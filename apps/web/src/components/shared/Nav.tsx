import Link from 'next/link'

const NAV_ITEMS = [
  { href: '/', label: '概览', icon: '◉' },
  { href: '/profit', label: '收益分成', icon: '¥' },
  { href: '/decisions', label: '决策记录', icon: '⚡' },
  { href: '/dashboard', label: '仪表盘', icon: '◈' },
  { href: '/contribution', label: '贡献图谱', icon: '◎' },
]

export function Nav() {
  return (
    <header style={{
      borderBottom: '1px solid #e2e8f0',
      background: 'white',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div className="nav-header" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', height: 56, gap: 32 }}>
        <Link href="/" style={{ fontWeight: 700, fontSize: '1.125rem', textDecoration: 'none', color: '#0f172a', whiteSpace: 'nowrap' }}>
          CoSTools
        </Link>
        <nav className="nav-scroll" style={{ display: 'flex', gap: 4, flex: 1 }}>
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="nav-link"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '0.375rem 0.75rem', borderRadius: 6,
                fontSize: '0.875rem', textDecoration: 'none',
                color: '#64748b', transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
