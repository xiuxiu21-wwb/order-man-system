const app = getApp()

Page({
  data: {
    login: '',
    password: '',
    userType: 'elder'
  },

  onLoad(options) {
    if (options.type) {
      this.setData({ userType: options.type })
    }
  },

  onLoginInput(e) {
    this.setData({ login: e.detail.value })
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value })
  },

  handleLogin() {
    const that = this
    const { login, password, userType } = this.data

    if (!login) {
      wx.showToast({ title: '请输入手机号或用户名', icon: 'none' })
      return
    }
    if (!password) {
      wx.showToast({ title: '请输入密码', icon: 'none' })
      return
    }

    wx.showLoading({ title: '登录中...' })

    const apiUrl = app.globalData.apiBaseUrl + '/users/login'
    console.log('请求 URL:', apiUrl)
    console.log('请求数据:', { login: login, password: password })

    wx.request({
      url: apiUrl,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: { login: login, password: password },
      success(res) {
        wx.hideLoading()
        if (res.data.access_token) {
          wx.setStorageSync('token', res.data.access_token)
          wx.setStorageSync('userInfo', res.data.user)  // 保存用户信息
          wx.setStorageSync('userType', res.data.user.user_type)  // 使用后端返回的用户类型
          app.globalData.userType = res.data.user.user_type
          app.globalData.userInfo = res.data.user
          
          // 如果是老人，保存 UID 和 elderInfo
          if (res.data.user.user_type === 'elder') {
            if (res.data.user.elder_uid) {
              app.globalData.elderUid = res.data.user.elder_uid
            }
            // 保存 elderInfo，供药品管理使用
            wx.setStorageSync('elderInfo', {
              id: res.data.user.id,
              uid: res.data.user.elder_uid,
              name: res.data.user.name || '老人'
            })
          }

          wx.showToast({ title: '登录成功', icon: 'success' })

          setTimeout(() => {
            if (res.data.user.user_type === 'elder') {
              wx.redirectTo({ url: '/pages/elder/dashboard' })
            } else {
              wx.redirectTo({ url: '/pages/family/dashboard' })
            }
          }, 1500)
        } else {
          wx.showToast({ title: res.data.detail || '登录失败', icon: 'none' })
        }
      },
      fail(err) {
        wx.hideLoading()
        console.error('登录失败详细错误:', err)
        wx.showToast({ title: '网络错误：' + (err.errMsg || '未知错误'), icon: 'none' })
      }
    })
  },

  goToRegister() {
    wx.navigateTo({
      url: '/pages/register/register?type=' + this.data.userType
    })
  }
})