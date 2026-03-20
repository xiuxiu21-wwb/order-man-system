const app = getApp()

Page({
  data: {
    medications: [],
    loading: false,
    showModal: false,
    newMed: {
      name: '',
      times: [], // 改为数组
      dosage: '',
      startDate: '',
      endDate: '' // 改为结束日期
    },
    today: new Date().toISOString().split('T')[0],
    elderId: null
  },

  onLoad() {
    this.loadElderId()
    this.loadMedications()
  },

  onShow() {
    this.loadElderId()
    this.loadMedications()
  },

  loadElderId() {
    let elderId = null
    
    // 1. 先尝试从 elderInfo 获取
    try {
      const elderInfo = wx.getStorageSync('elderInfo')
      console.log('elderInfo:', elderInfo)
      if (elderInfo && elderInfo.id) {
        elderId = elderInfo.id
        console.log('从 elderInfo 获取到 elderId:', elderId)
      }
    } catch (e) {
      console.error('读取 elderInfo 失败:', e)
    }
    
    // 2. 如果没有，尝试从 userInfo 获取
    if (!elderId) {
      try {
        const userInfo = wx.getStorageSync('userInfo')
        console.log('userInfo:', userInfo)
        if (userInfo && userInfo.id && userInfo.user_type === 'elder') {
          elderId = userInfo.id
          console.log('从 userInfo 获取到 elderId:', elderId)
          
          // 同时保存到 elderInfo
          try {
            wx.setStorageSync('elderInfo', {
              id: userInfo.id,
              uid: userInfo.elder_uid || '',
              name: userInfo.name || '老人'
            })
            console.log('已保存 elderInfo 到本地')
          } catch (e) {
            console.error('保存 elderInfo 失败:', e)
          }
        }
      } catch (e) {
        console.error('读取 userInfo 失败:', e)
      }
    }
    
    if (elderId) {
      this.setData({ elderId: elderId })
      console.log('最终设置的 elderId:', elderId)
    } else {
      console.log('未找到有效的 elderId')
    }
  },

  loadMedications() {
    const that = this
    const elderId = this.data.elderId

    if (!elderId) {
      this.loadLocalMedications()
      return
    }

    wx.request({
      url: app.globalData.apiBaseUrl + '/medications/elder/' + elderId + '/daily',
      method: 'GET',
      data: { date_str: this.data.today },
      success(res) {
        if (res.data && res.data.success && Array.isArray(res.data.data)) {
          const medications = res.data.data.map(item => ({
            id: item.id,
            name: item.name,
            times: item.times || ['08:00'],
            dosage: item.dosage || '',
            todayStatus: item.todayStatus || [],
            todayRemainingCount: item.todayRemainingCount || 0,
            remainingDays: item.remainingDays,
            isBackend: true
          }))
          that.setData({ medications })
          that.updateProgress()
        } else {
          that.loadLocalMedications()
        }
      },
      fail(err) {
        that.loadLocalMedications()
      }
    })
  },

  loadLocalMedications() {
    let localMeds = wx.getStorageSync('localMedications') || []
    const todayStr = new Date().toISOString().split('T')[0] // 使用 ISO 日期格式 yyyy-mm-dd
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    // 处理数据并筛选
    const activeMeds = localMeds.map(med => {
      // 兼容旧数据: 将 time 转为 times 数组
      if (!med.times && med.time) {
        med.times = [med.time]
      }
      // 兼容旧数据: 初始化 takenRecords
      if (!med.takenRecords) {
        med.takenRecords = {}
      }
      // 兼容旧数据: 如果有 lastTakenDate 和 taken，迁移到 takenRecords
      if (med.lastTakenDate && med.taken && !med.takenRecords[med.lastTakenDate]) {
        // 旧数据通常只有一个时间点，所以无法精确知道是哪个时间，假设所有时间都已服用
        // 或者简单地忽略旧状态，从今天开始新记录
      }

      // 获取今日服用状态
      const todayRecord = med.takenRecords[todayStr] || {}
      med.todayStatus = med.times.map(t => ({
        time: t,
        taken: !!todayRecord[t]
      }))
      
      // 计算今日剩余次数
      med.todayRemainingCount = med.todayStatus.filter(s => !s.taken).length

      // 计算剩余天数
      if (med.startDate && med.duration) {
        const start = new Date(med.startDate)
        start.setHours(0, 0, 0, 0)
        
        const end = new Date(start)
        end.setDate(start.getDate() + parseInt(med.duration))
        
        const diffTime = end.getTime() - now.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        med.remainingDays = diffDays > 0 ? diffDays : 0
      }
      
      return med
    }).filter(med => {
      // 筛选在有效期内的药品
      if (!med.startDate || !med.duration) return true
      const start = new Date(med.startDate)
      start.setHours(0, 0, 0, 0)
      
      const end = new Date(start)
      end.setDate(start.getDate() + parseInt(med.duration))
      
      return now >= start && now < end
    })

    // 保存可能的数据结构更新 (兼容性处理)
    wx.setStorageSync('localMedications', localMeds)

    // 排序：按最早的未服用时间排序，如果都服用了按最早时间排序
    activeMeds.sort((a, b) => {
       const aTime = a.times[0] || '00:00'
       const bTime = b.times[0] || '00:00'
       return aTime.localeCompare(bTime)
    })
    
    this.setData({ medications: activeMeds })
    this.updateProgress()
  },

  showAddModal() {
    const today = new Date().toISOString().split('T')[0]
    this.setData({
      showModal: true,
      newMed: { 
        name: '', 
        times: ['08:00'], // 默认一个时间
        dosage: '', 
        startDate: today,
        endDate: '' 
      }
    })
  },

  hideModal() {
    this.setData({ showModal: false })
  },

  stopPropagation() {},

  onInputName(e) {
    this.setData({ 'newMed.name': e.detail.value })
  },

  onInputDosage(e) {
    this.setData({ 'newMed.dosage': e.detail.value })
  },

  onAddTime(e) {
    const time = e.detail.value
    const times = this.data.newMed.times
    if (!times.includes(time)) {
      times.push(time)
      times.sort()
      this.setData({ 'newMed.times': times })
    } else {
      wx.showToast({ title: '时间已存在', icon: 'none' })
    }
  },

  removeTime(e) {
    const index = e.currentTarget.dataset.index
    const times = this.data.newMed.times
    times.splice(index, 1)
    this.setData({ 'newMed.times': times })
  },

  onStartDateChange(e) {
    this.setData({ 'newMed.startDate': e.detail.value })
  },

  onEndDateChange(e) {
    this.setData({ 'newMed.endDate': e.detail.value })
  },

  confirmAdd() {
    const { name, times, dosage, startDate, endDate } = this.data.newMed
    
    if (!name || !name.trim()) {
      wx.showToast({ title: '请输入药品名称', icon: 'none' })
      return
    }
    if (times.length === 0) {
      wx.showToast({ title: '请至少添加一个服用时间', icon: 'none' })
      return
    }
    if (!startDate) {
      wx.showToast({ title: '请选择开始日期', icon: 'none' })
      return
    }
    if (!endDate) {
      wx.showToast({ title: '请选择结束日期', icon: 'none' })
      return
    }
    if (endDate < startDate) {
      wx.showToast({ title: '结束日期不能早于开始日期', icon: 'none' })
      return
    }
    if (!dosage || !dosage.trim()) {
      wx.showToast({ title: '请输入服用说明', icon: 'none' })
      return
    }

    // 计算持续天数 (用于后端兼容或逻辑计算)
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end - start)
    const duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 

    if (this.data.elderId) {
      this.addMedicationToBackend(name.trim(), times, dosage.trim(), startDate, endDate)
      return
    }
    this.addMedicationLocal(name.trim(), times, dosage.trim(), duration, startDate, endDate)
  },

  addMedicationToBackend(name, times, dosage, startDateStr, endDateStr) {
    const that = this

    wx.request({
      url: app.globalData.apiBaseUrl + '/medications/elder',
      method: 'POST',
      data: {
        user_id: this.data.elderId,
        name: name,
        dosage: dosage,
        frequency: 'daily',
        times: times.join(','),
        start_date: `${startDateStr}T00:00:00`,
        end_date: `${endDateStr}T00:00:00`
      },
      header: { 'Content-Type': 'application/json' },
      success(res) {
        wx.showToast({ title: '添加成功', icon: 'success' })
        that.hideModal()
        that.loadMedications()
      },
      fail(err) {
        console.error('添加药品失败:', err)
        wx.showToast({ title: '添加失败，请重试', icon: 'none' })
      }
    })
  },

  addMedicationLocal(name, times, dosage, duration, startDate, endDate) {
    const newMedication = {
      id: Date.now(),
      name: name,
      times: times, // 数组
      dosage: dosage,
      duration: duration,
      startDate: startDate,
      endDate: endDate,
      // 记录每天每个时间点的服用状态
      // 结构: { "2023-10-27": { "08:00": true, "12:00": false } }
      takenRecords: {}, 
      isBackend: false
    }
    
    let localMeds = wx.getStorageSync('localMedications') || []
    localMeds.push(newMedication)
    wx.setStorageSync('localMedications', localMeds)
    
    this.loadLocalMedications()
    this.hideModal()
    wx.showToast({ title: '添加成功', icon: 'success' })
  },

  deleteMedication(e) {
    const id = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个药品吗？',
      success: (res) => {
        if (res.confirm) {
          const medication = this.data.medications.find(m => m.id === id)
          if (medication && medication.isBackend) {
            this.deleteMedicationFromBackend(id)
          } else {
            this.deleteMedicationLocal(id)
          }
        }
      }
    })
  },

  deleteMedicationFromBackend(id) {
    const that = this
    
    wx.request({
      url: app.globalData.apiBaseUrl + '/medications/elder/' + id,
      method: 'DELETE',
      success(res) {
        console.log('删除药品成功:', res.data)
        wx.showToast({ title: '删除成功', icon: 'success' })
        that.loadMedications()
      },
      fail(err) {
        console.error('删除药品失败:', err)
        wx.showToast({ title: '删除失败，请重试', icon: 'none' })
      }
    })
  },

  deleteMedicationLocal(id) {
    let localMeds = wx.getStorageSync('localMedications') || []
    localMeds = localMeds.filter(m => m.id !== id)
    wx.setStorageSync('localMedications', localMeds)
    
    this.loadLocalMedications()
    wx.showToast({ title: '删除成功', icon: 'success' })
  },

  takeMedication(e) {
    const id = e.currentTarget.dataset.id
    const time = e.currentTarget.dataset.time
    const todayStr = new Date().toISOString().split('T')[0]

    if (this.data.elderId) {
      wx.request({
        url: app.globalData.apiBaseUrl + '/medications/elder/record',
        method: 'POST',
        data: {
          elder_id: this.data.elderId,
          medication_id: id,
          scheduled_date: todayStr,
          scheduled_time: time
        },
        header: { 'Content-Type': 'application/json' },
        success: () => {
          this.loadMedications()
          wx.showToast({ title: '服药记录已保存！', icon: 'success' })
        },
        fail: () => {
          wx.showToast({ title: '同步失败，请重试', icon: 'none' })
        }
      })
      return
    }

    let localMeds = wx.getStorageSync('localMedications') || []
    localMeds = localMeds.map(med => {
      if (med.id === id) {
        if (!med.takenRecords) med.takenRecords = {}
        if (!med.takenRecords[todayStr]) med.takenRecords[todayStr] = {}
        med.takenRecords[todayStr][time] = true
      }
      return med
    })
    wx.setStorageSync('localMedications', localMeds)
    this.loadLocalMedications()
    wx.showToast({ title: '服药记录已保存！', icon: 'success' })
  },

  updateProgress() {
    const todayStr = new Date().toISOString().split('T')[0]
    let totalCount = 0
    let takenCount = 0
    
    this.data.medications.forEach(med => {
      const times = med.times || []
      totalCount += times.length
      if (med.todayStatus && Array.isArray(med.todayStatus)) {
        takenCount += med.todayStatus.filter(item => item.taken).length
      } else {
        const todayRecord = med.takenRecords && med.takenRecords[todayStr] ? med.takenRecords[todayStr] : {}
        times.forEach(t => {
          if (todayRecord[t]) takenCount++
        })
      }
    })
    
    const progressPercent = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0
    this.setData({ takenCount, totalCount, progressPercent })
  }
})
