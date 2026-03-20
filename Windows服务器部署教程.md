# Windows 服务器阿里云小程序部署教程

## 一、连接服务器

### 1.1 远程桌面连接
1. 在 Windows 电脑上按 `Win + R`
2. 输入 `mstsc` 回车
3. 输入你的服务器公网 IP：`172.20.211.169`
4. 用户名：`Administrator`
5. 输入密码（购买时设置的密码）

## 二、安装必要软件

### 2.1 安装 Python
1. 下载 Python 3.9：https://www.python.org/ftp/python/3.9.13/python-3.9.13-amd64.exe
2. 运行安装程序
3. ✅ 勾选 "Add Python to PATH"
4. 点击 "Install Now"

### 2.2 安装 Node.js
1. 下载 Node.js LTS：https://nodejs.org/dist/v18.17.0/node-v18.17.0-x64.msi
2. 运行安装程序
3. 一路下一步

### 2.3 安装 Git
1. 下载 Git：https://github.com/git-for-windows/git/releases/download/v2.42.0.windows.2/Git-2.42.0.2-64-bit.exe
2. 运行安装程序
3. 一路下一步

### 2.4 安装 PM2（进程管理）
打开 PowerShell（管理员），运行：
```powershell
npm install -g pm2
```

## 三、上传代码

### 方法一：使用远程桌面复制粘贴
1. 在本地电脑复制项目文件夹
2. 在远程桌面中粘贴到 `C:\` 盘

### 方法二：使用 FTP 工具（推荐）
1. 下载 FileZilla：https://filezilla-project.org/
2. 连接服务器：
   - 主机：`172.20.211.169`
   - 用户名：`Administrator`
   - 密码：你的密码
   - 端口：`22`（需要先开启 SSH）或 `3389`（远程桌面）

### 方法三：使用阿里云 Workbench
1. 登录阿里云控制台
2. 进入 ECS 实例
3. 点击 "远程连接" -> "Workbench"
4. 直接上传文件

## 四、部署后端

### 4.1 打开 PowerShell（管理员）
```powershell
cd C:\ord man
```

### 4.2 安装 Python 依赖
```powershell
python -m pip install --upgrade pip -i https://pypi.tuna.tsinghua.edu.cn/simple
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### 4.3 初始化数据库
```powershell
python init_db.py
```

