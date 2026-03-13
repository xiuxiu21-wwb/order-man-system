# 🚀 免费云部署完整指南

## 📋 部署目标

- **前端**: Vercel (完全免费，全球 CDN)
- **后端**: Fly.io (免费额度内，不会休眠)
- **数据库**: SQLite (内置，免费)

---

## 🎯 第一步：准备 GitHub 账号

1. 访问 https://github.com
2. 注册账号（如果没有）
3. 安装 Git（如果没安装）
   - 下载地址：https://git-scm.com/download/win

---

## 📦 第二步：上传代码到 GitHub

### 2.1 初始化 Git 仓库

```bash
# 打开命令行，进入项目根目录
cd "c:\Users\20924\Desktop\02_项目代码\order man\ord man"

# 初始化 Git 仓库
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit"
```

### 2.2 创建 GitHub 仓库

1. 访问 https://github.com/new
2. 仓库名称：`order-man-system`
3. 选择 **Public**（公开）
4. 点击 "Create repository"

### 2.3 推送代码到 GitHub

```bash
# 关联远程仓库（替换 YOUR_USERNAME 为您的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/order-man-system.git

# 推送代码
git branch -M main
git push -u origin main
```

---

## 🏗️ 第三步：部署后端到 Fly.io

### 3.1 注册 Fly.io

1. 访问 https://fly.io/app/sign-up
2. 使用 GitHub 账号登录
3. 完成注册

### 3.2 安装 Fly.io CLI

```bash
# Windows PowerShell（管理员身份）
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

安装完成后，重启终端。

### 3.3 登录 Fly.io

```bash
fly auth login
```

会自动打开浏览器，登录您的账号。

### 3.4 部署应用

```bash
# 进入项目目录
cd "c:\Users\20924\Desktop\02_项目代码\order man\ord man"

# 部署到 Fly.io
fly deploy
```

部署过程：
- 会询问是否创建应用 → 输入 `yes`
- 选择区域 → 选择 `sin`（新加坡，离中国最近）
- 等待构建和部署完成

### 3.5 打开应用

```bash
# 打开部署好的应用
fly open
```

您会看到后端 API 的地址，类似：`https://order-man-system.fly.dev`

**记下这个网址！前端需要用到。**

---

## 🎨 第四步：部署前端到 Vercel

### 4.1 修改前端配置

打开 `frontend/src/pages/AdminDashboard.jsx`，找到：

```javascript
const response = await fetch('http://localhost:8000/api/admin/login', {
```

修改为（替换为您的 Fly.io 地址）：

```javascript
const response = await fetch('https://YOUR-APP.fly.dev/api/admin/login', {
```

同样的，修改所有 API 请求地址。

### 4.2 上传前端到 GitHub

```bash
# 提交修改
cd "c:\Users\20924\Desktop\02_项目代码\order man\ord man\frontend"
git add .
git commit -m "Update API base URL"
git push
```

### 4.3 部署到 Vercel

1. 访问 https://vercel.com
2. 使用 GitHub 账号登录
3. 点击 "Add New Project"
4. 选择 `order-man-system/frontend`
5. 点击 "Deploy"

等待部署完成（约 1-2 分钟）。

### 4.4 获取前端地址

部署完成后，您会看到：
- **前端地址**: `https://order-man-system.vercel.app`

---

## ✅ 第五步：测试访问

### 访问地址：

- **前端**: `https://YOUR-APP.vercel.app`
- **后端**: `https://YOUR-APP.fly.dev`
- **管理后台**: `https://YOUR-APP.vercel.app/admin`

### 测试登录：

- 用户名：`admin`
- 密码：`admin123`

---

## 🔧 更新代码

每次修改代码后：

```bash
# 1. 提交到 GitHub
git add .
git commit -m "更新说明"
git push

# 2. Vercel 会自动部署前端
# 3. Fly.io 需要手动触发部署
fly deploy
```

---

## 💰 费用说明

### Vercel（前端）
- ✅ **完全免费**
- 免费额度：100GB 流量/月（个人项目足够）

### Fly.io（后端）
- ✅ **免费额度内**
- 每月 $5 免费额度
- 您的配置：1 核 256MB，约 $2-3/月
- **完全在免费额度内**

### 总计
- 💰 **每月约 ¥15-20 元**（或完全免费，如果用 Vercel + Render 免费方案）

---

## ⚡ 性能说明

- **响应时间**: 200-500ms（新加坡节点）
- **不会休眠**: Fly.io 不会强制休眠
- **24 小时在线**: 随时可访问
- **全球可访问**: 有网就能访问

---

## 🎉 完成！

现在您可以：
1. 把前端网址发给别人
2. 别人打开就能使用
3. 无需连接同一个 WiFi
4. 24 小时稳定运行

---

## 📞 需要帮助？

如果在部署过程中遇到问题：
1. 查看 Fly.io 日志：`fly logs`
2. 查看 Vercel 部署日志：vercel.com/dashboard
3. 检查后端是否运行：`fly status`

---

**祝您部署成功！** 🚀
