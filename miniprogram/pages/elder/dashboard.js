const app = getApp()

Page({
  data: {
    currentDate: '',
    weather: null,
    loadingWeather: false,
    uid: '',
    elderId: null,
    medications: []
  },

  onLoad() {
    this.updateDate()
    this.getWeather()
    this.loadUid()
    this.loadElderId()
    this.loadMedications()
  },

  onShow() {
    this.loadElderId()
    this.loadMedications()
  },

  loadUid() {
    let uid = app.globalData.elderUid
    if (!uid) {
      const userInfo = wx.getStorageSync('userInfo')
      if (userInfo && userInfo.elder_uid) {
        uid = userInfo.elder_uid
        app.globalData.elderUid = uid
      }
    }
    this.setData({ uid: uid || '' })
  },

  loadElderId() {
    let elderId = null
    
    // 1. 先尝试从 elderInfo 获取
    try {
      const elderInfo = wx.getStorageSync('elderInfo')
      if (elderInfo && elderInfo.id) {
        elderId = elderInfo.id
      }
    } catch (e) {
      console.error('读取 elderInfo 失败:', e)
    }
    
    // 2. 如果没有，尝试从 userInfo 获取
    if (!elderId) {
      try {
        const userInfo = wx.getStorageSync('userInfo')
        if (userInfo && userInfo.id && userInfo.user_type === 'elder') {
          elderId = userInfo.id
          // 同时保存到 elderInfo
          wx.setStorageSync('elderInfo', {
            id: userInfo.id,
            uid: userInfo.elder_uid || '',
            name: userInfo.name || '老人'
          })
        }
      } catch (e) {
        console.error('读取 userInfo 失败:', e)
      }
    }
    
    if (elderId) {
      this.setData({ elderId: elderId })
    }
  },

  loadMedications() {
    const that = this
    const elderId = this.data.elderId
    
    if (!elderId) {
      this.setData({
        medications: [
          { time: '08:00', dosage: '早餐后服用降压药' },
          { time: '12:00', dosage: '午餐后服用降糖药' },
          { time: '18:00', dosage: '晚餐后服用阿司匹林' }
        ]
      })
      return
    }

    wx.request({
      url: app.globalData.apiBaseUrl + '/medications/elder/' + elderId,
      method: 'GET',
      success(res) {
        console.log('加载药品列表成功:', res.data)
        if (res.data && Array.isArray(res.data)) {
          const medications = res.data.map(med => ({
            time: med.times || '08:00',
            dosage: med.dosage || med.frequency || '请按时服药'
          }))
          medications.sort((a, b) => a.time.localeCompare(b.time))
          that.setData({ medications })
        }
      },
      fail(err) {
        console.error('加载药品列表失败:', err)
        that.setData({
          medications: [
            { time: '08:00', dosage: '早餐后服用降压药' },
            { time: '12:00', dosage: '午餐后服用降糖药' },
            { time: '18:00', dosage: '晚餐后服用阿司匹林' }
          ]
        })
      }
    })
  },

  copyUid() {
    const { uid } = this.data
    if (uid) {
      wx.setClipboardData({
        data: uid,
        success: () => {
          wx.showToast({ title: '已复制 UID', icon: 'success', duration: 1500 })
        }
      })
    }
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

  getWeather() {
    const that = this
    this.setData({ loadingWeather: true })
    wx.getLocation({
      type: 'gcj02',
      success(res) {
        that.fetchWeatherByLocation(res.latitude, res.longitude)
      },
      fail() {
        that.fetchWeatherByCity('北京')
      }
    })
  },

  fetchWeatherByLocation(latitude, longitude) {
    const that = this
    wx.request({
      url: app.globalData.apiBaseUrl + '/weather/simple',
      data: { city: '北京' },
      success(res) {
        if (res.data && res.data.success) {
          that.setData({ weather: res.data.data, loadingWeather: false })
        } else {
          that.setData({ loadingWeather: false })
        }
      },
      fail() {
        that.setData({ loadingWeather: false })
      }
    })
  },

  fetchWeatherByCity(city) {
    const that = this
    wx.request({
      url: app.globalData.apiBaseUrl + '/weather/simple',
      data: { city: city },
      success(res) {
        if (res.data && res.data.success) {
          that.setData({ weather: res.data.data, loadingWeather: false })
        } else {
          that.setData({ loadingWeather: false })
        }
      },
      fail() {
        that.setData({ loadingWeather: false })
      }
    })
  },

  goToVoice() {
    wx.navigateTo({ url: '/pages/elder/voice' })
  },

  goToMedication() {
    wx.navigateTo({ url: '/pages/elder/medication' })
  },

  goToImageRecognition() {
    wx.navigateTo({ url: '/pages/elder/image-recognition' })
  },

  goToMap() {
    wx.navigateTo({ url: '/pages/elder/map' })
  },

  goToNews() {
    wx.navigateTo({ url: '/pages/elder/news' })
  },

  triggerEmergency() {
    wx.showModal({
      title: '确认求助',
      content: '确定要发送一键求助吗？',
      confirmText: '确定',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.sendEmergencyAlert()
        }
      }
    })
  },

  sendEmergencyAlert() {
    const that = this
    app.setEmergency()
    wx.getLocation({
      type: 'wgs84',
      success(res) {
        wx.request({
          url: app.globalData.apiBaseUrl + '/alerts',
          method: 'POST',
          header: { 'Authorization': 'Bearer ' + wx.getStorageSync('token') },
          data: {
            alert_type: 'emergency',
            message: '紧急求助！',
            latitude: res.latitude,
            longitude: res.longitude
          },
          success() {
            wx.showToast({ title: '求助已发送！', icon: 'success', duration: 2000 })
          },
          fail(err) {
            console.error('发送求助失败:', err)
            wx.showToast({ title: '发送失败，请重试', icon: 'none' })
          }
        })
      },
      fail() {
        wx.request({
          url: app.globalData.apiBaseUrl + '/alerts',
          method: 'POST',
          header: { 'Authorization': 'Bearer ' + wx.getStorageSync('token') },
          data: {
            alert_type: 'emergency',
            message: '紧急求助！'
          },
          success() {
            wx.showToast({ title: '求助已发送！', icon: 'success', duration: 2000 })
          },
          fail(err) {
            console.error('发送求助失败:', err)
            wx.showToast({ title: '发送失败，请重试', icon: 'none' })
          }
        })
      }
    })
  },

  logout() {
    app.clearUserInfo()
    wx.reLaunch({ url: '/pages/index/index' })
  }
})
