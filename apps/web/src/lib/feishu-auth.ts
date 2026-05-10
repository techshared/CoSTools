export interface FeishuUser {
  id: string
  open_id: string
  name: string
  avatar: string
}

export function isFeishuEnv(): boolean {
  if (typeof window === 'undefined') return false
  return (
    navigator.userAgent.includes('Lark') ||
    navigator.userAgent.includes('Feishu') ||
    typeof (window as any).tt !== 'undefined' ||
    !!(window as any).__LARK_SDK__
  )
}

export async function feishuLogin(): Promise<string | null> {
  try {
    const tt = (window as any).tt
    if (tt?.login) {
      return new Promise((resolve, reject) => {
        tt.login({ success: (res: any) => resolve(res.code), fail: reject })
      })
    }
  } catch { /* ignore */ }
  return null
}

export async function exchangeAuthCode(code: string): Promise<FeishuUser | null> {
  try {
    const resp = await fetch('/api/auth/feishu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    const json = await resp.json()
    if (json.success) return json.user
  } catch { /* ignore */ }
  return null
}
