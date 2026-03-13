import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

function getQuickResponse(message) {
  message = message.toLowerCase()
  
  if (message.includes("你好") || message.includes("hi") || message.includes("hello") || message.includes("好")) {
    return "你好呀！很高兴见到你，有什么我可以帮你的吗？"
  } else if (message.includes("名字") || message.includes("叫什么")) {
    return "我是你的智能助手，专门陪伴你的！"
  } else if (message.includes("时间") || message.includes("几点")) {
    const now = new Date()
    return `现在是${now.getHours()}点${now.getMinutes()}分哦。`
  } else if (message.includes("天气")) {
    return "今天天气很好，适合出去散散步呢！"
  } else if (message.includes("吃药") || message.includes("服药")) {
    return "记得按时吃药，这样身体才会棒棒的！"
  } else if (message.includes("回家") || message.includes("迷路") || message.includes("找不到")) {
    return "别担心，打开家庭地图，我帮你找到回家的路！"
  } else if (message.includes("家人") || message.includes("孩子") || message.includes("儿女")) {
    return "你的家人都很关心你，他们随时都在！"
  } else if (message.includes("不舒服") || message.includes("难受") || message.includes("疼")) {
    return "如果不舒服，一定要告诉家人或者打电话给医生哦！"
  } else if (message.includes("帮助") || message.includes("求助")) {
    return "我来帮你！有什么事慢慢说。"
  } else if (message.includes("谢谢") || message.includes("感谢")) {
    return "不客气！能帮到你我很开心！"
  } else if (message.includes("再见") || message.includes("拜拜")) {
    return "再见！有空再来聊聊天呀！"
  } else if (message.includes("饿") || message.includes("吃什么")) {
    return "饿了吗？问问家人今天吃什么好吃的！"
  } else if (message.includes("无聊") || message.includes("没事干")) {
    return "要不要听听音乐，或者去公园走走？"
  } else {
    return "我在听呢，你慢慢说。"
  }
}

function VoiceAssistant() {
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userType, setUserType] = useState('elder')
  const messagesEndRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    setMessages([
      {
        id: 1,
        text: '你好！我是你的智能语音助手，有什么我可以帮你的吗？',
        sender: 'ai'
      }
    ])
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!inputText.trim()) return

    const userMessage = {
      id: Date.now(),
      text: inputText,
      sender: 'user'
    }
    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setLoading(true)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)
      
      let aiResponse = getQuickResponse(inputText)
      
      try {
        const response = await fetch('/api/conversations/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: inputText }),
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          const data = await response.json()
          if (data.response) {
            aiResponse = data.response
          }
        }
      } catch (apiError) {
        console.log('API响应慢，使用本地回复:', apiError)
      }
      
      const aiMessage = {
        id: Date.now() + 1,
        text: aiResponse,
        sender: 'ai'
      }
      setMessages(prev => [...prev, aiMessage])
      setLoading(false)
    } catch (error) {
      console.error('获取AI回复失败:', error)
      const aiResponse = getQuickResponse(inputText)
      const aiMessage = {
        id: Date.now() + 1,
        text: aiResponse,
        sender: 'ai'
      }
      setMessages(prev => [...prev, aiMessage])
      setLoading(false)
    }
  }

  const handleVoiceInput = () => {
    setIsRecording(!isRecording)
    if (!isRecording) {
      setTimeout(() => {
        setInputText('我想回家')
        setIsRecording(false)
      }, 2000)
    }
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
            <h1 className="text-xl font-bold">语音陪伴</h1>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg h-[600px] flex flex-col">
          <div className="flex-1 p-6 overflow-y-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-2xl ${
                    message.sender === 'user' 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                      : 'bg-gradient-to-r from-gray-100 to-gray-200'
                  } shadow-md`}
                >
                  <p className="text-lg">{message.text}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start mb-4">
                <div className="max-w-[80%] p-4 rounded-2xl bg-gradient-to-r from-gray-100 to-gray-200 shadow-md">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t p-6 bg-gray-50">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleVoiceInput}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg transition-all ${
                  isRecording 
                    ? 'bg-red-500 text-white animate-pulse scale-110' 
                    : 'bg-white hover:bg-gray-100'
                }`}
              >
                🎤
              </button>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="输入消息或点击麦克风"
                className="flex-1 border-2 border-gray-200 rounded-2xl px-6 py-4 text-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
              <button
                onClick={handleSend}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
              >
                发送
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">💬 常用问题</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { text: '现在几点了？', icon: '🕐' },
              { text: '我该吃药了吗？', icon: '💊' },
              { text: '怎么回家？', icon: '🏠' },
              { text: '我的家人在哪里？', icon: '👨‍👩‍👧‍👦' },
              { text: '今天天气怎么样？', icon: '☀️' },
              { text: '我有点不舒服', icon: '🏥' }
            ].map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  setInputText(item.text)
                  setTimeout(handleSend, 100)
                }}
                className="bg-white hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-300 px-6 py-4 rounded-xl text-lg font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-3"
              >
                <span className="text-2xl">{item.icon}</span>
                <span>{item.text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VoiceAssistant
