import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function FamilyDashboard() {
  const [elderStatus, setElderStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const loadReminders = () => {
    const savedReminders = localStorage.getItem('medicationReminders')
    if (savedReminders) {
      return JSON.parse(savedReminders)
    }
    return [
      { id: 1, medication: '降压药', time: '08:00', status: '已服用' },
      { id: 2, medication: '降糖药', time: '07:00', status: '已服用' },
      { id: 3, medication: '降压药', time: '12:00', status: '未服用' },
      { id: 4, medication: '降糖药', time: '19:00', status: '未服用' },
      { id: 5, medication: '降压药', time: '18:00', status: '未服用' }
    ]
  }

  useEffect(() => {
    const fetchElderStatus = async () => {
      try {
        const reminders = loadReminders()
        const takenCount = reminders.filter(r => r.status === '已服用').length
        const totalCount = reminders.length
        const progress = Math.round((takenCount / totalCount) * 100)

        setElderStatus({
          name: '张爷爷',
          lastLocation: '北京市朝阳区阳光小区',
          lastSeen: '2024-01-15 14:30',
          status: '正常',
          medications: reminders,
          medicationProgress: progress
        })
      } catch (error) {
        console.error('获取老人状态失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchElderStatus()

    const interval = setInterval(() => {
      const reminders = loadReminders()
      const takenCount = reminders.filter(r => r.status === '已服用').length
      const totalCount = reminders.length
      const progress = Math.round((takenCount / totalCount) * 100)

      setElderStatus(prev => ({
        ...prev,
        medications: reminders,
        medicationProgress: progress
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">加载中...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-primary text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold">认知障碍老人监护系统</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm">欢迎，张大爷子女</span>
            <button
              onClick={() => navigate('/elder')}
              className="bg-white text-primary px-3 py-1 rounded hover:bg-gray-100"
            >
              切换到老人端
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">老人监护中心</h2>
          <p className="text-gray-600 mt-2">实时了解老人的位置和状态</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{elderStatus.name} 的状态</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-gray-600">最新位置</p>
              <p className="font-medium">{elderStatus.lastLocation}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-gray-600">最后更新</p>
              <p className="font-medium">{elderStatus.lastSeen}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-gray-600">当前状态</p>
              <p className={`font-medium ${elderStatus.status === '正常' ? 'text-success' : 'text-danger'}`}>
                {elderStatus.status}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-gray-600">今日服药</p>
              <div className="flex items-center">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-success h-2.5 rounded-full" 
                    style={{ width: `${elderStatus.medicationProgress}%` }}
                  ></div>
                </div>
                <span className="ml-2 text-sm">{elderStatus.medicationProgress}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate('/family/map')}
          >
            <div className="text-4xl mb-4">🗺️</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">查看位置</h3>
            <p className="text-gray-600">实时定位和轨迹回放</p>
          </div>
          <div
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate('/family/alerts')}
          >
            <div className="text-4xl mb-4">🚨</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">报警中心</h3>
            <p className="text-gray-600">查看紧急求助和异常行为</p>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">今日服药提醒</h3>
          <div className="space-y-4">
            {elderStatus.medications.map((med) => (
              <div key={med.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{med.medication}</p>
                  <p className="text-sm text-gray-600">{med.time}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${med.status === '已服用' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {med.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FamilyDashboard