### 4.4 创建启动脚本
新建 `start_backend.bat`：
```batch
@echo off
cd /d C:\ord man
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 4.5 使用 PM2 启动（推荐）
```powershell
pm2 start "python -m uvicorn app.main:app --host 0.0.0.0 --port 8000" --name order-man-backend
pm2 save
pm2 startup
```

## 五、部署前端

### 5.1 构建前端
```powershell
cd C:\ord man\frontend
npm install
npm run build
```

### 5.2 创建启动脚本
新建 `start_frontend.bat`：
```batch
@echo off
cd /d C:\ord man\frontend
npm run dev
```

## 六、配置防火墙（重要！）

### 6.1 在阿里云控制台配置安全组
1. 登录阿里云控制台
2. 进入 ECS 实例详情页
3. 点击 "网络与安全组" -> "安全组配置"
4. 点击 "配置规则" -> "入方向"
5. 添加以下规则：
   - 端口：8000，授权对象：0.0.0.0/0，描述：后端 API
   - 端口：80，授权对象：0.0.0.0/0，描述：HTTP
   - 端口：443，授权对象：0.0.0.0/0，描述：HTTPS
   - 端口：3000，授权对象：0.0.0.0/0，描述：前端（可选）

### 6.2 在 Windows 防火墙开放端口
打开 PowerShell（管理员）：
```powershell
New-NetFirewallRule -DisplayName "OrderMan Backend" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "OrderMan Frontend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "HTTP" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "HTTPS" -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow
```

## 七、修改小程序配置

### 7.1 修改 app.js
在微信开发者工具中打开项目，修改 `miniprogram/app.js`：
```javascript
globalData: {
  apiBaseUrl: 'http://你的服务器公网IP:8000/api',
  // ... 其他配置
}
```

**注意**：小程序正式上线必须使用 HTTPS，测试期间可以使用 HTTP。

## 八、测试验证

### 8.1 测试后端 API
在浏览器访问：
```
http://你的服务器公网IP:8000/api/users/test
```

应该返回：
```json
{
  "message": "API is working",
  "register_url": "/api/users/register (POST)"
}
```

### 8.2 测试前端
在浏览器访问：
```
http://你的服务器公网IP:3000
```

### 8.3 测试小程序
1. 在微信开发者工具中编译
2. 真机测试需要：
   - 手机连接同一 WiFi
   - 或在微信公众平台配置服务器域名

## 九、开机自启动

### 9.1 创建开机启动脚本
新建 `C:\ord man\startup.bat`：
```batch
@echo off
timeout /t 30 /nobreak
start "Backend" cmd /k "cd /d C:\ord man && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"
timeout /t 10 /nobreak
start "Frontend" cmd /k "cd /d C:\ord man\frontend && npm run dev"
```

### 9.2 添加到任务计划程序
1. 按 `Win + R`，输入 `taskschd.msc`
2. 点击 "创建任务"
3. 名称：`OrderMan Startup`
4. 勾选 "使用最高权限运行"
5. 触发器 -> 新建 -> "登录时"
6. 操作 -> 新建 -> 启动程序
   - 程序：`C:\ord man\startup.bat`
7. 条件 -> 取消勾选 "只有在计算机使用交流电源时才启动"

## 十、小程序上线配置

### 10.1 购买域名（必须）
1. 在阿里云购买域名（约 6 元/年）
2. 完成域名实名认证
3. ICP 备案（约 10-20 天）

### 10.2 配置 HTTPS（必须）
使用 IIS 或 Nginx 配置 SSL 证书：
1. 申请免费 SSL 证书（阿里云提供）
2. 下载并安装到 Windows
3. 在 IIS 中绑定 HTTPS

### 10.3 在微信公众平台配置
1. 登录 https://mp.weixin.qq.com/
2. 开发 -> 开发管理 -> 开发设置
3. 服务器域名：
   - request 合法域名：`https://你的域名`
   - uploadFile 合法域名：`https://你的域名`
   - downloadFile 合法域名：`https://你的域名`

## 十一、常见问题

### 11.1 无法访问服务器
- 检查阿里云安全组是否开放端口
- 检查 Windows 防火墙
- 确认服务是否运行：`pm2 list`

### 11.2 数据库文件不存在
```powershell
cd C:\ord man
python init_db.py
```

### 11.3 查看日志
```powershell
# PM2 日志
pm2 logs order-man-backend

# 查看 Python 进程
pm2 list
```

### 11.4 重启服务
```powershell
pm2 restart all
```

## 十二、快速部署清单

- [ ] 1. 远程桌面连接服务器
- [ ] 2. 安装 Python、Node.js、Git
- [ ] 3. 安装 PM2
- [ ] 4. 上传代码到 `C:\ord man`
- [ ] 5. 安装 Python 依赖
- [ ] 6. 初始化数据库
- [ ] 7. 启动后端服务
- [ ] 8. 构建前端
- [ ] 9. 启动前端服务
- [ ] 10. 配置阿里云安全组
- [ ] 11. 配置 Windows 防火墙
- [ ] 12. 修改小程序 API 地址
- [ ] 13. 测试 API 访问
- [ ] 14. 测试小程序

## 十三、费用说明

| 项目 | 费用 |
|------|------|
| 服务器（2 核 4G） | 约 120 元/月 |
| 域名（.com） | 约 6 元/年 |
| SSL 证书 | 免费（阿里云提供） |
| **总计** | **约 126 元/月** |

---

## 现在开始部署！

按照上面的步骤一步步操作，遇到问题可以查看常见问题部分。

**重要提示**：
- 测试期间可以使用 HTTP
- 正式上线必须配置 HTTPS 和域名
- 记得在阿里云控制台配置安全组！
