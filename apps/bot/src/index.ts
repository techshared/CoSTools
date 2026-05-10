import express from 'express'
import crypto from 'crypto'
import { Client, EventDispatcher } from '@larksuiteoapi/node-sdk'

const LARK_APP_ID = process.env.LARK_APP_ID || ''
const LARK_APP_SECRET = process.env.LARK_APP_SECRET || ''
const DECISION_API = process.env.DECISION_API || 'http://localhost:8002'
const DASHBOARD_API = process.env.DASHBOARD_API || 'http://localhost:8003'
const CONTRIBUTION_API = process.env.CONTRIBUTION_API || 'http://localhost:8004'
const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || ''

const client = new Client({ appId: LARK_APP_ID, appSecret: LARK_APP_SECRET })

function getCurrentWeekStart(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const mon = new Date(d.setDate(diff))
  return mon.toISOString().slice(0, 10)
}

function getCurrentWeekPeriod(): string {
  const d = new Date()
  const y = d.getFullYear()
  const jan1 = new Date(y, 0, 1)
  const days = Math.floor((d.getTime() - jan1.getTime()) / 86400000)
  const week = Math.min(Math.ceil((days + jan1.getDay() + 1) / 7), 53)
  return `${y}-W${String(week).padStart(2, '0')}`
}

async function ingestContributionScores(memberId: string, memberName: string, score: number, dimensions: Record<string, number>) {
  try {
    const period = getCurrentWeekPeriod()
    await fetch(`${CONTRIBUTION_API}/api/v1/contributions/ingest/scores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period, members: [{ member_id: memberId, member_name: memberName, total_score: score, dimension_scores: dimensions }] }),
    })
  } catch (e) {
    console.error('[ingest] contribution error:', e)
  }
}

async function ingestDashboardMember(memberId: string, weekStart: string, metrics: Record<string, any>) {
  try {
    await fetch(`${DASHBOARD_API}/api/v1/dashboard/ingest/member`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: memberId, week_start: weekStart, ...metrics }),
    })
  } catch (e) {
    console.error('[ingest] dashboard error:', e)
  }
}

const eventDispatcher = new EventDispatcher({
  encryptKey: process.env.LARK_ENCRYPT_KEY || '',
  verificationToken: process.env.LARK_VERIFICATION_TOKEN || '',
}).register({
  'im.message.receive_v1': async (data: any) => {
    console.log('[event] im.message.receive_v1 received:', JSON.stringify(data).slice(0, 500))
    if (!data.message || data.message.message_type !== 'text') {
      console.log('[event] ignored: not text message')
      return
    }

    let text = ''
    try {
      const content = JSON.parse(data.message.content)
      text = content.text || ''
    } catch { return }

    const messageId = data.message.message_id

    const reply = async (msg: string) => {
      try {
        await client.im.message.reply({
          path: { message_id: messageId },
          data: { content: JSON.stringify({ text: msg }), msg_type: 'text' },
        })
      } catch (e) {
        console.error('reply error:', e)
      }
    }

    if (/^记录决策/.test(text)) {
      try {
        const resp = await fetch(`${DECISION_API}/api/v1/bot/create-decision`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, sender_id: data.sender?.sender_id?.user_id || '' }),
        })
        const json = await resp.json()
        if (json.success) {
          const d = json.data
          await reply(`✅ 已记录决策 [${d.serial_no}] ${d.title}\n查看完整: http://localhost:3000/decisions/${d.id}`)
        } else {
          await reply('❌ 记录失败，请重试')
        }
      } catch {
        await reply('❌ 服务异常，请稍后重试')
      }
      return
    }

    if (/^搜索决策/.test(text)) {
      const query = text.replace(/^搜索决策[：:]?/, '').trim()
      if (!query) { await reply('请输入搜索关键词，例如：搜索决策：预算'); return }
      try {
        const resp = await fetch(`${DECISION_API}/api/v1/decisions/search?q=${encodeURIComponent(query)}`)
        const json = await resp.json()
        if (json.success && json.data?.length > 0) {
          const items = json.data.slice(0, 5)
          const lines = items.map((d: any) => `[${d.serial_no}] ${d.title} (${d.status})`)
          await reply(`📋 找到 ${json.data.length} 条结果：\n${lines.join('\n')}`)
        } else {
          await reply('未找到匹配的决策')
        }
      } catch {
        await reply('❌ 搜索失败')
      }
      return
    }

    if (text === '帮助') {
      await reply(`🤖 决策机器人使用指南：
• "记录决策：标题 - 理由" - 快速记录决策
• "搜索决策：关键词" - 搜索历史决策
• "帮助" - 查看使用指南`)
      return
    }

    await reply('👋 发送 "帮助" 查看使用指南')
  },
})

const app = express()

