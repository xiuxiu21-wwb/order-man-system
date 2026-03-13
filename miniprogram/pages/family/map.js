Page({
  data: {
    elderLongitude: 116.397428,
    elderLatitude: 39.90923,
    elderAddress: '北京市天安门广场',
    updateTime: '刚刚',
    loading: false,
    showTrack: false,
    elderCallout: {
      content: '爸爸在这里',
      color: '#3b82f6',
      fontSize: 12,
      borderRadius: 5,
      bgColor: '#ffffff',
      padding: 5,
      display: 'ALWAYS'
    },
    trackPoints: [
      { longitude: 116.397428, latitude: 39.90923 },
      { longitude: 116.398428, latitude: 39.91023 },
      { longitude: 116.399428, latitude: 39.91123 }
    ],
    trackList: [
      { time: '08:00', address: '家中' },
      { time: '09:30', address: '社区公园' },
      { time: '11:00', address: '菜市场' },
      { time: '12:30', address: '家中' }
    ]
  },

  onLoad() {
    this.startLocationUpdate()
  },

  onUnload() {
    this.stopLocationUpdate()
  },

  startLocationUpdate() {
    setInterval(() => {
      this.simulateLocationUpdate()
    }, 30000)
  },

  stopLocationUpdate() {
  },

  simulateLocationUpdate() {
    const now = new Date()
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    this.setData({
      updateTime: time
    })
  },

  refreshLocation() {
    this.setData({ loading: true })
    setTimeout(() => {
      this.setData({ loading: false })
      wx.showToast({
        title: '位置已更新',
        icon: 'success'
      })
    }, 1000)
  },

  callElder() {
    wx.makePhoneCall({
      phoneNumber: '13800138000',
      fail: () => {
        wx.showToast({
          title: '拨号功能需要真机测试',
          icon: 'none'
        })
      }
    })
  },

  viewTrack() {
    this.setData({
      showTrack: !this.data.showTrack
    })
  },

  onMarkerTap(e) {
    const markerId = e.detail.markerId
    if (markerId === 'elder') {
      wx.showToast({
        title: '老人位置',
        icon: 'none'
      })
    }
  }
})
