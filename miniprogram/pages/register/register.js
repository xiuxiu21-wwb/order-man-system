const app = getApp()

Page({
  data: {
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
    userType: 'elder',
    elderUid: '',
    registeredUid: '',
    showUidInput: false,
    verifyCode: '',
    verifyCodeImage: '',
    verifyCodeId: ''
  },

  onLoad(options) {
    if (options.type) {
      this.setData({ 
        userType: options.type,
        showUidInput: options.type === 'family'
      })
    }
    // 加载验证码
    this.loadVerifyCode()
  },

  // 加载验证码
  loadVerifyCode() {
    const that = this
    wx.request({
      url: app.globalData.apiBaseUrl + '/verify-code',
      method: 'POST',
      success(res) {
        if (res.data && res.data.success && res.data.data) {
          that.setData({
            verifyCodeImage: res.data.data.image,
            verifyCodeId: res.data.data.codeId
          })
        }
      },
      fail() {
        // 加载失败时生成一个简单的验证码
        that.setData({
          verifyCodeImage: '',
          verifyCodeId: 'error'
        })
      }
    })
  },

  // 刷新验证码
  refreshVerifyCode() {
    this.loadVerifyCode()
  },

  // 输入验证码
  onVerifyCodeInput(e) {
    this.setData({ verifyCode: e.detail.value })
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value })
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value })
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value })
  },

  onConfirmPasswordInput(e) {
    this.setData({ confirmPassword: e.detail.value })
  },

  onElderUidInput(e) {
    this.setData({ elderUid: e.detail.value.trim() })
  },

  handleRegister() {
    const that = this
    const { name, phone, password, confirmPassword, userType, elderUid, verifyCode } = this.data

    if (!name) {
      wx.showToast({ title: '请输入姓名', icon: 'none' })
      return
    }
    if (!phone) {
      wx.showToast({ title: '请输入手机号', icon: 'none' })
      return
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '手机号格式不正确', icon: 'none' })
      return
    }
    if (!password || password.length < 6) {
      wx.showToast({ title: '密码至少 6 位', icon: 'none' })
      return
    }
    if (password !== confirmPassword) {
      wx.showToast({ title: '两次密码不一致', icon: 'none' })
      return
    }
    // 子女注册必须输入老人 UID
    if (userType === 'family' && !elderUid) {
      wx.showToast({ title: '请输入老人 UID', icon: 'none' })
      return
    }
    // 验证码校验（简单校验，实际应该在服务端校验）
    if (!verifyCode || verifyCode.length !== 4) {
      wx.showToast({ title: '请输入 4 位验证码', icon: 'none' })
      return
    }

    wx.showLoading({ title: '注册中...' })

    const registerData = {
      name: name,
      phone: phone,
      password: password,
      user_type: userType
    }
    
    // 如果是子女注册，添加老人 UID
    if (userType === 'family' && elderUid) {
      registerData.elder_uid = elderUid
    }

    wx.request({
      url: app.globalData.apiBaseUrl + '/users/register',
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: registerData,
      success(res) {
        wx.hideLoading()
        if (res.data.id) {
          // 如果是老人注册，保存并显示 UID
          if (userType === 'elder' && res.data.elder_uid) {
            that.setData({ registeredUid: res.data.elder_uid })
            wx.showModal({
              title: '注册成功',
              content: `您的老人 UID 是：${res.data.elder_uid}\n\n请妥善保存，子女注册时需要输入此 UID 与您绑定`,
              showCancel: false,
              confirmText: '我知道了',
              success() {
                wx.navigateBack()
              }
            })
          } else {
            wx.showToast({ title: '注册成功', icon: 'success' })
            setTimeout(() => {
              wx.navigateBack()
            }, 1500)
          }
        } else {
          wx.showToast({ title: res.data.detail || '注册失败', icon: 'none' })
        }
      },
      fail(err) {
        wx.hideLoading()
        wx.showToast({ title: '网络错误', icon: 'none' })
        console.error('注册失败:', err)
      }
    })
  },

  goToLogin() {
    wx.navigateBack()
  },

  // 复制 UID
  copyUid() {
    const { registeredUid } = this.data
    if (registeredUid) {
      wx.setClipboardData({
        data: registeredUid,
        success() {
          wx.showToast({ title: '已复制 UID', icon: 'success' })
        }
      })
    }
  }
})