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
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* 顶部橙色区域 */}
      <div className="bg-gradient-to-b from-orange-400 to-orange-600 pt-12 pb-32 px-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-lg">
              👴
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">张大爷</h1>
              <p className="text-orange-100 text-xs">欢迎回家</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/family')}
            className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all text-sm font-medium"
          >
            切换到子女端
          </button>
        </div>
        
        {/* 日期时间 */}
        <div className="text-white mt-8">
          <div className="text-3xl font-bold">{new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}</div>
          <div className="text-orange-100 text-sm mt-1">
            {new Date().toLocaleDateString('zh-CN', { weekday: 'long' })}
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="-mt-24 px-4">
        {/* 功能网格 */}
        <div className="bg-white rounded-t-3xl shadow-xl pt-6 pb-8">
          <div className="px-4 mb-6">
            <h2 className="text-xl font-bold text-gray-800">功能服务</h2>
            <p className="text-gray-500 text-sm mt-1">选择您需要的服务</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 px-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 hover:from-orange-50 hover:to-orange-100 transition-all cursor-pointer active:scale-95 shadow-sm"
                onClick={() => navigate(feature.route)}
              >
                <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-md">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 紧急求助按钮 */}
        <div className="px-4 mt-6">
          <button
            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-2xl py-5 shadow-xl transition-all active:scale-95"
            onClick={() => navigate('/elder/alerts')}
          >
            <div className="flex items-center justify-center space-x-3">
              <div className="text-3xl animate-pulse">🆘</div>
              <div>
                <div className="text-xl font-bold">一键紧急求助</div>
                <div className="text-red-100 text-sm">遇到危险，快速求助</div>
              </div>
            </div>
          </button>
        </div>

        {/* 温馨提示 */}
        <div className="px-4 mt-6">
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-5 border border-orange-100">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">💡</div>
              <div>
                <h3 className="font-bold text-gray-800 mb-1">温馨提示</h3>
                <p className="text-gray-600 text-sm">
                  记得按时吃药，保持好心情。如有不适，请及时联系家人或医生。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ElderDashboard
