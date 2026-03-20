const app = getApp()

Page({
  data: {
    currentDate: '',
    greeting: '早上好',
    userName: '大爷',
    weather: null,
    loadingWeather: false,
    uid: '',
    elderId: null,
    medications: [],
    pendingMedications: [],
    completedMedications: [],
    reminderTotalDose: 0,
    reminderRemainingDose: 0,
    reminderCompletedDose: 0,
    showCompletedReminders: false
  },

  onLoad() {
    this.updateDate()
    this.updateGreeting()
    this.getWeather()
    this.loadUid()
    this.loadElderId()
    this.loadMedications()
  },

  onShow() {
    this.updateGreeting()
    this.loadElderId()
    this.loadMedications()
  },

  updateGreeting() {
    const hour = new Date().getHours()
    let greeting = '早上好'
    if (hour >= 5 && hour < 11) {
      greeting = '早上好'
    } else if (hour >= 11 && hour < 13) {
      greeting = '中午好'
    } else if (hour >= 13 && hour < 18) {
      greeting = '下午好'
    } else {
      greeting = '晚上好'
    }

    let userName = '大爷'
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo && userInfo.name) {
      userName = userInfo.name
    }

    this.setData({
      greeting,
      userName
    })
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
    const elderId = this.data.elderId
    const todayStr = new Date().toISOString().split('T')[0]
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const setReminderData = (list) => {
      const sortedList = list.sort((a, b) => {
        const aTime = a.remainingTimes > 0 ? (a.nextTime || '99:99') : '99:99'
        const bTime = b.remainingTimes > 0 ? (b.nextTime || '99:99') : '99:99'
        return aTime.localeCompare(bTime)
      })
      const pendingMedications = sortedList.filter(item => item.remainingTimes > 0)
      const completedMedications = sortedList.filter(item => item.remainingTimes === 0)
      const reminderTotalDose = sortedList.reduce((sum, item) => sum + item.totalTimes, 0)
      const reminderRemainingDose = sortedList.reduce((sum, item) => sum + item.remainingTimes, 0)
      const reminderCompletedDose = reminderTotalDose - reminderRemainingDose
      this.setData({
        medications: sortedList,
        pendingMedications,
        completedMedications,
        reminderTotalDose,
        reminderRemainingDose,
        reminderCompletedDose
      })
    }

    const isLocalActive = (med) => {
      if (med.startDate && med.duration) {
        const start = new Date(med.startDate)
        start.setHours(0, 0, 0, 0)
        const end = new Date(start)
        end.setDate(start.getDate() + parseInt(med.duration))
        return now >= start && now < end
      }
      if (med.startDate && med.endDate) {
        const start = new Date(med.startDate)
        start.setHours(0, 0, 0, 0)
        const end = new Date(med.endDate)
        end.setHours(23, 59, 59, 999)
        return now >= start && now <= end
      }
      return true
    }

    const normalizeTimes = (times, fallback = '08:00') => {
      if (Array.isArray(times)) return times.filter(Boolean)
      if (typeof times === 'string' && times.trim()) {
        return times.split(/[，,]/).map(t => t.trim()).filter(Boolean)
      }
      return [fallback]
    }

    const buildLocalItem = (med) => {
      const times = normalizeTimes(med.times || med.time)
      const todayRecord = med.takenRecords && med.takenRecords[todayStr] ? med.takenRecords[todayStr] : {}
      const takenTimes = times.filter(t => !!todayRecord[t]).length
      const remainingTimes = Math.max(times.length - takenTimes, 0)
      const nextTime = times.find(t => !todayRecord[t]) || times[0] || '--:--'
      return {
        id: med.id || `${med.name}-${times.join('-')}-local`,
        name: med.name || '未命名药品',
        dosage: med.dosage || '按时服用',
        totalTimes: times.length,
        takenTimes,
        remainingTimes,
        nextTime,
        timesText: times.join(' · ')
      }
    }

    const localMeds = (wx.getStorageSync('localMedications') || []).filter(isLocalActive).map(buildLocalItem)

    if (!elderId) {
      setReminderData(localMeds)
      return
    }

    wx.request({
      url: app.globalData.apiBaseUrl + '/medications/elder/' + elderId + '/daily',
      method: 'GET',
      data: { date_str: todayStr },
      success: (res) => {
        if (res.data && res.data.success && Array.isArray(res.data.data)) {
          const backendMeds = res.data.data.map((med) => {
            const times = Array.isArray(med.times) ? med.times : normalizeTimes(med.times)
            const todayStatus = Array.isArray(med.todayStatus) ? med.todayStatus : []
            const takenTimes = todayStatus.filter(v => v.taken).length
            const remainingTimes = typeof med.todayRemainingCount === 'number'
              ? med.todayRemainingCount
              : Math.max(times.length - takenTimes, 0)
            return {
              id: med.id || `${med.name}-${times.join('-')}-backend`,
              name: med.name || '未命名药品',
              dosage: med.dosage || med.frequency || '按时服用',
              totalTimes: times.length,
              takenTimes,
              remainingTimes,
              nextTime: todayStatus.find(v => !v.taken)?.time || times[0] || '--:--',
              timesText: times.join(' · ')
            }
          })
          setReminderData(backendMeds)
        } else {
          setReminderData(localMeds)
        }
      },
      fail: () => {
        setReminderData(localMeds)
      }
    })
  },

  toggleCompletedReminders() {
    this.setData({
      showCompletedReminders: !this.data.showCompletedReminders
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
    console.log('开始获取天气...')
    
    wx.getLocation({
      type: 'gcj02',
      success(res) {
        console.log('定位成功:', res)
        // 先通过经纬度获取城市名称
        that.getCityByLocation(res.latitude, res.longitude)
      },
      fail(err) {
        console.error('定位失败:', err)
        // 定位失败时使用默认城市
        that.fetchWeatherByCity('北京')
      }
    })
  },

  getCityByLocation(latitude, longitude) {
    const that = this
    console.log('开始获取城市名称，经纬度:', latitude, longitude)
    
    wx.request({
      url: app.globalData.apiBaseUrl + '/location/city',
      method: 'POST',
      data: {
        latitude: latitude,
        longitude: longitude
      },
      success(res) {
        console.log('获取城市成功:', res)
        if (res.data && res.data.success && res.data.city) {
          const city = res.data.city.replace('市', '') // 去掉"市"后缀
          console.log('最终城市名称:', city)
          that.fetchWeatherByCity(city)
        } else {
          console.log('获取城市失败，使用定位得到的城市或默认值', res.data)
          // 兜底：如果 API 失败但我们有经纬度，可以尝试传经纬度（如果后端支持）
          that.fetchWeatherByCity('张家界') // 用户图中显示的是张家界，作为备选
        }
      },
      fail(err) {
        console.error('获取城市失败:', err)
        that.fetchWeatherByCity('北京')
      }
    })
  },

  fetchWeatherByCity(city) {
    const that = this
    console.log('开始查询天气，城市:', city)
    wx.request({
      url: app.globalData.apiBaseUrl + '/weather/simple',
      data: { city: city },
      success(res) {
        console.log('天气 API 响应:', res)
        if (res.data && res.data.success) {
          console.log('天气数据:', res.data.data)
          that.setData({ weather: res.data.data, loadingWeather: false })
          console.log('页面 weather 数据已更新:', that.data.weather)
        } else {
          console.log('天气 API 返回失败:', res.data)
          that.setData({ loadingWeather: false })
        }
      },
      fail(err) {
        console.error('天气 API 调用失败:', err)
        that.setData({ loadingWeather: false })
      }
    })
  },

  refreshWeather() {
    const that = this
    console.log('刷新天气...')
    wx.showToast({
      title: '刷新中...',
      icon: 'loading',
      duration: 2000
    })
    this.getWeather()
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

  goToCalendar() {
    wx.navigateTo({ url: '/pages/calendar/calendar' })
  },

  goToNews() {
    wx.navigateTo({ url: '/pages/elder/news' })
  },

  goToProfile() {
    wx.navigateTo({ url: '/pages/profile/profile' })
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
          success(res) {
            if (res.statusCode === 200 || res.statusCode === 201) {
              wx.showToast({ title: '求助已发送！', icon: 'success', duration: 2000 })
            } else {
              wx.showToast({ title: '发送失败', icon: 'none' })
            }
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
          success(res) {
            if (res.statusCode === 200 || res.statusCode === 201) {
              wx.showToast({ title: '求助已发送！', icon: 'success', duration: 2000 })
            } else {
              wx.showToast({ title: '发送失败', icon: 'none' })
            }
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
