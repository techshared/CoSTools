// app.js - 飞书小程序入口
import { ApiClient } from '@costools/api-client'

App({
  globalData: {
    api: new ApiClient({
      baseUrl: 'http://localhost:8001',
      token: '',
    }),
    userInfo: null,
  },

  onLaunch() {
    // 获取飞书用户信息
    tt.getUserInfo({
      success: (res) => {
        this.globalData.userInfo = res.userInfo
      },
    })
  },
})
