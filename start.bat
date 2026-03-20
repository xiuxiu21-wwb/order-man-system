@echo off
chcp 65001 >nul
echo ========================================
echo     认知障碍老人陪伴与防走失系统
echo     服务器启动脚本
echo ========================================
echo.

:: 检查 cpolar 是否安装
where cpolar >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未找到 cpolar，请先安装 cpolar
    pause
    exit /b 1
)

:: 启动后端
echo [1/4] 正在启动后端服务器...
start "后端服务器 (端口 8000)" cmd /k "cd /d %~dp0 && .\venv\Scripts\activate && uvicorn app.main:app --host 0.0.0.0 --port 8000"
timeout /t 3 /nobreak >nul

:: 启动前端
echo [2/4] 正在启动前端服务器...
start "前端服务器 (端口 3000)" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 3 /nobreak >nul

:: 启动 cpolar 隧道 - 前端
echo [3/4] 正在启动 cpolar 隧道（前端）...
start "cpolar - 前端" cpolar http 3000
timeout /t 2 /nobreak >nul

:: 启动 cpolar 隧道 - 后端
echo [4/4] 正在启动 cpolar 隧道（后端）...
start "cpolar - 后端" cpolar http 8000
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo     服务器已全部启动！
echo ========================================
echo.
echo 本地访问地址：
echo   前端：http://localhost:3000
echo   后端：http://localhost:8000
echo   超级管理员：http://localhost:3000/admin
echo.
echo 下一步操作：
echo   1. 打开 cpolar 客户端查看新的隧道域名
echo   2. 登录阿里云 DNS 控制台更新 CNAME 记录：
echo      - www.wwblsc.top → 新的前端 cpolar 域名
echo      - api.wwblsc.top → 新的后端 cpolar 域名
echo   3. 等待 5-10 分钟 DNS 生效
echo.
echo ========================================
echo.
pause
