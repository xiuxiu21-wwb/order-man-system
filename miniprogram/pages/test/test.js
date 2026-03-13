const app = getApp()

Page({
  data: {
    testResult: ''
  },

  onLoad() {
    this.testNetwork()
  },

  testNetwork() {
    const that = this
    wx.showLoading({ title: '测试网络连接...' })
    
    wx.request({
      url: app.globalData.apiBaseUrl + '/users/test',
      method: 'GET',
      success(res) {
        wx.hideLoading()
        console.log('网络测试成功:', res.data)
        that.setData({ testResult: '网络连接正常: ' + JSON.stringify(res.data) })
      },
      fail(err) {
        wx.hideLoading()
        console.error('网络测试失败:', err)
        that.setData({ testResult: '网络连接失败: ' + JSON.stringify(err) })
      }
    })
  },

  testLogin() {
    const that = this
    wx.showLoading({ title: '测试登录接口...' })
    
    wx.request({
      url: app.globalData.apiBaseUrl + '/users/login',
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: { login: 'elder', password: '123456' },
      success(res) {
        wx.hideLoading()
        console.log('登录测试成功:', res.data)
        that.setData({ testResult: '登录接口正常: ' + JSON.stringify(res.data) })
      },
      fail(err) {
        wx.hideLoading()
        console.error('登录测试失败:', err)
        that.setData({ testResult: '登录接口失败: ' + JSON.stringify(err) })
      }
    })
  }
})