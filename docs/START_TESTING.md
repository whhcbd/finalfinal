# A2UI 项目测试指南

## 问题诊断

你的前端没有渲染出 UI 组件，可能的原因：

1. ✅ **已修复**: `index.html` 引用错误（已改为 `/src/index.ts`）
2. ⚠️ **需要检查**: 后端服务未运行
3. ⚠️ **需要验证**: A2UI 组件是否正确注册和渲染

## 测试步骤

### 步骤 1: 启动后端服务

```bash
cd c:\trae_coding\A2UI-main\my-a2ui-project\backend
python main.py
```

后端应该在 `http://127.0.0.1:8000` 运行

### 步骤 2: 启动前端开发服务器

打开新的终端窗口：

```bash
cd c:\trae_coding\A2UI-main\my-a2ui-project\frontend\genetics-app
npm run dev
```

前端应该在 `http://localhost:5173` 运行

### 步骤 3: 测试 A2UI 组件渲染

在浏览器中打开以下 URL 进行测试：

1. **主应用**: http://localhost:5173
2. **A2UI 测试页面**: http://localhost:5173/test-a2ui.html

### 步骤 4: 检查浏览器控制台

打开浏览器开发者工具（F12），查看：

1. **Console 标签页**: 查看是否有错误信息
2. **Network 标签页**: 查看 API 请求是否成功
3. **Elements 标签页**: 查看 DOM 中是否有 `<a2ui-surface>` 元素

## 预期结果

### 成功的标志

在浏览器控制台中，你应该看到：

```
[Test] A2UI v0_8: {Data: {...}, UI: {...}, Types: {...}}
[Test] Component Registry: ComponentRegistry {...}
[Test] Processor created: A2uiMessageProcessor {...}
[Test] Processing messages...
[Test] Messages processed successfully
[Test] Surfaces: Map(1) {"test_surface" => {...}}
[Test] Rendering surface: test_surface
```

在页面上，你应该看到：
- 孟德尔方格图组件正确渲染
- 显示 "Aa" 和 "aa" 的杂交结果

### 如果出现错误

#### 错误 1: "Cannot find module '@a2ui/lit/ui'"

**原因**: A2UI 库未正确安装

**解决方案**:
```bash
cd c:\trae_coding\A2UI-main\my-a2ui-project\frontend\genetics-app
npm install
```

#### 错误 2: "Failed to fetch" 或 "Network Error"

**原因**: 后端服务未运行

**解决方案**: 确保后端服务正在运行（步骤 1）

#### 错误 3: "Component 'PunnettSquare' not found"

**原因**: 自定义组件未正确注册到 A2UI

**解决方案**: 检查 `src/index.ts` 中的组件注册代码

#### 错误 4: "a2ui-surface is not defined"

**原因**: A2UI 标准组件库未导入

**解决方案**: 确保 `src/index.ts` 第一行是 `import "@a2ui/lit/ui";`

## 调试技巧

### 1. 检查组件是否注册

在浏览器控制台中运行：

```javascript
import { v0_8 } from "@a2ui/lit";
console.log(v0_8.UI.componentRegistry);
```

你应该看到 `PunnettSquare`, `DNAStructure` 等组件已注册。

### 2. 检查 API 响应

在聊天界面中输入测试消息，然后在 Network 标签页中查看 `/api/chat` 请求：

- **Request Payload**: 应该包含你的消息
- **Response**: 应该包含 `text` 和 `a2ui` 字段

### 3. 手动测试组件

在浏览器控制台中运行：

```javascript
const square = document.createElement('punnett-square');
square.parent1Genotype = 'Aa';
square.parent2Genotype = 'aa';
square.trait = '测试';
document.body.appendChild(square);
```

如果组件正确注册，你应该看到孟德尔方格图。

## 常见问题

### Q: 为什么我看到的是空白页面？

A: 检查以下几点：
1. 浏览器控制台是否有错误
2. 后端服务是否正在运行
3. Vite 开发服务器是否正在运行
4. `index.html` 是否正确引用 `/src/index.ts`

### Q: 为什么 A2UI 组件没有渲染？

A: 可能的原因：
1. 后端返回的 A2UI JSON 格式不正确
2. 组件未正确注册到 A2UI 系统
3. A2UIRenderer 未正确处理消息

### Q: 如何查看后端返回的 A2UI JSON？

A: 在 `chat-orchestrator.ts` 的第 67 行添加日志：

```typescript
console.log('[Orchestrator] A2UI data:', JSON.stringify(data.a2ui, null, 2));
```

## 下一步

如果测试页面工作正常，但主应用不工作，问题可能在于：

1. **ChatOrchestrator** 的消息处理逻辑
2. **后端 API** 返回的数据格式
3. **ChatModule** 的 DOM 结构

请运行测试并告诉我结果，我会根据具体错误提供进一步的帮助。
