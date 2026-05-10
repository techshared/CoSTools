import { NextResponse } from 'next/server'

const LARK_APP_ID = process.env.LARK_APP_ID || ''
const LARK_APP_SECRET = process.env.LARK_APP_SECRET || ''

async function getFeishuAccessToken(code: string) {
  const resp = await fetch('https://open.feishu.cn/open-apis/authen/v1/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      app_id: LARK_APP_ID,
      app_secret: LARK_APP_SECRET,
    }),
  })
  return resp.json() as Promise<{ code: number; data: { access_token: string; refresh_token: string; token_type: string; expires_in: number } }>
}

async function getFeishuUserInfo(accessToken: string) {
  const resp = await fetch('https://open.feishu.cn/open-apis/authen/v1/user_info', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return resp.json() as Promise<{ code: number; data: { user_id: string; open_id: string; name: string; avatar_url: string } }>
}

export async function POST(request: Request) {
  try {
    const { code } = await request.json()
    if (!code) {
      return NextResponse.json({ success: false, error: 'missing code' }, { status: 400 })
    }

    const tokenResp = await getFeishuAccessToken(code)
    if (tokenResp.code !== 0) {
      return NextResponse.json({ success: false, error: 'token exchange failed', detail: tokenResp }, { status: 401 })
    }

    const userResp = await getFeishuUserInfo(tokenResp.data.access_token)
    if (userResp.code !== 0) {
      return NextResponse.json({ success: false, error: 'user info failed' }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userResp.data.user_id,
        open_id: userResp.data.open_id,
        name: userResp.data.name,
        avatar: userResp.data.avatar_url,
      },
    })
  } catch (err) {
    console.error('feishu auth error:', err)
    return NextResponse.json({ success: false, error: 'internal error' }, { status: 500 })
  }
}
