import Link from 'next/link'

const MODULES = [
  {
    title: '收益分成计算引擎',
    description: '项目利润 30% 自动分成，权重计算，审计追溯，全员透明',
    href: '/profit',
    icon: '¥',
    color: '#0ea5e9',
    features: ['项目利润管理', '权重配置与计算', '分成明细全员可见', '审批流'],
  },
  {
    title: '异步决策记录器',
    description: '飞书 Bot 一句话记录决策，全文搜索，生命周期管理',
    href: '/decisions',
    icon: '⚡',
    color: '#8b5cf6',
    features: ['飞书 Bot 快捷录入', '决策生命周期', '全文搜索', '关联追溯'],
  },
  {
    title: '自驱力仪表盘',
    description: '非监控式团队健康度，多数据源聚合，隐私优先设计',
    href: '/dashboard',
    icon: '◈',
    color: '#10b981',
    features: ['7 大健康指标', '多数据源 ETL', '趋势分析', '周度 AI 洞察'],
  },
  {
    title: '成员贡献图谱',
    description: '基于 SourceCred 的多维贡献评分，可视化协作网络',
    href: '/contribution',
    icon: '◎',
    color: '#f59e0b',
    features: ['代码/文档/任务多维度', 'PageRank 算法', '图谱可视化', '与分成引擎联动'],
  },
]

export default function Home() {
  return (
    <div>
      <div style={{ marginBottom: 48 }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: 8 }}>CoSTools</h1>
        <p style={{ color: '#64748b', fontSize: '1.125rem' }}>
          专为不打卡组织设计的轻量级工具套件——收益透明 · 决策可溯 · 健康可视 · 贡献可量
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
        {MODULES.map(m => (
          <Link key={m.href} href={m.href} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card card-hover" style={{ cursor: 'pointer', height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: m.color, color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.25rem', fontWeight: 700,
                }}>
                  {m.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1rem' }}>{m.title}</div>
                </div>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 16, lineHeight: 1.5 }}>
                {m.description}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {m.features.map(f => (
                  <span key={f} className="badge badge-blue">{f}</span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ marginTop: 48, padding: '2rem', background: '#f1f5f9', borderRadius: 12 }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 12 }}>设计原则</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {[
            { title: '信任优先', desc: '不追踪时长/鼠标/屏幕，只看交付成果' },
            { title: '透明优于效率', desc: '分成全员可见，决策可追溯，权重可投票' },
            { title: '隐私是红线', desc: '个人数据仅自己可见，可选择退出图谱' },
            { title: '异步优先', desc: 'Bot 录入 > Web 填写，文档沟通 > 开会' },
          ].map(p => (
            <div key={p.title}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{p.title}</div>
              <div style={{ color: '#64748b', fontSize: '0.875rem' }}>{p.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
