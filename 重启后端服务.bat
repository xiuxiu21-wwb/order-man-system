@echo off
chcp 65001 >nul
echo 正在重启后端服务...
echo.

REM 查找并终止占用 8000 端口的进程
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do (
    echo 正在终止进程：%%a
    taskkill /F /PID %%a >nul 2>&1
)

timeout /t 2 /nobreak >nul

REM 启动新的后端服务
cd /d "%~dp0"
echo 正在启动后端服务...
echo API 地址：http://0.0.0.0:8000
echo.
echo 按 Ctrl+C 停止服务
echo.

python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

pause
