# 临时关闭 Windows 防火墙 - 用于测试
# 右键点击此文件，选择"以管理员身份运行"

Write-Host "正在关闭 Windows 防火墙..." -ForegroundColor Yellow

# 关闭所有防火墙配置文件
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False

Write-Host "防火墙已关闭！" -ForegroundColor Green
Write-Host ""
Write-Host "现在可以测试小程序登录了" -ForegroundColor Cyan
Write-Host ""
Write-Host "测试完成后，建议重新开启防火墙：" -ForegroundColor Yellow
Write-Host "Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True" -ForegroundColor White
Write-Host ""

pause
