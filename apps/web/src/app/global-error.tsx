'use client'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  console.error('global error:', error)
  return (
    <html lang="zh-CN">
      <body>
        <div style={{ textAlign: 'center', padding: '4rem 1.5rem', fontFamily: 'system-ui, sans-serif' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 8 }}>应用异常</h2>
          <p style={{ color: '#64748b', marginBottom: 16, fontSize: '0.875rem' }}>{error.message || '发生了意外错误'}</p>
          <button className="btn btn-primary" onClick={reset}>重试</button>
        </div>
      </body>
    </html>
  )
}
