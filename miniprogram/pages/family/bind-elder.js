const app = getApp()

Page({
  data: {
    elderUid: '',
    relationshipIndex: 0,
    relationships: ['父子', '父女', '母子', '母女', '其他'],
    boundElders: [],
    currentUserId: null
  },

  onLoad() {
    this.loadBoundElders()
  },

  onShow() {
    this.loadBoundElders()
  },

  // 加载已绑定的老人列表
  loadBoundElders() {
    const that = this
    const userInfo = wx.getStorageSync('userInfo')
    if (!userInfo || !userInfo.id) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    this.setData({ currentUserId: userInfo.id })

    wx.request({
      url: app.globalData.apiBaseUrl + `/bindings/family/${userInfo.id}`,
      method: 'GET',
      success(res) {
        if (res.data && res.data.success) {
          that.setData({
            boundElders: res.data.data || []
          })
        }
      },
      fail() {
        console.error('加载绑定列表失败')
      }
    })
  },

  onElderUidInput(e) {
    this.setData({ elderUid: e.detail.value.trim() })
  },

  onRelationshipChange(e) {
    this.setData({ relationshipIndex: parseInt(e.detail.value) })
  },

  // 绑定老人
  bindElder() {
    const that = this
    const { elderUid, relationshipIndex, relationships, currentUserId, boundElders } = this.data

    if (!elderUid) {
      wx.showToast({ title: '请输入老人 UID', icon: 'none' })
      return
    }

    if (boundElders.length >= 3) {
      wx.showToast({ title: '最多只能绑定 3 位老人', icon: 'none' })
      return
    }

    // 检查是否已绑定
    const alreadyBound = boundElders.some(elder => elder.elder_uid === elderUid)
    if (alreadyBound) {
      wx.showToast({ title: '已绑定该老人', icon: 'none' })
      return
    }

    wx.showLoading({ title: '绑定中...' })

    wx.request({
      url: app.globalData.apiBaseUrl + '/bindings/bind',
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: {
        family_id: currentUserId,
        elder_uid: elderUid,
        relation: relationships[relationshipIndex]
      },
      success(res) {
        wx.hideLoading()
        if (res.data && res.data.success) {
          wx.showToast({ title: '绑定成功', icon: 'success' })
          
          // 存储 elderInfo 到本地，供老人端使用
          const elderData = res.data.data
          if (elderData && elderData.elder_id) {
            wx.setStorageSync('elderInfo', {
              id: elderData.elder_id,
              uid: elderData.elder_uid,
              name: elderData.elder_name || '老人'
            })
          }
          
          that.setData({ elderUid: '' })
          that.loadBoundElders()
        } else {
          wx.showToast({ title: res.data.detail || '绑定失败', icon: 'none' })
        }
      },
      fail() {
        wx.hideLoading()
        wx.showToast({ title: '网络错误', icon: 'none' })
      }
    })
  },

  // 解绑老人
  unbindElder(e) {
    const elderId = e.currentTarget.dataset.id
    const that = this

    wx.showModal({
      title: '确认解绑',
      content: '确定要解绑这位老人吗？',
      success(res) {
        if (res.confirm) {
          wx.showLoading({ title: '解绑中...' })
          
          wx.request({
            url: app.globalData.apiBaseUrl + `/bindings/${elderId}`,
            method: 'DELETE',
            success(res) {
              wx.hideLoading()
              if (res.data && res.data.success) {
                wx.showToast({ title: '解绑成功', icon: 'success' })
                that.loadBoundElders()
              } else {
                wx.showToast({ title: '解绑失败', icon: 'none' })
              }
            },
            fail() {
              wx.hideLoading()
              wx.showToast({ title: '网络错误', icon: 'none' })
            }
          })
        }
      }
    })
  }
})
