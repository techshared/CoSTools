'use client'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  console.error('page error:', error)
  return (
    <div style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 8 }}>出错了</h2>
      <p style={{ color: '#64748b', marginBottom: 16, fontSize: '0.875rem' }}>{error.message || '页面发生异常'}</p>
      <button className="btn btn-primary" onClick={reset}>重试</button>
    </div>
  )
}
