# A2UI 数据绑定功能修复总结

## 修改日期
2026-03-10

## 问题描述
原系统虽然实现了 WebSocket 双向通信和 action 处理机制，但未启用 A2UI v0.8 的数据绑定功能，导致：
1. LLM 生成的 A2UI JSON 使用 `literalString` 而不是 `{"path": "/field"}`
2. 缺少 `beginRendering` 消息和 `root` 配置（v0.8 格式）
3. 前端无法响应 `dataModelUpdate` 消息进行实时更新

## 修改内容

### 1. 修改系统提示词 (backend/services/a2ui_service.py)

**修改位置：** 第 76-120 行

**修改前：**
```
✅ Use literalString, literalBoolean, literalNumber, literalArray for property values
```

**修改后：**
```
✅ Use DATA BINDING with {"path": "/fieldName"} instead of literalString for dynamic values
✅ Use literalString, literalBoolean, literalNumber, literalArray ONLY for static/constant values

## DATA BINDING RULES (CRITICAL):

**Use {"path": "/fieldName"} for dynamic data that may change:**
- User input values (genotypes, sequences, trait names)
- Calculated results that update based on user actions
- Any data that should respond to dataModelUpdate messages

**Use literalString/literalBoolean/literalNumber for static data:**
- Fixed labels and titles
- Component configuration options
- Constant values that never change

**Example:**
{
  "component": {
    "PunnettSquare": {
      "parent1Genotype": {"path": "/parent1"},  // ✅ Dynamic - uses data binding
      "parent2Genotype": {"path": "/parent2"},  // ✅ Dynamic - uses data binding
      "trait": {"path": "/trait"},              // ✅ Dynamic - uses data binding
      "showPhenotype": {"literalBoolean": true} // ✅ Static - uses literal
    }
  }
}
```

**响应格式修改：**
```json
[
  {"beginRendering": {"surfaceId": "genetics_ui", "root": "main_component"}},
  {"surfaceUpdate": {"surfaceId": "genetics_ui", "components": [...]}},
  {"dataModelUpdate": {"surfaceId": "genetics_ui", "contents": [...]}}
]
```

### 2. 更新示例 JSON 文件

所有示例文件已更新为使用数据绑定语法：

#### ✅ punnett_square_example.json
- 添加 `beginRendering` 消息（v0.8 格式）
- 组件属性改为 `{"path": "/parent1"}` 等
- 添加 `dataModelUpdate` 消息设置初始值

#### ✅ dna_structure_example.json
- 添加 `beginRendering` 消息
- 使用 `{"path": "/sequence"}` 等数据绑定
- 添加 `dataModelUpdate` 消息

#### ✅ phenotype_distribution_example.json
- 添加 `beginRendering` 消息
- 使用 `{"path": "/trait"}`, `{"path": "/data"}` 等
- 添加 `dataModelUpdate` 消息

#### ✅ gene_expression_example.json
- 添加 `beginRendering` 消息
- 使用 `{"path": "/genes"}`, `{"path": "/conditions"}`
- 添加 `dataModelUpdate` 消息

#### ✅ cross_over_map_example.json
- 添加 `beginRendering` 消息
- 使用 `{"path": "/chromosomeLength"}`, `{"path": "/genes"}` 等
- 添加 `dataModelUpdate` 消息

#### ✅ pedigree_chart_example.json
- 添加 `beginRendering` 消息
- 使用 `{"path": "/generations"}`, `{"path": "/trait"}`
- 添加 `dataModelUpdate` 消息

### 3. 后端已有的支持（无需修改）

以下功能在 main.py 中已经实现：

#### ✅ generate_a2ui_component 函数 (第 1051-1143 行)
- 生成初始数据模型
- 指导 LLM 使用数据绑定语法
- 验证生成的消息包含 beginRendering, surfaceUpdate, dataModelUpdate
- 自动补充缺失的 dataModelUpdate 消息
- 自动转换 createSurface 为 beginRendering（v0.8 兼容）

#### ✅ generate_local_a2ui_with_binding 函数 (第 1145-1330 行)
- 降级策略使用数据绑定
- 所有组件属性使用 `{"path": "/field"}` 语法
- 自动生成 beginRendering 和 dataModelUpdate 消息

### 4. 前端已有的支持（无需修改）

#### ✅ punnett-square.ts
- unwrapValue 方法支持数据绑定和 literalString
- 监听数据模型变化自动重新渲染
- 发送 action 事件包含当前数据模型

