import React from 'react'
import { useNavigate } from 'react-router-dom'

function ElderDashboard() {
  const navigate = useNavigate()

  const features = [
    {
      title: '家庭地图',
      description: '查看当前位置和回家路线',
      icon: '🗺️',
      route: '/elder/map'
    },
    {
      title: '服药提醒',
      description: '按时服药，健康生活',
      icon: '💊',
      route: '/elder/medication'
    },
    {
      title: '语音陪伴',
      description: '智能语音助手，随时聊天',
      icon: '🗣️',
      route: '/elder/voice'
    },
    {
      title: '图片识别',
      description: '拍照识别物品，了解更多',
      icon: '📸',
      route: '/elder/image-recognition'
    },
    {
      title: '一键求助',
      description: '紧急情况，快速求助',
      icon: '🚨',
      route: '/elder/alerts'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-primary text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold">认知障碍老人陪伴系统</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm">欢迎，张大爷</span>
            <button
              onClick={() => navigate('/family')}
              className="bg-white text-primary px-3 py-1 rounded hover:bg-gray-100"
            >
              切换到子女端
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">欢迎回家</h2>
          <p className="text-gray-600 mt-2">今天感觉怎么样？需要什么帮助吗？</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(feature.route)}
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <button
            className="bg-danger hover:bg-red-700 text-white font-bold py-4 px-8 rounded-full text-lg shadow-lg hover:shadow-xl transition-all"
            onClick={() => navigate('/elder/alerts')}
          >
            🆘 紧急求助
          </button>
        </div>
      </div>
    </div>
  )
}

export default ElderDashboard
