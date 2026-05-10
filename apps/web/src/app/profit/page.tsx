'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, formatPercentage, formatDate } from '@costools/utils'
import type { Project, Distribution } from '@costools/shared-types'

const API = '/api/be/profit'

export default function ProfitPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [distributions, setDistributions] = useState<any[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', reservedRatio: 0.2, profitShareRatio: 0.3 })

  const loadProjects = async () => {
    try {
      const res = await fetch(`${API}/projects`)
      const json = await res.json()
      if (json.success && json.data) setProjects(json.data)
    } catch { console.warn('loadProjects failed') }
  }

  useEffect(() => { loadProjects() }, [])

  const loadDistributions = async (id: string) => {
    setSelectedProject(id)
    try {
      const res = await fetch(`${API}/projects/${id}/distributions`)
      const json = await res.json()
      if (json.success && json.data) setDistributions(json.data)
    } catch { console.warn('loadDistributions failed') }
  }

  const createProject = async () => {
    try {
      const res = await fetch(`${API}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (json.success) {
        setShowCreate(false)
        setForm({ name: '', description: '', reservedRatio: 0.2, profitShareRatio: 0.3 })
        loadProjects()
      }
    } catch { console.warn('createProject failed') }
  }

  const triggerDistribute = async (projectId: string) => {
    try {
      const res = await fetch(`${API}/projects/${projectId}/distribute`, { method: 'POST' })
      const json = await res.json()
      if (json.success) loadDistributions(projectId)
    } catch { console.warn('triggerDistribute failed') }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>收益分成计算引擎</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>
            项目利润 30% 自动分成，权重计算，审计追溯，全员透明
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ 新建项目</button>
      </div>

      {showCreate && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontWeight: 600, marginBottom: 16 }}>新建项目</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: 4, display: 'block' }}>项目名称</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="输入项目名称" />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: 4, display: 'block' }}>描述</label>
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="项目描述" />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: 4, display: 'block' }}>公司预留比例</label>
              <input type="number" step="0.01" value={form.reservedRatio} onChange={e => setForm({ ...form, reservedRatio: +e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: 4, display: 'block' }}>团队分成比例</label>
              <input type="number" step="0.01" value={form.profitShareRatio} onChange={e => setForm({ ...form, profitShareRatio: +e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={createProject}>创建</button>
            <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>取消</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: 16 }}>项目列表</h3>
          {projects.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>暂无项目，点击"新建项目"开始</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {projects.map((p: any) => (
                <div key={p.id}
                  onClick={() => loadDistributions(p.id)}
                  style={{
                    padding: '1rem', borderRadius: 8, cursor: 'pointer', border: '1px solid #e2e8f0',
                    background: selectedProject === p.id ? '#f0f9ff' : 'white',
                    borderColor: selectedProject === p.id ? '#0ea5e9' : '#e2e8f0',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ color: '#64748b', fontSize: '0.875rem' }}>
                        收入: {formatCurrency(p.total_revenue || 0)} · 成本: {formatCurrency(p.total_cost || 0)}
                      </div>
                    </div>
                    <span className={`badge ${p.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                      {p.status === 'active' ? '进行中' : '已结束'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontWeight: 600 }}>分成记录</h3>
            {selectedProject && (
              <button className="btn btn-primary" onClick={() => triggerDistribute(selectedProject)}>触发分成</button>
            )}
          </div>
          {!selectedProject ? (
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>选择一个项目查看分成记录</p>
          ) : distributions.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>暂无分成记录，点击"触发分成"开始计算</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {distributions.map((d: any) => (
                <div key={d.id} className="card" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: '0.875rem', color: '#64748b' }}>计算于 {formatDate(d.calculatedAt)}</span>
                    <span className={`badge ${d.status === 'approved' ? 'badge-green' : d.status === 'paid' ? 'badge-blue' : 'badge-yellow'}`}>
                      {d.status === 'pending' ? '待审批' : d.status === 'approved' ? '已批准' : d.status === 'paid' ? '已发放' : '争议中'}
                    </span>
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 8 }}>
                    分成总池: {formatCurrency(d.total_pool)}
                  </div>
                  {d.items?.map((item: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid #f1f5f9', fontSize: '0.875rem' }}>
                      <span>{item.memberName || item.memberId}</span>
                      <span style={{ fontWeight: 500 }}>{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
