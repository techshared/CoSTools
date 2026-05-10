Page({
  data: {
    distributions: [
      { id: '1', projectName: 'Project Alpha', date: '2026-04-15', amount: '3,500.00' },
      { id: '2', projectName: 'Project Beta', date: '2026-04-08', amount: '2,800.00' },
      { id: '3', projectName: 'Project Gamma', date: '2026-03-25', amount: '4,200.00' },
    ],
  },

  onLoad() {
    const app = getApp()
    if (app.globalData.api) {
      app.globalData.api.getMyEarnings('current-user').then((res: any) => {
        if (res.success) {
          this.setData({ distributions: res.data })
        }
      })
    }
  },
})
