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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">认知障碍老人陪伴与防走失系统</h1>
        <h2 className="text-xl font-semibold text-center text-gray-600 mb-6">登录</h2>
        
        <div className="mb-8">
          <p className="text-center text-gray-600 mb-4">选择角色直接进入：</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => handleDirectLogin('elder')}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-8 rounded focus:outline-none focus:shadow-outline text-lg"
            >
              👨 老人端
            </button>
            <button
              onClick={() => handleDirectLogin('family')}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded focus:outline-none focus:shadow-outline text-lg"
            >
              👨‍👩‍👧‍👦 子女端
            </button>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-6">
          <p className="text-center text-gray-600 mb-4">或使用账号密码登录：</p>
          <button
            onClick={() => setShowLogin(!showLogin)}
            className="text-center text-sm text-blue-500 hover:text-blue-800 w-full"
          >
            {showLogin ? '返回快速登录' : '显示登录表单'}
          </button>
          
          {showLogin && (
            <form className="mt-6" onSubmit={(e) => e.preventDefault()}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                  用户名
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="username"
                  type="text"
                  placeholder="请输入用户名"
                  defaultValue="elder"
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                  密码
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="password"
                  type="password"
                  placeholder="请输入密码"
                  defaultValue="123456"
                />
              </div>
              <div className="flex items-center justify-between">
                <button
                  className="bg-primary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  type="submit"
                >
                  登录
                </button>
                <a
                  className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
                  href="/register"
                >
                  注册新账号
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default Login