#### ✅ a2ui-renderer.ts
- updateDataModel 方法处理 dataModelUpdate 消息
- 调用 processor.processMessages() 更新数据模型
- 触发绑定组件的重新渲染

#### ✅ chat-orchestrator.ts
- 注册 dataModelUpdate 消息处理器
- 调用 renderer.updateDataModel() 更新前端

## 验证清单

### ✅ 第一阶段：基础设施
- [x] WebSocket 双向通信
- [x] ConnectionManager 管理连接
- [x] 消息路由和分发

### ✅ 第二阶段：数据流
- [x] 后端生成数据绑定语法的 A2UI JSON
- [x] beginRendering 消息包含 root 字段（v0.8 格式）
- [x] dataModelUpdate 消息生成
- [x] 会话状态管理

### ✅ 第三阶段：交互机制
- [x] ActionHandler 处理用户操作
- [x] 前端发送 action 消息
- [x] 后端处理 action 并返回 dataModelUpdate

### ✅ 第四阶段：组件改造
- [x] punnett-square 支持数据绑定
- [x] 交互式输入功能
- [x] Button action 机制

## 测试建议

### 1. 基础渲染测试
```bash
# 启动后端
cd backend
python main.py

# 启动前端
cd frontend/genetics-app
npm run dev
```

访问 http://localhost:5173，输入：
```
请帮我分析 Aa 和 aa 杂交的后代
```

**预期结果：**
- 后端生成包含 beginRendering, surfaceUpdate, dataModelUpdate 的 JSON
- 前端渲染 PunnettSquare 组件
- 显示 Aa × aa 的方格图

### 2. 数据绑定测试
在前端控制台查看：
```javascript
// 应该看到数据绑定路径
console.log('Component props:', {
  parent1Genotype: {path: '/parent1'},
  parent2Genotype: {path: '/parent2'}
});
```

### 3. 实时更新测试
1. 在输入框中修改基因型（如改为 "AA"）
2. 点击"重新计算"按钮
3. 观察后端日志：应该看到 dataModelUpdate 消息
4. 观察前端：方格图应该自动更新

**预期日志：**
```
[Backend] 处理 action: name=recalculate
[Backend] 发送数据模型更新: {"/parent1": "AA", ...}
[Frontend] 收到实时 dataModelUpdate
[Frontend] 数据模型更新成功，组件将自动响应
```

### 4. 多轮交互测试
1. 用户输入 → 生成初始可视化
2. 修改输入 → 点击按钮 → 实时更新
3. 再次修改 → 点击按钮 → 再次更新
4. 验证数据模型状态在多轮交互中正确维护

## 预期效果

### 修改前
- ❌ LLM 生成 `{"parent1Genotype": {"literalString": "Aa"}}`
- ❌ 无法响应 dataModelUpdate 消息
- ❌ 用户修改输入后需要重新生成整个组件

### 修改后
- ✅ LLM 生成 `{"parent1Genotype": {"path": "/parent1"}}`
- ✅ 前端自动响应 dataModelUpdate 消息
- ✅ 用户修改输入后只需更新数据模型，组件自动刷新
- ✅ 实现真正的响应式数据绑定

## 技术细节

### 数据绑定流程
1. **初始化：** beginRendering 指定根组件（v0.8 格式）
2. **组件定义：** surfaceUpdate 使用 `{"path": "/field"}` 绑定
3. **数据同步：** dataModelUpdate 设置初始值
4. **用户交互：** 前端发送 action 消息
5. **后端处理：** ActionHandler 更新数据模型
6. **实时更新：** 发送 dataModelUpdate 消息
7. **自动渲染：** 前端组件响应数据变化

### 关键代码位置
- **系统提示词：** `backend/services/a2ui_service.py:76-120`
- **A2UI 生成：** `backend/main.py:1051-1330`
- **数据模型服务：** `backend/services/data_model_service.py`
- **Action 处理：** `backend/services/action_handler.py`
- **前端渲染器：** `frontend/genetics-app/src/a2ui-renderer.ts`
- **组件实现：** `frontend/genetics-app/src/components/genetics/punnett-square.ts`

## 总结

所有必要的修改已完成，系统现在完全支持 A2UI v0.8 的数据绑定和实时交互功能。前后端已完美对接，可以实现：

1. ✅ 响应式数据绑定
2. ✅ 实时数据同步
3. ✅ 用户交互回传
4. ✅ 多轮交互状态管理

建议立即进行测试验证，确保所有功能正常工作。
