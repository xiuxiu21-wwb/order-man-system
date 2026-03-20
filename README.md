# 家护伴 - 智慧养老陪护平台

<div align="center">
  <img src="8c77c5e108fbe008d27d74302307c07e.jpg" alt="家护伴Logo" width="200"/>

  专为老年人打造的智慧养老服务平台，提供位置监护、健康管理、语音陪伴、紧急求助等全方位服务。
</div>

## 📋 项目简介

家护伴是一款面向居家养老场景的智能陪护系统，通过"硬件设备+云平台+移动端"的组合，为老人提供安全、便捷、智能的养老服务，同时让子女能够实时了解老人的健康和安全状况。

## ✨ 核心功能

### 👴 老人端功能
- **实时定位**：GPS+基站多重定位，随时查看老人位置
- **服药提醒**：自定义服药计划，准时语音提醒
- **语音陪伴**：智能语音对话，聊天解闷、查询信息
- **一键求助**：紧急情况下一键呼叫子女和紧急联系人
- **健康监测**：对接健康设备，记录健康数据
- **天气播报**：每日天气和出行提醒

### 👨‍👩‍👧 子女端功能
- **位置查看**：实时查看老人当前位置
- **轨迹回放**：查看老人历史行动轨迹
- **电子围栏**：设置安全区域，出入自动报警
- **报警接收**：接收紧急求助、异常行为报警通知
- **健康管理**：查看老人健康数据和服药记录
- **远程设置**：远程为老人设置提醒、配置功能

### 🖥️ 管理端功能
- **用户管理**：管理平台所有用户信息
- **设备管理**：管理接入的智能硬件设备
- **数据分析**：查看平台运营数据和用户统计
- **内容管理**：管理新闻资讯、健康知识等内容
- **系统配置**：配置平台参数和第三方服务

## 🛠️ 技术栈

### 后端
- **框架**：FastAPI + Python
- **数据库**：SQLite (开发) / PostgreSQL (生产)
- **缓存**：Redis
- **任务调度**：Celery
- **实时通信**：WebSocket
- **认证**：JWT + Passlib

### 前端
- **小程序**：微信小程序原生开发
- **管理后台**：HTML + JavaScript + Tailwind CSS
- **移动端**：React + Vite

### 第三方服务
- **地图服务**：高德地图API
- **语音服务**：百度语音API / 火山引擎
- **天气服务**：第三方天气API
- **推送服务**：微信消息推送

## 🚀 快速开始

### 环境要求
- Python 3.9+
- Redis (可选，用于任务调度和缓存)
- 微信小程序开发工具 (如需开发小程序)

### 1. 克隆项目
```bash
git clone <仓库地址>
cd "order man2/ord man"
```

### 2. 创建虚拟环境
```bash
python -m venv .venv
# Windows激活
.venv\Scripts\activate
# Linux/Mac激活
source .venv/bin/activate
```

### 3. 安装依赖
```bash
pip install -r requirements.txt
```

### 4. 初始化数据库
```bash
python init_db.py
# 创建默认管理员账号
python create_admin.py
```

### 5. 配置环境变量
复制 `.env.example` 为 `.env`，配置相关参数：
```env
# 数据库配置
DATABASE_URL=sqlite:///./example_db.db

# JWT配置
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# 第三方API密钥
GAODE_MAP_KEY=your-gaode-key
BAIDU_VOICE_KEY=your-baidu-key
WEATHER_API_KEY=your-weather-key
```

### 6. 启动服务
```bash
# 方式1：直接启动
python run.py

# 方式2：使用启动脚本
start.bat  # Windows
./start.sh # Linux/Mac
```

### 7. 访问服务
- 后端API：http://localhost:8000
- API文档：http://localhost:8000/docs
- 管理后台：http://localhost:8000/admin.html
- 默认管理员账号：admin / admin123

## 📁 项目结构

```
.
├── app/                          # 后端代码目录
│   ├── __init__.py
│   ├── main.py                  # 项目入口文件
│   ├── api/                     # API接口层
│   │   ├── admin.py             # 管理员相关接口
│   │   ├── users.py             # 用户相关接口
│   │   ├── locations.py         # 位置相关接口
│   │   ├── medications.py       # 服药相关接口
│   │   ├── alerts.py            # 报警相关接口
│   │   ├── conversations.py     # 对话相关接口
│   │   ├── news.py              # 新闻相关接口
│   │   ├── weather.py           # 天气相关接口
│   │   └── verify_code.py       # 验证码接口
│   ├── core/                    # 核心配置层
│   │   ├── config.py            # 配置文件
│   │   └── security.py          # 安全认证相关
│   ├── db/                      # 数据库层
│   │   ├── models.py            # 数据库模型
│   │   └── session.py           # 数据库会话
│   ├── schemas/                 # 数据校验层
│   │   └── *.py                 # 各模块的Pydantic模型
│   └── services/                # 业务服务层
│       ├── ai_assistant.py      # AI助手服务
│       ├── map_service.py       # 地图服务
│       └── weather_service.py   # 天气服务
├── miniprogram/                 # 微信小程序代码
├── frontend/                    # 前端代码
├── *.html                       # 管理后台静态页面
├── requirements.txt             # Python依赖
├── run.py                       # 开发环境启动入口
├── start.bat                    # Windows启动脚本
├── start.sh                     # Linux启动脚本
├── init_db.py                   # 数据库初始化脚本
├── create_admin.py              # 创建管理员脚本
├── ARCHITECTURE.md              # 技术架构文档
├── DEPLOYMENT.md                # 详细部署文档
└── README.md                    # 项目说明文档
```

## 📦 部署说明

### Windows服务器部署
详细步骤请参考：[Windows服务器部署教程.md](Windows服务器部署教程.md)

### 宝塔面板部署
详细步骤请参考：[宝塔面板部署指南.md](宝塔面板部署指南.md)

### 阿里云服务器部署
详细步骤请参考：[阿里云服务器部署指南.md](阿里云服务器部署指南.md)

### 小程序部署
详细步骤请参考：[阿里云小程序部署教程.md](阿里云小程序部署教程.md)

### 快速部署
```bash
# 一键部署（Windows）
./一键部署.bat

# 手动部署参考
# 1. 安装Nginx
# 2. 配置反向代理到8000端口
# 3. 配置SSL证书
# 4. 配置开机自启
```

## 🧪 测试
```bash
# 运行所有测试
pytest

# 运行单个模块测试
pytest test_user_api.py
```

## 📚 相关文档
- [技术架构文档](ARCHITECTURE.md) - 详细的技术架构设计
- [部署文档](DEPLOYMENT.md) - 完整的部署流程说明
- [测试指南](TESTING_GUIDE.md) - 测试流程和规范
- [安全组配置指南](安全组配置指南.md) - 服务器端口配置说明
- [文件上传方法](文件上传方法.md) - 文件上传功能说明

## 🤝 开发规范
- 代码风格遵循PEP8规范，使用Black格式化
- 提交信息使用约定式提交规范：`feat: 功能描述` / `fix: 修复描述`
- 所有API接口必须有对应的Pydantic参数校验
- 敏感信息不允许提交到代码库，必须通过环境变量配置

## 🔒 安全说明
- 所有接口使用HTTPS加密传输
- 用户密码使用bcrypt加密存储
- 接口访问需要JWT认证
- 输入参数做严格校验，防止SQL注入和XSS攻击
- 敏感数据做脱敏处理

## 📄 许可证
本项目仅供内部使用，未经授权不得外传。

## 📞 技术支持
如有问题，请联系开发团队。
