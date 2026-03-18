# WebSocket 调试指南

## 如何在浏览器中查看 WebSocket 消息

### 步骤 1：打开开发者工具
1. 在浏览器中按 **F12** 键
2. 或者右键点击页面 → 选择"检查"

### 步骤 2：切换到 Network（网络）标签页
1. 点击顶部的 **Network** 标签
2. 如果看不到，可能需要点击 `>>` 展开更多标签

### 步骤 3：过滤 WebSocket 连接
1. 在 Network 标签页中，找到过滤器区域
2. 点击 **WS** 按钮（WebSocket 的缩写）
3. 或者在搜索框中输入 `ws://`

### 步骤 4：刷新页面并查看连接
1. 刷新页面（F5）
2. 你应该能看到一个 WebSocket 连接，类似：
   ```
   ws://localhost:8000/ws/chat/[session-id]
   ```

### 步骤 5：查看 WebSocket 消息
1. 点击这个 WebSocket 连接
2. 在右侧面板中，切换到 **Messages** 标签
3. 你会看到所有发送和接收的消息：
   - ⬆️ 绿色箭头 = 发送的消息（客户端 → 服务器）
   - ⬇️ 红色箭头 = 接收的消息（服务器 → 客户端）

### 步骤 6：查看消息内容
1. 点击任意一条消息
2. 在下方会显示消息的完整内容（JSON 格式）
3. 你可以展开查看详细的数据结构

---

## 预期看到的消息流程

### 1. 用户发送消息时
**发送（⬆️）：**
```json
{
  "type": "chat",
  "message": "请帮我分析 Aa 和 aa 杂交的后代",
  "use_ui": true,
  "history": [...]
}
```

### 2. 服务器返回文本响应
**接收（⬇️）：**
```json
{
  "type": "text",
  "text": "好的，我来帮你分析..."
}
```

### 3. 服务器返回 A2UI 消息（3条）
**接收（⬇️）- 第1条：**
```json
{
  "type": "a2ui",
  "message": {
    "beginRendering": {
      "surfaceId": "genetics_ui",
      "root": "punnett_square_component"
    }
  }
}
```

**接收（⬇️）- 第2条：**
```json
{
  "type": "a2ui",
  "message": {
    "surfaceUpdate": {
      "surfaceId": "genetics_ui",
      "components": [...]
    }
  }
}
```

**接收（⬇️）- 第3条：**
```json
{
  "type": "a2ui",
  "message": {
    "dataModelUpdate": {
      "surfaceId": "genetics_ui",
      "contents": [
        {
          "path": "/parent1",
          "value": "Aa"
        },
        {
          "path": "/parent2",
          "value": "aa"
        },
        ...
      ]
    }
  }
}
```

---

## 常见问题排查

### 问题 1：看不到 WebSocket 连接
**可能原因：**
- 前端没有成功连接到后端
- 后端服务没有启动

**检查方法：**
1. 在 Console 标签页查看是否有错误：
   ```
   WebSocket connection failed
   ```
2. 确认后端是否在运行：
   ```bash
   curl http://localhost:8000/health
   ```

### 问题 2：WebSocket 连接后立即断开
**可能原因：**
- 后端 WebSocket 端点有问题
- 端口被占用

**检查方法：**
1. 查看后端日志是否有错误
2. 检查 Network 标签中的 Status Code

### 问题 3：发送消息后没有收到响应
**可能原因：**
- 后端处理消息时出错
- 消息格式不正确

**检查方法：**
1. 查看后端日志中的错误信息
2. 在 WebSocket Messages 中确认消息是否发送成功
3. 检查是否收到 error 类型的消息

### 问题 4：收到消息但前端没有显示
**可能原因：**
- 前端消息处理器有问题
- A2UI 渲染失败

**检查方法：**
1. 在 Console 标签查看是否有 JavaScript 错误
2. 查看是否有以下日志：
   ```
   [Orchestrator] 收到消息: a2ui
   [A2UIRenderer] Rendering X A2UI messages
   ```

---

## 实时调试技巧

### 在 Console 中手动检查
```javascript
// 1. 检查 WebSocket 连接状态
const ws = window.orchestrator?.websocket;
console.log('WebSocket state:', ws?.readyState);
// 0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED

// 2. 检查是否有 a2ui-surface 元素
const surface = document.querySelector('a2ui-surface');
console.log('Surface element:', surface);

// 3. 查看 surface 的数据
if (surface) {
  console.log('Surface data:', surface.surface);
  console.log('Data model:', surface.processor?.getSurfaces());
}

// 4. 检查是否注册了自定义组件
console.log('Custom elements:', customElements.get('punnett-square'));
```

---

## 截图示例

### Network 标签 - WS 过滤
```
┌─────────────────────────────────────────┐
│ Network                                 │
├─────────────────────────────────────────┤
│ Filter: [All] [XHR] [JS] [CSS] [WS] ← 点这里
│                                         │
│ Name                          Status    │
│ ├─ ws://localhost:8000/...    101       │
│                                         │
└─────────────────────────────────────────┘
```

### Messages 标签
```
┌─────────────────────────────────────────┐
│ Headers | Preview | Response | Messages │← 点这里
├─────────────────────────────────────────┤
│ ⬆️ {"type":"chat","message":"..."}      │
│ ⬇️ {"type":"text","text":"..."}         │
│ ⬇️ {"type":"a2ui","message":{...}}      │
│ ⬇️ {"type":"a2ui","message":{...}}      │
│ ⬇️ {"type":"a2ui","message":{...}}      │
└─────────────────────────────────────────┘
```

---

## 下一步

按照上面的步骤操作后，请告诉我：

1. **能看到 WebSocket 连接吗？**（在 Network → WS 中）
2. **发送消息后收到了几条响应？**（在 Messages 标签中）
3. **响应消息的 type 是什么？**（text? a2ui? error?）
4. **Console 标签有什么错误信息吗？**

这些信息能帮我快速定位问题所在！
