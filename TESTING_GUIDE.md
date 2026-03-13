# 药品管理功能测试指南

## ✅ 已完成的修复

### 1. 后端修复
- ✅ 修改 `app/api/bindings.py` - 绑定成功后返回完整的 elder 信息（elder_id, elder_uid, elder_name）
- ✅ 修改 `app/schemas/medications.py` - 添加 user_id 字段到 MedicationCreate
- ✅ 修改 `miniprogram/pages/family/bind-elder.js` - 绑定成功后存储 elderInfo 到本地

### 2. 前端修复
- ✅ `miniprogram/pages/elder/medication.js` - 每次 onShow 时重新加载药品
- ✅ `miniprogram/pages/elder/dashboard.js` - 每次 onShow 时重新加载药品
- ✅ `miniprogram/pages/elder/dashboard.wxml` - 使用动态数据渲染今日提醒

### 3. 数据库状态
当前数据库中有 3 个测试药品（elder_id=1）：
- 降压药 (08:00): 早餐后服用 1 片
- 降糖药 (12:00): 午餐后服用 1 片
- 阿司匹林 (18:00): 晚餐后服用 1 片

## 📋 测试步骤

### 测试 1: 验证 dashboard 页面显示药品
1. 打开小程序，进入老人端 dashboard 页面
2. 查看"今日提醒"部分
3. **预期结果**：显示 3 个药品提醒（降压药、降糖药、阿司匹林）

### 测试 2: 添加药品并验证持久化
1. 进入"服药提醒"页面
2. 点击右上角"➕ 添加药品"
3. 填写信息：
   - 药品名称：维生素 D
   - 服用时间：20:00
   - 服用说明：睡前服用 1 片
4. 点击"确定添加"
5. 返回 dashboard 页面
6. **预期结果**：今日提醒显示 4 个药品（包括新添加的维生素 D）
7. 退出小程序，重新进入
8. **预期结果**：维生素 D 依然存在

### 测试 3: 删除药品并验证同步
1. 进入"服药提醒"页面
2. 点击某个药品右上角的🗑️按钮
3. 确认删除
4. 返回 dashboard 页面
5. **预期结果**：该药品从今日提醒中消失

### 测试 4: 绑定流程测试（可选）
1. 切换到子女端账号
2. 进入绑定老人页面
3. 输入老人 UID 并绑定
4. **预期结果**：绑定成功后，elderInfo 被存储到本地
5. 切换到老人端
6. **预期结果**：可以正常显示该老人的药品信息

## 🔍 故障排查

### 如果 dashboard 仍显示默认数据：
1. 检查 console 是否有错误
2. 确认 elderInfo 是否正确存储：
   ```javascript
   console.log(wx.getStorageSync('elderInfo'))
   ```
3. 预期输出：`{id: 1, uid: "123456", name: "老人"}`

### 如果显示"暂无服药提醒"：
1. 检查后端服务是否运行
2. 访问：http://127.0.0.1:8000/api/medications/elder/1
3. 应该返回药品列表 JSON

### 如果添加药品失败：
1. 检查网络请求
2. 查看后端日志
3. 确认 API URL 正确：`/api/medications/elder`

## 🎯 测试完成标准

- ✅ dashboard 页面显示真实的药品数据（不是硬编码的 3 个）
- ✅ 添加药品后，返回 dashboard 立即显示
- ✅ 删除药品后，dashboard 同步更新
- ✅ 退出小程序再进入，数据依然存在
- ✅ 今日提醒列表按时间排序显示

## 📞 如需帮助

如果测试中遇到问题，请提供：
1. 小程序 console 的错误信息
2. 后端日志
3. 具体操作步骤和预期结果
