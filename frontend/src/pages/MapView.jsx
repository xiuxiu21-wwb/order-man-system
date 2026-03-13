import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

function MapView() {
  const [location, setLocation] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [userType, setUserType] = useState('elder')
  const [showTrail, setShowTrail] = useState(true)
  const [trailAnimation, setTrailAnimation] = useState(0)
  const navigate = useNavigate()
  const locationHook = useLocation()

  useEffect(() => {
    const path = locationHook.pathname
    if (path.includes('/family')) {
      setUserType('family')
    } else {
      setUserType('elder')
    }
  }, [locationHook.pathname])

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        setLocation({
          latitude: 39.9042,
          longitude: 116.4074,
          address: '北京市朝阳区阳光小区',
          timestamp: new Date().toLocaleString()
        })
        
        setHistory([
          { latitude: 39.9042, longitude: 116.4074, timestamp: '14:30', address: '阳光小区北门' },
          { latitude: 39.9045, longitude: 116.4070, timestamp: '14:25', address: '社区公园门口' },
          { latitude: 39.9048, longitude: 116.4065, timestamp: '14:20', address: '便民超市' },
          { latitude: 39.9050, longitude: 116.4060, timestamp: '14:15', address: '社区服务中心' }
        ])
      } catch (error) {
        console.error('获取位置失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLocation()
  }, [])

  const renderMap = () => {
    return (
      <div className="w-full h-[500px] bg-gradient-to-br from-blue-50 to-green-50 rounded-lg relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle,_#e5e7eb_1px,_transparent_1px)] bg-[size:20px_20px]"></div>
          
          <div className="absolute top-4 left-4 bg-white p-4 rounded-xl shadow-lg border-2 border-blue-200">
            <p className="text-lg font-bold text-blue-600">🏠 家</p>
            <p className="text-xs text-gray-500">起点</p>
          </div>
          
          <div className="absolute top-1/4 left-1/2 bg-white p-4 rounded-xl shadow-lg border-2 border-yellow-200">
            <p className="text-lg font-bold text-yellow-600">🏪 便民超市</p>
            <p className="text-xs text-gray-500">14:20</p>
          </div>
          
          <div className="absolute bottom-1/3 right-1/4 bg-white p-4 rounded-xl shadow-lg border-2 border-green-200">
            <p className="text-lg font-bold text-green-600">🏥 社区医院</p>
            <p className="text-xs text-gray-500">附近</p>
          </div>
          
          <div className="absolute top-1/2 left-1/4 bg-white p-4 rounded-xl shadow-lg border-2 border-purple-200">
            <p className="text-lg font-bold text-purple-600">🌳 社区公园</p>
            <p className="text-xs text-gray-500">14:25</p>
          </div>
          
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl shadow-xl animate-pulse border-4 border-white">
              👴
            </div>
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm whitespace-nowrap">
              当前位置
            </div>
          </div>
          
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            <line x1="5%" y1="20%" x2="95%" y2="20%" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round"/>
            <line x1="20%" y1="5%" x2="20%" y2="95%" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round"/>
            <line x1="80%" y1="5%" x2="80%" y2="95%" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round"/>
            <line x1="5%" y1="80%" x2="95%" y2="80%" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round"/>
            <line x1="35%" y1="35%" x2="65%" y2="65%" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round"/>
            
            {showTrail && (
              <g>
                <defs>
                  <linearGradient id="trailGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6">
                      <animate attributeName="stopColor" values="#3b82f6;#8b5cf6;#ec4899;#3b82f6" dur="3s" repeatCount="indefinite"/>
                    </stop>
                    <stop offset="100%" stopColor="#8b5cf6">
                      <animate attributeName="stopColor" values="#8b5cf6;#ec4899;#3b82f6;#8b5cf6" dur="3s" repeatCount="indefinite"/>
                    </stop>
                  </linearGradient>
                </defs>
                <path 
                  d="M 100 50 Q 200 100 300 150 Q 350 180 400 200 Q 450 220 500 250" 
                  fill="none" 
                  stroke="url(#trailGradient)" 
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray="20,10"
                  opacity="0.8">
                  <animate attributeName="stroke-dashoffset" from="0" to="30" dur="1s" repeatCount="indefinite"/>
                </path>
                
                {[0, 1, 2, 3].map((i) => (
                  <circle 
                    key={i} 
                    cx={100 + i * 133} 
                    cy={50 + i * 67} 
                    r="8" 
                    fill={i === 3 ? "#ef4444" : "#3b82f6"}>
                    <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" begin={`${i * 0.3}s`}/>
                  </circle>
                ))}
              </g>
            )}
          </svg>
        </div>
        
        <div className="absolute top-4 right-4 z-30">
          <div className="bg-white/90 backdrop-blur p-4 rounded-xl shadow-lg">
            <h4 className="font-bold text-gray-800 mb-2">图例</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>轨迹点</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>当前位置</span>
              </div>
            </div>
            <button 
              onClick={() => setShowTrail(!showTrail)}
              className={`mt-3 w-full py-2 rounded-lg text-sm font-medium transition-colors ${showTrail ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
              {showTrail ? '隐藏轨迹' : '显示轨迹'}
            </button>
          </div>
        </div>
        
        <div className="absolute bottom-4 left-4 right-4 z-30">
          <div className="bg-white/90 backdrop-blur p-4 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">📍 当前位置</p>
                <p className="font-bold text-gray-800">北京市朝阳区阳光小区</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">更新时间</p>
                <p className="font-bold text-gray-800">{location?.timestamp}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">加载中...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-primary text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={() => navigate(userType === 'elder' ? '/elder' : '/family')}
              className="mr-4 hover:text-gray-200"
            >
              ← 返回
            </button>
            <h1 className="text-xl font-bold">{userType === 'elder' ? '家庭地图' : '老人位置'}</h1>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          {renderMap()}
        </div>

        {location && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                📍
              </div>
              <h3 className="text-xl font-bold text-gray-800">位置详情</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                <p className="text-gray-600 text-sm mb-1">详细地址</p>
                <p className="font-bold text-lg text-gray-800">{location.address}</p>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                <p className="text-gray-600 text-sm mb-1">最后更新</p>
                <p className="font-bold text-lg text-gray-800">{location.timestamp}</p>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                <p className="text-gray-600 text-sm mb-1">纬度</p>
                <p className="font-bold text-lg text-gray-800">{location.latitude}</p>
              </div>
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                <p className="text-gray-600 text-sm mb-1">经度</p>
                <p className="font-bold text-lg text-gray-800">{location.longitude}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-2xl">
              🗺️
            </div>
            <h3 className="text-xl font-bold text-gray-800">轨迹回放</h3>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-700">今日行走轨迹</span>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                {history.length} 个轨迹点
              </span>
            </div>
            
            <div className="relative">
              <div className="space-y-4">
                {history.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${index === 0 ? 'bg-green-500' : index === history.length - 1 ? 'bg-red-500' : 'bg-blue-500'}`}>
                        {index + 1}
                      </div>
                      {index < history.length - 1 && (
                        <div className="w-1 flex-1 bg-gray-300 my-2"></div>
                      )}
                    </div>
                    <div className="flex-1 bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-gray-800">{item.address}</p>
                          <p className="text-sm text-gray-500">{item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}</p>
                        </div>
                        <div className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium text-gray-700">
                          {item.timestamp}
                        </div>
                      </div>
                      {index === 0 && (
                        <p className="text-xs text-green-600 mt-2 font-medium">🏁 起点</p>
                      )}
                      {index === history.length - 1 && (
                        <p className="text-xs text-red-600 mt-2 font-medium">📍 当前位置</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {userType === 'elder' && (
          <div className="mt-6 flex justify-center">
            <button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all">
              🛤️ 导航回家
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default MapView
