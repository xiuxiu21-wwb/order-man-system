import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

function AlertCenter() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [sendingAlert, setSendingAlert] = useState(false)
  const [userType, setUserType] = useState('elder')
  const navigate = useNavigate()
  const location = useLocation()

  const defaultAlerts = [
    {
      id: 1,
      type: '求助',
      message: '我迷路了，需要帮助',
      location: '北京市朝阳区阳光小区',
      time: '2024-01-15 14:30',
      status: '已处理'
    },
    {
      id: 2,
      type: '异常行为',
      message: '长时间未活动',
      location: '北京市朝阳区阳光小区',
      time: '2024-01-15 10:15',
      status: '已处理'
    },
    {
      id: 3,
      type: '求助',
      message: '感觉不舒服',
      location: '北京市朝阳区阳光小区',
      time: '2024-01-14 16:45',
      status: '已处理'
    }
  ]

  const loadAlerts = () => {
    const savedAlerts = localStorage.getItem('emergencyAlerts')
    if (savedAlerts) {
      return JSON.parse(savedAlerts)
    }
    return defaultAlerts
  }

  const saveAlerts = (newAlerts) => {
    localStorage.setItem('emergencyAlerts', JSON.stringify(newAlerts))
  }

  useEffect(() => {
    const path = location.pathname
    if (path.includes('/family')) {
      setUserType('family')
    } else {
      setUserType('elder')
    }

    const fetchAlerts = async () => {
      try {
        setAlerts(loadAlerts())
      } catch (error) {
        console.error('获取报警记录失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAlerts()

    const interval = setInterval(() => {
      setAlerts(loadAlerts())
    }, 3000)

    return () => clearInterval(interval)
  }, [location.pathname])

  const handleEmergency = async () => {
    setSendingAlert(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const newAlert = {
        id: Date.now(),
        type: '求助',
        message: '紧急求助',
        location: '北京市朝阳区阳光小区',
        time: new Date().toLocaleString('zh-CN'),
        status: '处理中'
      }
      
      const updatedAlerts = [newAlert, ...alerts]
      setAlerts(updatedAlerts)
      saveAlerts(updatedAlerts)
      
      alert('求助信号已发送，家人正在赶来')
    } catch (error) {
      console.error('发送求助失败:', error)
      alert('发送求助失败，请重试')
    } finally {
      setSendingAlert(false)
    }
  }

  const handleMarkAsResolved = (alertId) => {
    const updatedAlerts = alerts.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: '已处理' } 
        : alert
    )
    setAlerts(updatedAlerts)
    saveAlerts(updatedAlerts)
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
            <h1 className="text-xl font-bold">{userType === 'elder' ? '一键求助' : '报警中心'}</h1>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {userType === 'elder' && (
          <div className="mb-8 text-center">
            <button
              onClick={handleEmergency}
              disabled={sendingAlert}
              className="bg-danger hover:bg-red-700 text-white font-bold py-6 px-12 rounded-full text-xl shadow-lg hover:shadow-xl transition-all w-full max-w-md"
            >
              {sendingAlert ? '发送中...' : '🆘 紧急求助'}
            </button>
            <p className="text-gray-600 mt-4">点击按钮向家人发送求助信号</p>
          </div>
        )}

        {userType === 'family' && alerts.some(a => a.status === '处理中') && (
          <div className="mb-8 bg-red-100 border-2 border-red-500 rounded-lg p-6 animate-pulse">
            <div className="flex items-center">
              <span className="text-4xl mr-4">🚨</span>
              <div>
                <h3 className="text-xl font-bold text-red-800">有新的紧急求助!</h3>
                <p className="text-red-700">请立即查看并处理</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">报警记录</h3>
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className={`p-4 rounded ${alert.status === '处理中' ? 'bg-red-50 border-2 border-red-300' : 'bg-gray-50'}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm ${alert.type === '求助' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {alert.type}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm ${alert.status === '已处理' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                        {alert.status}
                      </span>
                    </div>
                    <p className="mt-2 font-medium">{alert.message}</p>
                    <p className="text-sm text-gray-600 mt-1">{alert.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{alert.time}</p>
                    {userType === 'family' && alert.status === '处理中' && (
                      <button
                        onClick={() => handleMarkAsResolved(alert.id)}
                        className="mt-2 bg-green-500 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                      >
                        标记为已处理
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {userType === 'elder' && (
          <div className="mt-6 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">安全提示</h3>
            <ul className="list-disc list-inside text-blue-700 space-y-2">
              <li>遇到紧急情况请点击上方求助按钮</li>
              <li>保持手机电量充足</li>
              <li>随身携带身份证和紧急联系卡</li>
              <li>尽量不要单独前往陌生地方</li>
            </ul>
          </div>
        )}

        {userType === 'family' && (
          <div className="mt-6 flex justify-center">
            <button 
              onClick={() => navigate('/family/map')}
              className="bg-primary hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full shadow-md"
            >
              查看老人位置
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AlertCenter
