'use client'

import { useState, useEffect } from 'react'

const API = '/api/be/contribution'

export default function ContributionPage() {
  const [scores, setScores] = useState<any[]>([])
  const [myScore, setMyScore] = useState<any>(null)
  const [graphData, setGraphData] = useState<any>(null)
  const [view, setView] = useState<'overview' | 'graph'>('overview')

  useEffect(() => {
    fetch(`${API}/overview`)
      .then(r => r.json()).then(j => { if (j.success) setScores(j.data || []) })
    fetch(`${API}/me`)
      .then(r => r.json()).then(j => { if (j.success) setMyScore(j.data) })
    fetch(`${API}/graph`)
      .then(r => r.json()).then(j => { if (j.success) setGraphData(j.data) })
  }, [])

  const maxScore = Math.max(...scores.map(s => s.total_score), 0.01)

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>成员贡献图谱</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>
          基于 SourceCred 的多维贡献评分 · 代码/文档/任务全维度覆盖 · 与分成引擎联动
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button className={`btn ${view === 'overview' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('overview')}>贡献总览</button>
        <button className={`btn ${view === 'graph' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('graph')}>协作图谱</button>
      </div>

      {view === 'overview' && (
        <>
          {myScore && (
            <div className="card" style={{ marginBottom: 24 }}>
              <h3 style={{ fontWeight: 600, marginBottom: 16 }}>我的贡献</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#f59e0b', marginBottom: 16 }}>
                {myScore.total_score.toFixed(0)}
                <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 400 }}> / 100</span>
              </div>
              <DimensionBar dim={myScore.dimension_scores} />
              {myScore.weekly_trend && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem', marginBottom: 8 }}>周贡献趋势</div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 60 }}>
                    {myScore.weekly_trend.map((w: any, i: number) => {
                      const barPct = Math.min(w.score / 100, 1)
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{
                            width: '100%', background: '#f59e0b', borderRadius: '4px 4px 0 0',
                            height: `${barPct * 60}px`, minHeight: 4, opacity: 0.7,
                          }} />
                          <span style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: 2 }}>{w.week}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="card">
            <h3 style={{ fontWeight: 600, marginBottom: 16 }}>团队贡献排名</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {scores.map((s, i) => (
                <div key={s.contributorId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#d97706' : '#e2e8f0',
                    color: i < 3 ? 'white' : '#64748b',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: 700,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ fontWeight: 500, flex: 1 }}>{s.contributorName}</div>
                  <div style={{ width: 120, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${(s.total_score / maxScore) * 100}%`, height: '100%', background: '#f59e0b', borderRadius: 4 }} />
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', width: 50, textAlign: 'right' }}>
                    {s.total_score.toFixed(0)}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
              贡献分数仅展示相对区间，个人完整分数仅自己可见
            </div>
          </div>
        </>
      )}

      {view === 'graph' && graphData && (
        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: 16 }}>协作网络</h3>
          <svg width="100%" height={400} style={{ background: '#fafafa', borderRadius: 8 }}>
            {graphData.edges?.map((e: any, i: number) => {
              const src = graphData.nodes.find((n: any) => n.id === e.sourceNodeId)
              const tgt = graphData.nodes.find((n: any) => n.id === e.targetNodeId)
              if (!src || !tgt) return null
              const nodes = graphData.nodes
              const si = nodes.indexOf(src)
              const ti = nodes.indexOf(tgt)
              const cx = 200 + Math.cos((si / nodes.length) * Math.PI * 2) * 150
              const cy = 200 + Math.sin((si / nodes.length) * Math.PI * 2) * 150
              const tx = 200 + Math.cos((ti / nodes.length) * Math.PI * 2) * 150
              const ty = 200 + Math.sin((ti / nodes.length) * Math.PI * 2) * 150
              return <line key={i} x1={cx} y1={cy} x2={tx} y2={ty} stroke="#e2e8f0" strokeWidth={1} />
            })}
            {graphData.nodes?.map((n: any, i: number) => {
              const nodes = graphData.nodes
              const x = 200 + Math.cos((i / nodes.length) * Math.PI * 2) * 150
              const y = 200 + Math.sin((i / nodes.length) * Math.PI * 2) * 150
              return (
                <g key={n.id}>
                  <circle cx={x} cy={y} r={24} fill="#f59e0b" opacity={0.9} />
                  <text x={x} y={y + 4} textAnchor="middle" fill="white" fontSize={11} fontWeight={600}>
                    {n.contributorId?.slice(-2)}
                  </text>
                </g>
              )
            })}
          </svg>
          <div style={{ marginTop: 16, fontSize: '0.875rem', color: '#64748b', textAlign: 'center' }}>
            节点 = 成员 · 连线 = 协作关系（代码审查、文档评论、协作编辑）
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ fontWeight: 600, marginBottom: 8 }}>维度权重</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8, fontSize: '0.875rem' }}>
          <div>代码贡献 (GitHub) <strong>35%</strong></div>
          <div>文档贡献 (飞书) <strong>20%</strong></div>
          <div>任务交付 (多维表格) <strong>20%</strong></div>
          <div>设计贡献 (Figma) <strong>10%</strong></div>
          <div>知识分享 (知识库) <strong>10%</strong></div>
          <div>同行认可 (互评) <strong>5%</strong></div>
        </div>
        <div style={{ marginTop: 8, fontSize: '0.75rem', color: '#94a3b8' }}>
           权重可被团队投票调整 {'>'} 60% 同意生效
        </div>
      </div>
    </div>
  )
}

const DIMENSION_LABELS: Record<string, { label: string; color: string }> = {
  code_contributions: { label: '代码贡献', color: '#3b82f6' },
  doc_contributions: { label: '文档贡献', color: '#10b981' },
  code_review: { label: '代码评审', color: '#8b5cf6' },
  design: { label: '设计贡献', color: '#f59e0b' },
  community: { label: '社区/知识', color: '#ec4899' },
}

function DimensionBar({ dim }: { dim: any }) {
  if (!dim) return null
  const items = Object.entries(DIMENSION_LABELS).filter(([key]) => key in dim)
  if (items.length === 0) return null
  const maxVal = Math.max(...items.map(([k]) => dim[k] || 0), 0.01)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map(([key, meta]) => {
        const pct = (dim[key] / maxVal) * 100
        return (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem' }}>
            <span style={{ width: 64, color: '#64748b' }}>{meta.label}</span>
            <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: meta.color, borderRadius: 4 }} />
            </div>
            <span style={{ width: 40, textAlign: 'right', fontWeight: 500 }}>{dim[key].toFixed(0)}</span>
          </div>
        )
      })}
    </div>
  )
}
