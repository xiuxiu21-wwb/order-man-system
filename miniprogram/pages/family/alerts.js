Page({
  data: {
    currentFilter: 'all',
    alerts: [
      {
        id: 1,
        type: 'emergency',
        typeText: '紧急求助',
        icon: '🚨',
        title: '老人发起一键求助',
        description: '老人在社区公园附近发起求助，请尽快确认情况！',
        time: '10分钟前',
        location: '社区公园',
        read: false
      },
      {
        id: 2,
        type: 'warning',
        typeText: '行为异常',
        icon: '⚠️',
        title: '超出活动范围',
        description: '老人已超出预设的安全活动范围，请关注！',
        time: '30分钟前',
        location: '距离家2.5公里',
        read: false
      },
      {
        id: 3,
        type: 'warning',
        typeText: '服药提醒',
        icon: '💊',
        title: '未按时服药',
        description: '午餐后的降压药还未服用，请提醒老人！',
        time: '1小时前',
        read: true
      },
      {
        id: 4,
        type: 'info',
        typeText: '位置更新',
        icon: '📍',
        title: '老人已到家',
        description: '老人已安全回到家中，位置已更新。',
        time: '2小时前',
        location: '家中',
        read: true
      },
      {
        id: 5,
        type: 'info',
        typeText: '系统通知',
        icon: '📱',
        title: '电量偏低',
        description: '老人手机电量不足20%，请提醒充电。',
        time: '3小时前',
        read: true
      }
    ]
  },

  onLoad() {
    this.updateUnreadCount()
  },

  updateUnreadCount() {
    const unreadCount = this.data.alerts.filter(a => !a.read).length
    this.setData({ unreadCount })
  },

  get filteredAlerts() {
    const filter = this.data.currentFilter
    if (filter === 'all') {
      return this.data.alerts
    }
    return this.data.alerts.filter(a => a.type === filter)
  },

  setFilter(e) {
    const filter = e.currentTarget.dataset.filter
    this.setData({ currentFilter: filter })
  },

  viewAlert(e) {
    const id = e.currentTarget.dataset.id
    const alerts = this.data.alerts.map(alert => {
      if (alert.id === id) {
        return { ...alert, read: true }
      }
      return alert
    })
    this.setData({ alerts })
    this.updateUnreadCount()
    
    wx.showModal({
      title: '告警详情',
      content: '点击确定可联系老人或查看位置',
      confirmText: '查看位置',
      cancelText: '知道了',
      success: (res) => {
        if (res.confirm) {
          wx.switchTab({
            url: '/pages/family/map'
          })
        }
      }
    })
  }
})
