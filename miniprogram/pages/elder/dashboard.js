const app = getApp()
const { fetchOpenMeteoWeather, getDistanceKm } = require('../../utils/open-meteo')

const getLocalDateKey = () => {
  const now = new Date()
  return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0')
}

Page({
  data: {
    currentDate: '',
    greeting: '早上好',
    userName: '大爷',
    weather: null,
    loadingWeather: false,
    weatherRefreshTimer: null,
    lastWeatherLocation: null,
    lastWeatherRefreshAt: 0,
    uid: '',
    elderId: null,
    medications: [],
    pendingMedications: [],
    completedMedications: [],
    reminderTotalDose: 0,
    reminderRemainingDose: 0,
    reminderCompletedDose: 0,
    showCompletedReminders: false,
    carePlan: null,
    carePlanLoading: false,
    petCareTasks: [],
    petMedicationPlans: [],
    waterCount: 0,
    waterGoal: 6,
    waterPercent: 0,
    activityMinutes: 0,
    activityGoal: 30,
    activityPercent: 0,
    petStyle: '',
    petIsDragging: false,
    petChatOpen: false,
    petChatInput: '',
    petChatMessages: [],
    petChatSending: false,
    petChatScrollTarget: '',
    petSpeaking: false,
    quickQuestions: [
      '漏服药了，现在应该怎么办？',
      '今天的天气适合出去散步吗？',
      '家里地上有水，会不会容易摔倒？'
    ]
  },

  onLoad() {
    this.audioContext = wx.createInnerAudioContext()
    this.lastPetTtsRequestId = 0
    this.petPlanAnnounced = false
    this.initPetPosition()
    this.updateDate()
    this.updateGreeting()
    this.loadDailyProgress()
    this.startWeatherTracking()
    this.loadUid()
    this.loadElderId()
    this.loadMedications()
    setTimeout(() => this.announcePetPlan({ allowEmpty: true }), 2500)
  },

  onShow() {
    this.updateGreeting()
    this.loadDailyProgress()
    this.startWeatherTracking({ silent: true })
    this.loadElderId()
    this.loadMedications()
  },

  onHide() {
    this.stopPetSpeaking()
    this.stopLocationWatching()
    this.clearWeatherAutoRefresh()
  },

  onUnload() {
    this.stopPetSpeaking()
    if (this.audioContext) {
      this.audioContext.destroy()
      this.audioContext = null
    }
    this.stopLocationWatching()
    this.clearWeatherAutoRefresh()
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

    try {
      const elderInfo = wx.getStorageSync('elderInfo')
      if (elderInfo && elderInfo.id) {
        elderId = elderInfo.id
      }
    } catch (e) {
      console.error('读取 elderInfo 失败:', e)
    }

    if (!elderId) {
      try {
        const userInfo = wx.getStorageSync('userInfo')
        if (userInfo && userInfo.id && userInfo.user_type === 'elder') {
          elderId = userInfo.id
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
      this.setData({ elderId }, () => this.loadCarePlan())
    }
  },

  loadMedications() {
    const elderId = this.data.elderId
    const todayStr = new Date().toISOString().split('T')[0]
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const setReminderData = (list) => {
      console.log('原始数据列表:', list)
      console.log('每个药品的 times:', list.map(item => ({ id: item.id, name: item.name, times: item.times, timesWithStatus: item.timesWithStatus })))
      console.log('每个药品的 timesWithStatus 详情:', list.map(item => ({ id: item.id, timesWithStatus: item.timesWithStatus })))
      const sortedList = list.sort((a, b) => {
        const aTime = a.remainingTimes > 0 ? (a.nextTime || '99:99') : '99:99'
        const bTime = b.remainingTimes > 0 ? (b.nextTime || '99:99') : '99:99'
        return aTime.localeCompare(bTime)
      })
      const pendingMedications = sortedList.filter(item => item.remainingTimes > 0)
      const completedMedications = sortedList.filter(item => item.remainingTimes === 0)
      console.log('待服药 times:', pendingMedications.map(item => ({ id: item.id, times: item.times })))
      console.log('已完成 times:', completedMedications.map(item => ({ id: item.id, times: item.times })))
      const reminderTotalDose = sortedList.reduce((sum, item) => sum + item.totalTimes, 0)
      const reminderRemainingDose = sortedList.reduce((sum, item) => sum + item.remainingTimes, 0)
      const reminderCompletedDose = reminderTotalDose - reminderRemainingDose
      this.setData({
        medications: sortedList,
        pendingMedications,
        completedMedications,
        reminderTotalDose,
        reminderRemainingDose,
        reminderCompletedDose,
        petMedicationPlans: this.buildPetMedicationPlans(pendingMedications)
      }, () => this.loadCarePlan())
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
      // 创建时间胶囊列表，每个胶囊都有时间和状态
      const timePills = times.map(time => ({
        time: time,
        taken: !!todayRecord[time]
      }))
      console.log('本地数据 - 时间胶囊列表:', timePills)
      
      const result = {
        id: med.id || `${med.name}-${times.join('-')}-local`,
        name: med.name || '未命名药品',
        dosage: med.dosage || '按时服用',
        totalTimes: times.length,
        takenTimes,
        remainingTimes,
        nextTime,
        times: times,
        timePills: timePills,
        timesText: times.join(' / ')
      }
      console.log('本地数据 - result:', result)
      return result
    }

    const localMeds = (wx.getStorageSync('localMedications') || []).filter(isLocalActive).map(buildLocalItem)
    console.log('本地加载的药品数据:', localMeds)

    if (!elderId) {
      console.log('没有 elderId，使用本地数据')
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
            console.log('单个药品原始数据:', med)
            console.log('med.times 类型:', typeof med.times, 'isArray:', Array.isArray(med.times))
            let times
            if (Array.isArray(med.times)) {
              times = med.times
              console.log('使用数组 times:', times)
            } else {
              times = normalizeTimes(med.times)
              console.log('使用 normalizeTimes 处理后的 times:', times)
            }
            const todayStatus = Array.isArray(med.todayStatus) ? med.todayStatus : []
            const takenTimes = todayStatus.filter(v => v.taken).length
            const remainingTimes = typeof med.todayRemainingCount === 'number'
              ? med.todayRemainingCount
              : Math.max(times.length - takenTimes, 0)
            // 为每个时间点添加服药状态
            // 创建时间胶囊列表，每个胶囊都有时间和状态
            const timePills = times.map(time => {
              const status = todayStatus.find(s => s.time === time)
              return {
                time: time,
                taken: status ? status.taken : false
              }
            })
            console.log('时间胶囊列表:', timePills)
            
            const result = {
              id: med.id || `${med.name}-${times.join('-')}-backend`,
              name: med.name || '未命名药品',
              dosage: med.dosage || med.frequency || '按时服用',
              totalTimes: times.length,
              takenTimes,
              remainingTimes,
              nextTime: todayStatus.find(v => !v.taken)?.time || times[0] || '--:--',
              times: times,
              timePills: timePills,
              timesText: times.join(' / ')
            }
            console.log('处理后的结果:', result)
            return result
          })
          console.log('后端加载的药品数据:', backendMeds)
          setReminderData(backendMeds)
        } else {
          console.log('后端返回数据异常，使用本地数据')
          setReminderData(localMeds)
        }
      },
      fail: (err) => {
        console.error('后端请求失败:', err)
        setReminderData(localMeds)
      }
    })
  },

  toggleCompletedReminders() {
    this.setData({
      showCompletedReminders: !this.data.showCompletedReminders
    })
  },

  toggleMedicationTaken(e) {
    const medIndex = e.currentTarget.dataset.medIndex
    const pillIndex = e.currentTarget.dataset.pillIndex
    const todayStr = new Date().toISOString().split('T')[0]
    
    const pendingMedications = this.data.pendingMedications
    const medication = pendingMedications[medIndex]
    const pill = medication.timePills[pillIndex]
    
    if (!pill) return
    
    const newTaken = !pill.taken
    
    pill.taken = newTaken
    if (newTaken) {
      medication.remainingTimes = Math.max(medication.remainingTimes - 1, 0)
      medication.takenTimes = medication.takenTimes + 1
    } else {
      medication.remainingTimes = medication.remainingTimes + 1
      medication.takenTimes = Math.max(medication.takenTimes - 1, 0)
    }
    
    this.setData({
      pendingMedications: pendingMedications,
      petMedicationPlans: this.buildPetMedicationPlans(pendingMedications)
    })
    
    wx.showToast({
      title: newTaken ? '服药成功！' : '已取消',
      icon: newTaken ? 'success' : 'none'
    })
    
    const localMeds = wx.getStorageSync('localMedications') || []
    const targetMed = localMeds.find(m => m.id === medication.id || m.name === medication.name)
    
    if (targetMed) {
      if (!targetMed.takenRecords) {
        targetMed.takenRecords = {}
      }
      if (!targetMed.takenRecords[todayStr]) {
        targetMed.takenRecords[todayStr] = {}
      }
      if (newTaken) {
        targetMed.takenRecords[todayStr][pill.time] = true
      } else {
        delete targetMed.takenRecords[todayStr][pill.time]
      }
      wx.setStorageSync('localMedications', localMeds)
    }
    
    const elderId = this.data.elderId
    if (elderId && medication.id && !isNaN(medication.id)) {
      wx.request({
        url: app.globalData.apiBaseUrl + '/medications/elder/toggle',
        method: 'POST',
        header: {
          'Content-Type': 'application/json'
        },
        data: {
          elder_id: elderId,
          medication_id: medication.id,
          scheduled_date: todayStr,
          scheduled_time: pill.time,
          taken: newTaken
        },
        success: (res) => {
          console.log('服药状态同步成功', res)
          this.loadCarePlan()
        },
        fail: (err) => {
          console.error('服药状态同步失败', err)
        }
      })
    }
  },

  buildPetMedicationPlans(medications) {
    return (medications || [])
      .filter((medication) => medication.remainingTimes > 0)
      .slice(0, 2)
      .map((medication) => {
        const nextPill = Array.isArray(medication.timePills)
          ? medication.timePills.find((pill) => !pill.taken)
          : null
        return {
          id: medication.id || medication.name,
          name: medication.name || '未命名药品',
          time: nextPill ? nextPill.time : (medication.nextTime || '--:--')
        }
      })
  },

  copyUid() {
    const { uid } = this.data
    if (!uid) return

    wx.setClipboardData({
      data: uid,
      success: () => {
        wx.showToast({ title: '已复制 UID', icon: 'success', duration: 1500 })
      }
    })
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

  startWeatherTracking(options = {}) {
    // The backend domain is already registered with WeChat. Show its weather
    // first so a phone without location permission never gets an empty card.
    this.loadFallbackWeather()
    this.startLocationWatching()
    this.startWeatherAutoRefresh()
    this.getWeather(options)
  },

  startWeatherAutoRefresh() {
    if (this.data.weatherRefreshTimer) {
      return
    }

    const timer = setInterval(() => {
      this.getWeather({ silent: true })
    }, 5 * 60 * 1000)

    this.setData({ weatherRefreshTimer: timer })
  },

  clearWeatherAutoRefresh() {
    if (!this.data.weatherRefreshTimer) {
      return
    }

    clearInterval(this.data.weatherRefreshTimer)
    this.setData({ weatherRefreshTimer: null })
  },

  startLocationWatching() {
    if (this.locationChangeHandler || !wx.startLocationUpdate) {
      return
    }

    this.locationChangeHandler = (res) => {
      const nextLocation = {
        latitude: res.latitude,
        longitude: res.longitude
      }

      const distanceKm = getDistanceKm(this.data.lastWeatherLocation, nextLocation)
      const enoughTimeElapsed = Date.now() - (this.data.lastWeatherRefreshAt || 0) > 60 * 1000

      if (distanceKm >= 0.2 || enoughTimeElapsed) {
        this.fetchWeatherByLocation(nextLocation, { silent: true })
      }
    }

    wx.startLocationUpdate({
      type: 'wgs84',
      success: () => {
        wx.onLocationChange(this.locationChangeHandler)
      },
      fail: (err) => {
        console.warn('开启位置监听失败，回退到进入页面刷新:', err)
      }
    })
  },

  stopLocationWatching() {
    if (this.locationChangeHandler && wx.offLocationChange) {
      wx.offLocationChange(this.locationChangeHandler)
    }

    this.locationChangeHandler = null

    if (wx.stopLocationUpdate) {
      wx.stopLocationUpdate({
        fail: () => {}
      })
    }
  },

  fetchWeatherByLocation(nextLocation, options = {}) {
    const { silent = false, force = false } = options
    const lastRefreshAt = this.data.lastWeatherRefreshAt || 0
    const distanceKm = getDistanceKm(this.data.lastWeatherLocation, nextLocation)
    const isFresh = Date.now() - lastRefreshAt < 2 * 60 * 1000

    if (!force && isFresh && distanceKm < 0.2 && this.data.weather) {
      this.setData({ loadingWeather: false })
      return
    }

    this.syncElderLocation(nextLocation)

    fetchOpenMeteoWeather(nextLocation.latitude, nextLocation.longitude)
      .then((weather) => {
        wx.setStorageSync('lastWeatherSnapshot', weather)
        this.setData({
          weather,
          loadingWeather: false,
          lastWeatherLocation: nextLocation,
          lastWeatherRefreshAt: Date.now()
        }, () => this.loadCarePlan())
      })
      .catch((err) => {
        console.error('Open-Meteo 获取天气失败:', err)
        this.loadFallbackWeather({ silent })
      })
  },

  normalizeFallbackWeather(weather) {
    if (!weather || typeof weather !== 'object') return null
    const toNumber = (value, fallback = 0) => {
      const number = Number(value)
      return Number.isFinite(number) ? Math.round(number) : fallback
    }

    return {
      city: weather.city || '张家界',
      weather: weather.weather || '多云',
      temperature: toNumber(weather.temperature),
      humidity: toNumber(weather.humidity),
      winddirection: weather.winddirection || '--',
      windpower: weather.windpower || '--',
      weather_icon: weather.weather_icon || '🌤️',
      forecasts: Array.isArray(weather.forecasts) ? weather.forecasts : [],
      updatedAt: Date.now()
    }
  },

  loadFallbackWeather(options = {}) {
    const { silent = true } = options
    const cachedWeather = this.normalizeFallbackWeather(wx.getStorageSync('lastWeatherSnapshot'))
    if (cachedWeather) {
      if (!this.data.weather) this.setData({ weather: cachedWeather, loadingWeather: false })
      return
    }

    wx.request({
      url: app.globalData.apiBaseUrl + '/weather?city=' + encodeURIComponent('张家界'),
      method: 'GET',
      timeout: 8000,
      success: (res) => {
        const weather = this.normalizeFallbackWeather(res.data && res.data.data)
        if (weather) {
          wx.setStorageSync('lastWeatherSnapshot', weather)
          // Do not overwrite weather that has already been refreshed by GPS.
          if (!this.data.weather) {
            this.setData({ weather, loadingWeather: false }, () => this.loadCarePlan())
          }
          return
        }
        this.setData({ loadingWeather: false })
      },
      fail: () => {
        this.setData({ loadingWeather: false })
        if (!silent && !this.data.weather) {
          wx.showToast({ title: '天气暂时不可用', icon: 'none' })
        }
      }
    })
  },

  syncElderLocation(location) {
    const elderId = this.data.elderId
    if (!elderId) return
    const snapshot = wx.getStorageSync('elderLocationSnapshot') || {}
    wx.request({
      url: app.globalData.apiBaseUrl + '/locations/sync',
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: {
        elder_id: elderId,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy || 0,
        address: snapshot.address || ''
      }
    })
  },

  getWeather(options = {}) {
    const { silent = false, force = false } = options

    if (!silent) {
      this.setData({ loadingWeather: true })
    }

    wx.getLocation({
      type: 'wgs84',
      isHighAccuracy: true,
      success: async (res) => {
        const nextLocation = {
          latitude: res.latitude,
          longitude: res.longitude
        }
        this.fetchWeatherByLocation(nextLocation, { silent, force })
      },
      fail: (err) => {
        console.error('定位失败:', err)
        this.loadFallbackWeather({ silent })

        if (!silent) {
          wx.showToast({ title: '已显示默认城市天气', icon: 'none' })
        }
      }
    })
  },

  refreshWeather() {
    wx.showToast({
      title: '刷新天气中',
      icon: 'loading',
      duration: 1500
    })
    this.getWeather({ force: true })
  },

  loadCarePlan() {
    const elderId = this.data.elderId
    if (!elderId || this.data.carePlanLoading) return

    const weather = this.data.weather || {}
    const planParams = { weather: weather.weather || '' }
    if (typeof weather.temperature === 'number') {
      planParams.temperature = weather.temperature
    }
    this.setData({ carePlanLoading: true })
    wx.request({
      url: app.globalData.apiBaseUrl + '/care/risks/evaluate/' + elderId,
      method: 'POST'
    })
    wx.request({
      url: app.globalData.apiBaseUrl + '/care/plan/' + elderId,
      method: 'GET',
      data: planParams,
      success: (res) => {
        if (res.data && res.data.success) {
          const rawCarePlan = res.data.data || {}
          const tasks = (Array.isArray(rawCarePlan.tasks) ? rawCarePlan.tasks : [])
            .filter((task) => task.type !== 'check_in')
          const carePlan = {
            ...rawCarePlan,
            risks: Array.isArray(rawCarePlan.risks) ? rawCarePlan.risks : [],
            tasks
          }
          this.setData({ carePlan, petCareTasks: tasks.slice(0, 2) }, () => this.announcePetPlan())
        }
      },
      complete: () => this.setData({ carePlanLoading: false })
    })
  },

  loadDailyProgress() {
    const today = getLocalDateKey()
    const saved = wx.getStorageSync('elderDailyProgress') || {}
    const progress = saved.date === today ? saved : { date: today, waterCount: 0, activityMinutes: 0 }
    this.updateDailyProgress(progress)
  },

  updateDailyProgress(progress) {
    const waterCount = Math.max(0, Number(progress.waterCount) || 0)
    const activityMinutes = Math.max(0, Number(progress.activityMinutes) || 0)
    this.setData({
      waterCount,
      waterPercent: Math.min(100, Math.round(waterCount / this.data.waterGoal * 100)),
      activityMinutes,
      activityPercent: Math.min(100, Math.round(activityMinutes / this.data.activityGoal * 100))
    })
  },

  saveDailyProgress(changes, message) {
    const progress = {
      date: getLocalDateKey(),
      waterCount: this.data.waterCount,
      activityMinutes: this.data.activityMinutes,
      ...changes
    }
    wx.setStorageSync('elderDailyProgress', progress)
    this.updateDailyProgress(progress)
    if (message) {
      wx.showToast({ title: message, icon: 'success' })
    }
  },

  addWater() {
    this.saveDailyProgress({ waterCount: this.data.waterCount + 1 }, '已记录一杯水')
  },

  addActivity() {
    this.saveDailyProgress({ activityMinutes: this.data.activityMinutes + 10 }, '已记录十分钟活动')
  },

  askQuickQuestion(e) {
    const question = e.currentTarget.dataset.question
    if (!question) return
    wx.setStorageSync('pendingChatQuestion', question)
    wx.navigateTo({ url: '/pages/elder/voice' })
  },

  goToCareProfile() {
    wx.navigateTo({ url: '/pages/elder/care-profile' })
  },

  goToKnowledge() {
    wx.navigateTo({ url: '/pages/elder/knowledge' })
  },

  goToVoice() {
    wx.navigateTo({ url: '/pages/elder/voice' })
  },

  initPetPosition() {
    const systemInfo = wx.getSystemInfoSync()
    const savedPosition = wx.getStorageSync('elderDashboardPetPosition') || {}
    const scale = systemInfo.windowWidth / 750
    const petWidth = 464 * scale
    const petHeight = 420 * scale
    const edge = 8
    const defaultLeft = systemInfo.windowWidth - 22 * scale - petWidth
    const defaultTop = systemInfo.windowHeight - 238 * scale - petHeight
    const left = this.clampPetPosition(savedPosition.left, edge, systemInfo.windowWidth - petWidth - edge, defaultLeft)
    const top = this.clampPetPosition(savedPosition.top, edge, systemInfo.windowHeight - petHeight - edge, defaultTop)

    this.petViewport = { width: systemInfo.windowWidth, height: systemInfo.windowHeight }
    this.petPosition = { left, top, width: petWidth, height: petHeight, edge }
    this.setData({ petStyle: this.getPetStyle(left, top) })
  },

  clampPetPosition(value, min, max, fallback) {
    const target = typeof value === 'number' ? value : fallback
    return Math.max(min, Math.min(target, Math.max(min, max)))
  },

  getPetStyle(left, top) {
    return 'left:' + Math.round(left) + 'px;top:' + Math.round(top) + 'px;right:auto;bottom:auto;'
  },

  startPetDrag(e) {
    const touch = e.touches && e.touches[0]
    if (!touch || !this.petPosition) return

    this.petDragState = {
      startX: touch.clientX == null ? touch.pageX : touch.clientX,
      startY: touch.clientY == null ? touch.pageY : touch.clientY,
      originLeft: this.petPosition.left,
      originTop: this.petPosition.top,
      moved: false
    }
    this.setData({ petIsDragging: true })
  },

  movePet(e) {
    const touch = e.touches && e.touches[0]
    const drag = this.petDragState
    if (!touch || !drag || !this.petPosition) return

    const touchX = touch.clientX == null ? touch.pageX : touch.clientX
    const touchY = touch.clientY == null ? touch.pageY : touch.clientY
    const deltaX = touchX - drag.startX
    const deltaY = touchY - drag.startY
    if (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6) drag.moved = true

    const viewport = this.petViewport || wx.getSystemInfoSync()
    const left = this.clampPetPosition(drag.originLeft + deltaX, this.petPosition.edge, viewport.width - this.petPosition.width - this.petPosition.edge, drag.originLeft)
    const top = this.clampPetPosition(drag.originTop + deltaY, this.petPosition.edge, viewport.height - this.petPosition.height - this.petPosition.edge, drag.originTop)
    this.petPosition.left = left
    this.petPosition.top = top
    this.setData({ petStyle: this.getPetStyle(left, top) })
  },

  endPetDrag() {
    const drag = this.petDragState
    if (!drag) return

    if (drag.moved && this.petPosition) {
      this.petTapBlockedUntil = Date.now() + 250
      wx.setStorageSync('elderDashboardPetPosition', {
        left: this.petPosition.left,
        top: this.petPosition.top
      })
    }
    this.petDragState = null
    this.setData({ petIsDragging: false })
  },

  openPetChat() {
    if (Date.now() < (this.petTapBlockedUntil || 0)) return
    if (this.data.petChatOpen) return

    const messages = this.data.petChatMessages.length
      ? this.data.petChatMessages
      : [this.createPetChatMessage('您好，我是奶龙。想聊天、查天气，或者说“打开新闻”都可以。', false)]

    this.setData({
      petChatOpen: true,
      petChatMessages: messages,
      petChatScrollTarget: 'pet-chat-end-' + Date.now()
    })
  },

  // 奶龙点击状态：打开对话并开始播报；播放中再次点击立即停止；停止后再次点击重新播报。
  onPetTap() {
    if (Date.now() < (this.petTapBlockedUntil || 0)) return
    // 首页自动播报期间，首次点击优先展开对话框，不会直接把用户带来的朗读打断。
    if (!this.data.petChatOpen) {
      this.openPetChat()
      if (!this.data.petSpeaking) this.announcePetPlan({ replay: true, allowEmpty: true })
      return
    }
    if (this.data.petSpeaking) {
      this.stopPetSpeaking()
      return
    }
    this.announcePetPlan({ replay: true, allowEmpty: true })
  },

  buildPetPlanSpeech() {
    const plan = this.data.carePlan
    const tasks = Array.isArray(this.data.petCareTasks) ? this.data.petCareTasks : []
    const meds = Array.isArray(this.data.petMedicationPlans) ? this.data.petMedicationPlans : []
    const parts = ['您好，我是奶龙。今天的照护计划如下。']
    if (plan && plan.summary) parts.push(plan.summary)
    if (tasks.length) {
      parts.push('今天需要完成：' + tasks.map(item => item.title || item.name).filter(Boolean).join('、') + '。')
    }
    if (meds.length) {
      parts.push('服药计划：' + meds.map(item => `${item.time || '按时'}服用${item.name || '药品'}`).join('，') + '。')
    }
    if (parts.length === 1) parts.push('目前还没有读取到具体计划，您可以先和我聊聊。')
    return parts.join('')
  },

  announcePetPlan(options = {}) {
    if (this.petPlanAnnounced && !options.replay) return
    const hasPlanData = !!this.data.carePlan || this.data.petMedicationPlans.length > 0
    // 计划仍在请求时延迟播报，避免先说“暂无计划”而错过真实计划。
    if (!hasPlanData && options.allowEmpty && this.data.carePlanLoading) {
      setTimeout(() => this.announcePetPlan({ allowEmpty: true }), 800)
      return
    }
    if (!hasPlanData && !options.allowEmpty) {
      if ((this.petPlanAnnounceRetry || 0) < 5) {
        this.petPlanAnnounceRetry = (this.petPlanAnnounceRetry || 0) + 1
        setTimeout(() => this.announcePetPlan(), 800)
      }
      return
    }
    this.petPlanAnnounced = true
    this.speakPetText(this.buildPetPlanSpeech())
  },

  stopPetSpeaking() {
    this.lastPetTtsRequestId = (this.lastPetTtsRequestId || 0) + 1
    if (this.audioContext) this.audioContext.stop()
    if (this.data.petSpeaking) this.setData({ petSpeaking: false })
  },

  speakPetText(text) {
    const content = (text || '').trim()
    if (!content || !this.audioContext) return
    const requestId = ++this.lastPetTtsRequestId
    this.setData({ petSpeaking: true })
    wx.request({
      url: app.globalData.apiBaseUrl + '/voice/tts',
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: { text: content.slice(0, 500) },
      responseType: 'arraybuffer',
      success: (res) => {
        if (requestId !== this.lastPetTtsRequestId) return
        if (res.statusCode !== 200 || !res.data) {
          this.setData({ petSpeaking: false })
          return
        }
        const filePath = `${wx.env.USER_DATA_PATH}/pet-voice-${Date.now()}.mp3`
        wx.getFileSystemManager().writeFile({
          filePath,
          data: res.data,
          success: () => {
            if (!this.audioContext || requestId !== this.lastPetTtsRequestId) return
            this.audioContext.stop()
            this.audioContext.src = filePath
            this.audioContext.offEnded && this.audioContext.offEnded()
            this.audioContext.onEnded(() => {
              if (requestId === this.lastPetTtsRequestId) this.setData({ petSpeaking: false })
            })
            this.audioContext.play()
          },
          fail: () => {
            if (requestId === this.lastPetTtsRequestId) this.setData({ petSpeaking: false })
          }
        })
      },
      fail: () => {
        if (requestId === this.lastPetTtsRequestId) this.setData({ petSpeaking: false })
      }
    })
  },

  closePetChat() {
    this.stopPetSpeaking()
    this.setData({ petChatOpen: false, petChatInput: '' })
  },

  preventPetChatTap() {},

  onPetChatInput(e) {
    this.setData({ petChatInput: e.detail.value })
  },

  createPetChatMessage(text, isUser, extras = {}) {
    return {
      id: Date.now() + Math.floor(Math.random() * 1000),
      text,
      isUser,
      ...extras
    }
  },

  appendPetChatMessage(text, isUser, extras = {}) {
    const messages = this.data.petChatMessages.concat(this.createPetChatMessage(text, isUser, extras))
    this.setData({
      petChatMessages: messages,
      petChatScrollTarget: 'pet-chat-end-' + Date.now()
    })
  },

  sendPetChat() {
    const message = this.data.petChatInput.trim()
    if (!message || this.data.petChatSending) return

    this.stopPetSpeaking()
    this.appendPetChatMessage(message, true)
    this.setData({ petChatInput: '', petChatSending: true })
    if (this.handlePetChatCommand(message)) return

    const userInfo = wx.getStorageSync('userInfo') || {}
    const elderInfo = wx.getStorageSync('elderInfo') || {}
    const messages = this.data.petChatMessages
      .filter(item => item && item.text)
      .slice(-10)
      .map(item => ({
        role: item.isUser ? 'user' : 'assistant',
        content: item.text
      }))

    const requestChat = (location) => {
      const data = {
        message,
        messages,
        elder_id: elderInfo.id || userInfo.id || null
      }
      if (location) {
        data.current_latitude = location.latitude
        data.current_longitude = location.longitude
      }
      wx.request({
        url: app.globalData.apiBaseUrl + '/chat',
        method: 'POST',
        header: { 'Content-Type': 'application/json' },
        data,
        success: (res) => {
          const reply = res.data && (res.data.response || res.data.text || res.data.message)
          this.appendPetChatMessage(
            typeof reply === 'string' && reply.trim()
              ? reply.trim()
              : '我刚刚没有听明白，您可以换个说法试试。',
            false,
            res.data && res.data.navigation ? { navigation: res.data.navigation } : {}
          )
          if (typeof reply === 'string' && reply.trim()) this.speakPetText(reply.trim())
        },
        fail: () => {
          this.appendPetChatMessage('现在网络有点忙，您稍等一下再试。', false)
          this.speakPetText('现在网络有点忙，您稍等一下再试。')
        },
        complete: () => this.setData({ petChatSending: false })
      })
    }

    if (!this.extractPetNavigationDestination(message)) {
      requestChat()
      return
    }

    wx.getLocation({
      type: 'gcj02',
      isHighAccuracy: true,
      success: (res) => requestChat({ latitude: res.latitude, longitude: res.longitude }),
      fail: () => {
        this.appendPetChatMessage('请先开启位置权限，我才能通过高德地图查询目的地距离并为您导航。', false)
        this.setData({ petChatSending: false })
      }
    })
  },

  extractPetNavigationDestination(message) {
    const normalized = (message || '').replace(/\s+/g, '')
    const match = normalized.match(/(?:我要|我想|想|请|帮我|带我)?(?:去|到|前往|导航去|导航到)([^，。！？?！,.]{2,40})/)
    return match ? match[1].replace(/(?:怎么走|怎么去|吧|呀|啊|呢)$/, '').trim() : ''
  },

  handlePetChatCommand(message) {
    const normalized = (message || '').replace(/[，。！？、\s]/g, '')
    const commands = [
      { match: /新闻|资讯|头条|热点/, reply: '好的，这就为您打开今日新闻。', route: '/pages/elder/news' },
      { match: /摄像头|看监控|监控画面|家里画面|家中画面|家庭画面|远程看护|儿女家|自己家/, reply: '好的，这就为您打开家庭双摄。', route: '/pages/elder/camera' },
      { match: /刷视频|短视频|看视频|视频|抖音|快手/, reply: '好的，这就为您打开视频。', route: '/pages/elder/videos' },
      { match: /药品识别|识别.*药|认.*药|药盒|拍药/, reply: '好的，这就为您打开药品识别。', route: '/pages/elder/medication-ocr' },
      { match: /服药|吃药|用药|药品管理|我的药/, reply: '好的，这就为您打开服药管理。', route: '/pages/elder/medication' },
      { match: /图片识别|识图|拍照识别|认图片|看看这是什么|识别图片/, reply: '好的，这就为您打开居家安全识别。', route: '/pages/elder/image-recognition' },
      { match: /照护档案|健康档案|我的档案/, reply: '好的，这就为您打开照护档案。', route: '/pages/elder/care-profile' },
      { match: /地图|位置|定位|我在哪|我在哪里/, reply: '好的，这就为您打开家庭地图。', route: '/pages/elder/map' },
      { match: /养老知识|健康知识|知识课堂|健康常识|养生知识/, reply: '好的，这就为您打开养老知识。', route: '/pages/elder/knowledge' },
      { match: /日历|提醒安排|今天安排|今日安排/, reply: '好的，这就为您打开日历提醒。', route: '/pages/calendar/calendar' },
      { match: /回到首页|返回首页|回首页|回主页|主页面|照护首页/, reply: '好的，已回到照护首页。', closeChat: true }
    ]
    const command = commands.find(item => item.match.test(normalized))
    if (!command) return false

    this.appendPetChatMessage(command.reply, false)
    this.speakPetText(command.reply)
    this.setData({ petChatSending: false })
    setTimeout(() => {
      if (command.closeChat) {
        this.closePetChat()
      } else {
        wx.navigateTo({ url: command.route })
      }
    }, 450)
    return true
  },

  openPetNavigation(e) {
    const { latitude, longitude, name, address } = e.currentTarget.dataset
    if (latitude == null || longitude == null) {
      wx.showToast({ title: '导航地点信息不完整', icon: 'none' })
      return
    }
    wx.openLocation({
      latitude: Number(latitude),
      longitude: Number(longitude),
      name: name || '目的地',
      address: address || '',
      scale: 16,
      fail: () => wx.showToast({ title: '暂时无法打开导航', icon: 'none' })
    })
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

  goToVideos() {
    wx.navigateTo({ url: '/pages/elder/videos' })
  },

  goToCamera() {
    wx.navigateTo({ url: '/pages/elder/camera' })
  },

  goToProfile() {
    wx.navigateTo({ url: '/pages/profile/profile' })
  },

  triggerEmergency() {
    const elderInfo = wx.getStorageSync('elderInfo')
    if (!elderInfo || !elderInfo.id) {
      wx.showModal({
        title: '提示',
        content: '请先让子女绑定您的账号后才能使用一键求助功能',
        showCancel: false,
        confirmText: '知道了'
      })
      return
    }
    
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
    app.setEmergency()
    wx.getLocation({
      type: 'wgs84',
      success(res) {
        wx.request({
          url: app.globalData.apiBaseUrl + '/alerts',
          method: 'POST',
          header: { Authorization: 'Bearer ' + wx.getStorageSync('token') },
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
          header: { Authorization: 'Bearer ' + wx.getStorageSync('token') },
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
