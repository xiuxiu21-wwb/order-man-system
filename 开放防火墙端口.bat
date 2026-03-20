# 开放防火墙端口 - 微信小程序局域网测试
# 右键点击此文件，选择"以管理员身份运行"

netsh advfirewall firewall add rule name="Python API 8000" dir=in action=allow protocol=TCP localport=8000
netsh advfirewall firewall add rule name="Vite Frontend 3000" dir=in action=allow protocol=TCP localport=3000

echo.
echo 防火墙端口已开放！
echo - 8000 端口（后端 API）
echo - 3000 端口（前端）
echo.
pause
