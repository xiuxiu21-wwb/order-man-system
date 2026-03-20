@echo off
chcp 65001 >nul
echo ========================================
echo   微信小程序阿里云部署脚本
echo   Windows Server 版本
echo ========================================
echo.

REM 检查是否安装了 Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Python，请先安装 Python 3.9
    echo 下载地址：https://www.python.org/ftp/python/3.9.13/python-3.9.13-amd64.exe
    pause
    exit /b 1
)

REM 检查是否安装了 Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js
    echo 下载地址：https://nodejs.org/dist/v18.17.0/node-v18.17.0-x64.msi
    pause
    exit /b 1
)

echo [√] Python 已安装
echo [√] Node.js 已安装
echo.

REM 获取当前脚本所在目录
set SCRIPT_DIR=%~dp0
set PROJECT_DIR=%SCRIPT_DIR%

echo 项目目录：%PROJECT_DIR%
echo.

REM 1. 安装 Python 依赖
echo ========================================
echo 步骤 1: 安装 Python 依赖
echo ========================================
cd /d "%PROJECT_DIR%"
python -m pip install --upgrade pip -i https://pypi.tuna.tsinghua.edu.cn/simple
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
if errorlevel 1 (
    echo [错误] Python 依赖安装失败
    pause
    exit /b 1
)
echo [√] Python 依赖安装完成
echo.

REM 2. 初始化数据库
echo ========================================
echo 步骤 2: 初始化数据库
echo ========================================
python init_db.py
if errorlevel 1 (
    echo [错误] 数据库初始化失败
    pause
    exit /b 1
)
echo [√] 数据库初始化完成
echo.

REM 3. 构建前端
echo ========================================
echo 步骤 3: 构建前端
echo ========================================
cd /d "%PROJECT_DIR%frontend"
if not exist "node_modules" (
    echo 正在安装前端依赖...
    call npm install --registry=https://registry.npmmirror.com
)
echo 正在构建前端...
call npm run build
if errorlevel 1 (
    echo [错误] 前端构建失败
    pause
    exit /b 1
)
echo [√] 前端构建完成
echo.

REM 4. 安装 PM2
echo ========================================
echo 步骤 4: 安装 PM2 进程管理
echo ========================================
call npm install -g pm2 --registry=https://registry.npmmirror.com
if errorlevel 1 (
    echo [警告] PM2 安装失败，将使用后台模式启动
) else (
    echo [√] PM2 安装完成
)
echo.

REM 5. 创建启动脚本
echo ========================================
echo 步骤 5: 创建启动脚本
echo ========================================

REM 创建后端启动脚本
echo @echo off > "%PROJECT_DIR%start_backend.bat"
echo cd /d "%PROJECT_DIR%" >> "%PROJECT_DIR%start_backend.bat"
echo python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 >> "%PROJECT_DIR%start_backend.bat"

REM 创建前端启动脚本
echo @echo off > "%PROJECT_DIR%start_frontend.bat"
echo cd /d "%PROJECT_DIR%frontend" >> "%PROJECT_DIR%start_frontend.bat"
echo npm run dev >> "%PROJECT_DIR%start_frontend.bat"

echo [√] 启动脚本创建完成
echo.

REM 6. 配置防火墙
echo ========================================
echo 步骤 6: 配置 Windows 防火墙
echo ========================================
echo 正在开放端口...
netsh advfirewall firewall add rule name="OrderMan Backend" dir=in action=allow protocol=TCP localport=8000 >nul 2>&1
netsh advfirewall firewall add rule name="OrderMan Frontend" dir=in action=allow protocol=TCP localport=3000 >nul 2>&1
netsh advfirewall firewall add rule name="HTTP" dir=in action=allow protocol=TCP localport=80 >nul 2>&1
netsh advfirewall firewall add rule name="HTTPS" dir=in action=allow protocol=TCP localport=443 >nul 2>&1
echo [√] 防火墙配置完成
echo.

REM 7. 启动服务
echo ========================================
echo 步骤 7: 启动服务
echo ========================================

REM 检查 PM2 是否可用
where pm2 >nul 2>&1
if errorlevel 1 (
    echo PM2 不可用，使用后台模式启动...
    start "后端服务" cmd /k "cd /d %PROJECT_DIR% && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"
    timeout /t 5 /nobreak >nul
    start "前端服务" cmd /k "cd /d %PROJECT_DIR%frontend && npm run dev"
) else (
    echo 使用 PM2 启动...
    cd /d "%PROJECT_DIR%"
    call pm2 start "python -m uvicorn app.main:app --host 0.0.0.0 --port 8000" --name order-man-backend
    call pm2 save
    echo [√] PM2 服务已启动
)

echo.
echo ========================================
echo   部署完成！
echo ========================================
echo.
echo 后端 API 地址：http://localhost:8000
echo 前端地址：http://localhost:3000
echo.
echo 请在阿里云控制台配置安全组：
echo - 开放端口 8000（后端 API）
echo - 开放端口 80（HTTP）
echo - 开放端口 443（HTTPS）
echo - 开放端口 3000（前端）
echo.
echo 然后在小程序中修改 API 地址为：
echo http://你的服务器公网IP:8000/api
echo.
pause
