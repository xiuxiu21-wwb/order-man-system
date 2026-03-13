import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function MedicationReminder() {
  const [medications, setMedications] = useState([])
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const [userType, setUserType] = useState('elder')
  const navigate = useNavigate()

  const defaultMedications = [
    {
      id: 1,
      name: '降压药',
      dosage: '1片',
      frequency: '每天3次',
      times: '08:00,12:00,18:00',
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    },
    {
      id: 2,
      name: '降糖药',
      dosage: '2片',
      frequency: '每天2次',
      times: '07:00,19:00',
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    }
  ]

  const defaultReminders = [
    {
      id: 1,
      medication: '降压药',
      time: '08:00',
      status: '已服用',
      medicationId: 1
    },
    {
      id: 2,
      medication: '降糖药',
      time: '07:00',
      status: '已服用',
      medicationId: 2
    },
    {
      id: 3,
      medication: '降压药',
      time: '12:00',
      status: '未服用',
      medicationId: 1
    },
    {
      id: 4,
      medication: '降糖药',
      time: '19:00',
      status: '未服用',
      medicationId: 2
    },
    {
      id: 5,
      medication: '降压药',
      time: '18:00',
      status: '未服用',
      medicationId: 1
    }
  ]

  const loadReminders = () => {
    const savedReminders = localStorage.getItem('medicationReminders')
    if (savedReminders) {
      return JSON.parse(savedReminders)
    }
    return defaultReminders
  }

  const saveReminders = (newReminders) => {
    localStorage.setItem('medicationReminders', JSON.stringify(newReminders))
  }

  useEffect(() => {
    const fetchMedications = async () => {
      try {
        setMedications(defaultMedications)
        setReminders(loadReminders())
      } catch (error) {
        console.error('获取服药数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMedications()
  }, [])

  const handleMarkAsTaken = (reminderId) => {
    const newReminders = reminders.map(reminder => 
      reminder.id === reminderId 
        ? { ...reminder, status: '已服用' } 
        : reminder
    )
    setReminders(newReminders)
    saveReminders(newReminders)
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
              onClick={() => navigate('/elder')}
              className="mr-4 hover:text-gray-200"
            >
              ← 返回
            </button>
            <h1 className="text-xl font-bold">服药提醒</h1>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">今日服药提醒</h3>
          <div className="space-y-4">
            {reminders.map((reminder) => (
              <div key={reminder.id} className="flex justify-between items-center p-4 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{reminder.medication}</p>
                  <p className="text-sm text-gray-600">{reminder.time}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm ${reminder.status === '已服用' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {reminder.status}
                  </span>
                  {reminder.status === '未服用' && (
                    <button
                      onClick={() => handleMarkAsTaken(reminder.id)}
                      className="bg-success hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                    >
                      标记为已服用
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">服药计划</h3>
          <div className="space-y-4">
            {medications.map((medication) => (
              <div key={medication.id} className="p-4 bg-gray-50 rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-lg">{medication.name}</p>
                    <p className="text-sm text-gray-600">{medication.dosage}</p>
                  </div>
                  <span className="bg-primary text-white px-3 py-1 rounded-full text-sm">
                    {medication.frequency}
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-600">服药时间: {medication.times}</p>
                  <p className="text-sm text-gray-600">
                    有效期: {medication.startDate} 至 {medication.endDate}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {userType === 'family' && (
          <div className="mt-6 flex justify-center">
            <button className="bg-primary hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full shadow-md">
              ➕ 添加服药计划
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default MedicationReminder
