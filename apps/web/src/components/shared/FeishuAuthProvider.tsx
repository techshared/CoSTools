'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { isFeishuEnv, feishuLogin, exchangeAuthCode, type FeishuUser } from '@/lib/feishu-auth'

interface AuthContextValue {
  user: FeishuUser | null
  loading: boolean
  isFeishu: boolean
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true, isFeishu: false })

export function useAuth() {
  return useContext(AuthContext)
}

export function FeishuAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FeishuUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFeishu, setIsFeishu] = useState(false)

  useEffect(() => {
    const env = isFeishuEnv()
    setIsFeishu(env)

    if (!env) {
      setLoading(false)
      return
    }

    ;(async () => {
      const code = await feishuLogin()
      if (code) {
        const u = await exchangeAuthCode(code)
        if (u) setUser(u)
      }
      setLoading(false)
    })()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, isFeishu }}>
      {children}
    </AuthContext.Provider>
  )
}
