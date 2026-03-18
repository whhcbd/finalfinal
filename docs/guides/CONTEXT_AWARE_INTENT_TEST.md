# 对话上下文感知意图识别 - 测试指南

## 功能说明

现在意图识别服务支持对话上下文感知，能够理解用户的模糊表达（如"是的"、"画一个"、"展示一下"）并结合之前的对话判断真实意图。

## 实现细节

### 后端改动

1. **IntentService.identify_intent()** 新增 `conversation_history` 参数
   - 接收最近 6 条消息（3 轮对话）作为上下文
   - 将历史消息传递给 LLM 进行意图识别

2. **System Prompt 更新**
   - 添加了"上下文感知"指导
   - 明确告诉 LLM 如何处理模糊表达

3. **main.py 更新**
   - 从前端接收 `history` 字段
   - 转换为标准格式传递给意图识别服务

### 前端支持

前端 `chat-orchestrator.ts` 已经在发送历史记录：
```typescript
body: JSON.stringify({
  message: userMessage,
  session_id: sessionId,
  use_ui: true,
  history: this.conversationHistory.slice(-10) // 最近 10 条消息
})
```

## 测试场景

### 场景 1：模糊的"画一个"

**对话流程：**
```
用户: Aa和aa杂交后代是什么
AI: [解释杂交结果]
用户: 画一个
```

**预期结果：**
- 意图识别为 `punnett_square`（因为上文讨论了杂交）
- 生成孟德尔方格图，基因型为 Aa 和 aa

### 场景 2：确认词"是的"

**对话流程：**
```
用户: 能展示一下DNA的双螺旋结构吗
AI: [解释DNA结构]
用户: 是的，展示一下
```

**预期结果：**
- 意图识别为 `dna_structure`（因为上文讨论了DNA结构）
- 生成 DNA 结构可视化

### 场景 3：简短的"可以"

**对话流程：**
```
用户: 这个家族的遗传模式是什么
AI: [解释遗传模式]
用户: 可以画个家系图吗
AI: [解释家系图]
用户: 可以
```

**预期结果：**
- 意图识别为 `pedigree_chart`（因为上文讨论了家系图）
- 生成家系图可视化

### 场景 4：无上下文的模糊表达

**对话流程：**
```
用户: 你好
AI: [问候]
用户: 画一个
```

**预期结果：**
- 意图识别为 `general`（因为没有明确的上下文）
- 返回文本提示用户说明想画什么

## 如何测试

### 1. 启动服务

```bash
# 后端
cd C:\trae_coding\A2UI-main\my-a2ui-project
.venv\Scripts\Activate.ps1
py -m uvicorn backend.main:app --reload --port 8000

# 前端
cd C:\trae_coding\A2UI-main\my-a2ui-project\frontend\genetics-app
npm run dev
```

### 2. 查看日志

后端日志会显示：
```
意图识别使用了 X 条历史消息作为上下文
历史消息: ['Aa和aa杂交后代是什么', '在这个杂交实验中...']
意图识别结果: intent=punnett_square, keywords=...
```

### 3. 测试步骤

1. 打开浏览器访问 `http://localhost:5173`
2. 开始新对话
3. 按照上述测试场景进行对话
4. 观察：
   - 后端日志中的意图识别结果
   - 前端是否正确渲染了对应的可视化组件

## 预期改进效果

### 之前（无上下文）
```
用户: Aa和aa杂交后代是什么
AI: [文本解释]
用户: 画一个
AI: [不知道画什么，返回 general 意图]
```

### 现在（有上下文）
```
用户: Aa和aa杂交后代是什么
AI: [文本解释]
用户: 画一个
AI: [理解是要画杂交图，返回 punnett_square 意图]
    [自动生成 Aa x aa 的孟德尔方格图]
```

## 技术细节

### 历史消息格式

前端发送：
```json
{
  "message": "画一个",
  "session_id": "xxx",
  "use_ui": true,
  "history": [
    {"role": "user", "content": "Aa和aa杂交后代是什么"},
    {"role": "assistant", "content": "在这个杂交实验中..."}
  ]
}
```

后端处理：
```python
conversation_history = []
if request.history:
    for msg in request.history[-6:]:  # 最近 3 轮
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if content:
            conversation_history.append({"role": role, "content": content})

intent_result = await intent_service.identify_intent(
    request.message,
    conversation_history
)
```

### LLM 调用

```python
messages = [
    {"role": "system", "content": system_prompt},
    {"role": "user", "content": "Aa和aa杂交后代是什么"},
    {"role": "assistant", "content": "在这个杂交实验中..."},
    {"role": "user", "content": "画一个"}  # 当前消息
]
```

LLM 会根据完整的对话历史判断"画一个"指的是画杂交图。

## 故障排查

### 问题：意图识别仍然不准确

**检查：**
1. 后端日志是否显示"使用了 X 条历史消息"
2. 前端是否正确发送了 `history` 字段
3. 历史消息内容是否完整

**解决：**
- 确保前端 `conversationHistory` 正确维护
- 检查后端是否正确解析 `request.history`

### 问题：历史消息为空

**检查：**
- 前端 `chat-orchestrator.ts` 中的 `conversationHistory` 是否正确添加消息
- 后端日志中是否显示"使用了 0 条历史消息"

**解决：**
- 确保前端在发送消息前已经将用户消息添加到历史
- 检查前端是否正确维护 `role` 和 `content` 字段

## 下一步优化

- [ ] 添加关键词正则匹配回退机制
- [ ] 合并意图识别和响应生成为单次 LLM 调用
- [ ] 使用 JSON 模式强制结构化输出
- [ ] 添加更多上下文感知的测试用例