// Raw body needed for GitHub webhook signature verification
app.use(express.json({
  verify: (req: any, _res, buf) => { req.rawBody = buf.toString() },
}))

// Existing Feishu bot event handler
app.all('/webhook/event', async (req, res) => {
  console.log('[webhook] event request received, method:', req.method, 'body type:', req.body?.type)
  try {
    const body = req.method === 'GET'
      ? { challenge: req.query.challenge as string }
      : req.body
    if (body.type === 'url_verification') {
      res.json({ challenge: body.challenge })
      return
    }
    const result = await eventDispatcher.invoke(body)
    res.json(result)
  } catch (err) {
    console.error('event error:', err)
    res.status(500).end()
  }
})

// GitHub Webhook handler
app.post('/webhook/github', async (req, res) => {
  console.log('[github] webhook received:', req.headers['x-github-event'])

  const signature = req.headers['x-hub-signature-256'] as string
  if (GITHUB_WEBHOOK_SECRET && signature) {
    const rawBody = (req as any).rawBody || JSON.stringify(req.body)
    const sig = crypto.createHmac('sha256', GITHUB_WEBHOOK_SECRET).update(rawBody).digest('hex')
    const expected = signature.replace('sha256=', '')
    if (expected.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) {
      console.warn('[github] invalid signature')
      res.status(401).json({ error: 'invalid signature' })
      return
    }
  }

  const event = req.headers['x-github-event'] as string
  const body = req.body

  try {
    if (event === 'push') {
      const repo = body.repository?.full_name || 'unknown'
      const commits = body.commits || []
      const authors = new Map<string, { name: string; commits: number }>()
      for (const c of commits) {
        const author = c.author?.username || c.author?.name || 'unknown'
        authors.set(author, { name: author, commits: (authors.get(author)?.commits || 0) + 1 })
      }
      for (const [username, info] of authors) {
        await ingestContributionScores(
          `github:${username}`,
          username,
          10 + info.commits * 2,
          { code_contributions: 10 + info.commits * 2, doc_contributions: 0, code_review: 0, design: 0, community: 5 },
        )
        console.log('[github] ingested push scores for', username, info.commits, 'commits')
      }
    }

    if (event === 'pull_request') {
      const action = body.action
      const pr = body.pull_request
      const author = pr?.user?.login || 'unknown'
      const repo = body.repository?.full_name || 'unknown'

      if (action === 'opened' || action === 'reopened') {
        await ingestContributionScores(
          `github:${author}`,
          author,
          15,
          { code_contributions: 5, doc_contributions: 0, code_review: 0, design: 0, community: 10 },
        )
        console.log('[github] ingested PR opened for', author)
      }

      if (action === 'closed' && pr?.merged) {
        await ingestContributionScores(
          `github:${author}`,
          author,
          30,
          { code_contributions: 20, doc_contributions: 0, code_review: 5, design: 0, community: 5 },
        )
        console.log('[github] ingested PR merged for', author)

        if (pr?.requested_reviewers) {
          for (const reviewer of pr.requested_reviewers) {
            const reviewerName = reviewer.login || 'unknown'
            await ingestContributionScores(
              `github:${reviewerName}`,
              reviewerName,
              8,
              { code_contributions: 0, doc_contributions: 0, code_review: 8, design: 0, community: 0 },
            )
            console.log('[github] ingested reviewer score for', reviewerName)
          }
        }
      }
    }

    res.json({ success: true })
  } catch (err) {
    console.error('[github] processing error:', err)
    res.status(500).json({ success: false, error: 'processing error' })
  }
})

// Feishu approval event handler
const FEISHU_APPROVAL_TYPES = ['approval_instance']
eventDispatcher.register({
  'approval_instance': async (data: any) => {
    console.log('[feishu] approval event:', JSON.stringify(data).slice(0, 300))
    try {
      const instance = data.instance || data.object || {}
      const applicant = instance.applicant_id || instance.applicant?.id || 'unknown'
      const approvalName = instance.approval_name || instance.approval?.approval_name || 'unknown'
      const status = instance.status || instance.instance_status || ''

      const weekStart = getCurrentWeekStart()
      const memberId = `feishu:${applicant}`

      if (status === 'approved' || status === 'completed') {
        await ingestDashboardMember(memberId, weekStart, {
          okr_progress: 0,
          task_completion_rate: 0,
          doc_contributions: 1,
          code_contributions: 0,
          collaboration_score: 5,
        })
        console.log('[feishu] ingested approval for', applicant, approvalName)
      }
    } catch (e) {
      console.error('[feishu] approval processing error:', e)
    }
  },
})

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

const PORT = parseInt(process.env.PORT || '9000', 10)
app.listen(PORT, () => {
  console.log(`🤖 Bot running on port ${PORT}`)
})
