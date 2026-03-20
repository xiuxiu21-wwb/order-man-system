@echo off
chcp 65001 >nul
echo ========================================
echo   快速启动后端服务脚本
echo ========================================
echo.

cd /d "%~dp0"

echo 正在启动后端服务...
echo API 地址：http://0.0.0.0:8000
echo.
echo 按 Ctrl+C 停止服务
echo.

python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

pause
