Page({
  data: {
    period: '2026年第19周',
    totalScore: 85,
    changeText: '较上周 +5',
    changeColor: '#10b981',
    dimensions: [
      { label: '代码贡献', value: 40, color: '#3b82f6' },
      { label: '文档贡献', value: 25, color: '#10b981' },
      { label: '任务交付', value: 30, color: '#8b5cf6' },
      { label: '知识分享', value: 15, color: '#ec4899' },
      { label: '同行认可', value: 20, color: '#06b6d4' },
    ],
  },

  onLoad() {
    const app = getApp()
    fetch('http://localhost:8004/api/v1/contributions/me')
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          const d = json.data
          const dims = [
            { label: '代码贡献', value: Math.round(d.dimension_scores.code * 100), color: '#3b82f6' },
            { label: '文档贡献', value: Math.round(d.dimension_scores.doc * 100), color: '#10b981' },
            { label: '任务交付', value: Math.round(d.dimension_scores.task * 100), color: '#8b5cf6' },
          ]
          this.setData({
            totalScore: Math.round(d.total_score * 100),
            dimensions: dims,
          })
        }
      })
  },
})
