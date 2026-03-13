const app = getApp()

Page({
  data: {},

  onLoad() {
    const userType = wx.getStorageSync('userType')
    const token = wx.getStorageSync('token')
    if (userType && token) {
      if (userType === 'elder') {
        wx.redirectTo({
          url: '/pages/elder/dashboard'
        })
      } else if (userType === 'family') {
        wx.redirectTo({
          url: '/pages/family/dashboard'
        })
      }
    }
  },

  goToElder() {
    wx.navigateTo({
      url: '/pages/login/login?type=elder'
    })
  },

  goToFamily() {
    wx.navigateTo({
      url: '/pages/login/login?type=family'
    })
  }
})