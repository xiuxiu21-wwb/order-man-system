# 🚀 超简单云部署指南（10 分钟搞定）

## 📋 部署方案

- **前端**: Vercel（完全免费，自动部署）
- **后端**: Render（免费额度，自动部署）
- **数据库**: SQLite（内置）

---

## 🎯 第一步：创建 GitHub 仓库（2 分钟）

### 1.1 访问 GitHub
打开 https://github.com 并登录

### 1.2 创建新仓库
1. 点击右上角 "+" → "New repository"
2. 仓库名称：`order-man-system`
3. 选择 **Public**（公开）
4. **不要**勾选 "Initialize this repository with a README"
5. 点击 "Create repository"

### 1.3 推送代码

在命令行执行以下命令（复制粘贴）：

```bash
cd "c:\Users\20924\Desktop\02_项目代码\order man\ord man"
git remote add origin https://github.com/YOUR_USERNAME/order-man-system.git
git branch -M main
git push -u origin main
```

**注意**: 将 `YOUR_USERNAME` 替换为您的 GitHub 用户名

---

## 🏗️ 第二步：部署后端到 Render（3 分钟）

### 2.1 注册 Render
1. 访问 https://render.com
2. 点击 "Sign Up"
3. 选择 "Continue with GitHub"（用 GitHub 登录）

### 2.2 创建 Web Service
1. 登录后，点击 "New +" → "Web Service"
2. 选择您的仓库 `order-man-system`
3. 填写配置：
   - **Name**: `order-man-system`
   - **Region**: Singapore（新加坡）
   - **Branch**: main
   - **Root Directory**: 留空
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Free（免费）

4. 点击 "Advanced"（高级设置）：
   - 找到 "Auto-Deploy" → 确保勾选 ✅

5. 点击 "Create Web Service"

### 2.3 等待部署
- Render 会自动构建和部署
- 大约需要 3-5 分钟
- 部署完成后会显示网址，类似：`https://order-man-system.onrender.com`

**记下这个网址！**

---

## 🎨 第三步：部署前端到 Vercel（3 分钟）

### 3.1 访问 Vercel
1. 打开 https://vercel.com
2. 点击 "Sign Up"
3. 选择 "Continue with GitHub"

### 3.2 导入项目
1. 登录后，点击 "Add New Project"
2. 选择 "Import Git Repository"
3. 找到 `order-man-system`，点击 "Import"

### 3.3 配置项目
1. **Framework Preset**: Vite
2. **Root Directory**: 点击 "Edit" → 输入 `frontend`
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`

5. 点击 "Deploy"

### 3.4 等待部署
- Vercel 会自动构建
- 大约 1-2 分钟
- 完成后显示网址：`https://order-man-system.vercel.app`

---

## ⚙️ 第四步：配置前端 API 地址（2 分钟）

### 4.1 修改前端代码

打开文件：`frontend/src/pages/AdminDashboard.jsx`

找到所有 `http://localhost:8000` 的地方，替换为您的 Render 网址。

例如，将：
```javascript
const response = await fetch('http://localhost:8000/api/admin/login', {
```

改为：
```javascript
const response = await fetch('https://YOUR-APP.onrender.com/api/admin/login', {
```

**需要修改的地方**：
- `fetchUsers()` 函数中的 API 地址
- `handleLogin()` 函数中的登录地址
- `handleCreateUser()` 函数中的创建用户地址
- `handleDeleteUser()` 函数中的删除用户地址

### 4.2 提交修改

```bash
git add .
git commit -m "Update API base URL to Render"
git push
```

### 4.3 Vercel 自动重新部署
- Vercel 检测到代码更新后会自动重新部署
- 等待 1-2 分钟即可

---

## ✅ 第五步：测试访问

### 访问地址：

- **前端首页**: `https://YOUR-APP.vercel.app`
- **管理后台**: `https://YOUR-APP.vercel.app/admin`
- **后端 API**: `https://YOUR-APP.onrender.com`

### 测试登录：

- 用户名：`admin`
- 密码：`admin123`

---

## 💰 费用说明

### 完全免费！

- **Vercel**: 
  - ✅ 完全免费
  - 免费额度：100GB 流量/月（个人项目足够）

- **Render**:
  - ✅ 免费套餐
  - ⚠️ 15 分钟无请求会休眠
  - 💡 解决方法：使用 UptimeRobot 免费监控，每 10 分钟访问一次

---

## 🔧 让 Render 不休眠（可选）

### 使用 UptimeRobot 保持活跃：

1. 访问 https://uptimerobot.com
2. 注册免费账号
3. 点击 "Add New Monitor"
4. 填写：
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: `order-man-system`
   - **URL**: `https://YOUR-APP.onrender.com/api/health`
   - **Monitoring Interval**: 5 minutes

5. 点击 "Create Monitor"

这样 UptimeRobot 会每 5 分钟访问一次您的网站，防止休眠！

---

## 📱 分享给别人

现在您可以：
1. 把 Vercel 网址发给别人
2. 别人打开就能使用
3. 无需连接同一个 WiFi
4. 24 小时在线（配合 UptimeRobot）

---

## 🎉 完成！

部署成功后，您会拥有：
- ✅ 前端网址：`https://YOUR-APP.vercel.app`
- ✅ 后端网址：`https://YOUR-APP.onrender.com`
- ✅ 管理后台：`https://YOUR-APP.vercel.app/admin`

**别人只需要打开 Vercel 网址就能使用！**

---

## 📞 遇到问题？

### 常见问题：

**Q: Render 部署失败？**
- 查看日志：Render 控制台 → Logs 标签
- 检查 requirements.txt 是否完整

**Q: Vercel 部署失败？**
- 查看日志：Vercel 控制台 → View Build Logs
- 检查 frontend 目录是否正确

**Q: 前端无法连接后端？**
- 检查 API 地址是否修改正确
- 确保 Render 部署成功

---

**祝您部署成功！** 🚀
