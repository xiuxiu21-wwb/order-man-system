const app = getApp()

Page({
  data: {
    currentFilter: 'all',
    alerts: [],
    unreadCount: 0
  },

  onLoad() {
    this.fetchAlerts()
  },

  onShow() {
    this.fetchAlerts()
  },

  fetchAlerts() {
    const userInfo = wx.getStorageSync('userInfo')
    if (!userInfo || !userInfo.id) return

    wx.request({
      url: app.globalData.apiBaseUrl + '/alerts/family/' + userInfo.id,
      method: 'GET',
      header: { 'Authorization': 'Bearer ' + wx.getStorageSync('token') },
      success: (res) => {
        if (res.statusCode === 200 && Array.isArray(res.data)) {
          const formattedAlerts = res.data.map(alert => {
            const date = new Date(alert.created_at)
            const timeStr = `${date.getMonth()+1}-${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
            
            let typeText = '系统通知'
            let icon = '📱'
            if (alert.alert_type === 'emergency') {
              typeText = '紧急求助'
              icon = '🚨'
            } else if (alert.alert_type === 'warning') {
              typeText = '行为异常'
              icon = '⚠️'
            }

            return {
              id: alert.id,
              type: alert.alert_type,
              typeText: typeText,
              icon: icon,
              title: alert.message || typeText,
              description: alert.message || '收到一条新的告警信息',
              time: timeStr,
              location: alert.latitude ? '查看位置' : '',
              read: alert.status !== 'pending',
              latitude: alert.latitude,
              longitude: alert.longitude
            }
          })
          
          this.setData({ alerts: formattedAlerts })
          this.updateUnreadCount()
        }
      }
    })
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
    const alert = this.data.alerts.find(a => a.id === id)
    
    if (!alert.read) {
      // 更新后端状态
      wx.request({
        url: app.globalData.apiBaseUrl + '/alerts/' + id + '/status?status=resolved',
        method: 'PUT',
        header: { 'Authorization': 'Bearer ' + wx.getStorageSync('token') },
        success: () => {
          const alerts = this.data.alerts.map(a => {
            if (a.id === id) return { ...a, read: true }
            return a
          })
          this.setData({ alerts })
          this.updateUnreadCount()
        }
      })
    }
    
    wx.showModal({
      title: '告警详情',
      content: alert.description || '点击确定可联系老人或查看位置',
      confirmText: alert.latitude ? '查看位置' : '知道了',
      cancelText: alert.latitude ? '取消' : '',
      showCancel: !!alert.latitude,
      success: (res) => {
        if (res.confirm && alert.latitude) {
          wx.openLocation({
            latitude: alert.latitude,
            longitude: alert.longitude,
            name: '老人报警位置'
          })
        }
      }
    })
  }
})
