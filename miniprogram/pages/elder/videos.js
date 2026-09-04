const app = getApp()

// Bump this whenever the server replaces the curated clips, so old phones do
// not keep replaying the previous cached set.
const VIDEO_CACHE_KEY = 'jiahuban_short_video_cache_v3'
const MAX_CACHED_VIDEOS = 12

const BUILT_IN_VIDEOS = [
  {
    id: 'legacy-wellness-1',
    title: '跟着节奏做舒缓伸展',
    description: '动作慢一点，身体更舒服。',
    source: '家护伴精选',
    video_url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    cover_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=1200&fit=crop'
  },
  {
    id: 'legacy-wellness-2',
    title: '公园散步小贴士',
    description: '选择平整路线，记得带水，量力而行。',
    source: '家护伴精选',
    video_url: 'https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4',
    cover_url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&h=1200&fit=crop'
  }
]

Page({
  data: {
    videos: [],
    currentIndex: 0,
    paused: false,
    loading: true,
    firstVideoReady: false
  },

  onLoad() {
    this.isPageActive = true
    this.downloadQueue = []
    this.downloading = false

    // Render a real poster immediately. The API call then refreshes this list.
    this.setVideos(this.getBuiltInVideos(), false)
    this.fetchVideos()
  },

  onShow() {
    this.isPageActive = true
  },

  onHide() {
    this.isPageActive = false
  },

  onUnload() {
    this.isPageActive = false
  },

  getBuiltInVideos() {
    return BUILT_IN_VIDEOS
  },

  getCache() {
    const cache = wx.getStorageSync(VIDEO_CACHE_KEY)
    return cache && typeof cache === 'object' ? cache : {}
  },

  setVideos(rawVideos, loading) {
    const sourceVideos = rawVideos.slice(0, MAX_CACHED_VIDEOS)
    const videos = sourceVideos.map((item, index) => {
      const videoUrl = this.resolveUrl(item.video_url)
      return {
        ...item,
        video_url: videoUrl,
        cover_url: this.resolveUrl(item.cover_url),
        // 直接使用接口返回地址，避免首次进入时等待批量缓存。
        play_url: videoUrl,
        isReady: false,
        // Loading all 12 native video components at once slows down real phones.
        shouldLoad: this.isNearCurrentVideo(index, 0, sourceVideos.length)
      }
    })

    this.setData({
      videos,
      currentIndex: 0,
      paused: false,
      loading,
      firstVideoReady: false
    })
    // 直接播放视频接口返回的地址，不再进页后批量下载 12 个视频。
  },

  resolveUrl(url) {
    if (!url || /^https?:\/\//.test(url) || /^wxfile:\/\//.test(url)) return url
    if (/^\/static\//.test(url)) return url
    return app.globalData.apiBaseUrl + url
  },

  isNearCurrentVideo(index, currentIndex, total) {
    if (total < 2) return true
    const previousIndex = (currentIndex - 1 + total) % total
    const nextIndex = (currentIndex + 1) % total
    return index === currentIndex || index === previousIndex || index === nextIndex
  },

  updateVideoLoadWindow(currentIndex) {
    const total = this.data.videos.length
    const videos = this.data.videos.map((video, index) => {
      const shouldLoad = this.isNearCurrentVideo(index, currentIndex, total)
      return {
        ...video,
        shouldLoad,
        isReady: shouldLoad ? video.isReady : false
      }
    })
    this.setData({ videos })
  },

  verifyCachedFiles(videos) {
    const cache = this.getCache()
    let changed = false
    const validIds = new Set(videos.map(item => item.id))

    Object.keys(cache).forEach((id) => {
      if (!validIds.has(id)) {
        delete cache[id]
        changed = true
      }
    })

    videos.forEach((item) => {
      const cached = cache[item.id]
      if (!cached || !cached.savedFilePath) return
      wx.getFileInfo({
        filePath: cached.savedFilePath,
        fail: () => {
          const latestCache = this.getCache()
          delete latestCache[item.id]
          wx.setStorageSync(VIDEO_CACHE_KEY, latestCache)
          const latestVideos = this.data.videos.map(video => (
            video.id === item.id ? { ...video, play_url: video.video_url, isReady: false } : video
          ))
          this.setData({ videos: latestVideos })
          this.enqueueDownloads(latestVideos)
        }
      })
    })

    if (changed) wx.setStorageSync(VIDEO_CACHE_KEY, cache)
  },

  fetchVideos() {
    wx.request({
      url: app.globalData.apiBaseUrl + '/videos/feed',
      method: 'GET',
      success: (res) => {
        const videos = res.data && Array.isArray(res.data.data)
          ? res.data.data.filter(item => item && item.video_url)
          : []
        if (videos.length) this.setVideos(videos, false)
      },
      fail: () => {
        // A transient request failure must not turn the page into a black view.
        wx.showToast({ title: '正在使用本地视频列表', icon: 'none' })
      },
      complete: () => {
        if (this.isPageActive) this.setData({ loading: false })
        wx.stopPullDownRefresh()
      }
    })
  },

  enqueueDownloads(videos) {
    const cache = this.getCache()
    const candidates = videos.filter(item => (
      !cache[item.id]
      && item.id !== this.inFlightId
      && /\/videos\/assets\//.test(item.video_url)
    ))
    const queuedIds = new Set(this.downloadQueue.map(item => item.id))
    this.downloadQueue = this.downloadQueue
      .filter(item => candidates.some(candidate => candidate.id === item.id))
      .concat(candidates.filter(item => !queuedIds.has(item.id)))
    this.processDownloadQueue()
  },

  processDownloadQueue() {
    if (this.downloading || !this.downloadQueue.length) return
    const item = this.downloadQueue.shift()
    this.downloading = true
    this.inFlightId = item.id

    wx.downloadFile({
      url: item.video_url,
      success: (downloadResult) => {
        if (downloadResult.statusCode !== 200) return
        wx.saveFile({
          tempFilePath: downloadResult.tempFilePath,
          success: (saveResult) => {
            const cache = this.getCache()
            cache[item.id] = { savedFilePath: saveResult.savedFilePath, cachedAt: Date.now() }
            const cachedIds = Object.keys(cache)
            if (cachedIds.length > MAX_CACHED_VIDEOS) {
              cachedIds
                .sort((a, b) => cache[a].cachedAt - cache[b].cachedAt)
                .slice(0, cachedIds.length - MAX_CACHED_VIDEOS)
                .forEach((id) => {
                  wx.removeSavedFile({ filePath: cache[id].savedFilePath, fail: () => {} })
                  delete cache[id]
                })
            }
            wx.setStorageSync(VIDEO_CACHE_KEY, cache)
            if (this.isPageActive) {
              const videos = this.data.videos.map(video => (
                video.id === item.id ? { ...video, play_url: saveResult.savedFilePath, isReady: false } : video
              ))
              this.setData({ videos })
            }
          }
        })
      },
      complete: () => {
        this.downloading = false
        this.inFlightId = null
        this.processDownloadQueue()
      }
    })
  },

  onPullDownRefresh() {
    this.fetchVideos()
  },

  onSlideChange(e) {
    const currentIndex = e.detail.current
    const currentVideo = this.data.videos[currentIndex]
    this.setData({
      currentIndex,
      paused: false,
      firstVideoReady: Boolean(currentVideo && currentVideo.isReady)
    })
    this.updateVideoLoadWindow(currentIndex)
  },

  onVideoReady(e) {
    const index = Number(e.currentTarget.dataset.index)
    const videos = this.data.videos.map((video, videoIndex) => (
      videoIndex === index ? { ...video, isReady: true } : video
    ))
    this.setData({ videos, firstVideoReady: index === this.data.currentIndex })
  },

  onVideoError(e) {
    const index = Number(e.currentTarget.dataset.index)
    const current = this.data.videos[index]
    if (!current || current.play_url === current.video_url) return
    const cache = this.getCache()
    delete cache[current.id]
    wx.setStorageSync(VIDEO_CACHE_KEY, cache)
    const videos = this.data.videos.map((video, videoIndex) => (
      videoIndex === index ? { ...video, play_url: video.video_url, isReady: false } : video
    ))
    this.setData({ videos })
    this.enqueueDownloads(videos)
  },

  togglePlayback() {
    const nextPaused = !this.data.paused
    const context = wx.createVideoContext('video-' + this.data.currentIndex, this)
    if (nextPaused) context.pause()
    else context.play()
    this.setData({ paused: nextPaused })
  },

  onVideoEnded() {
    this.nextVideo()
  },

  nextVideo() {
    if (this.data.videos.length < 2) {
      this.setData({ paused: true })
      return
    }
    const currentIndex = (this.data.currentIndex + 1) % this.data.videos.length
    this.setData({ currentIndex, paused: false })
    this.updateVideoLoadWindow(currentIndex)
  },

  goBack() {
    wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/elder/dashboard' }) })
  }
})
