Page({
  data: {
    longitude: 116.397428,
    latitude: 39.90923,
    address: '北京市天安门广场',
    // 家的位置（可以设置为默认地址或通过小程序设置）
    homeLongitude: 116.397428,
    homeLatitude: 39.90923,
    homeAddress: '家（北京市天安门广场）',
    familyMembers: [
      {
        id: 1,
        name: '儿子',
        avatar: '👨',
        distance: '距离 2.5 公里',
        online: true
      },
      {
        id: 2,
        name: '女儿',
        avatar: '👩',
        distance: '距离 5.2 公里',
        online: true
      }
    ]
  },

  onLoad() {
    this.getLocation()
    // 从本地存储加载家的位置
    const homeLocation = wx.getStorageSync('homeLocation')
    if (homeLocation) {
      this.setData({
        homeLongitude: homeLocation.longitude,
        homeLatitude: homeLocation.latitude,
        homeAddress: homeLocation.address || '家',
        homeDetailAddress: homeLocation.detail_address || ''
      })
    }
  },

  getLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({
          longitude: res.longitude,
          latitude: res.latitude
        })
        // 获取地址
        this.getAddress(res.longitude, res.latitude, 'current')
      },
      fail: (err) => {
        console.error('获取位置失败:', err)
        wx.showToast({
          title: '获取位置失败',
          icon: 'none'
        })
      }
    })
  },

  getAddress(longitude, latitude, type = 'current') {
    // 使用腾讯地图逆地址解析（小程序内置）
    wx.request({
      url: 'https://apis.map.qq.com/ws/geocoder/v1/',
      data: {
        location: `${latitude},${longitude}`,
        key: 'your-tencent-map-key',
        get_poi: 1
      },
      success: (res) => {
        if (res.data && res.data.result) {
          const result = res.data.result
          const fullAddress = result.address || '当前位置'
          const detailAddress = result.formatted_addresses || {
            street: result.address_component.street || '',
            street_number: result.address_component.street_number || ''
          }
          
          if (type === 'current') {
            this.setData({
              address: fullAddress
            })
          } else if (type === 'home') {
            this.setData({
              homeAddress: detailAddress.street + (detailAddress.street_number || ''),
              homeDetailAddress: fullAddress
            })
          }
        }
      },
      fail: (err) => {
        console.error('获取地址失败:', err)
      }
    })
  },

  // 一键导航回家
  navigateHome() {
    const that = this
    wx.showModal({
      title: '导航回家',
      content: `将从当前位置导航到：${this.data.homeAddress}`,
      confirmText: '开始导航',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          that.startNavigation()
        }
      }
    })
  },

  // 开始导航
  startNavigation() {
    const { longitude, latitude, homeLongitude, homeLatitude, homeAddress } = this.data
    
    // 方法 1: 使用 wx.openLocation 打开腾讯地图
    // 这在真机上会直接打开腾讯地图 APP 或小程序
    wx.openLocation({
      longitude: parseFloat(homeLongitude),
      latitude: parseFloat(homeLatitude),
      name: '家',
      address: homeAddress,
      scale: 15,
      success: () => {
        console.log('成功打开地图')
      },
      fail: (err) => {
        console.error('打开地图失败:', err)
        
        // 方法 2: 如果失败，使用备用方案 - 打开路线规划页面
        wx.navigateTo({
          url: `https://apis.map.qq.com/marker/v1/plan?type=drive&from=我的位置&fromcoord=${latitude},${longitude}&to=家&tocoord=${homeLatitude},${homeLongitude}`,
          fail: (err2) => {
            console.error('打开路线规划失败:', err2)
            
            // 方法 3: 显示提示信息
            wx.showModal({
              title: '导航提示',
              content: `请打开地图软件导航到：${homeAddress}\n\n坐标：${homeLatitude}, ${homeLongitude}`,
              showCancel: false,
              confirmText: '知道了'
            })
          }
        })
      }
    })
  },

  // 设置家的位置
  setHomeLocation() {
    const that = this
    wx.showModal({
      title: '设置家的位置',
      content: '是否将当前位置设置为家？',
      confirmText: '确定',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 获取详细地址
          that.getAddress(that.data.longitude, that.data.latitude, 'home')
          
          const homeLocation = {
            longitude: that.data.longitude,
            latitude: that.data.latitude,
            address: that.data.address,
            detail_address: that.data.address
          }
          wx.setStorageSync('homeLocation', homeLocation)
          that.setData({
            homeLongitude: homeLocation.longitude,
            homeLatitude: homeLocation.latitude,
            homeAddress: homeLocation.address || '家',
            homeDetailAddress: homeLocation.detail_address || ''
          })
          wx.showToast({
            title: '家的位置已设置',
            icon: 'success',
            duration: 2000
          })
        }
      }
    })
  },

  refreshLocation() {
    wx.showLoading({
      title: '刷新中...'
    })
    setTimeout(() => {
      this.getLocation()
      wx.hideLoading()
      wx.showToast({
        title: '位置已更新',
        icon: 'success'
      })
    }, 1000)
  }
})
