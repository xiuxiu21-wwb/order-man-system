# 家护伴 - 微信小程序

## 📱 项目介绍

这是一个专为认知障碍老人设计的微信小程序，包含**大爷端**和**子女端**两个入口。

## 🚀 快速开始

### 1. 安装微信开发者工具

下载并安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)

### 2. 导入项目

1. 打开微信开发者工具
2. 选择"导入项目"
3. 选择 `miniprogram` 文件夹作为项目目录
4. 填写 AppID（可以使用测试号）

### 3. 配置后端地址

打开 `miniprogram/app.js`，修改 `apiBaseUrl` 为您的后端地址：

```javascript
globalData: {
  apiBaseUrl: 'http://your-server-ip:8000/api'
}
```

## 📂 项目结构

```
miniprogram/
├── app.js                 # 小程序入口文件
├── app.json               # 小程序配置文件
├── app.wxss               # 全局样式
├── sitemap.json           # 站点地图
├── pages/
│   ├── index/             # 首页（选择身份）
│   ├── elder/             # 大爷端
│   │   ├── dashboard      # 大爷首页
│   │   ├── medication     # 服药提醒
│   │   ├── voice          # 语音陪伴
│   │   ├── image-recognition  # 图片识别
│   │   └── map            # 家庭地图
│   └── family/            # 子女端
│       ├── dashboard      # 子女首页
│       ├── alerts         # 告警中心
│       └── map            # 实时定位
└── images/                # 图片资源
```

## 👴 大爷端功能

### 首页功能
- AI语音陪伴 - 与AI聊天解闷
- 服药提醒 - 查看和确认服药
- 图片识别 - 拍照识别物体
- 家庭地图 - 查看家人位置
- 一键求助 - 紧急情况快速求助

### 服药提醒
- 显示今日待服药物
- 一键确认服药
- 服药进度可视化

## 👨‍👩‍👧 子女端功能

### 首页功能
- 实时定位 - 查看老人当前位置
- 告警中心 - 查看异常行为告警
- 今日动态 - 查看老人一天的活动
- 健康数据 - 查看血压、心率、血糖等

### 实时定位
- 查看老人实时位置
- 轨迹回放
- 电子围栏设置

## 🎨 样式说明

小程序使用了现代化的UI设计：
- 大字体、高对比度，适合老人阅读
- 简洁的卡片式布局
- 温暖的配色方案
- 清晰的按钮和操作提示

## 🔧 开发说明

### 添加新页面
1. 在 `pages/` 目录下创建新页面文件夹
2. 在 `app.json` 的 `pages` 数组中添加页面路径
3. 创建页面的 `.wxml`、`.wxss`、`.js` 文件

### API调用示例
```javascript
wx.request({
  url: app.globalData.apiBaseUrl + '/endpoint',
  method: 'POST',
  data: {},
  success: (res) => {
    console.log(res.data)
  }
})
```

## 📝 注意事项

1. **网络域名配置**：正式发布前需要在微信公众平台配置服务器域名白名单
2. **图片资源**：tabBar的图标需要自行准备并放在 `images/` 目录下
3. **后端对接**：需要将小程序与现有的FastAPI后端进行对接
4. **用户认证**：建议添加微信登录功能

## 🎯 下一步

- [ ] 完善所有页面的功能实现
- [ ] 对接后端API接口
- [ ] 添加微信登录功能
- [ ] 实现实时定位功能
- [ ] 添加推送通知功能
- [ ] 测试并优化用户体验

## 📞 技术支持

如有问题，请查看微信小程序官方文档：https://developers.weixin.qq.com/miniprogram/dev/framework/
