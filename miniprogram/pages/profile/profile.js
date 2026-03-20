const app = getApp();

Page({
  data: {
    profile: {
      name: '',
      bloodType: '',
      emergencyContact: '',
      address: ''
    },
    bloodTypes: ['A型', 'B型', 'AB型', 'O型', 'Rh阴性', '其他'],
    bloodTypeIndex: -1,
    uid: '',
    avatarUrl: ''
  },

  onLoad() {
    this.loadProfile();
    this.loadUid();
    this.loadAvatar();
  },

  loadUid() {
    let uid = app.globalData.elderUid
    if (!uid) {
      const userInfo = wx.getStorageSync('userInfo')
      if (userInfo && userInfo.elder_uid) {
        uid = userInfo.elder_uid
      }
    }
    this.setData({ uid: uid || '' })
  },

  loadAvatar() {
    const avatarUrl = wx.getStorageSync('userAvatar')
    if (avatarUrl) {
      this.setData({ avatarUrl: avatarUrl })
    }
  },

  chooseAvatar() {
    const that = this
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success(res) {
        const tempFilePath = res.tempFiles[0].tempFilePath
        that.setData({ avatarUrl: tempFilePath })
        wx.setStorageSync('userAvatar', tempFilePath)
        
        that.saveAvatarToUserInfo(tempFilePath)
        
        wx.showToast({
          title: '头像已更新',
          icon: 'success'
        })
      },
      fail(err) {
        console.error('选择头像失败:', err)
      }
    })
  },

  saveAvatarToUserInfo(avatarUrl) {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      const updatedUserInfo = {
        ...userInfo,
        avatar: avatarUrl
      }
      wx.setStorageSync('userInfo', updatedUserInfo)
    }
  },

  copyUid() {
    wx.setClipboardData({
      data: this.data.uid,
      success() {
        wx.showToast({ title: 'ID已复制', icon: 'success' })
      }
    })
  },

  loadProfile() {
    const that = this
    const userInfo = wx.getStorageSync('userInfo')
    const homeLocation = wx.getStorageSync('homeLocation')
    
    let address = ''
    if (userInfo && userInfo.address) {
      address = userInfo.address
    } else if (homeLocation && homeLocation.detail_address) {
      address = homeLocation.detail_address
    }
    
    if (userInfo) {
      const profile = {
        name: userInfo.name || '',
        bloodType: userInfo.blood_type || '',
        emergencyContact: userInfo.emergency_contact || '',
        address: address
      }
      
      const bloodTypeIndex = profile.bloodType ? this.data.bloodTypes.indexOf(profile.bloodType) : -1
      
      this.setData({
        profile: profile,
        bloodTypeIndex: bloodTypeIndex
      })
      
      if (userInfo.avatar) {
        this.setData({ avatarUrl: userInfo.avatar })
      }
    }
  },

  onInputName(e) {
    this.setData({
      'profile.name': e.detail.value
    });
  },

  onBloodTypeChange(e) {
    const index = e.detail.value;
    this.setData({
      bloodTypeIndex: index,
      'profile.bloodType': this.data.bloodTypes[index]
    });
  },

  onInputContact(e) {
    this.setData({
      'profile.emergencyContact': e.detail.value
    });
  },

  onInputAddress(e) {
    this.setData({
      'profile.address': e.detail.value
    });
  },

  saveProfile() {
    const that = this
    const { profile } = this.data;
    
    if (!profile.name) {
      wx.showToast({
        title: '请输入姓名',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({ title: '保存中...' })
    
    const userInfo = wx.getStorageSync('userInfo')
    const token = wx.getStorageSync('token')
    
    wx.request({
      url: app.globalData.apiBaseUrl + '/users/me',
      method: 'PUT',
      header: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      data: {
        name: profile.name,
        blood_type: profile.bloodType,
        emergency_contact: profile.emergencyContact,
        address: profile.address
      },
      success(res) {
        wx.hideLoading()
        if (res.data && res.data.id) {
          const updatedUserInfo = {
            ...userInfo,
            name: res.data.name,
            blood_type: res.data.blood_type,
            emergency_contact: res.data.emergency_contact,
            address: res.data.address
          }
          wx.setStorageSync('userInfo', updatedUserInfo)
          
          wx.showToast({
            title: '保存成功',
            icon: 'success'
          });
          
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          wx.showToast({
            title: '保存失败',
            icon: 'none'
          });
        }
      },
      fail() {
        wx.hideLoading()
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
      }
    })
  }
});
