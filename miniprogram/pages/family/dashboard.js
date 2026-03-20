const app = getApp()

Page({
  data: {
    currentDate: '',
    lastUpdateTime: '刚刚',
    alertCount: 0,
    hasEmergency: false,
    emergencyTime: '',
    alertCount: 0,
    currentAlertId: null,
    emergencyPolling: null,
    emergencyRequesting: false,
    familyPendingMedications: [],
    familyCompletedMedications: [],
    familyMedicationTotalDose: 0,
    familyMedicationRemainingDose: 0,
    familyMedicationCompletedDose: 0,
    showCompletedMedications: false
  },

  onLoad() {
    this.updateDate()
    this.loadEmergencyStatus()
    this.loadMedicationSync()
    this.startEmergencyPolling()
  },

  onUnload() {
    if (this.data.emergencyPolling) {
      clearInterval(this.data.emergencyPolling)
    }
  },

  onShow() {
    this.loadEmergencyStatus()
    this.loadMedicationSync()
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

  loadEmergencyStatus() {
    const userInfo = wx.getStorageSync('userInfo')
    if (!userInfo || !userInfo.id) return

    if (this.data.emergencyRequesting) return
    const wasEmergency = this.data.hasEmergency
    this.setData({ emergencyRequesting: true })

    wx.request({
      url: app.globalData.apiBaseUrl + '/alerts/family/' + userInfo.id,
      method: 'GET',
      header: { 'Authorization': 'Bearer ' + wx.getStorageSync('token') },
      success: (res) => {
        if (res.statusCode === 200 && Array.isArray(res.data)) {
          // 查找是否有未处理的紧急报警
          const pendingEmergencies = res.data.filter(a => a.alert_type === 'emergency' && a.status === 'pending')
          
          if (pendingEmergencies.length > 0) {
            const latestAlert = pendingEmergencies[0]
            // 格式化时间
            const alertTime = new Date(latestAlert.created_at)
            const timeStr = `${alertTime.getHours().toString().padStart(2, '0')}:${alertTime.getMinutes().toString().padStart(2, '0')}`
            
            this.setData({
              hasEmergency: true,
              emergencyTime: timeStr,
              alertCount: pendingEmergencies.length,
              currentAlertId: latestAlert.id
            })
            
            // 如果之前没有报警，现在有了，可以震动提示
            if (!wasEmergency) {
              wx.vibrateLong()
            }
          } else {
            this.setData({
              hasEmergency: false,
              emergencyTime: '',
              alertCount: 0,
              currentAlertId: null
            })
          }
        }
      },
      fail: (err) => {
        console.error('获取报警状态失败:', err)
      },
      complete: () => {
        this.setData({ emergencyRequesting: false })
      }
    })
  },

  startEmergencyPolling() {
    const polling = setInterval(() => {
      this.loadEmergencyStatus()
    }, 5000)
    this.setData({ emergencyPolling: polling })
  },

  loadMedicationSync() {
    const userInfo = wx.getStorageSync('userInfo')
    if (!userInfo || !userInfo.id) {
      this.setData({
        familyPendingMedications: [],
        familyCompletedMedications: [],
        familyMedicationTotalDose: 0,
        familyMedicationRemainingDose: 0,
        familyMedicationCompletedDose: 0
      })
      return
    }

    wx.request({
      url: app.globalData.apiBaseUrl + '/medications/family/' + userInfo.id + '/daily',
      method: 'GET',
      data: { date_str: new Date().toISOString().split('T')[0] },
      success: (res) => {
        if (res.data && res.data.success && Array.isArray(res.data.data)) {
          const meds = res.data.data.map(item => ({
            id: `${item.elderId}-${item.id}`,
            name: `${item.elderName} · ${item.name}`,
            dosage: item.dosage || '按时服用',
            totalTimes: item.times ? item.times.length : 1,
            takenTimes: (item.todayStatus || []).filter(v => v.taken).length,
            remainingTimes: item.todayRemainingCount || 0,
            nextTime: (item.todayStatus || []).find(v => !v.taken)?.time || (item.times && item.times[0]) || '--:--',
            timesText: (item.times || []).join(' · ')
          })).sort((a, b) => {
            const aTime = a.remainingTimes > 0 ? (a.nextTime || '99:99') : '99:99'
            const bTime = b.remainingTimes > 0 ? (b.nextTime || '99:99') : '99:99'
            return aTime.localeCompare(bTime)
          })

          const familyPendingMedications = meds.filter(item => item.remainingTimes > 0)
          const familyCompletedMedications = meds.filter(item => item.remainingTimes === 0)
          const familyMedicationTotalDose = meds.reduce((sum, item) => sum + item.totalTimes, 0)
          const familyMedicationRemainingDose = meds.reduce((sum, item) => sum + item.remainingTimes, 0)
          const familyMedicationCompletedDose = familyMedicationTotalDose - familyMedicationRemainingDose

          this.setData({
            familyPendingMedications,
            familyCompletedMedications,
            familyMedicationTotalDose,
            familyMedicationRemainingDose,
            familyMedicationCompletedDose
          })
          return
        }
        this.setData({
          familyPendingMedications: [],
          familyCompletedMedications: [],
          familyMedicationTotalDose: 0,
          familyMedicationRemainingDose: 0,
          familyMedicationCompletedDose: 0
        })
      },
      fail: () => {
        this.setData({
          familyPendingMedications: [],
          familyCompletedMedications: [],
          familyMedicationTotalDose: 0,
          familyMedicationRemainingDose: 0,
          familyMedicationCompletedDose: 0
        })
      }
    })
  },

  toggleCompletedMedications() {
    this.setData({
      showCompletedMedications: !this.data.showCompletedMedications
    })
  },

  clearEmergency() {
    if (!this.data.currentAlertId) {
      app.clearEmergency()
      this.setData({ hasEmergency: false, emergencyTime: '', alertCount: 0 })
      return
    }

    wx.showModal({
      title: '确认取消',
      content: '确定要取消紧急报警吗？',
      confirmText: '确定',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: app.globalData.apiBaseUrl + '/alerts/' + this.data.currentAlertId + '/status?status=resolved',
            method: 'PUT',
            header: { 'Authorization': 'Bearer ' + wx.getStorageSync('token') },
            success: (res) => {
              app.clearEmergency()
              this.setData({
                hasEmergency: false,
                emergencyTime: '',
                alertCount: 0,
                currentAlertId: null
              })
              wx.showToast({
                title: '已取消报警',
                icon: 'success'
              })
            },
            fail: (err) => {
              console.error('取消报警失败:', err)
              wx.showToast({ title: '取消失败', icon: 'none' })
            }
          })
        }
      }
    })
  },

  goToMap() {
    wx.navigateTo({
      url: '/pages/family/map'
    })
  },

  goToAlerts() {
    wx.navigateTo({
      url: '/pages/family/alerts'
    })
  },

  goToProfile() {
    wx.navigateTo({
      url: '/pages/profile/profile'
    })
  },

  goToBindElder() {
    wx.navigateTo({
      url: '/pages/family/bind-elder'
    })
  },

  logout() {
    app.clearUserInfo()
    wx.reLaunch({
      url: '/pages/index/index'
    })
  }
})
