# 测试指南 - A2UI 数据绑定功能

## 📋 测试前准备

### 1. 检查环境配置

确保 `.env` 文件存在并配置了 API 密钥：

```bash
# backend/.env
ZHIPUAI_API_KEY=your_api_key_here
```

### 2. 安装依赖

#### 后端依赖
```bash
cd backend
pip install -r requirements.txt
```

#### 前端依赖
```bash
cd frontend/genetics-app
npm install
```

---

## 🚀 启动服务

### 方式 1：分别启动（推荐用于调试）

#### 终端 1 - 启动后端
```bash
cd backend
python main.py
```

**预期输出：**
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

#### 终端 2 - 启动前端
```bash
cd frontend/genetics-app
npm run dev
```

**预期输出：**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 方式 2：使用脚本启动

如果有启动脚本，可以一键启动：
```bash
# 根目录
./start.sh  # Linux/Mac
start.bat   # Windows
```

---

## 🧪 测试场景

### 测试 1：基础渲染测试（验证数据绑定生成）

#### 步骤：
1. 打开浏览器访问 http://localhost:5173
2. 在聊天框输入：
   ```
   请帮我分析 Aa 和 aa 杂交的后代
   ```
3. 点击发送

#### 预期结果：

**后端日志应该显示：**
```
INFO - 收到 WebSocket 消息: session_id=xxx, type=chat
INFO - 意图识别结果: intent=punnett_square
INFO - 生成初始数据模型: {'parent1': 'Aa', 'parent2': 'aa', 'trait': '花色', 'showPhenotype': True}
INFO - 开始 A2UI 组件生成...
INFO - LLM A2UI 响应: [{"beginRendering": ...
INFO - 发送 A2UI 消息: ['beginRendering']
INFO - 发送 A2UI 消息: ['surfaceUpdate']
INFO - 发送 A2UI 消息: ['dataModelUpdate']
```

**前端应该显示：**
- ✅ Punnett Square 方格图
- ✅ 显示 Aa × aa 的杂交结果
- ✅ 4 个子代格子（Aa, Aa, aa, aa）
- ✅ 表型比例显示

**浏览器控制台检查：**
```javascript
// 打开开发者工具 (F12)
// 应该看到：
[A2UIRenderer] Rendering 3 A2UI messages
[A2UIRenderer] Found 1 surfaces to render
[A2UIRenderer] Rendering surface: genetics_ui
```

#### ✅ 验证数据绑定：

打开浏览器控制台，检查组件属性：
```javascript
// 查看 surface 元素
const surface = document.querySelector('a2ui-surface');
console.log(surface.surface);

// 应该看到组件使用了 path 绑定：
// {
//   "component": {
//     "PunnettSquare": {
//       "parent1Genotype": {"path": "/parent1"},  // ✅ 使用数据绑定
//       "parent2Genotype": {"path": "/parent2"},  // ✅ 使用数据绑定
//       ...
//     }
//   }
// }
```

---

### 测试 2：实时更新测试（验证 dataModelUpdate）

#### 步骤：
1. 在已渲染的 Punnett Square 中找到输入框
2. 修改"亲本1基因型"从 `Aa` 改为 `AA`
3. 修改"亲本2基因型"从 `aa` 改为 `Aa`
4. 点击"重新计算"按钮

#### 预期结果：

**后端日志应该显示：**
```
INFO - 收到 WebSocket 消息: session_id=xxx, type=action
INFO - 处理 action: name=recalculate, surface=genetics_ui, context={'parent1': 'AA', 'parent2': 'Aa', 'trait': '花色'}
INFO - 重新计算: session=xxx, context={'parent1': 'AA', 'parent2': 'Aa', 'trait': '花色'}
INFO - 更新数据模型字段: session=xxx, path=/parent1, value=AA
INFO - 更新数据模型字段: session=xxx, path=/parent2, value=Aa
INFO - 发送数据模型更新: {'dataModelUpdate': {'surfaceId': 'genetics_ui', 'contents': [...]}}
```

**前端应该显示：**
- ✅ 方格图自动更新（无需重新生成整个组件）
- ✅ 显示新的杂交结果：AA × Aa
- ✅ 4 个子代格子变为（AA, Aa, AA, Aa）
- ✅ 表型比例自动更新

**浏览器控制台检查：**
```
[Orchestrator] 收到实时 dataModelUpdate
[Orchestrator] 处理 dataModelUpdate for surface: genetics_ui
[A2UIRenderer] 更新 surface genetics_ui 的数据模型
[A2UIRenderer] 数据模型更新成功，组件将自动响应
```

#### ✅ 关键验证点：
- 页面**没有闪烁**（说明是增量更新，不是重新渲染）
- 只有方格图内容变化，其他部分保持不变
- 更新速度很快（< 100ms）

---

### 测试 3：多轮交互测试（验证状态管理）

#### 步骤：
1. 第一轮：输入 `Aa` × `aa`，点击"重新计算"
2. 第二轮：修改为 `AA` × `AA`，点击"重新计算"
3. 第三轮：修改为 `Aa` × `Aa`，点击"重新计算"
4. 第四轮：点击"重置"按钮

#### 预期结果：

**每次更新后：**
- ✅ 方格图正确显示当前基因型的杂交结果
- ✅ 后端日志显示数据模型正确更新
- ✅ 前端控制台显示 dataModelUpdate 消息

**点击重置后：**
- ✅ 恢复到默认值（Aa × aa）
- ✅ 后端日志显示：
  ```
  INFO - 重置数据模型: session=xxx
  INFO - 数据模型已重置
  ```

---

### 测试 4：降级策略测试（验证本地生成）

