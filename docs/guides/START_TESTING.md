# 🚀 快速启动测试

## 启动步骤

### 1. 启动后端（终端 1）
```bash
cd c:\trae_coding\A2UI-main\my-a2ui-project\backend
python main.py
```

**预期输出：**
```
INFO:     Started server process
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### 2. 启动前端（终端 2）
```bash
cd c:\trae_coding\A2UI-main\my-a2ui-project\frontend\genetics-app
npm run dev
```

**预期输出：**
```
VITE ready in xxx ms
➜  Local:   http://localhost:5173/
```

### 3. 开始测试

访问：http://localhost:5173

输入测试问题：
```
请帮我分析 Aa 和 aa 杂交的后代
```

---

## ✅ 3 个关键测试

### 测试 1：基础渲染
- ✅ 能看到 Punnett Square 方格图
- ✅ 显示 Aa × aa 的杂交结果

### 测试 2：数据绑定验证
打开浏览器控制台 (F12)：
```javascript
// 检查是否使用数据绑定
const surface = document.querySelector('a2ui-surface');
console.log(surface.surface.components[0].component);
// 应该看到 {"path": "/parent1"} 而不是 {"literalString": "Aa"}
```

### 测试 3：实时更新
1. 修改输入框：将 "Aa" 改为 "AA"
2. 点击"重新计算"按钮
3. 观察方格图是否立即更新（无闪烁）

---

## 🎯 成功标准

如果以上 3 个测试都通过，说明：
- ✅ 数据绑定功能正常
- ✅ 实时更新机制工作
- ✅ 前后端完美对接

恭喜！系统已完全就绪！🎉

---

## 📝 详细测试指南

查看完整测试文档：[TESTING_GUIDE.md](./TESTING_GUIDE.md)
