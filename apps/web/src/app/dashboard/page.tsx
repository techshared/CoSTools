'use client'

import { useState, useEffect } from 'react'
import { formatPercentage } from '@costools/utils'

const API = '/api/be/dashboard'

export default function DashboardPage() {
  const [overview, setOverview] = useState<any>(null)

  useEffect(() => {
    fetch(`${API}/overview`)
      .then(r => r.json())
      .then(j => { if (j.success) setOverview(j.data) })
  }, [])

  if (!overview) return <div style={{ color: '#64748b' }}>加载中...</div>

  const metrics = [
    { label: '团队健康分', value: overview.team_health_score, unit: '', color: '#10b981' },
    { label: 'OKR 完成率', value: formatPercentage(overview.okr_completion_rate), unit: '', color: '#0ea5e9' },
    { label: '任务完成率', value: formatPercentage(overview.task_completion_rate), unit: '', color: '#8b5cf6' },
    { label: '活跃成员', value: overview.active_members, unit: '人', color: '#f59e0b' },
    { label: '协作密度', value: formatPercentage(overview.collaboration_density), unit: '', color: '#ec4899' },
  ]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>自驱力仪表盘</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>
          非监控式团队健康度 · 只看成果不追踪过程 · 隐私优先
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {metrics.map(m => (
          <div key={m.label} className="card" style={{ textAlign: 'center' }}>
            <div className="stat-value" style={{ color: m.color }}>
              {m.value}{m.unit}
            </div>
            <div className="stat-label">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: 16 }}>OKR 完成趋势</h3>
          <TrendChart data={overview.weekly_trends?.okr} color="#0ea5e9" />
          <div style={{ marginTop: 16, fontSize: '0.875rem', color: '#64748b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span>本周 OKR 完成率</span>
              <span style={{ fontWeight: 600, color: '#0ea5e9' }}>{formatPercentage(overview.okr_completion_rate)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span>本周任务完成率</span>
              <span style={{ fontWeight: 600, color: '#8b5cf6' }}>{formatPercentage(overview.task_completion_rate)}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: 16 }}>文档活跃度趋势</h3>
          <TrendChart data={overview.weekly_trends?.doc} color="#10b981" />
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.875rem' }}>
              <span>协作密度</span>
              <span style={{ fontWeight: 600 }}>{formatPercentage(overview.collaboration_density)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.875rem' }}>
              <span>活跃成员</span>
              <span style={{ fontWeight: 600 }}>{overview.active_members} 人</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ fontWeight: 600, marginBottom: 8 }}>设计原则</h3>
        <div style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6 }}>
          <div>❌ 不追踪：登录时长 / 鼠标移动 / 屏幕截图</div>
          <div>✅ 只看成果：任务交付 / 文档产出 / 代码提交</div>
          <div>🔒 个人数据仅自己可见，团队数据匿名聚合</div>
        </div>
      </div>
    </div>
  )
}

function TrendChart({ data, color }: { data?: any[]; color: string }) {
  if (!data || data.length === 0) return <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>暂无数据</div>
  const maxVal = Math.max(...data.map(d => d.value), 1)
  const h = 120
  return (
    <svg width="100%" height={h} style={{ overflow: 'visible' }}>
      {data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100
        const y = h - (d.value / maxVal) * (h - 20) - 10
        return <circle key={i} cx={`${x}%`} cy={y} r={3} fill={color} />
      })}
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={2}
        points={data.map((d, i) => {
          const x = (i / (data.length - 1)) * 100
          const y = h - (d.value / maxVal) * (h - 20) - 10
          return `${x}%,${y}`
        }).join(' ')}
      />
    </svg>
  )
}
