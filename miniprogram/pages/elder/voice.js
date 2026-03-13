const app = getApp()

Page({
  data: {
    messages: [
      {
        id: 1,
        isUser: false,
        text: '大爷您好！我是您的 AI 陪伴助手，有什么我可以帮您的吗？',
        time: '刚刚'
      }
    ],
    inputText: '',
    isTyping: false,
    quickQuestions: [
      '今天天气怎么样？',
      '给我讲个故事',
      '帮我设个提醒',
      '陪我聊聊天'
    ],
    scrollToView: '',
    uid: ''
  },

  onLoad: function() {
    this.loadUid()
    this.scrollToBottom()
  },

  loadUid() {
    const uid = app.getUserUid()
    this.setData({ uid })
  },

  // 复制 UID
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
  },

  onInput: function(e) {
    this.setData({
      inputText: e.detail.value
    })
  },

  sendMessage: function() {
    var that = this
    var text = this.data.inputText.trim()
    if (!text) return

    this.addMessage(text, true)
    this.setData({ inputText: '', isTyping: true })
    this.callAIAPI(text)
  },

  sendQuick: function(e) {
    var text = e.currentTarget.dataset.text
    this.setData({ inputText: text })
    this.sendMessage()
  },

  callAIAPI: function(message) {
    var that = this
    wx.request({
      url: app.globalData.apiBaseUrl + '/chat',
      method: 'POST',
      data: {
        message: message
      },
      success: function(res) {
        console.log('API 响应:', res)
        if (res.data && res.data.response) {
          that.addMessage(res.data.response, false)
        } else {
          that.addMessage('抱歉，我没有听懂您的意思，请再说一遍吧。', false)
        }
        that.setData({ isTyping: false })
      },
      fail: function(err) {
        console.error('API 调用失败:', err)
        that.addMessage('抱歉，网络连接有点问题，请稍后再试吧。', false)
        that.setData({ isTyping: false })
      }
    })
  },

  addMessage: function(text, isUser) {
    var now = new Date()
    var time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0')
    var newMessage = {
      id: Date.now(),
      isUser: isUser,
      text: text,
      time: time
    }
    var messages = this.data.messages
    messages.push(newMessage)
    this.setData({ messages: messages })
    this.scrollToBottom()
  },

  scrollToBottom: function() {
    var that = this
    setTimeout(function() {
      that.setData({
        scrollToView: 'msg-' + that.data.messages[that.data.messages.length - 1].id
      })
    }, 100)
  }
})
