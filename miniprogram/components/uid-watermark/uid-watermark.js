Component({
  properties: {
    uid: {
      type: String,
      value: '',
      observer: 'onUidChange'
    }
  },

  data: {
    displayUid: ''
  },

  methods: {
    onUidChange(newUid) {
      this.setData({
        displayUid: newUid || ''
      })
    },

    copyUid() {
      const { uid } = this.data
      if (uid) {
        wx.setClipboardData({
          data: uid,
          success: () => {
            wx.showToast({
              title: '已复制 UID',
              icon: 'success',
              duration: 1500
            })
          }
        })
      }
    }
  }
})
