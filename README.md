# 遗传学学习平台 (Genetics Learning Platform)

基于 A2UI 框架和智谱 GLM-4.7 模型的交互式生物遗传学教学平台。

## 项目概述

本项目是一个集成了 AI 对话、动态可视化组件生成和智能测验功能的生物遗传学教学平台。采用 **A2UI (Agent to UI)** 协议，实现 AI 代理与前端界面的标准化通信，支持动态生成遗传学专用的可视化组件。

### 核心特性

- 🤖 **AI 智能对话**: 基于 GLM-4.7 模型的自然语言交互
- 🎨 **A2UI 动态可视化**: AI 自动生成遗传学专用图表（孟德尔方格、DNA 结构、家系图等）
- 🧬 **6 个自定义组件**: 遗传学专用 Lit Web Components
- 🎯 **智能意图识别**: 自动识别 10 种意图类型，选择合适的可视化方式
- 📝 **智能测验系统**: 多知识点测验，实时反馈和答案解析
- 🌐 **知识图谱**: 交互式知识结构可视化
- 💬 **会话管理**: 多对话历史记录，本地持久化存储
- 🔄 **降级策略**: A2UI 生成失败时自动使用本地降级方案
- 🎨 **简洁设计**: 专业灰度配色，移除 AI 风格装饰

## 技术栈

### 后端

- **FastAPI**: Web 框架
- **GLM-4.7**: 智谱 AI 大语言模型
- **A2UI Python SDK v0.8**: A2UI 协议实现
- **Python 3.10+**: 运行环境

### 前端

- **Vite**: 构建工具
- **Lit**: Web Components 框架
- **TypeScript**: 类型安全
- **marked**: Markdown 渲染
- **KaTeX**: 数学公式渲染

## 项目结构

```
my-a2ui-project/
├── .env                          # 环境变量配置
├── .gitignore                    # Git 忽略规则
├── README.md                     # 项目说明（本文档）
├── requirements.txt              # Python 依赖清单
│
├── backend/                      # 后端代码
│   ├── main.py                   # FastAPI 应用入口
│   ├── services/                 # 核心服务
│   │   ├── glm_service.py        # GLM API 调用服务
│   │   ├── intent_service.py     # 意图识别服务（10种意图）
│   │   ├── context_service.py    # 会话上下文管理
│   │   ├── a2ui_service.py       # A2UI 系统提示词和验证
│   │   ├── rag_service.py        # RAG 检索服务（已停用）
│   │   ├── embedding_service.py  # 文本向量化（已停用）
│   │   └── vector_store.py       # 向量存储（已停用）
│   ├── schemas/
│   │   └── genetics_catalog.json # 遗传学组件目录定义
│   ├── examples/
│   │   └── genetics_examples/    # A2UI 组件示例 JSON
│   ├── data/                     # 知识库数据（已停用）
│   └── python/
│       └── a2ui_agent/           # A2UI Python SDK
│           ├── src/a2ui/
│           │   ├── inference/schema/  # Schema 管理和验证
│           │   └── extension/         # A2UI 扩展
│           └── specification/         # A2UI 协议规范文档
│
├── frontend/                     # 前端代码
│   ├── genetics-app/             # 主应用
│   │   ├── src/
│   │   │   ├── app.ts            # 应用入口，路由集成
│   │   │   ├── router.ts         # 路由管理器
│   │   │   ├── home-page.ts      # 主页
│   │   │   ├── chat-module.ts    # AI 对话模块
│   │   │   ├── quiz-module.ts    # 测验模块
│   │   │   ├── knowledge-graph-module.ts  # 知识图谱
│   │   │   ├── chat-orchestrator.ts       # 聊天协调器
│   │   │   ├── a2ui-renderer.ts           # A2UI 渲染器
│   │   │   └── components/genetics/       # 自定义遗传学组件
│   │   │       ├── punnett-square.ts      # 孟德尔方格
│   │   │       ├── dna-structure.ts       # DNA 结构
│   │   │       ├── phenotype-distribution.ts  # 表型分布
│   │   │       ├── gene-expression.ts     # 基因表达
│   │   │       ├── pedigree-chart.ts      # 家系图
│   │   │       └── crossover-map.ts       # 交叉互换图谱
│   │   ├── index.html
│   │   ├── package.json
│   │   └── vite.config.ts
│   ├── lit/                      # A2UI Lit 渲染器（本地依赖）
│   └── web_core/                 # A2UI Web 核心（本地依赖）
│
├── docs/                         # 📁 项目文档
│   ├── guides/                   # 开发指南
│   │   ├── START_TESTING.md      # 快速测试指南
│   │   ├── TESTING_GUIDE.md      # 完整测试指南
│   │   ├── DATA_BINDING_CHANGES.md  # 数据绑定说明
│   │   ├── WEBSOCKET_DEBUG_GUIDE.md # WebSocket 调试
│   │   ├── FIX_SUMMARY.md        # 修复总结
│   │   └── CONTEXT_AWARE_INTENT_TEST.md  # 意图测试
│   ├── summaries/                # 项目总结
│   │   ├── 阶段1+2完成总结.md
│   │   └── 阶段2完成总结.md
│   ├── full.md                   # 知识库文件
│   └── [其他技术文档...]
│
├── scripts/                      # 📁 启动脚本
│   ├── start-backend.bat         # 启动后端
│   ├── start-frontend.bat        # 启动前端
│   ├── restart-backend.bat       # 重启后端
│   └── restart-frontend.bat      # 重启前端
│
├── tests/                        # 测试文件
│   └── test_rag.py               # RAG 功能测试
│
├── logs/                         # 日志目录
│   ├── backend.log               # 后端日志
│   └── frontend.log              # 前端日志
│
└── specification/                # A2UI 规范
    ├── v0_8/
    ├── v0_9/
    └── v0_10/
```

## 核心功能与工作流

### 1. AI 对话系统

**工作流程**：

```
用户输入
  → 前端发送 POST /api/chat
  → 后端意图识别（IntentService）
  → 生成文本回答（GLM-4.7）
  → 生成 A2UI 可视化（GLM-4.7 + A2UI Service）
  → 验证和修复 A2UI JSON
  → 返回完整响应 {text, a2ui, intent, keywords}
  → 前端打字机效果显示文本
  → 前端渲染 A2UI 组件
```

**关键组件**：

- `ChatModule` (frontend): 对话界面，消息管理，打字机效果
- `ChatOrchestrator` (frontend): 协调消息发送和 A2UI 渲染
- `A2UIRenderer` (frontend): 解析和渲染 A2UI JSON
- `IntentService` (backend): 识别用户意图（10 种类型）
- `GLMService` (backend): 调用 GLM API
- `A2UIService` (backend): 生成系统提示词，验证 A2UI 响应

**意图类型**（10 种）：

- **遗传学组件（6种）**: punnett_square, dna_structure, phenotype_distribution, gene_expression, pedigree_chart, cross_over_map
- **其他意图（4种）**: quiz, video, general, greeting

### 2. A2UI 可视化系统

**A2UI 协议说明**：
A2UI (Agent to UI) 是一个标准化的 AI 代理到用户界面的通信协议。AI 生成结构化的 JSON 消息，前端渲染器根据这些消息动态渲染界面。

**A2UI 消息格式**：

```json
[
  {
    "beginRendering": {
      "surfaceId": "genetics_ui",
      "root": "main_component"
    }
  },
  {
    "surfaceUpdate": {
      "surfaceId": "genetics_ui",
      "components": [
        {
          "id": "main_component",
          "component": {
            "PunnettSquare": {
              "parent1Genotype": { "literalString": "Aa" },
              "parent2Genotype": { "literalString": "aa" },
              "trait": { "literalString": "花色" }
            }
          }
        }
      ]
    }
  }
]
```

**6 个自定义遗传学组件**：

| 组件名                    | 用途           | 关键属性                                     |
| ------------------------- | -------------- | -------------------------------------------- |
| **PunnettSquare**         | 孟德尔方格图   | parent1Genotype, parent2Genotype, trait      |
| **DNAStructure**          | DNA 双螺旋结构 | sequence, showLabels, highlightRegions       |
| **PhenotypeDistribution** | 表型分布柱状图 | data (phenotype, count, percentage)          |
| **GeneExpression**        | 基因表达水平   | genes, expressionLevels, conditions          |
| **PedigreeChart**         | 家系图         | generations, diseaseName, inheritancePattern |
| **CrossOverMap**          | 交叉互换图谱   | chromosome1, chromosome2, crossOverPoints    |

**A2UI 生成流程**：

```
用户问题
  → 意图识别
  → 加载系统提示词（包含组件 Schema）
  → GLM 生成 A2UI JSON
  → Schema 验证（validate_and_fix_response）
  → 验证失败？
      ├─ 是 → 本地降级生成（generate_local_a2ui）
      └─ 否 → 返回 A2UI JSON
  → 前端渲染组件
```

**降级策略**：
当 AI 生成的 A2UI JSON 验证失败时，系统会自动使用本地预定义的简化版本，确保用户始终能看到可视化内容。

### 3. 测验系统

**工作流程**：

```
用户选择知识点
  → 前端发送 GET /api/quiz/questions?category=xxx
  → 后端返回题目列表
  → 前端展示题目
  → 用户选择答案
  → 前端显示正确/错误反馈
  → 显示答案解析
  → 统计得分和连对次数
```

**支持的知识点**：

- 孟德尔遗传（mendelian）
- DNA 结构与复制（dna）
- 基因表达（gene-expression）
- 系谱分析（pedigree）
- 基因突变（mutations）
- 群体遗传（population）

### 4. 知识图谱

**功能**：

- 交互式节点和边可视化
- 多类别过滤
- 节点拖拽和缩放
- 节点详情展示

### 5. 会话管理

**功能**：

- 多对话历史记录
- 本地 localStorage 持久化
- 自动保存对话内容
- 刷新页面不丢失历史

**工作流程**：

```
页面加载
  → 从 localStorage 加载对话历史
  → 如果有历史，选择最新对话
  → 如果没有历史，创建新对话
用户发送消息
  → 保存到当前对话
  → 自动保存到 localStorage
```

## API 端点

### 聊天

- `POST /api/chat` - AI 对话
  - 请求体：`{message, session_id?, use_ui?, history?}`
  - 响应：`{text, a2ui, intent, keywords, session_id}`

### 测验

- `GET /api/quiz/questions?category={category}` - 获取测验题目
  - 参数：category (mendelian, dna, population 等)
  - 响应：题目数组

### 健康检查

- `GET /` - API 状态
- `GET /health` - 服务健康状态

## 环境变量配置

`.env` 文件：

```env
GLM_API_KEY=your_api_key_here
GLM_MODEL=glm-4.7
KNOWLEDGE_BASE_PATH=C:\trae_coding\A2UI-main\my-a2ui-project\docs\full.md
EMBEDDING_MODEL_NAME=paraphrase-multilingual-MiniLM-L12-v2
HF_CACHE_DIR=C:\trae_coding\A2UI-main\my-a2ui-project\.cache\huggingface
```

**注意**：

- `GLM_API_KEY`: 请替换为你的智谱 AI API Key
- `KNOWLEDGE_BASE_PATH`: 知识库文件路径（已更新为项目内路径）
- `HF_CACHE_DIR`: Hugging Face 模型缓存目录

## 快速开始

### 前置要求

- Python 3.10+
- Node.js 18+
- npm 或 yarn

### 安装依赖

#### 后端

```powershell
cd C:\trae_coding\A2UI-main\my-a2ui-project
.venv\Scripts\Activate.ps1
# 依赖已安装
```

#### 前端

```bash
cd C:\trae_coding\A2UI-main\my-a2ui-project\frontend\genetics-app
npm install
```

### 启动服务

#### 方法 1: 使用启动脚本（推荐）

**Windows 用户**:

```bash
# 启动后端（终端 1）
scripts\start-backend.bat

# 启动前端（终端 2）
scripts\start-frontend.bat
```

**重启服务**:
```bash
# 重启后端
scripts\restart-backend.bat

# 重启前端
scripts\restart-frontend.bat
```

#### 方法 2: 手动启动

**启动后端**:

```powershell
cd C:\trae_coding\A2UI-main\my-a2ui-project
.venv\Scripts\Activate.ps1
py -m uvicorn backend.main:app --reload --port 8000
```

