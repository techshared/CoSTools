type CardAction = {
  tag: string
  text: { tag: string; content: string }
  value?: Record<string, string>
  url?: string
}

type CardHeader = {
  title: { tag: string; content: string }
  subtitle?: { tag: string; content: string }
}

type CardElement = {
  tag: string
  content: string
  lines?: number[]
  fields?: { is_short: boolean; text: { tag: string; content: string } }[]
  extra?: Record<string, any>
  actions?: CardAction[]
}

export function buildDecisionCard(data: {
  serialNo: string
  title: string
  status: string
  type: string
  id: string
}) {
  return {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: `📋 ${data.serialNo} ${data.title}` },
      subtitle: { tag: 'plain_text', content: `类型: ${data.type} | 状态: ${data.status}` },
    },
    elements: [
      {
        tag: 'action',
        actions: [
          {
            tag: 'button',
            text: { tag: 'plain_text', content: '查看详情' },
            url: `http://localhost:3000/decisions/${data.id}`,
            type: 'default',
          },
          {
            tag: 'button',
            text: { tag: 'plain_text', content: '✏️ 编辑' },
            value: { action: 'edit_decision', decision_id: data.id },
            type: 'primary',
          },
        ],
      },
    ],
  }
}

export function buildShareSummaryCard(data: {
  memberName: string
  amount: number
  projectName: string
  status: string
  distributionId: string
}) {
  return {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: '💰 分成通知' },
    },
    elements: [
      {
        tag: 'div',
        fields: [
          { is_short: true, text: { tag: 'lark_md', content: `**成员**\n${data.memberName}` } },
          { is_short: true, text: { tag: 'lark_md', content: `**金额**\n¥${data.amount.toFixed(2)}` } },
          { is_short: true, text: { tag: 'lark_md', content: `**项目**\n${data.projectName}` } },
          { is_short: true, text: { tag: 'lark_md', content: `**状态**\n${data.status}` } },
        ],
      },
      {
        tag: 'action',
        actions: [
          {
            tag: 'button',
            text: { tag: 'plain_text', content: '查看明细' },
            url: `http://localhost:3000/profit/${data.distributionId}`,
            type: 'default',
          },
        ],
      },
    ],
  }
}

export function buildContributionCard(data: {
  memberName: string
  totalScore: number
  weeklyChange: number
}) {
  const change = data.weeklyChange >= 0 ? `+${data.weeklyChange}` : `${data.weeklyChange}`
  return {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: `📊 周贡献报告` },
    },
    elements: [
      {
        tag: 'div',
        fields: [
          { is_short: true, text: { tag: 'lark_md', content: `**成员**\n${data.memberName}` } },
          { is_short: true, text: { tag: 'lark_md', content: `**本周贡献分**\n${data.totalScore}` } },
          { is_short: true, text: { tag: 'lark_md', content: `**环比变化**\n${change}` } },
        ],
      },
      {
        tag: 'action',
        actions: [
          {
            tag: 'button',
            text: { tag: 'plain_text', content: '查看详情' },
            url: `http://localhost:3000/contribution`,
            type: 'default',
          },
        ],
      },
    ],
  }
}
