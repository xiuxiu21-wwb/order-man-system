App({
  globalData: {
    userInfo: null,
    userType: null,
    elderUid: null,
    apiBaseUrl: 'http://172.23.229.165:8000/api',
    hasEmergency: false,
    emergencyTime: ''
  },
  
  onLaunch() {
    const userType = wx.getStorageSync('userType')
    const userInfo = wx.getStorageSync('userInfo')
    if (userType && userInfo) {
      this.globalData.userType = userType
      this.globalData.userInfo = userInfo
      // 从 userInfo 中提取 elder_uid
      if (userInfo.elder_uid) {
        this.globalData.elderUid = userInfo.elder_uid
      }
    }
    const hasEmergency = wx.getStorageSync('hasEmergency')
    const emergencyTime = wx.getStorageSync('emergencyTime')
    if (hasEmergency) {
      this.globalData.hasEmergency = true
      this.globalData.emergencyTime = emergencyTime
    }
  },
  
  setUserInfo(userInfo, userType) {
    this.globalData.userInfo = userInfo
    this.globalData.userType = userType
    if (userInfo.elder_uid) {
      this.globalData.elderUid = userInfo.elder_uid
    }
    wx.setStorageSync('userInfo', userInfo)
    wx.setStorageSync('userType', userType)
  },
  
  clearUserInfo() {
    this.globalData.userInfo = null
    this.globalData.userType = null
    this.globalData.elderUid = null
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('userType')
  },
  
  // 获取当前用户的 UID（老人返回 elder_uid，子女返回空）
  getUserUid() {
    return this.globalData.elderUid || ''
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              },
  
  getCurrentTime() {
    const now = new Date()
    const hours = now.getHours().toString().padStart(2, '0')
    const minutes = now.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  },
  
  setEmergency() {
    this.globalData.hasEmergency = true
    this.globalData.emergencyTime = this.getCurrentTime()
    wx.setStorageSync('hasEmergency', true)
    wx.setStorageSync('emergencyTime', this.globalData.emergencyTime)
  },
  
  clearEmergency() {
    this.globalData.hasEmergency = false
    this.globalData.emergencyTime = ''
    wx.removeStorageSync('hasEmergency')
    wx.removeStorageSync('emergencyTime')
  }
})
