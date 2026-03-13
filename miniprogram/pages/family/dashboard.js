const app = getApp()

Page({
  data: {
    currentDate: '',
    lastUpdateTime: '刚刚',
    alertCount: 0,
    hasEmergency: false,
    emergencyTime: '',
    emergencyPolling: null
  },

  onLoad() {
    this.updateDate()
    this.loadEmergencyStatus()
    this.startEmergencyPolling()
  },

  onUnload() {
    if (this.data.emergencyPolling) {
      clearInterval(this.data.emergencyPolling)
    }
  },

  onShow() {
    this.loadEmergencyStatus()
  },

  updateDate() {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const day = now.getDate()
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const weekDay = weekDays[now.getDay()]
    this.setData({
      currentDate: `${year}年${month}月${day}日 ${weekDay}`
    })
  },

  loadEmergencyStatus() {
    this.setData({
      hasEmergency: app.globalData.hasEmergency,
      emergencyTime: app.globalData.emergencyTime,
      alertCount: app.globalData.hasEmergency ? 1 : 0
    })
  },

  startEmergencyPolling() {
    const polling = setInterval(() => {
      this.loadEmergencyStatus()
    }, 3000)
    this.setData({ emergencyPolling: polling })
  },

  clearEmergency() {
    wx.showModal({
      title: '确认取消',
      content: '确定要取消紧急报警吗？',
      confirmText: '确定',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          app.clearEmergency()
          this.setData({
            hasEmergency: false,
            emergencyTime: '',
            alertCount: 0
          })
          wx.showToast({
            title: '已取消报警',
            icon: 'success'
          })
        }
      }
    })
  },

  goToMap() {
    wx.navigateTo({
      url: '/pages/family/map'
    })
  },

  goToAlerts() {
    wx.navigateTo({
      url: '/pages/family/alerts'
    })
  },

  goToBindElder() {
    wx.navigateTo({
      url: '/pages/family/bind-elder'
    })
  },

  logout() {
    app.clearUserInfo()
    wx.reLaunch({
      url: '/pages/index/index'
    })
  }
})
