import type { Metadata } from 'next'
import './globals.css'
import { Nav } from '@/components/shared/Nav'
import { FeishuAuthProvider } from '@/components/shared/FeishuAuthProvider'

export const metadata: Metadata = {
  title: 'CoSTools - 不打卡组织工具套件',
  description: '收益透明 · 决策可溯 · 健康可视 · 贡献可量',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <script src="https://sf3-cn.feishucdn.com/obj/lark-js-sdk/lark-js-sdk-2.1.0.js" async />
      </head>
      <body>
        <FeishuAuthProvider>
          <Nav />
          <main style={{ maxWidth: 1280, margin: '0 auto', padding: '2rem 1.5rem' }}>
            {children}
          </main>
        </FeishuAuthProvider>
      </body>
    </html>
  )
}
