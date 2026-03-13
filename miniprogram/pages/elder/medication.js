const app = getApp()

Page({
  data: {
    medications: [],
    loading: false,
    showModal: false,
    newMed: {
      name: '',
      time: '08:00',
      dosage: ''
    },
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
    
    console.log('loadMedications - elderId:', elderId)
    
    if (!elderId) {
      console.log('未找到 elderId，使用本地数据')
      this.loadLocalMedications()
      return
    }

    wx.request({
      url: app.globalData.apiBaseUrl + '/medications/elder/' + elderId,
      method: 'GET',
      success(res) {
        console.log('加载药品列表成功:', res.data)
        if (res.data && Array.isArray(res.data)) {
          const medications = res.data.map(item => ({
            id: item.id,
            name: item.name,
            time: item.times || '08:00',
            dosage: item.dosage || item.frequency || '',
            taken: false,
            isBackend: true
          }))
          that.setData({ medications })
          that.updateProgress()
        }
      },
      fail(err) {
        console.error('加载药品列表失败:', err)
        that.loadLocalMedications()
      }
    })
  },

  loadLocalMedications() {
    const localMeds = [
      { id: 1, name: '降压药', time: '08:00', dosage: '早餐后服用 1 片', taken: false },
      { id: 2, name: '降糖药', time: '12:00', dosage: '午餐后服用 1 片', taken: false },
      { id: 3, name: '阿司匹林', time: '18:00', dosage: '晚餐后服用 1 片', taken: false }
    ]
    this.setData({ medications: localMeds })
    this.updateProgress()
  },

  showAddModal() {
    this.setData({
      showModal: true,
      newMed: { name: '', time: '08:00', dosage: '' }
    })
  },

  hideModal() {
    this.setData({ showModal: false })
  },

  stopPropagation() {},

  onInputName(e) {
    this.setData({ 'newMed.name': e.detail.value })
  },

  onTimeChange(e) {
    this.setData({ 'newMed.time': e.detail.value })
  },

  onInputDosage(e) {
    this.setData({ 'newMed.dosage': e.detail.value })
  },

  confirmAdd() {
    const { name, time, dosage } = this.data.newMed
    
    if (!name || !name.trim()) {
      wx.showToast({ title: '请输入药品名称', icon: 'none' })
      return
    }
    if (!time) {
      wx.showToast({ title: '请选择服用时间', icon: 'none' })
      return
    }
    if (!dosage || !dosage.trim()) {
      wx.showToast({ title: '请输入服用说明', icon: 'none' })
      return
    }

    if (this.data.elderId) {
      this.addMedicationToBackend(name.trim(), time, dosage.trim())
    } else {
      this.addMedicationLocal(name.trim(), time, dosage.trim())
    }
  },

  addMedicationToBackend(name, time, dosage) {
    const that = this
    
    console.log('添加药品到后端 - elderId:', this.data.elderId)
    
    wx.request({
      url: app.globalData.apiBaseUrl + '/medications/elder',
      method: 'POST',
      data: {
        user_id: this.data.elderId,
        name: name,
        dosage: dosage,
        frequency: 'daily',
        times: time,
        start_date: new Date().toISOString().split('T')[0] + 'T00:00:00',
        end_date: null
      },
      header: { 'Content-Type': 'application/json' },
      success(res) {
        console.log('添加药品成功:', res.data)
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

  addMedicationLocal(name, time, dosage) {
    const newMedication = {
      id: Date.now(),
      name: name,
      time: time,
      dosage: dosage,
      taken: false,
      isBackend: false
    }
    const medications = [...this.data.medications, newMedication]
    this.setData({ medications })
    this.updateProgress()
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
    const medications = this.data.medications.filter(m => m.id !== id)
    this.setData({ medications })
    this.updateProgress()
    wx.showToast({ title: '删除成功', icon: 'success' })
  },

  takeMedication(e) {
    const id = e.currentTarget.dataset.id
    const medications = this.data.medications.map(med => {
      if (med.id === id) {
        return { ...med, taken: true }
      }
      return med
    })
    this.setData({ medications })
    this.updateProgress()
    wx.showToast({ title: '服药记录已保存！', icon: 'success' })
  },

  updateProgress() {
    const takenCount = this.data.medications.filter(m => m.taken).length
    const totalCount = this.data.medications.length
    const progressPercent = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0
    this.setData({ takenCount, totalCount, progressPercent })
  }
})
