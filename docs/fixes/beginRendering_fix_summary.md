# beginRendering vs createSurface 修复总结

## 修复日期
2026-03-17

## 问题描述
项目使用 A2UI v0.8，但多处文档和注释中错误地提到了 v0.9 的 `createSurface` 消息格式，导致：
1. 系统提示中的误导性注释可能让 GLM 生成错误格式
2. 文档示例与实际代码不一致
3. 开发者可能被误导使用错误的消息格式

## A2UI 版本差异

### v0.8 格式（本项目使用）
```json
{
  "beginRendering": {
    "surfaceId": "genetics_ui",
    "root": "main_component"
  }
}
```

### v0.9 格式（不应使用）
```json
{
  "createSurface": {
    "surfaceId": "genetics_ui",
    "sendDataModel": true
  }
}
```

## 修复内容

### 1. 后端代码
**文件：** `backend/services/a2ui_service.py`
- ✅ 第 80 行：注释从 `createSurface` 改为 `beginRendering`
- ✅ 第 117 行：响应格式示例已正确使用 `beginRendering`

**文件：** `backend/main.py`
- ✅ 第 1118-1139 行：已有自动转换逻辑，将 GLM 生成的 `createSurface` 转换为 `beginRendering`
- ✅ 第 1175-1330 行：降级策略 `generate_local_a2ui_with_binding` 已正确使用 `beginRendering`

### 2. 文档修复
**文件：** `docs/guides/DATA_BINDING_CHANGES.md`
- ✅ 第 9 行：问题描述更新
- ✅ 第 56 行：响应格式示例更新
- ✅ 第 67-94 行：所有组件示例更新
- ✅ 第 103-109 行：函数说明更新
- ✅ 第 137 行：检查清单更新
- ✅ 第 170 行：预期结果更新
- ✅ 第 220 行：数据绑定流程更新

**文件：** `docs/guides/WEBSOCKET_DEBUG_GUIDE.md`
- ✅ 第 67-71 行：WebSocket 消息示例更新

**文件：** `docs/guides/TESTING_GUIDE.md`
- ✅ 第 93-94 行：日志示例更新

**文件：** `docs/summaries/阶段2完成总结.md`
- ✅ 第 45 行：消息序列更新

**文件：** `docs/summaries/阶段1+2完成总结.md`
- ✅ 第 146-177 行：任务 6 完整重写
- ✅ 第 226 行：完整流程图更新

### 3. 示例文件
**目录：** `backend/examples/genetics_examples/`
- ✅ 所有 7 个示例 JSON 文件已正确使用 `beginRendering`
- ✅ 无需修改

## 兼容性保障

后端已实现自动转换机制（`main.py` 第 1118-1139 行）：
- 如果 GLM 生成 `createSurface` 消息，会自动转换为 `beginRendering`
- 自动提取根组件 ID 并设置 `root` 字段
- 确保前端始终收到正确的 v0.8 格式

## 验证清单

- [x] 后端系统提示使用正确术语
- [x] 后端降级策略使用正确格式
- [x] 后端有自动转换机制
- [x] 所有文档使用正确格式
- [x] 所有示例文件使用正确格式
- [x] 前端渲染器支持 v0.8 格式

## 测试建议

1. 在前端发送 "帮我展示 Aa 和 Aa 的杂交"
2. 检查浏览器控制台，确认：
   - 收到 `beginRendering` 消息（不是 `createSurface`）
   - `rootComponentId` 不为 null
   - 组件成功渲染
3. 检查后端日志，确认：
   - 如果 GLM 生成了 `createSurface`，会看到 "检测到 createSurface，转换为 beginRendering"
   - 最终发送的是 `beginRendering` 消息

## 相关文件清单

### 已修改
- `backend/services/a2ui_service.py`
- `docs/guides/DATA_BINDING_CHANGES.md`
- `docs/guides/WEBSOCKET_DEBUG_GUIDE.md`
- `docs/guides/TESTING_GUIDE.md`
- `docs/summaries/阶段2完成总结.md`
- `docs/summaries/阶段1+2完成总结.md`

### 已验证（无需修改）
- `backend/main.py` - 已有正确实现和转换逻辑
- `backend/examples/genetics_examples/*.json` - 已使用正确格式
- `frontend/genetics-app/src/a2ui-renderer.ts` - 支持 v0.8 格式

## 注意事项

1. **不要在新代码中使用 `createSurface`** - 这是 v0.9 格式
2. **始终使用 `beginRendering` 并指定 `root` 字段** - 这是 v0.8 格式
3. **后端会自动转换** - 即使 GLM 生成错误格式，也会被修正
4. **文档已统一** - 所有文档现在都使用正确的术语和示例