#### 步骤：
1. 暂时断开网络或设置错误的 API 密钥
2. 输入：`请帮我分析 Aa 和 aa 杂交的后代`

#### 预期结果：

**后端日志应该显示：**
```
WARNING - A2UI 生成失败，使用本地降级策略（数据绑定版本）
INFO - 生成数据绑定版本的降级 A2UI: intent=punnett_square
```

**前端应该显示：**
- ✅ 仍然能看到 Punnett Square（使用本地生成）
- ✅ 使用数据绑定（不是 literalString）
- ✅ 交互功能正常工作

---

### 测试 5：不同组件类型测试

#### 测试 DNA 结构：
```
输入：请展示 ATCGATCG 这段 DNA 序列的结构
```

**预期：**
- ✅ 显示 DNAStructure 组件
- ✅ 使用 `{"path": "/sequence"}` 数据绑定

#### 测试表型分布：
```
输入：F2代中紫色花和白色花的比例是多少？
```

**预期：**
- ✅ 显示 PhenotypeDistribution 组件
- ✅ 使用 `{"path": "/trait"}`, `{"path": "/data"}` 数据绑定

---

## 🔍 调试技巧

### 1. 查看后端日志

实时查看日志：
```bash
# Linux/Mac
tail -f logs/backend.log

# Windows PowerShell
Get-Content logs/backend.log -Wait -Tail 50
```

### 2. 查看前端控制台

打开浏览器开发者工具 (F12)，查看：
- **Console** - 查看日志和错误
- **Network** - 查看 WebSocket 连接
- **Elements** - 检查 DOM 结构

### 3. 检查 WebSocket 连接

在浏览器控制台：
```javascript
// 查看 WebSocket 状态
const ws = window.orchestrator?.websocket;
console.log('WebSocket state:', ws?.readyState);
// 0 = CONNECTING, 1 = OPEN, 2 = CLOSING, 3 = CLOSED
```

### 4. 检查数据模型

在浏览器控制台：
```javascript
// 查看当前数据模型
const surface = document.querySelector('a2ui-surface');
const processor = surface?.processor;
console.log('Data model:', processor?.getSurfaces().get('genetics_ui')?.dataModel);
```

### 5. 手动发送 action 消息

在浏览器控制台测试：
```javascript
// 手动触发 action
const surface = document.querySelector('a2ui-surface');
surface.dispatchEvent(new CustomEvent('action', {
  detail: {
    name: 'recalculate',
    context: {
      parent1: 'AA',
      parent2: 'aa',
      trait: '测试'
    }
  },
  bubbles: true,
  composed: true
}));
```

---

## ❌ 常见问题排查

### 问题 1：后端启动失败

**错误：** `ModuleNotFoundError: No module named 'xxx'`

**解决：**
```bash
cd backend
pip install -r requirements.txt
```

### 问题 2：前端无法连接后端

**错误：** `WebSocket connection failed`

**检查：**
1. 后端是否在运行？
2. 端口是否正确（默认 8000）？
3. 防火墙是否阻止？

**解决：**
```bash
# 检查后端是否运行
curl http://localhost:8000/health

# 或在浏览器访问
http://localhost:8000/docs
```

### 问题 3：组件不更新

**症状：** 点击"重新计算"后方格图不变化

**检查：**
1. 浏览器控制台是否有错误？
2. 后端是否发送了 dataModelUpdate？
3. 组件是否使用了数据绑定（path）？

**调试：**
```javascript
// 检查是否收到 dataModelUpdate
const surface = document.querySelector('a2ui-surface');
surface.addEventListener('dataModelUpdate', (e) => {
  console.log('Received dataModelUpdate:', e.detail);
});
```

### 问题 4：LLM 生成的 JSON 格式错误

**症状：** 后端日志显示 JSON 解析失败

**检查后端日志：**
```
ERROR - JSON 解析失败: Expecting value: line 1 column 1 (char 0)
WARNING - A2UI 生成失败，使用本地降级策略
```

**这是正常的！** 系统会自动使用降级策略，功能仍然可用。

### 问题 5：API 密钥错误

**错误：** `Authentication failed`

**解决：**
1. 检查 `.env` 文件是否存在
2. 检查 API 密钥是否正确
3. 重启后端服务

---

## ✅ 测试检查清单

完成以下所有测试后，你的系统就完全正常了：

- [ ] **基础渲染** - 能看到 Punnett Square
- [ ] **数据绑定** - 组件使用 `{"path": "/field"}` 而不是 `literalString`
- [ ] **实时更新** - 修改输入后点击按钮，方格图自动更新
- [ ] **多轮交互** - 多次修改和计算都能正常工作
- [ ] **重置功能** - 点击重置按钮恢复默认值
- [ ] **降级策略** - LLM 失败时仍能使用本地生成
- [ ] **不同组件** - DNA、表型分布等组件都能正常工作
- [ ] **WebSocket 连接** - 前后端通信正常
- [ ] **日志输出** - 后端和前端日志都正常
- [ ] **无错误** - 浏览器控制台无错误信息

---

## 📊 性能指标

正常情况下的性能指标：

| 指标 | 预期值 |
|------|--------|
| 首次渲染时间 | < 2 秒 |
| 数据更新延迟 | < 100ms |
| WebSocket 连接时间 | < 500ms |
| LLM 响应时间 | 3-10 秒 |
| 降级策略响应 | < 100ms |

---

## 🎯 测试成功标准

如果以上所有测试都通过，说明：

✅ 数据绑定功能已正确实现
✅ 实时更新机制正常工作
✅ 前后端完美对接
✅ 降级策略可靠
✅ 系统可以投入使用

恭喜！你的 A2UI v0.8 实时交互系统已经完全就绪！🎉
