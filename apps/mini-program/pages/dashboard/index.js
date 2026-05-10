Page({
  data: {
    today: new Date().toLocaleDateString('zh-CN'),
    healthScore: 87,
    metrics: [
      { label: 'OKR 完成率', value: '78', unit: '%', color: '#0ea5e9' },
      { label: '任务完成率', value: '85', unit: '%', color: '#8b5cf6' },
      { label: '活跃成员', value: '12', unit: '人', color: '#f59e0b' },
      { label: '协作密度', value: '65', unit: '%', color: '#ec4899' },
    ],
  },

  onLoad() {
    const app = getApp()
    fetch('http://localhost:8003/api/v1/dashboard/overview')
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          this.setData({
            healthScore: json.data.team_health_score,
            metrics: [
              { label: 'OKR 完成率', value: (json.data.okr_completion_rate * 100).toFixed(0), unit: '%', color: '#0ea5e9' },
              { label: '任务完成率', value: (json.data.task_completion_rate * 100).toFixed(0), unit: '%', color: '#8b5cf6' },
              { label: '活跃成员', value: json.data.active_members, unit: '人', color: '#f59e0b' },
              { label: '协作密度', value: (json.data.collaboration_density * 100).toFixed(0), unit: '%', color: '#ec4899' },
            ],
          })
        }
      })
  },
})
