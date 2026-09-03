const app = getApp()
const recorderManager = wx.getRecorderManager()

Page({
  data: {
    messages: [],
    inputText: '',
    isTyping: false,
    showMore: false,
    chatDate: '',
    userAvatarUrl: '',
    lastMessageTime: null,
    timeInterval: 5 * 60 * 1000,
    scrollTop: 0,
    isRecording: false
  },

  onLoad() {
    this.audioContext = wx.createInnerAudioContext()
    this.lastTtsRequestId = 0
    this.initRecorder()
    this.setChatDate()
    this.loadUserAvatar()
    this.loadChatHistory()
    this.loadPendingQuestion()
  },

  loadPendingQuestion() {
    const question = wx.getStorageSync('pendingChatQuestion')
    if (!question) return
    this.setData({ inputText: question })
    wx.removeStorageSync('pendingChatQuestion')
  },

  loadUserAvatar() {
    let avatarUrl = wx.getStorageSync('userAvatar')
    if (!avatarUrl) {
      const userInfo = wx.getStorageSync('userInfo')
      if (userInfo && userInfo.avatar) {
        avatarUrl = userInfo.avatar
      }
    }
    this.setData({ userAvatarUrl: avatarUrl })
  },

  loadChatHistory() {
    const savedMessages = wx.getStorageSync('chatHistory')
    if (savedMessages && savedMessages.length > 0) {
      this.setData({
        messages: savedMessages,
        lastMessageTime: savedMessages[savedMessages.length - 1].time ? new Date(savedMessages[savedMessages.length - 1].time) : null
      })
    } else {
      this.addWelcomeMessage()
    }
  },

  saveChatHistory() {
    wx.setStorageSync('chatHistory', this.data.messages)
  },

  onShow() {
    this.loadUserAvatar()
    setTimeout(() => this.scrollToBottom(), 300)
  },

  onUnload() {
    if (this.audioContext) {
      this.audioContext.destroy()
      this.audioContext = null
    }
  },

  initRecorder() {
    recorderManager.onStop((res) => {
      this.setData({ isRecording: false })
      wx.hideToast()

      if (res.tempFilePath) {
        this.uploadAndChat(res.tempFilePath)
      }
    })

    recorderManager.onError((err) => {
      console.error('录音失败:', err)
      this.setData({ isRecording: false })
      wx.hideToast()
      wx.showToast({ title: '录音失败，请重试', icon: 'none' })
    })
  },

  setChatDate() {
    const now = new Date()
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const today = `${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, '0')}月${String(now.getDate()).padStart(2, '0')}日 ${weekdays[now.getDay()]}`
    this.setData({ chatDate: today })
  },

  addWelcomeMessage() {
    const now = new Date()
    this.setData({
      messages: [{
        id: Date.now(),
        isUser: false,
        text: '您好呀，我是您的 AI 陪伴助手。您可以和我聊天，也可以说“打开今日新闻”、“刷视频”或“我要看摄像头”。',
        time: now,
        formattedTime: this.formatTime(now),
        showTime: true
      }],
      lastMessageTime: now
    })
  },

  goBack() {
    wx.navigateBack({
      fail: () => {
        wx.switchTab({ url: '/pages/elder/dashboard' })
      }
    })
  },

  onMoreTap() {
    wx.showActionSheet({
      itemList: ['清空聊天'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.setData({ messages: [] })
          wx.removeStorageSync('chatHistory')
          this.addWelcomeMessage()
        }
      }
    })
  },

  onInput(e) {
    this.setData({ inputText: e.detail.value })
  },

  sendMessage() {
    const text = this.data.inputText.trim()
    if (!text) return

    // 用户开始新一轮对话时，立即打断上一条仍在播放的语音。
    this.stopSpeaking()
    this.addUserMessage(text)
    this.setData({ inputText: '', showMore: false })
    if (this.handleQuickCommand(text)) return
    this.setData({ isTyping: true })
    this.sendChatWithLocation(text)
  },

  handleQuickCommand(text) {
    // 应用内意图路由：支持同义说法，命中后直接执行页面跳转，不再当作普通聊天发送给大模型。
    const normalized = (text || '').replace(/[，。！？、\s]/g, '')
    const hasOpenIntent = /打开|进入|前往|跳转|切换|查看|看看|去看|给我看|帮我看|想看|要看|我要|帮我|播放|刷|返回|回到|回去|带我/.test(normalized)
    const commands = [
      {
        route: '/pages/elder/news',
        reply: '好的，这就为您打开今日新闻。',
        match: value => /新闻|资讯|头条|热点|时事|国内外消息/.test(value),
        allowWithoutOpenIntent: true
      },
      {
        route: '/pages/elder/camera',
        reply: '好的，这就为您打开家庭双摄。',
        match: value => /摄像头|看监控|监控画面|家里画面|家中画面|家庭画面|远程看护|儿女家|自己家/.test(value),
        allowWithoutOpenIntent: true
      },
      {
        route: '/pages/elder/videos',
        reply: '好的，这就为您打开精选视频。上下滑动即可切换内容。',
        match: value => /刷视频|短视频|看视频|视频|小视频|播放视频|刷抖音|抖音|快手/.test(value),
        allowWithoutOpenIntent: true
      },
      {
        route: '/pages/elder/medication-ocr',
        reply: '好的，这就为您打开药品识别。',
        match: value => /药品识别|识别.*药|认.*药|药盒|这是什么药|拍药/.test(value)
      },
      {
        route: '/pages/elder/medication',
        reply: '好的，这就为您打开服药管理。',
        match: value => /服药|吃药|用药|吃的药|我的药|药品管理|药物|看看药|打开药/.test(value)
      },
      {
        route: '/pages/elder/image-recognition',
        reply: '好的，这就为您打开图片识别。',
        match: value => /图片识别|识图|拍照识别|认图片|看看这是什么|识别图片/.test(value)
      },
      {
        route: '/pages/elder/map',
        reply: '好的，这就为您打开地图与定位。',
        match: value => /打开地图|看地图|查看位置|我的位置|定位我|我在哪|我在哪里|位置在哪/.test(value),
        allowWithoutOpenIntent: true
      },
      {
        route: '/pages/elder/care-profile',
        reply: '好的，这就为您打开照护档案。',
        match: value => /照护档案|健康档案|我的档案|老人档案|身体档案/.test(value),
        allowWithoutOpenIntent: true
      },
      {
        route: '/pages/elder/knowledge',
        reply: '好的，这就为您打开养老知识。',
        match: value => /养老知识|健康知识|知识课堂|健康常识|养生知识|学习知识/.test(value)
      },
      {
        route: '/pages/calendar/calendar',
        reply: '好的，这就为您打开日历提醒。',
        match: value => /日历|提醒安排|今天安排|今日安排|今天要做什么|待办/.test(value),
        allowWithoutOpenIntent: true
      },
      {
        route: '/pages/elder/dashboard',
        reply: '好的，这就带您回到照护首页。',
        replaceCurrentPage: true,
        match: value => /回到首页|返回首页|回首页|回主页|主页面|照护首页/.test(value),
        allowWithoutOpenIntent: true
      }
    ]

    const command = commands.find(item => item.match(normalized) && (hasOpenIntent || item.allowWithoutOpenIntent))
    if (!command) return false

    this.addAIMessage(command.reply)
    this.speakText(command.reply)
    setTimeout(() => {
      // 【页面路由扩展点】新增小程序功能时，只需在 commands 中补充关键词、路径和提示文案。
      if (command.replaceCurrentPage) {
        wx.redirectTo({ url: command.route })
      } else {
        wx.navigateTo({ url: command.route })
      }
    }, 450)
    return true
  },

  addUserMessage(text) {
    const now = new Date()
    const messages = this.data.messages
    const showTime = !this.data.lastMessageTime || (now - this.data.lastMessageTime) > this.data.timeInterval

    messages.push({
      id: Date.now(),
      isUser: true,
      text,
      time: now,
      formattedTime: this.formatTime(now),
      showTime
    })

    this.setData({ messages, lastMessageTime: now })
    this.saveChatHistory()
    this.scrollToBottom()
  },

  addAIMessage(text, extras = {}) {
    const now = new Date()
    const messages = this.data.messages
    const showTime = !this.data.lastMessageTime || (now - this.data.lastMessageTime) > this.data.timeInterval

    messages.push({
      id: Date.now(),
      isUser: false,
      text,
      ...extras,
      time: now,
      formattedTime: this.formatTime(now),
      showTime
    })

    this.setData({ messages, lastMessageTime: now, isTyping: false })
    this.saveChatHistory()
    this.scrollToBottom()
  },

  buildConversationPayload(message, location) {
    const userInfo = wx.getStorageSync('userInfo') || {}
    const elderInfo = wx.getStorageSync('elderInfo') || {}
    const recentMessages = (this.data.messages || [])
      .filter(item => item && item.text && !item.imageUrl)
      .slice(-10)
      .map(item => ({
        role: item.isUser ? 'user' : 'assistant',
        content: item.text
      }))

    const payload = {
      message,
      messages: recentMessages,
      elder_id: elderInfo.id || userInfo.id || null
    }
    if (location) {
      payload.current_latitude = location.latitude
      payload.current_longitude = location.longitude
    }
    return payload
  },

  extractNavigationDestination(message) {
    const normalized = (message || '').replace(/\s+/g, '')
    const match = normalized.match(/(?:我要|我想|想|请|帮我|带我)?(?:去|到|前往|导航去|导航到)([^，。！？?！,.]{2,40})/)
    return match ? match[1].replace(/(?:怎么走|怎么去|吧|呀|啊|呢)$/, '').trim() : ''
  },

  sendChatWithLocation(message) {
    if (!this.extractNavigationDestination(message)) {
      this.callAIAPI(message)
      return
    }

    wx.getLocation({
      type: 'gcj02',
      isHighAccuracy: true,
      success: (res) => this.callAIAPI(message, { latitude: res.latitude, longitude: res.longitude }),
      fail: () => {
        this.setData({ isTyping: false })
        this.addAIMessage('请先开启位置权限，我才能帮您计算到目的地的距离并开始导航。')
      }
    })
  },

  callAIAPI(message, location) {
    const payload = this.buildConversationPayload(message, location)
    const primaryUrl = app.globalData.apiBaseUrl + '/chat'
    const fallbackBase = app.globalData.apiFallbackUrl
    const fallbackUrl = fallbackBase ? fallbackBase + '/chat' : ''

    const requestChat = (url, canFallback) => wx.request({
      url,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        // LocalTunnel 真机请求可能展示提醒页，加入此头可直接转发到后端。
        'bypass-tunnel-reminder': 'true'
      },
      data: payload,
      success: (res) => {
        if ((!res.data || res.statusCode >= 500) && canFallback && fallbackUrl && fallbackUrl !== url) {
          requestChat(fallbackUrl, false)
          return
        }
        const responseText = res.data && (res.data.response || res.data.text || res.data.message)
        if (typeof responseText === 'string' && responseText.trim()) {
          this.addAIMessage(responseText.trim(), res.data.navigation ? { navigation: res.data.navigation } : {})
          this.speakText(responseText.trim())
          if (res.data.risk) {
            this.showRiskGuidance(res.data.risk)
          }
        } else {
          this.addAIMessage('我刚刚没太听明白，您可以换个说法，我继续陪您聊。')
        }
      },
      fail: (err) => {
        console.error('API 调用失败:', err)
        if (canFallback && fallbackUrl && fallbackUrl !== url) {
          requestChat(fallbackUrl, false)
          return
        }
        this.addAIMessage('现在网络有点忙，您稍等一下，我们再试一次。')
      }
    })

    requestChat(primaryUrl, true)
  },

  showRiskGuidance(risk) {
    wx.showModal({
      title: '已识别到需要关注的情况',
      content: `${risk.message}\n\n系统已将提示同步给家属。情况紧急时，请立即使用一键求助或拨打 120。`,
      confirmText: '我知道了',
      showCancel: false
    })
  },

  toggleVoice() {
    if (this.data.isRecording) {
      this.stopRecord()
    } else {
      this.startRecord()
    }
  },

  startRecord() {
    // 开始录音代表用户要再次说话，先停止当前朗读并使旧请求失效。
    this.stopSpeaking()
    recorderManager.start({
      duration: 60000,
      sampleRate: 16000,
      numberOfChannels: 1,
      encodeBitRate: 48000,
      // 火山 ASR 使用 16kHz 单声道 16 位 PCM；WAV 可在后端稳定读取该数据。
      format: 'wav'
    })

    this.setData({ isRecording: true })
    wx.showToast({
      title: '正在录音...',
      icon: 'none',
      duration: 60000
    })
  },

  stopRecord() {
    recorderManager.stop()
  },

  normalizeVoiceText(text) {
    const raw = (text || '').trim()
    if (!raw) return ''

    const collapsedSpaces = raw.replace(/\s+/g, ' ')
    const parts = collapsedSpaces.split(/[，,。.!！?？]+/).map(s => s.trim()).filter(Boolean)

    if (parts.length <= 1) {
      return collapsedSpaces
    }

    const deduped = []
    for (const part of parts) {
      if (deduped[deduped.length - 1] !== part) {
        deduped.push(part)
      }
    }

    return deduped.join('，')
  },

  addVoiceMessage(text) {
    const now = new Date()
    const messages = this.data.messages
    const showTime = !this.data.lastMessageTime || (now - this.data.lastMessageTime) > this.data.timeInterval
    const normalizedText = this.normalizeVoiceText(text)

    messages.push({
      id: Date.now(),
      isUser: true,
      text: normalizedText,
      isVoice: true,
      time: now,
      formattedTime: this.formatTime(now),
      showTime
    })

    this.setData({ messages, lastMessageTime: now })
    this.saveChatHistory()
    this.scrollToBottom()
  },

  uploadAndChat(tempFilePath) {
    wx.showLoading({ title: '识别中...' })
    console.log('[voice] 开始上传录音:', tempFilePath)

    wx.uploadFile({
      url: app.globalData.apiBaseUrl + '/voice',
      filePath: tempFilePath,
      name: 'file',
      success: (res) => {
        wx.hideLoading()
        console.log('[voice] 上传成功，HTTP状态:', res.statusCode)
        console.log('[voice] 原始响应:', res.data)

        try {
          const data = JSON.parse(res.data)
          console.log('语音识别响应:', data)

          const isSuccess = !!data.success
          const userText = typeof data.text === 'string' ? data.text.trim() : ''
          const errorMessage = typeof data.message === 'string' ? data.message.trim() : '识别失败，请重试'

          if (isSuccess && userText) {
            console.log('语音转写结果:', userText)
            this.addVoiceMessage(userText)
            if (this.handleQuickCommand(userText)) return
            this.setData({ isTyping: true })
            this.sendChatWithLocation(userText)
          } else {
            console.warn('[voice] 识别失败:', errorMessage)
            wx.showToast({ title: errorMessage, icon: 'none' })
          }
        } catch (e) {
          console.error('解析失败:', e)
          wx.showToast({ title: '识别失败', icon: 'none' })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('上传失败:', err)
        wx.showToast({ title: '网络错误', icon: 'none' })
      }
    })
  },

  stopSpeaking() {
    // 递增请求编号，让已发出的旧 TTS 响应不再写入或播放。
    this.lastTtsRequestId = (this.lastTtsRequestId || 0) + 1
    if (this.audioContext) {
      this.audioContext.stop()
    }
  },

  speakText(text) {
    const content = (text || '').trim()
    if (!content || !this.audioContext) return

    const requestId = ++this.lastTtsRequestId
    wx.request({
      url: app.globalData.apiBaseUrl + '/voice/tts',
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: { text: content.slice(0, 500) },
      responseType: 'arraybuffer',
      success: (res) => {
        if (requestId !== this.lastTtsRequestId || res.statusCode !== 200 || !res.data) return
        const filePath = `${wx.env.USER_DATA_PATH}/ai-voice-${Date.now()}.mp3`
        wx.getFileSystemManager().writeFile({
          filePath,
          data: res.data,
          success: () => {
            if (!this.audioContext || requestId !== this.lastTtsRequestId) return
            this.audioContext.stop()
            this.audioContext.src = filePath
            this.audioContext.play()
          },
          fail: (error) => console.warn('[voice] 保存语音文件失败:', error)
        })
      },
      // 朗读失败不打断文字聊天，老人仍可直接阅读回复。
      fail: (error) => console.warn('[voice] 请求语音朗读失败:', error)
    })
  },

  toggleMore() {
    this.setData({ showMore: !this.data.showMore })
  },

  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]
        const now = new Date()
        const messages = this.data.messages
        messages.push({
          id: Date.now(),
          isUser: true,
          text: '[图片]',
          imageUrl: tempFilePath,
          time: now,
          formattedTime: this.formatTime(now),
          showTime: true
        })
        this.setData({ messages, showMore: false })
        this.scrollToBottom()
      }
    })
  },

  chooseCamera() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]
        const now = new Date()
        const messages = this.data.messages
        messages.push({
          id: Date.now(),
          isUser: true,
          text: '[图片]',
          imageUrl: tempFilePath,
          time: now,
          formattedTime: this.formatTime(now),
          showTime: true
        })
        this.setData({ messages, showMore: false })
        this.scrollToBottom()
      }
    })
  },

  previewImage(e) {
    wx.previewImage({
      urls: [e.currentTarget.dataset.url],
      current: e.currentTarget.dataset.url
    })
  },

  openNavigation(e) {
    const { latitude, longitude, name, address } = e.currentTarget.dataset
    wx.openLocation({
      latitude: Number(latitude),
      longitude: Number(longitude),
      name,
      address,
      scale: 18
    })
  },

  sendLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.addUserMessage(`[位置] ${res.latitude.toFixed(6)}, ${res.longitude.toFixed(6)}`)
        this.setData({ isTyping: true })
        this.callAIAPI('我发送了一个位置')
      },
      fail: () => {
        wx.showToast({ title: '获取位置失败', icon: 'none' })
      }
    })
  },

  sendWeather() {
    wx.getLocation({
      type: 'gcj02',
      success: () => {
        this.addUserMessage('[天气] 查询中...')
        this.setData({ isTyping: true })
        this.callAIAPI('请告诉我现在的天气情况')
      },
      fail: () => {
        wx.showToast({ title: '获取位置失败', icon: 'none' })
      }
    })
  },

  scrollToBottom() {
    setTimeout(() => {
      this.setData({ scrollTop: 999999 })
    }, 100)
  },

  onScrollUpper() {},

  formatTime(date) {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }
})
