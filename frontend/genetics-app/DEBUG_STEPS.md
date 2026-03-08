# 🐛 前端组件不渲染 - 调试步骤

## 当前状态
✅ 后端 JSON 格式正确（使用 literalString 和 literalBoolean）
❌ 前端没有组件渲染出来

## 🔍 调试步骤

### 步骤 1: 检查浏览器控制台

1. 打开前端页面：http://localhost:5173
2. 按 F12 打开开发者工具
3. 查看 **Console** 标签页，寻找以下日志：

**期望看到的日志：**
```
[Orchestrator] Rendering A2UI with 2 messages
[A2UIRenderer] Rendering 2 A2UI messages
[A2UIRenderer] Messages processed successfully
[A2UIRenderer] Found 1 surfaces to render
[A2UIRenderer] Rendering surface: genetics_ui
```

**如果看到错误：**
- `Failed to resolve module specifier "@a2ui/lit/ui"` → 运行 `npm install`
- `a2ui-surface is not defined` → A2UI 标准组件未加载
- `Cannot read property 'register' of undefined` → componentRegistry 不存在
- 其他错误 → 记录下来

### 步骤 2: 检查 Network 请求

1. 切换到 **Network** 标签页
2. 在聊天框输入："Aa和aa杂交会产生什么后代？"
3. 找到 `/api/chat` 请求
4. 点击查看 **Response**

**检查响应内容：**
- ✅ `a2ui` 字段存在且不为空数组
- ✅ `a2ui[0]` 包含 `beginRendering`
- ✅ `a2ui[1]` 包含 `surfaceUpdate`
- ✅ 组件名称是 `PunnettSquare`（大写开头）
- ✅ 属性使用 `literalString` 和 `literalBoolean` 包装

### 步骤 3: 检查 DOM 结构

1. 切换到 **Elements** 标签页
2. 找到最新的助手消息（`.message.assistant`）
3. 展开查看内部结构

**期望的 DOM 结构：**
```html
<div class="message assistant" data-id="...">
  <div class="message-header">...</div>
  <div class="message-content">...</div>
  <div class="a2ui-container">
    <a2ui-surface surface-id="genetics_ui">
      #shadow-root
        <punnett-square>
          #shadow-root
            <!-- 组件内容 -->
        </punnett-square>
    </a2ui-surface>
  </div>
</div>
```

**如果缺少某个元素：**
- 缺少 `.a2ui-container` → chat-module.ts 第 990 行有问题
- 缺少 `<a2ui-surface>` → A2UIRenderer 没有创建元素
- 缺少 `<punnett-square>` → 组件注册或渲染失败

### 步骤 4: 测试独立页面

1. 访问测试页面：http://localhost:5173/test-a2ui.html
2. 查看控制台日志
3. 检查页面是否显示孟德尔方格图

**如果测试页面正常：**
→ 说明组件本身没问题，问题在聊天模块的集成

**如果测试页面也不正常：**
→ 说明组件注册或 A2UI 配置有问题

### 步骤 5: 手动测试组件

在浏览器控制台中运行：

```javascript
// 检查组件是否已注册
console.log('punnett-square registered:', customElements.get('punnett-square'));

// 手动创建组件
const square = document.createElement('punnett-square');
square.parent1Genotype = 'Aa';
square.parent2Genotype = 'aa';
square.trait = '测试';
square.showPhenotype = true;
document.body.appendChild(square);
```

## 📋 问题排查清单

完成以下检查并记录结果：

- [ ] 浏览器控制台有无错误？
- [ ] Network 中 `/api/chat` 响应是否包含 `a2ui` 字段？
- [ ] DOM 中是否有 `.a2ui-container` 元素？
- [ ] DOM 中是否有 `<a2ui-surface>` 元素？
- [ ] DOM 中是否有 `<punnett-square>` 元素？
- [ ] 测试页面 `test-a2ui.html` 是否正常工作？

## 📞 下一步

完成上述调试步骤后，请提供：

1. **浏览器控制台截图**（Console 标签页）
2. **Network 响应截图**（/api/chat 的 Response）
3. **DOM 结构截图**（Elements 标签页）
4. **测试页面结果**（test-a2ui.html 是否正常）
