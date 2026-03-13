const app = getApp()

Page({
  data: {
    newsList: [],
    loading: false,
    hasMore: true,
    page: 1
  },

  onLoad() {
    this.loadNews()
  },

  onPullDownRefresh() {
    this.refreshNews()
  },

  onReachBottom() {
    if (this.data.hasMore) {
      this.loadMore()
    }
  },

  loadNews() {
    if (this.data.loading) return
    
    this.setData({ loading: true })

    const that = this
    wx.request({
      url: app.globalData.apiBaseUrl + '/news/list',
      method: 'GET',
      data: {
        page: this.data.page,
        page_size: 10
      },
      success(res) {
        console.log('新闻数据:', res)
        if (res.data && res.data.news) {
          that.setData({
            newsList: res.data.news,
            hasMore: res.data.has_more || false,
            loading: false
          })
        } else {
          that.loadSampleNews()
        }
        wx.stopPullDownRefresh()
      },
      fail(err) {
        console.error('获取新闻失败:', err)
        that.loadSampleNews()
        wx.stopPullDownRefresh()
      }
    })
  },

  loadSampleNews() {
    const sampleNews = [
      {
        id: 1,
        title: '春季养生小贴士：多吃这些食物对身体好',
        description: '春季是养生的好时节，专家建议多吃新鲜蔬菜和水果，适量运动，保持良好的作息习惯。',
        image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=300&fit=crop',
        time: '2小时前',
        source: '健康日报'
      },
      {
        id: 2,
        title: '城市公园开放新区域，市民休闲又添好去处',
        description: '本市中央公园东区正式对外开放，新增了健身设施、儿童乐园和花海景观，欢迎市民前往游玩。',
        image: 'https://images.unsplash.com/photo-1588714477688-cf28a50e94f7?w=400&h=300&fit=crop',
        time: '3小时前',
        source: '本地新闻'
      },
      {
        id: 3,
        title: '老年人如何保持大脑活跃？专家给出这些建议',
        description: '专家建议老年人多读书、下棋、学习新技能，保持社交活动，这些都有助于延缓认知衰退。',
        image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop',
        time: '5小时前',
        source: '老年健康'
      },
      {
        id: 4,
        title: '天气预报：未来三天晴好，适合外出踏青',
        description: '据气象部门预报，未来三天我市天气晴好，气温适中，非常适合外出踏青和户外活动。',
        image: 'https://images.unsplash.com/photo-1592210454359-9043f067919b?w=400&h=300&fit=crop',
        time: '6小时前',
        source: '气象服务'
      },
      {
        id: 5,
        title: '社区开展免费健康体检活动，欢迎老年人参加',
        description: '本周末社区卫生服务中心将开展免费健康体检活动，包括血压、血糖、心电图等检查项目。',
        image: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=400&h=300&fit=crop',
        time: '8小时前',
        source: '社区通知'
      }
    ]

    this.setData({
      newsList: sampleNews,
      loading: false
    })
  },

  refreshNews() {
    this.setData({
      page: 1,
      hasMore: true
    })
    this.loadNews()
  },

  loadMore() {
    if (this.data.loading || !this.data.hasMore) return
    
    this.setData({ 
      loading: true,
      page: this.data.page + 1
    })
    
    const that = this
    wx.request({
      url: app.globalData.apiBaseUrl + '/news/list',
      method: 'GET',
      data: {
        page: this.data.page,
        page_size: 5
      },
      success(res) {
        if (res.data && res.data.news) {
          that.setData({
            newsList: [...that.data.newsList, ...res.data.news],
            hasMore: res.data.has_more || false,
            loading: false
          })
        } else {
          that.setData({ loading: false, hasMore: false })
        }
      },
      fail(err) {
        console.error('加载更多失败:', err)
        that.setData({ loading: false, hasMore: false })
      }
    })
  },

  viewNews(e) {
    const id = e.currentTarget.dataset.id
    wx.showToast({
      title: '新闻详情开发中',
      icon: 'none'
    })
  }
})
