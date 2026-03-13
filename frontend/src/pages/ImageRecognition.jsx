import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

function ImageRecognition() {
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const fileInputRef = useRef(null)
  const navigate = useNavigate()

  const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.7) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width)
              width = maxWidth
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height)
              height = maxHeight
            }
          }

          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }))
            },
            'image/jpeg',
            quality
          )
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    })
  }

  const handleImageSelect = async (e) => {
    const file = e.target.files[0]
    if (file) {
      setLoading(true)
      setLoadingProgress(20)
      
      const compressedFile = await compressImage(file)
      setLoadingProgress(50)
      
      setSelectedImage(compressedFile)
      const reader = new FileReader()
      reader.onload = (event) => {
        setImagePreview(event.target.result)
        setLoadingProgress(100)
        setTimeout(() => {
          setLoading(false)
          setLoadingProgress(0)
        }, 300)
      }
      reader.readAsDataURL(compressedFile)
      setResult(null)
    }
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      setLoading(true)
      setLoadingProgress(20)
      
      const compressedFile = await compressImage(file)
      setLoadingProgress(50)
      
      setSelectedImage(compressedFile)
      const reader = new FileReader()
      reader.onload = (event) => {
        setImagePreview(event.target.result)
        setLoadingProgress(100)
        setTimeout(() => {
          setLoading(false)
          setLoadingProgress(0)
        }, 300)
      }
      reader.readAsDataURL(compressedFile)
      setResult(null)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const simulateProgress = () => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 15
      if (progress > 90) {
        progress = 90
        clearInterval(interval)
      }
      setLoadingProgress(Math.min(progress, 90))
    }, 500)
    return interval
  }

  const handleRecognize = async () => {
    if (!selectedImage || loading) return

    setLoading(true)
    setLoadingProgress(10)
    setResult({
      description: '正在识别图片，请稍等...',
      confidence: 0.5,
      isLoading: true
    })

    const progressInterval = simulateProgress()

    const formData = new FormData()
    formData.append('file', selectedImage)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    try {
      const response = await fetch('/api/image-recognition/recognize', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      clearInterval(progressInterval)
      setLoadingProgress(100)

      if (response.ok) {
        const data = await response.json()
        setResult({ ...data, isLoading: false })
      } else {
        setResult({
          description: '抱歉，识别遇到了问题，请稍后再试。',
          confidence: 0.5,
          isLoading: false
        })
      }
    } catch (error) {
      console.log('识别出错:', error)
      clearInterval(progressInterval)
      setLoadingProgress(100)
      setResult({
        description: '这张图片很有趣！让我好好看看...虽然现在我不太确定，但您可以告诉我图片里有什么，我们一起聊聊！',
        confidence: 0.5,
        isLoading: false
      })
    } finally {
      setTimeout(() => {
        setLoading(false)
        setLoadingProgress(0)
      }, 500)
    }
  }

  const handleReset = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setResult(null)
    setLoading(false)
    setLoadingProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-primary text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/elder')}
              className="mr-4 hover:text-gray-200 text-2xl"
            >
              ←
            </button>
            <h1 className="text-xl font-bold">图片识别</h1>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">📸</div>
            <h2 className="text-xl font-bold text-gray-800">识别图片</h2>
            <p className="text-gray-600 mt-1">上传图片，让我帮您看看</p>
          </div>

          {!imagePreview ? (
            <div
              className="border-4 border-dashed border-gray-300 rounded-2xl p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <div className="text-5xl mb-3">🖼️</div>
              <p className="text-lg text-gray-600 mb-1">点击上传图片</p>
              <p className="text-sm text-gray-400">也可以直接拖拽图片</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-5">
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="预览"
                  className="w-full max-h-80 object-contain rounded-xl shadow-lg mx-auto"
                />
              </div>

              {loadingProgress > 0 && (
                <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-300"
                    style={{ width: `${loadingProgress}%` }}
                  ></div>
                </div>
              )}

              <div className="flex justify-center gap-3">
                <button
                  onClick={handleReset}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2.5 px-6 rounded-xl shadow-md transition-all"
                >
                  🔄 重新选择
                </button>
                <button
                  onClick={handleRecognize}
                  disabled={loading || !selectedImage}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition-all"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      识别中...
                    </span>
                  ) : (
                    '🔍 开始识别'
                  )}
                </button>
              </div>

              {result && (
                <div className={`bg-gradient-to-r ${result.isLoading ? 'from-blue-50 to-cyan-50 border-blue-200' : 'from-green-50 to-blue-50 border-green-200'} border-2 rounded-xl p-5`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-2xl">{result.isLoading ? '⏳' : '✨'}</div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {result.isLoading ? '识别中...' : '识别结果'}
                    </h3>
                  </div>
                  <p className="text-base text-gray-700 leading-relaxed">
                    {result.description}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 bg-white rounded-xl shadow-md p-5">
          <h3 className="text-base font-bold text-gray-800 mb-3">💡 使用提示</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-blue-50 p-3 rounded-xl">
              <div className="text-xl mb-1">🏠</div>
              <p className="text-gray-700 text-sm">拍摄家里的物品</p>
            </div>
            <div className="bg-green-50 p-3 rounded-xl">
              <div className="text-xl mb-1">🌳</div>
              <p className="text-gray-700 text-sm">拍摄外面的风景</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-xl">
              <div className="text-xl mb-1">👨‍👩‍👧</div>
              <p className="text-gray-700 text-sm">拍摄家人的照片</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImageRecognition
