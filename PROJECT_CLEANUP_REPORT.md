# 中心法则组件开发任务

**项目技术栈**: Lit (Web Components) + TypeScript + A2UI 协议  
**组件路径**: `frontend/genetics-app/src/components/genetics/central-dogma.ts`  
**后端集成**: 需要在 `backend/schemas/genetics_catalog.json` 中添加组件定义

---

## 任务 1：创建组件骨架

```
创建新文件 frontend/genetics-app/src/components/genetics/central-dogma.ts

实现基础结构：
1. 导入 Lit 基类和装饰器
2. 定义 CentralDogma 继承自 Root
3. 使用 @state() 定义状态变量
4. 实现 render() 方法返回基础模板
5. 定义组件样式

状态变量：
- phase: 'idle' | 'replication' | 'transcription' | 'translation' | 'completed'
- dnaSequence: string = 'ATCGATCG' (默认序列)
- animationSpeed: number = 1000 (毫秒)
- isPaused: boolean = false

直接创建文件，不要预览，不要解释。
```

---

## 任务 2：实现 DNA 复制动画 - 解旋

```
修改 frontend/genetics-app/src/components/genetics/central-dogma.ts

在 replication 阶段实现 DNA 解旋：
1. 显示初始 DNA 双螺旋（两条链）
2. 点击"开始复制"后，双链从中间分开（CSS transform: rotate）
3. 左链和右链向两边移动
4. 使用 Lit 的动画或 CSS 过渡
5. 使用 setTimeout 或 requestAnimationFrame 控制动画时序

直接修改，不要预览，不要解释。
```

---

## 任务 3：实现 DNA 复制动画 - 新链合成

```
修改 frontend/genetics-app/src/components/genetics/central-dogma.ts

在 replication 阶段实现新链合成：
1. 每条模板链旁边合成互补的新链
2. 新链逐碱基出现（map + 延迟动画）
3. 配对规则：A-T, T-A, C-G, G-C
4. 完成后显示两条完整的子代 DNA
5. 自动跳转到 transcription 阶段
6. 触发 A2UI action 事件（如果 interactive=true）

直接修改，不要预览，不要解释。
```

---

## 任务 4：实现 DNA 转录动画

```
修改 frontend/genetics-app/src/components/genetics/central-dogma.ts

在 transcription 阶段实现：
1. 显示一条 DNA 链作为模板
2. RNA 聚合酶（蓝色块）沿模板从左到右移动
3. mRNA 链逐碱基合成（T→U）
4. 配对规则：A-U, T-A, C-G, G-C
5. 完成后显示完整 mRNA 链
6. 自动跳转到 translation 阶段
7. 触发 A2UI action 事件（如果 interactive=true）

直接修改，不要预览，不要解释。
```

---

## 任务 5：实现 mRNA 翻译动画

```
修改 frontend/genetics-app/src/components/genetics/central-dogma.ts

在 translation 阶段实现：
1. 显示 mRNA 链
2. 核糖体（橙色块）沿 mRNA 移动，每次移动 3 个碱基
3. 每 3 个碱基组成密码子，显示对应氨基酸
4. 氨基酸显示格式：中文名（三字母缩写）如：甲硫氨酸 Met
5. 蛋白质链逐个氨基酸连接
6. 完成后显示完整蛋白质链
7. 跳转到 completed 阶段
8. 触发 A2UI action 事件（如果 interactive=true）

直接修改，不要预览，不要解释。
```

---

## 任务 6：添加序列输入功能

```
修改 frontend/genetics-app/src/components/genetics/central-dogma.ts

添加序列输入功能：
1. 在组件顶部添加文本框，允许用户输入 DNA 序列
2. 添加"使用自定义序列"按钮
3. 验证输入：只包含 A/T/C/G 字符（不区分大小写）
4. 使用输入序列初始化 DNA 双链（自动生成互补链）
5. 添加错误提示（输入无效时）

直接修改，不要预览，不要解释。
```

---

## 任务 7：添加动画控制

```
修改 frontend/genetics-app/src/components/genetics/central-dogma.ts

添加动画控制功能：
1. 添加"暂停/继续"按钮
2. 添加"下一步"按钮（手动模式）
3. 添加速度滑块（控制动画速度）
4. 使用 @state() 装饰器管理 isPaused、animationSpeed 状态
5. 暂停时停止当前动画
6. 速度变化时更新动画间隔

直接修改，不要预览，不要解释。
```

---

## 任务 8：添加阶段跳转功能

```
修改 frontend/genetics-app/src/components/genetics/central-dogma.ts

允许直接跳转到任意阶段：
1. 添加阶段选择器（单选按钮组）
2. 选择后直接跳转到对应阶段
3. 跳转时重置当前阶段状态
4. 更新 phase 状态变量
5. 触发相应的渲染

直接修改，不要预览，不要解释。
```

---

## 任务 9：优化样式和交互

```
修改 frontend/genetics-app/src/components/genetics/central-dogma.ts

优化视觉效果：
1. DNA 碱基颜色：A（红色）、T（蓝色）、C（绿色）、G（黄色）
2. RNA 中 U 显示为紫色
3. 氨基酸使用统一颜色（灰色）
4. 添加平滑的过渡动画（CSS transition）
5. 响应式布局（适配移动端）
6. 使用项目灰度配色（#111827, #6b7280, #e5e7eb）
7. 添加悬停效果和点击反馈
8. 确保可访问性（aria-labels）

直接修改，不要预览，不要解释。
```

---

## 任务 10：添加后端支持

```
修改 backend/schemas/genetics_catalog.json

在组件目录中添加 CentralDogma 组件定义：

{
  "componentName": "CentralDogma",
  "version": "0.8.0",
  "description": "中心法则可视化组件，展示 DNA 复制、转录和翻译过程",
  "properties": {
    "dnaSequence": {
      "type": "string",
      "description": "DNA 序列",
      "default": "ATCGATCG"
    },
    "animationSpeed": {
      "type": "number",
      "description": "动画速度（毫秒）",
      "default": 1000
    },
    "phase": {
      "type": "string",
      "description": "当前阶段",
      "enum": ["idle", "replication", "transcription", "translation", "completed"]
    }
  },
  "actions": [
    {
      "name": "start_replication",
      "description": "开始 DNA 复制"
    },
    {
      "name": "start_transcription",
      "description": "开始转录"
    },
    {
      "name": "start_translation",
      "description": "开始翻译"
    },
    {
      "name": "update_sequence",
      "description": "更新 DNA 序列"
    }
  ]
}

直接修改，不要预览，不要解释。
```

---

## 任务 11：注册组件

```
修改 frontend/genetics-app/src/a2ui-renderer.ts

在 A2UI 渲染器中注册 CentralDogma 组件：

1. 导入组件：import { CentralDogma } from './components/genetics/central-dogma';
2. 在 customComponents Map 中添加：'CentralDogma': CentralDogma
3. 确保组件标签名正确：@customElement('genetics-central-dogma', CentralDogma)

直接修改，不要预览，不要解释。
```

---

## 任务 12：添加 AI 意图识别

```
修改 backend/services/intent_service.py

添加中心法则意图识别：

在 INTENT_MAPPING 中添加：
"central_dogma": {
  "keywords": ["中心法则", "复制", "转录", "翻译", "DNA复制", "mRNA翻译", "蛋白质合成"],
  "component": "CentralDogma"
}

更新意图识别逻辑以匹配新的关键词。

直接修改，不要预览，不要解释。
```

---

## 任务 13：创建降级示例

```
创建文件 backend/examples/genetics_examples/central_dogma_example.json

创建中心法则组件的降级示例，当 AI 生成失败时使用：

{
  "beginRendering": {
    "surfaceId": "genetics_ui",
    "root": "main_component"
  },
  "surfaceUpdate": {
    "surfaceId": "genetics_ui",
    "components": [
      {
        "id": "main_component",
        "component": {
          "CentralDogma": {
            "dnaSequence": { "literalString": "ATCGATCG" },
            "animationSpeed": { "literalNumber": 1000 },
            "phase": { "literalString": "idle" }
          }
        }
      }
    ]
  }
}

直接创建文件，不要预览，不要解释。
```

---

## 任务 14：测试和调试

```
测试中心法则组件：

1. 在浏览器中测试完整流程：
   - 输入自定义 DNA 序列
   - 依次执行：复制 → 转录 → 翻译
   - 测试动画控制（暂停、继续、速度）
   - 测试阶段跳转

2. 测试 A2UI 集成：
   - 通过 API 调用生成组件
   - 验证 A2UI JSON 正确解析
   - 测试 action 事件传递

3. 测试边界情况：
   - 空序列
   - 非法字符输入
   - 超长序列
   - 快速点击多个按钮

4. 修复发现的问题

5. 更新前端测试指南 FRONTEND_TEST_GUIDE.md

直接测试，不要预览，不要解释。
```

---

## 任务 15：文档更新

```
更新项目文档：

1. 更新 README.md：
   - 在"8 个自定义组件"中添加 CentralDogma
   - 更新组件表格

2. 更新 TEST_REPORT.md：
   - 添加中心法则组件测试结果

3. 创建 CENTRAL_DOGMA_GUIDE.md（可选）：
   - 中心法则教学指南
   - 组件使用说明
   - 教学场景示例

直接修改，不要预览，不要解释。
```

---

**按顺序逐个执行这些任务即可。**