后端运行在 `http://localhost:8000`

**启动前端**:

```bash
cd C:\trae_coding\A2UI-main\my-a2ui-project\frontend\genetics-app
npm run dev
```

前端运行在 `http://localhost:5173`

#### 构建前端

```bash
npm run build
```

构建产物输出到 `dist/` 目录

## 设计风格

### 当前设计（简洁专业）

- **配色**: 灰度系统（#111827, #6b7280, #e5e7eb, #fafafa）
- **字体**: Inter（已在 index.html 中加载）
- **风格**: 简洁、专业、无装饰
- **布局**: 卡片式，清晰的层次结构
- **动画**: 最小化，仅保留必要的过渡效果

## 已知问题与限制

### 其他限制

- 前端构建产物较大（~715KB），建议使用代码分割优化
- A2UI 组件渲染依赖 AI 生成质量，可能偶尔出现格式错误（已有降级策略）

## 开发进度

### 已完成

- ✅ 项目初始化和配置
- ✅ 后端核心服务（GLM、Intent、Context、A2UI）
- ✅ A2UI Schema 集成和 6 个自定义组件
- ✅ API 端点实现
- ✅ 前端 6 个自定义组件
- ✅ 路由系统和应用模块
- ✅ 会话管理和历史记录
- ✅ 测验系统
- ✅ 知识图谱
- ✅ 设计风格简化
- ✅ CSS @import 错误修复
- ✅ 刷新页面重复创建对话问题修复
- ✅ Quiz API 端点添加

### 待优化

- 📊 前端性能优化（代码分割、懒加载）
- 🧪 添加单元测试和端到端测试
- 🎨 UI 细节改进和响应式设计优化
- 📝 添加更多遗传学知识点和测验题目

- ⚡ **优化意图识别流程**（参考谷歌官方做法）：
  - 合并意图识别和响应生成为单次 LLM 调用（减少 API 调用次数）
  - 使用 JSON 模式强制结构化输出（`response_format="json"`）
  - 添加对话上下文感知（识别"是的"、"好的"等确认词）
  - 实现关键词正则匹配作为回退机制
  - 预期效果：更快响应、更低成本、更可靠的输出格式

## 参考资料

- A2UI 协议规范: `backend/python/a2ui_agent/specification/v0_8/`
- A2UI Python SDK: `backend/python/a2ui_agent/src/a2ui/`
- GLM API 文档: 智谱 AI 官方文档

## 许可证

本项目仅供学习和研究使用。

## 更新日志

### 2026-03-16

- ✅ 项目文件整理完成
- ✅ 创建 docs/guides/ 和 docs/summaries/ 目录
- ✅ 创建 scripts/ 目录，集中管理启动脚本
- ✅ 移动 6 个指南文档到 docs/guides/
- ✅ 移动 2 个总结文档到 docs/summaries/
- ✅ 移动 4 个启动脚本到 scripts/
- ✅ 移动测试文件到 tests/
- ✅ 清理 logs/ 目录，删除 7 个空日志文件
- ✅ 根目录文件从 24 个减少到 13 个（减少 46%）
- ✅ 添加 .gitignore 文件
- ✅ Git 仓库优化（从 21MB 压缩到 9.8MB）
- ✅ 更新 .env 文件，知识库路径改为项目内路径
- ✅ 更新 README 文档，反映最新项目结构

### 2026-03-09

- ✅ 优化 README 文档
- ✅ 修正环境变量配置示例（使用相对路径）
- ✅ 更新 Python 版本要求（3.10+ 而非 3.13+）
- ✅ 移除具体版本号，保持文档简洁
- ✅ 修复 GLM API 连接问题（禁用 HTTP/2，优化超时配置）
- ✅ 确认 RAG 服务和 embedding 模型已正常工作
- ✅ 添加友好的错误提示信息

### 2026-03-08

- ✅ 修复 CSS @import 错误（移除所有模块中的 @import 语句）
- ✅ 修复刷新页面重复创建对话问题
- ✅ 添加 Quiz API 端点（/api/quiz/questions）
- ✅ 更新 embedding_service.py 缓存路径配置
- ✅ 更新 README 文档，完善项目结构和工作流说明
