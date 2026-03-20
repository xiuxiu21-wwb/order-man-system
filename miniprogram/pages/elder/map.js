Page({
  data: {
    longitude: 116.397428,
    latitude: 39.90923,
    address: '北京市天安门广场',
    // 家的位置（可以设置为默认地址或通过小程序设置）
    homeLongitude: 116.397428,
    homeLatitude: 39.90923,
    homeAddress: '家（北京市天安门广场）',
    markers: []
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
      }, () => {
        this.updateMarkers()
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
        }, () => {
          this.updateMarkers()
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

  updateMarkers() {
    const markers = []
    
    // 当前位置标记
    markers.push({
      id: 1,
      latitude: this.data.latitude,
      longitude: this.data.longitude,
      iconPath: '/images/location-current.png', // 需要确保这个图片存在，或者使用系统默认
      width: 32,
      height: 32,
      label: {
        content: '我的位置',
        color: '#ff8c00',
        fontSize: 12,
        anchorX: -30,
        anchorY: -60,
        padding: 4,
        borderRadius: 4,
        bgColor: '#ffffff'
      }
    })

    // 家的位置标记
    if (this.data.homeLongitude && this.data.homeLatitude) {
      markers.push({
        id: 2,
        latitude: this.data.homeLatitude,
        longitude: this.data.homeLongitude,
        iconPath: '/images/location-home.png', // 需要确保图片存在
        width: 32,
        height: 32,
        label: {
          content: '家',
          color: '#ff8c00',
          fontSize: 12,
          anchorX: -10,
          anchorY: -60,
          padding: 4,
          borderRadius: 4,
          bgColor: '#ffffff'
        }
      })
    }

    this.setData({ markers })
  },

  getAddress(longitude, latitude, type = 'current') {
    // 使用高德地图逆地址解析
    wx.request({
      url: 'https://restapi.amap.com/v3/geocode/regeo',
      data: {
        location: `${longitude},${latitude}`,
        key: '82dc66f3753fd5736fe625de1141dafd',
        extensions: 'all'
      },
      success: (res) => {
        if (res.data && res.data.status === '1' && res.data.regeocode) {
          const regeocode = res.data.regeocode
          const fullAddress = regeocode.formatted_address || '当前位置'
          const addressComponent = regeocode.addressComponent
          const detailAddress = (addressComponent.streetNumber && addressComponent.streetNumber.street) 
            ? addressComponent.streetNumber.street + (addressComponent.streetNumber.number || '') 
            : fullAddress
          
          if (type === 'current') {
            this.setData({
              address: fullAddress
            })
          } else if (type === 'home') {
            this.setData({
              homeAddress: detailAddress,
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
    wx.chooseLocation({
      success: (res) => {
        const homeLocation = {
          longitude: res.longitude,
          latitude: res.latitude,
          address: res.name || '家',
          detail_address: res.address || res.name
        }
        wx.setStorageSync('homeLocation', homeLocation)
        
        that.setData({
          homeLongitude: homeLocation.longitude,
          homeLatitude: homeLocation.latitude,
          latitude: homeLocation.latitude, // 自动把视角切换到新设定的家
          longitude: homeLocation.longitude,
          homeAddress: homeLocation.address,
          homeDetailAddress: homeLocation.detail_address
        }, () => {
          that.updateMarkers()
        })
        
        that.syncHomeAddressToProfile(homeLocation.detail_address)
        
        wx.showToast({
          title: '设置成功',
          icon: 'success'
        })
      },
      fail: (err) => {
        console.error('选择位置失败:', err)
        if (err.errMsg.indexOf('auth deny') >= 0 || err.errMsg.indexOf('auth denied') >= 0) {
          wx.showModal({
            title: '需要位置权限',
            content: '请在设置中开启位置权限，才能设置家的位置',
            confirmText: '去设置',
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.openSetting()
              }
            }
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
  },

  syncHomeAddressToProfile(address) {
    const that = this
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      const updatedUserInfo = {
        ...userInfo,
        address: address
      }
      wx.setStorageSync('userInfo', updatedUserInfo)
    }
  }
})
