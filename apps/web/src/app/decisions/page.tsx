'use client'

import { useState, useEffect } from 'react'
import { timeAgo, DECISION_TYPE_LABELS, DECISION_STATUS_LABELS } from '@costools/utils'
import type { Decision } from '@costools/shared-types'

const API = '/api/be/decision'

export default function DecisionsPage() {
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null)
  const [comments, setComments] = useState<any[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [form, setForm] = useState({ title: '', type: 'tech_selection', background: '', tags: '' })

  const loadDecisions = async () => {
    try {
      const res = await fetch(`${API}/decisions`)
      const json = await res.json()
      if (json.success) {
        setDecisions(json.data?.items || json.data || [])
      }
    } catch { console.warn('loadDecisions failed') }
  }

  useEffect(() => { loadDecisions() }, [])

  const searchDecisions = async () => {
    if (!searchQuery.trim()) { loadDecisions(); return }
    try {
      const res = await fetch(`${API}/decisions/search?q=${encodeURIComponent(searchQuery)}`)
      const json = await res.json()
      if (json.success) setDecisions(json.data || [])
    } catch { console.warn('searchDecisions failed') }
  }

  const viewDecision = async (id: string) => {
    try {
      const res = await fetch(`${API}/decisions/${id}`)
      const json = await res.json()
      if (json.success) {
        setSelectedDecision(json.data)
        const cres = await fetch(`${API}/decisions/${id}/comments`)
        const cjson = await cres.json()
        if (cjson.success) setComments(cjson.data || [])
      }
    } catch { console.warn('viewDecision failed') }
  }

  const createDecision = async () => {
    try {
      const res = await fetch(`${API}/decisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
        }),
      })
      const json = await res.json()
      if (json.success) {
        setShowCreate(false)
        setForm({ title: '', type: 'tech_selection', background: '', tags: '' })
        loadDecisions()
      }
    } catch { console.warn('createDecision failed') }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`${API}/decisions/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const json = await res.json()
      if (json.success) viewDecision(id)
    } catch { console.warn('updateStatus failed') }
  }

  return (
    <div>
      <div className="responsive-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>异步决策记录器</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>
            飞书 Bot 一句话记录决策，全文搜索，生命周期管理
          </p>
        </div>
        <div className="responsive-stack" style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <input
              placeholder="搜索决策..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchDecisions()}
              className="responsive-full"
              style={{ width: 240 }}
            />
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)} style={{ whiteSpace: 'nowrap' }}>+ 新建决策</button>
        </div>
      </div>

      {showCreate && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontWeight: 600, marginBottom: 16 }}>新建决策</h3>
          <div className="responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: 4, display: 'block' }}>决策标题</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="例如：选择前端框架" />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: 4, display: 'block' }}>类型</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                {Object.entries(DECISION_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: 4, display: 'block' }}>背景</label>
              <textarea rows={3} value={form.background} onChange={e => setForm({ ...form, background: e.target.value })} placeholder="决策背景和上下文" />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: 4, display: 'block' }}>标签（逗号分隔）</label>
              <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="技术, 前端" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={createDecision}>创建</button>
            <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>取消</button>
          </div>
        </div>
      )}

      <div className="responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: decisions.length > 0 ? '1fr 1fr' : '1fr', gap: 24 }}>
        <div className="card" style={{ maxHeight: 600, overflow: 'auto' }}>
          <h3 style={{ fontWeight: 600, marginBottom: 16 }}>决策列表</h3>
          {decisions.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>暂无决策记录。在飞书群 @决策机器人 "记录决策：标题"，或手动创建。</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {decisions.map((d: any) => (
                <div key={d.id}
                  onClick={() => viewDecision(d.id)}
                  style={{
                    padding: '1rem', borderRadius: 8, cursor: 'pointer', border: '1px solid #e2e8f0',
                    background: selectedDecision?.id === d.id ? '#f5f3ff' : 'white',
                    borderColor: selectedDecision?.id === d.id ? '#8b5cf6' : '#e2e8f0',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#8b5cf6', fontFamily: 'monospace' }}>{(d as any).serial_no}</span>
                      <div style={{ fontWeight: 600, marginTop: 2 }}>{d.title}</div>
                    </div>
                    <span className={`badge ${
                      d.status === 'decided' ? 'badge-green' : d.status === 'proposal' ? 'badge-blue' :
                      d.status === 'closed' ? 'badge-gray' : 'badge-yellow'
                    }`}>
                      {DECISION_STATUS_LABELS[d.status] || d.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.75rem', color: '#64748b' }}>
                    <span>{DECISION_TYPE_LABELS[d.type] || d.type}</span>
                    <span>·</span>
                    <span>{timeAgo((d as any).created_at)}</span>
                    {(d as any).comment_count > 0 && <><span>·</span><span>{(d as any).comment_count} 条讨论</span></>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedDecision && (
          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#8b5cf6', fontFamily: 'monospace' }}>{(selectedDecision as any).serial_no}</span>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginTop: 4 }}>{selectedDecision.title}</h3>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {selectedDecision.status === 'draft' && <button className="btn btn-primary" onClick={() => updateStatus(selectedDecision.id, 'proposal')}>发起提案</button>}
                  {selectedDecision.status === 'proposal' && <button className="btn btn-primary" onClick={() => updateStatus(selectedDecision.id, 'voting')}>开始投票</button>}
                  {selectedDecision.status === 'voting' && <button className="btn btn-primary" onClick={() => updateStatus(selectedDecision.id, 'decided')}>确认决策</button>}
                  {selectedDecision.status === 'decided' && <button className="btn btn-secondary" onClick={() => updateStatus(selectedDecision.id, 'implementing')}>开始执行</button>}
                  {selectedDecision.status === 'implementing' && <button className="btn btn-secondary" onClick={() => updateStatus(selectedDecision.id, 'closed')}>完成关闭</button>}
                </div>
              </div>

              {selectedDecision.background && (
                <div style={{ marginBottom: 16, padding: '0.75rem', background: '#f8fafc', borderRadius: 8, fontSize: '0.875rem' }}>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>背景</div>
                  {selectedDecision.background}
                </div>
              )}

              {selectedDecision.options && selectedDecision.options.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 500, marginBottom: 8 }}>备选方案</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selectedDecision.options.map((o: any, i: number) => (
                      <div key={i} style={{ padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>{o.name}</div>
                        <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{o.pros}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedDecision.decision && (
                <div style={{ padding: '0.75rem', background: '#f0fdf4', borderRadius: 8 }}>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>决策结果</div>
                  <div style={{ fontSize: '0.875rem' }}>{selectedDecision.decision}</div>
                  {selectedDecision.rationale && (
                    <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: 4 }}>理由：{selectedDecision.rationale}</div>
                  )}
                </div>
              )}
            </div>

            <div className="card">
              <h4 style={{ fontWeight: 600, marginBottom: 12 }}>讨论 ({comments.length})</h4>
              {comments.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.875rem' }}>暂无讨论</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {comments.map((c: any) => (
                    <div key={c.id} style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.75rem', color: '#64748b' }}>
                        <span style={{ fontWeight: 500 }}>{(c as any).author_name}</span>
                        <span>{timeAgo((c as any).created_at)}</span>
                      </div>
                      <div style={{ fontSize: '0.875rem' }}>{c.content}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center', marginTop: 16, fontSize: '0.75rem', color: '#94a3b8' }}>
              提示：在飞书群 @决策机器人 "记录决策：标题" 可快速创建
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
