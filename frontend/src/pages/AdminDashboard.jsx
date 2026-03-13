import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function AdminDashboard() {
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [loginError, setLoginError] = useState('')
  
  // 用户列表状态
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [expandedUsers, setExpandedUsers] = useState({})
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    name: '',
    phone: '',
    user_type: 'elder',
    elder_uid: ''
  })

  // 登录处理
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    
    // 验证默认管理员账号
    if (loginForm.username === 'admin' && loginForm.password === 'admin123') {
      try {
        const response = await fetch('http://localhost:8000/api/admin/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(loginForm),
        })
        
        if (response.ok) {
          const data = await response.json()
          localStorage.setItem('adminToken', data.access_token)
          localStorage.setItem('adminUser', loginForm.username)
          setIsAuthenticated(true)
          fetchUsers()
        } else {
          const errorData = await response.json()
          setLoginError(errorData.detail || '登录失败')
        }
      } catch (error) {
        console.error('登录错误:', error)
        setLoginError('网络错误，请稍后重试')
      }
    } else {
      setLoginError('用户名或密码错误')
    }
  }

  // 获取用户列表
  const fetchUsers = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('http://localhost:8000/api/admin/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
        setLastRefreshTime(new Date())
      } else {
        console.error('获取用户列表失败')
        // 如果 token 过期，退出登录
        if (response.status === 401) {
          handleLogout()
        }
      }
    } catch (error) {
      console.error('获取用户列表错误:', error)
    } finally {
      setLoading(false)
    }
  }

  // 删除用户
  const handleDeleteUser = async (userId, username) => {
    if (!confirm(`确定要删除用户 "${username}" 吗？此操作不可恢复！`)) {
      return
    }
    
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`http://localhost:8000/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        alert('删除成功')
        fetchUsers()
      } else {
        const errorData = await response.json()
        alert(`删除失败：${errorData.detail || '未知错误'}`)
      }
    } catch (error) {
      console.error('删除用户错误:', error)
      alert('删除失败，请稍后重试')
    }
  }

  // 创建新用户
  const handleCreateUser = async (e) => {
    e.preventDefault()
    
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('http://localhost:8000/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      })
      
      if (response.ok) {
        alert('创建成功！')
        setShowCreateModal(false)
        setNewUser({
          username: '',
          password: '',
          name: '',
          phone: '',
          user_type: 'elder',
          elder_uid: ''
        })
        fetchUsers()
      } else {
        const errorData = await response.json()
        alert(`创建失败：${errorData.detail || '未知错误'}`)
      }
    } catch (error) {
      console.error('创建用户错误:', error)
      alert('创建失败，请稍后重试')
    }
  }

  // 退出登录
  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    setIsAuthenticated(false)
    setUsers([])
  }

  // 切换展开/收起状态
  const toggleExpand = (userId) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }))
  }

  // 切换密码显示/隐藏
  const togglePasswordVisibility = (userId) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }))
  }

  // 复制 UID 到剪贴板
  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text)
      alert(`${label} 已复制到剪贴板！`)
    } catch (err) {
      // 备用方法
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      alert(`${label} 已复制到剪贴板！`)
    }
  }

  // 手动刷新
  const handleRefresh = () => {
    fetchUsers()
  }

  // 切换自动刷新
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh)
  }

  // 过滤用户列表
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone || '').includes(searchTerm) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterType === 'all' || user.user_type === filterType
    
    return matchesSearch && matchesFilter
  })

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 掩码密码显示
  const maskPassword = (passwordHash) => {
    if (!passwordHash) return '-'
    return '•'.repeat(10) + passwordHash.slice(-4)
  }

  // 获取用户类型显示文本
  const getUserTypeText = (type) => {
    if (!type) return '未知'
    const typeMap = {
      'elder': '👴 老人',
      'family': '👨‍👩‍‍👦 子女',
      'admin': '🔧 管理员'
    }
    return typeMap[type] || type
  }

  // 获取绑定状态显示
  const getBindingStatusText = (status) => {
    if (!status) return '未知'
    const statusMap = {
      'pending': '⏳ 待确认',
      'confirmed': '✅ 已绑定',
      'rejected': '❌ 已拒绝'
    }
    return statusMap[status] || status
  }

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (token) {
      setIsAuthenticated(true)
      fetchUsers()
    }
  }, [])

  // 自动刷新功能
  useEffect(() => {
    let interval = null
    if (autoRefresh && isAuthenticated) {
      interval = setInterval(() => {
        fetchUsers()
      }, 5000) // 每 5 秒刷新一次
    } else if (!autoRefresh) {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [autoRefresh, isAuthenticated])

  // 登录表单
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">🔐 管理后台</h1>
            <p className="text-gray-600">超级管理员登录</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户名
              </label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="请输入用户名"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="请输入密码"
                required
              />
            </div>
            
            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {loginError}
              </div>
            )}
            
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
            >
              登录
            </button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => navigate('/')}
              className="w-full text-center text-sm text-gray-600 hover:text-gray-800"
            >
              ← 返回主页
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 管理后台主界面
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600">
      {/* 顶部导航栏 */}
      <nav className="bg-white bg-opacity-95 backdrop-blur-sm shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-800">🔧 超级管理员后台</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">欢迎，{localStorage.getItem('adminUser')}</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition duration-200"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 顶部操作栏 */}
        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg shadow-xl p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition duration-200"
                title="刷新数据"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>刷新</span>
              </button>
              
              <button
                onClick={toggleAutoRefresh}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition duration-200 ${
                  autoRefresh 
                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
                title="自动刷新（每 5 秒）"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{autoRefresh ? '自动刷新中' : '自动刷新'}</span>
              </button>
            </div>
            
            {lastRefreshTime && (
              <div className="text-sm text-gray-500">
                最后刷新：{lastRefreshTime.toLocaleTimeString('zh-CN')}
              </div>
            )}
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">总用户数</p>
                <p className="text-3xl font-bold text-gray-800">{users.length}</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>
          
          <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">老人用户</p>
                <p className="text-3xl font-bold text-green-600">
                  {users.filter(u => u.user_type === 'elder').length}
                </p>
              </div>
              <div className="text-4xl">👴</div>
            </div>
          </div>
          
          <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">子女用户</p>
                <p className="text-3xl font-bold text-blue-600">
                  {users.filter(u => u.user_type === 'family').length}
                </p>
              </div>
              <div className="text-4xl">👨‍👩‍👦</div>
            </div>
          </div>
          
          <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">管理员</p>
                <p className="text-3xl font-bold text-purple-600">
                  {users.filter(u => u.user_type === 'admin').length}
                </p>
              </div>
              <div className="text-4xl">🔧</div>
            </div>
          </div>
        </div>

        {/* 搜索和筛选 */}
        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg shadow-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜索用户名、姓名、手机号..."
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <label className="text-gray-700 font-medium">用户类型：</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">全部</option>
                <option value="elder">老人</option>
                <option value="family">子女</option>
                <option value="admin">管理员</option>
              </select>
              
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>创建账号</span>
              </button>
            </div>
          </div>
        </div>

        {/* 用户列表表格 */}
        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">用户列表</h2>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户名</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">姓名</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">手机号</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户类型</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">老人 UID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">注册时间</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <React.Fragment key={user.id}>
                      <tr className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.phone}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.user_type === 'elder' ? 'bg-green-100 text-green-800' :
                            user.user_type === 'family' ? 'bg-blue-100 text-blue-800' :
                            user.user_type === 'admin' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {getUserTypeText(user.user_type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                          <div className="flex items-center space-x-2">
                            <span>{user.elder_uid || '-'}</span>
                            {user.elder_uid && (
                              <button
                                onClick={() => copyToClipboard(user.elder_uid, '老人 UID')}
                                className="text-green-600 hover:text-green-900 transition"
                                title="复制 UID"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            {user.user_type === 'family' && user.bound_elders && user.bound_elders.length > 0 && (
                              <button
                                onClick={() => toggleExpand(user.id)}
                                className="text-blue-600 hover:text-blue-900 transition"
                              >
                                {expandedUsers[user.id] ? '收起 ▲' : '展开 ▼'}
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteUser(user.id, user.username)}
                              className="text-red-600 hover:text-red-900 transition"
                            >
                              删除
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* 展开显示绑定的老人信息 */}
                      {expandedUsers[user.id] && user.user_type === 'family' && user.bound_elders && user.bound_elders.length > 0 && (
                        <tr className="bg-blue-50">
                          <td colSpan="10" className="px-6 py-4">
                            <div className="pl-4">
                              <h4 className="text-sm font-semibold text-gray-700 mb-3">📋 绑定的老人信息</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {user.bound_elders.map((elder, index) => (
                                  <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-blue-200">
                                    <div className="space-y-2">
                                      <div>
                                        <span className="text-xs text-gray-500">老人姓名</span>
                                        <p className="text-sm font-medium text-gray-900">{elder.elder_name}</p>
                                      </div>
                                      <div>
                                        <span className="text-xs text-gray-500">老人 UID</span>
                                        <p className="text-sm font-mono text-gray-900">{elder.elder_uid}</p>
                                      </div>
                                      <div>
                                        <span className="text-xs text-gray-500">关系</span>
                                        <p className="text-sm text-gray-900">{elder.relation}</p>
                                      </div>
                                      <div>
                                        <span className="text-xs text-gray-500">绑定状态</span>
                                        <p className="text-sm">
                                          <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${
                                            elder.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                            elder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                          }`}>
                                            {getBindingStatusText(elder.status)}
                                          </span>
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {filteredUsers.length === 0 && !loading && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">没有找到用户</h3>
              <p className="mt-1 text-sm text-gray-500">请尝试调整搜索条件或筛选器</p>
            </div>
          )}
        </div>
      </main>

      {/* 创建账号弹窗 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">创建新账号</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  用户名 *
                </label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入用户名"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  密码 *
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入密码"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  姓名 *
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入姓名"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  手机号 *
                </label>
                <input
                  type="text"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入手机号"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  用户类型 *
                </label>
                <select
                  value={newUser.user_type}
                  onChange={(e) => setNewUser({ ...newUser, user_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="elder">老人</option>
                  <option value="family">子女</option>
                  <option value="admin">管理员</option>
                </select>
              </div>
              
              {newUser.user_type === 'elder' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    老人 UID
                  </label>
                  <input
                    type="text"
                    value={newUser.elder_uid}
                    onChange={(e) => setNewUser({ ...newUser, elder_uid: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入老人 UID（可选）"
                  />
                </div>
              )}
              
              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg transition duration-200"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition duration-200"
                >
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
