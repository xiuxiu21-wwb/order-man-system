import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Login() {
  const navigate = useNavigate()
  const [showLogin, setShowLogin] = useState(false)

  const handleQuickLogin = (userType) => {
    localStorage.setItem('token', `token_${userType}`)
    localStorage.setItem('userType', userType)
    localStorage.setItem('userName', userType === 'elder' ? '张大爷' : '张大爷子女')
    navigate(userType === 'elder' ? '/elder' : '/family')
  }

  const handleDirectLogin = (userType) => {
    localStorage.setItem('token', `token_${userType}`)
    localStorage.setItem('userType', userType)
    localStorage.setItem('userName', userType === 'elder' ? '张大爷' : '张大爷子女')
    navigate(userType === 'elder' ? '/elder' : '/family')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部橙色区域 */}
      <div className="bg-gradient-to-b from-orange-400 to-orange-600 pt-12 pb-20 px-6">
        <div className="text-center">
          <div className="text-6xl mb-4">🏠</div>
          <h1 className="text-2xl font-bold text-white mb-2">家护伴 - 老人陪伴与防走失系统</h1>
          <p className="text-orange-100 text-sm">温暖陪伴 · 安全守护</p>
        </div>
      </div>

      {/* 白色卡片区域 */}
      <div className="-mt-16 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          {/* 快速登录 */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">选择身份进入</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleDirectLogin('elder')}
                className="flex flex-col items-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl hover:from-orange-100 hover:to-orange-200 transition-all active:scale-95"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-3xl mb-3 shadow-lg">
                  👴
                </div>
                <span className="text-gray-800 font-semibold text-lg">老人端</span>
              </button>
              
              <button
                onClick={() => handleDirectLogin('family')}
                className="flex flex-col items-center p-6 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl hover:from-amber-100 hover:to-amber-200 transition-all active:scale-95"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-3xl mb-3 shadow-lg">
                  👨‍👩‍👧‍
                </div>
                <span className="text-gray-800 font-semibold text-lg">子女端</span>
              </button>
            </div>
          </div>

          {/* 分割线 */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">或</span>
            </div>
          </div>

          {/* 账号密码登录 */}
          <div>
            <button
              onClick={() => setShowLogin(!showLogin)}
              className="w-full text-center text-orange-500 hover:text-orange-600 font-medium py-2 transition-colors"
            >
              {showLogin ? '返回快速登录' : '账号密码登录'}
            </button>
            
            {showLogin && (
              <form className="mt-4 space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <input
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                    type="text"
                    placeholder="请输入用户名"
                    defaultValue="elder"
                  />
                </div>
                <div>
                  <input
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                    type="password"
                    placeholder="请输入密码"
                    defaultValue="123456"
                  />
                </div>
                <button
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all duration-200 shadow-lg"
                  type="submit"
                >
                  登 录
                </button>
                <a
                  className="block text-center text-sm text-gray-600 hover:text-gray-800 py-2"
                  href="/register"
                >
                  注册新账号 →
                </a>
              </form>
            )}
          </div>
        </div>

        {/* 底部说明 */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>© 2024 家护伴</p>
          <p className="mt-1">关爱老人 · 守护健康</p>
        </div>
      </div>
    </div>
  )
}

export default Login
