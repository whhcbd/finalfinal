# 生物遗传学学科可视化平台

基于 A2UI 框架和智谱 GLM-4.5-Air 模型的生物遗传学智能教学平台。

## 项目概述

本项目是一个集成了 AI 对话、A2UI 可视化组件生成和智能测验功能的生物遗传学教学平台。项目采用 **A2UI (Agent to UI)** 协议，实现了 AI 代理与前端界面的标准化通信，支持动态生成遗传学专用的可视化组件。

### 核心特性

- 🤖 **AI 智能对话**: 基于 GLM-4.5-Air 模型的自然语言交互
- 🎨 **A2UI 可视化**: 自动生成遗传学专用图表（孟德尔方格、DNA 结构、家系图等）
- 🧬 **自定义组件**: 6 个遗传学专用 Lit Web Components
- 🎯 **意图识别**: 智能识别 10 种意图类型，自动选择合适的可视化组件
- 📝 **智能测验**: AI 生成测验题目和答案解析
- 🌐 **知识图谱**: 交互式知识结构可视化
- 💬 **非流式响应**: 一次性返回完整响应，前端打字机效果
- 🏠 **单页应用**: 基于 Lit Web Components 和 Router 的 SPA 架构
- 🔄 **降级策略**: A2UI 生成失败时自动使用本地降级方案

### 重要说明

✅ **Bugfix完成状态**: 已完成所有5个bugfix任务，A2UI组件选择问题已修复。

支持以下 10 种意图类型：

**遗传学组件意图（6种）**:

- **punnett_square**: 孟德尔方格图相关请求
- **dna_structure**: DNA结构相关请求
- **phenotype_distribution**: 表型分布相关请求
- **gene_expression**: 基因表达相关请求
- **pedigree_chart**: 家系图相关请求
- **cross_over_map**: 交叉互换图谱相关请求

**其他意图（4种）**:

- **quiz**: 测验、考试、测试相关请求
- **video**: 视频、观看视频相关请求
- **general**: 一般性问题、解释、对话
- **greeting**: 问候语

降级策略支持所有6个遗传学组件以及quiz、video、general三种通用意图。

### 核心架构

```
用户请求 → FastAPI 端点 → 意图识别 → LLM 生成文本 → A2UI 生成 → A2UI 验证 → 完整 JSON 响应
                ↓                ↓                                    ↓
          会话管理        关键词提取                          前端打字机效果
          消息存储        组件选择                            A2UI 组件渲染
                                                              降级策略
```

### A2UI 协议说明

**A2UI (Agent to UI)** 是一个标准化的 AI 代理到用户界面的通信协议，允许 AI 代理动态生成结构化的 UI 定义，前端渲染器根据这些定义实时渲染界面。

**核心概念**:
- **Server to Client**: AI 代理发送 A2UI 消息（JSON 格式）到客户端
- **Client to Server**: 用户交互事件从客户端发送回 AI 代理
- **Catalog**: 定义可用的 UI 组件及其属性（本项目使用 `genetics_catalog.json`）
- **Surface**: 一个独立的 UI 渲染区域
- **Data Model**: 组件数据的响应式绑定

**本项目使用 A2UI v0.8 规范**，包含：
- 标准 A2UI 组件（Button, Text, Container 等）
- 6 个自定义遗传学组件（PunnettSquare, DNAStructure 等）
- Schema 验证和响应修复机制

## 技术栈

### 后端

- **FastAPI**: Web 框架
- **GLM-4.5-Air**: 智谱 AI 大语言模型
- **httpx**: 异步 HTTP 客户端
- **A2UI Python SDK**: A2UI 协议实现（v0.8）
  - Schema Manager: 管理组件目录和验证
  - Catalog: 自定义组件定义（genetics_catalog.json）
  - Validator: JSON Schema 验证
- **IntentService**: 意图识别和关键词提取服务（10 种意图类型）
- **ContextService**: 学习者上下文管理服务（5 分钟缓存）

### 前端

- **Vite**: 构建工具 (v7.3.1)
- **Lit**: Web Components 框架 (v3.3.1)
- **TypeScript**: 类型安全 (v5.9.3)
- **marked**: Markdown 渲染 (v17.0.3)
- **KaTeX**: 数学公式渲染 (v0.16.33)
- **@lit-labs/signals**: 响应式状态管理 (v0.2.0)
- **@a2ui/lit**: A2UI Lit 渲染器（本地依赖）
- **@a2ui/web_core**: A2UI Web 核心（本地依赖）
- **vite-plugin-checker**: 类型检查插件 (v0.12.0)

## 项目结构

```
my-a2ui-project/
├── .env                      # 环境变量配置
├── .venv/                    # Python 虚拟环境
├── backend/
│   ├── python/
│   │   └── a2ui_agent/      # A2UI Python SDK (v0.8)
│   │       ├── src/a2ui/
│   │       │   ├── extension/        # A2UI 扩展
│   │       │   │   ├── a2ui_extension.py
│   │       │   │   ├── a2ui_schema_utils.py
│   │       │   │   └── send_a2ui_to_client_toolset.py
│   │       │   └── inference/        # 推理和验证
│   │       │       ├── schema/       # Schema 管理
│   │       │       │   ├── manager.py      # A2uiSchemaManager
│   │       │       │   ├── catalog.py      # Catalog 定义
│   │       │       │   ├── validator.py    # JSON Schema 验证
│   │       │       │   └── common_modifiers.py
│   │       │       └── template/     # 模板管理
│   │       ├── specification/        # A2UI 规范文档
│   │       │   ├── v0_8/            # v0.8 规范
│   │       │   ├── v0_9/            # v0.9 规范
│   │       │   └── v0_10/           # v0.10 规范
│   │       └── tests/               # 单元测试
│   ├── schemas/              # A2UI 组件 Schema 定义
│   │   └── genetics_catalog.json    # 遗传学自定义组件目录
│   ├── services/             # 核心服务
│   │   ├── glm_service.py           # GLM API 调用
│   │   ├── intent_service.py        # 意图识别（10种意图）
│   │   ├── context_service.py       # 上下文管理
│   │   ├── a2ui_service.py          # A2UI 服务（系统提示词、验证）
│   │   ├── embedding_service.py     # 文本向量化（已停用）
│   │   ├── vector_store.py          # 向量存储（已停用）
│   │   └── rag_service.py           # RAG 检索（已停用）
│   ├── examples/
│   │   └── genetics_examples/       # A2UI 示例文件
│   ├── data/                        # 数据文件（已停用）
│   ├── test_*.py                    # 服务测试文件
│   └── main.py                      # FastAPI 应用入口
├── frontend/
│   ├── genetics-app/        # Vite + Lit 应用
│   │   ├── src/
│   │   │   ├── components/genetics/    # 自定义遗传学组件
│   │   │   │   ├── punnett-square.ts
│   │   │   │   ├── dna-structure.ts
│   │   │   │   ├── phenotype-distribution.ts
│   │   │   │   ├── gene-expression.ts
│   │   │   │   ├── pedigree-chart.ts
│   │   │   │   └── crossover-map.ts
│   │   │   ├── index.ts             # 组件注册
│   │   │   ├── app.ts               # 应用入口组件
│   │   │   ├── home-page.ts         # 主页组件
│   │   │   ├── chat-module.ts       # AI 对话模块
│   │   │   ├── quiz-module.ts       # 测验模块
│   │   │   ├── knowledge-graph-module.ts # 知识图谱模块
│   │   │   ├── router.ts            # 路由器
│   │   │   └── a2ui-manager.ts      # A2UI 管理器
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   ├── lit/                # A2UI Lit 渲染器（本地）
│   │   └── src/0.8/
│   │       ├── core.ts
│   │       ├── events/
│   │       └── ui/                  # 标准 A2UI 组件
│   └── web_core/           # A2UI Web 核心（本地）
│       └── src/v0_8/
└── README.md
```

## 环境变量

项目使用 `.env` 文件配置环境变量：

```env
GLM_API_KEY=b315454c761c4b488d86c3676cf6082c.IFu4xI2nFEvbUSwd
GLM_MODEL=glm-4.5-air
KNOWLEDGE_BASE_PATH=C:\trae_coding\full.md
```

## 快速开始

### 前置要求

- Python 3.13+
- Node.js 18+
- npm 或 yarn

### 安装依赖

#### 后端依赖

```powershell
# 激活虚拟环境
c:\trae_coding\A2UI-main\my-a2ui-project\.venv\Scripts\Activate.ps1

# 依赖已安装（阶段 0 和阶段 1 已完成）
# 如需重新安装，参考 todolist.md 的操作步骤
```

#### 前端依赖

```bash
cd c:\trae_coding\A2UI-main\my-a2ui-project\frontend\genetics-app

# 基础依赖已安装（Task 18 完成）
# 如需安装 A2UI 相关依赖，参考 todolist.md 的 Task 19
```

### 启动服务

#### 启动后端

```powershell
cd c:\trae_coding\A2UI-main\my-a2ui-project
.venv\Scripts\Activate.ps1
py -m uvicorn backend.main:app --reload --port 8000
```

后端将在 `http://localhost:8000` 运行

API 文档: `http://localhost:8000/docs`

#### 启动前端

```bash
cd c:\trae_coding\A2UI-main\my-a2ui-project\frontend\genetics-app
npm run dev
```

前端将在 `http://localhost:5173` 运行

#### 构建前端

```bash
cd c:\trae_coding\A2UI-main\my-a2ui-project\frontend\genetics-app
npm run build
```

构建产物将输出到 `dist/` 目录。

## 应用功能模块

### 主页 (Home Page)

- 欢迎界面和学习进度展示
- 功能导航卡片（AI 助手对话、知识测验、知识图谱）
- 学习统计数据展示
- 响应式设计，支持移动端

### AI 对话模块 (Chat Module)

- 多会话管理
- 非流式响应（完整 JSON）
- 前端打字机效果
- 意图识别（quiz、video、general、greeting）
- Markdown 渲染
- 数学公式支持（KaTeX）
- A2UI 组件渲染
- 消息历史记录
- 上下文缓存（5 分钟 TTL）

### 测验模块 (Quiz Module)

- 多知识点选择（孟德尔遗传、DNA 结构、基因表达等）
- AI 生成测验题目
- 实时答案反馈
- 答案解析展示
- 学习进度追踪
- 连续答题统计

### 知识图谱模块 (Knowledge Graph Module)

- 交互式知识网络可视化
- 多类别过滤
- 节点拖拽和平移
- 缩放功能
- 节点详情展示

## 前端架构

### 路由系统

应用使用自定义 Router 实现单页应用（SPA）：

| 路由         | 组件                 | 描述         |
| ------------ | -------------------- | ------------ |
| `/`          | HomePage             | 主页         |
| `/chat`      | ChatModule           | AI 对话模块  |
| `/quiz`      | QuizModule           | 测验模块     |
| `/knowledge` | KnowledgeGraphModule | 知识图谱模块 |

### 组件结构

```
App (应用入口)
├── Router (路由管理)
├── HomePage (主页)
├── ChatModule (AI 对话)
│   └── A2UIManagerComponent (A2UI 渲染)
├── QuizModule (测验)
└── KnowledgeGraphModule (知识图谱)
```

### 全局样式

- 紫色渐变背景主题
- 响应式布局
- 路由过渡动画
- 卡片悬停效果
- 移动端适配

## API 端点

### 会话管理

- `POST /api/session/new` - 创建新会话
- `GET /api/session/{session_id}/history` - 获取会话历史
- `DELETE /api/session/{session_id}` - 删除会话
- `GET /api/sessions` - 列出所有会话

### 聊天

- `POST /api/chat` - AI 对话（非流式响应）
  - 请求参数：`message`, `session_id`, `use_ui` (默认 true), `history`
  - 响应格式：JSON
  - 响应字段：`text`, `a2ui`, `intent`, `keywords`

#### API 响应格式示例

```json
{
    "text": "这是一个经典的孟德尔遗传学杂交问题。让我为您详细分析...",
    "a2ui": [
        {
            "beginRendering": {
                "surfaceId": "genetics_ui",
                "root": "main_component"
            }
        },
        {
            "surfaceUpdate": {
                "surfaceId": "genetics_ui",
                "components": [...]
            }
        },
        {
            "dataModelUpdate": {
                "surfaceId": "genetics_ui",
                "contents": [
                    {
                        "key": "_fallback",
                        "valueBoolean": true
                    }
                ]
            }
        }
    ],
    "intent": "general",
    "keywords": "genotype, phenotype, Mendel, inheritance"
}
```

### 测验

- `POST /api/quiz/generate` - 生成测验题目
  - 请求参数：`topic`, `difficulty` (默认"中等"), `question_count` (默认5)
  - 响应：JSON 数组，包含题目、选项、答案和解析

### 知识图谱

- `GET /api/knowledge-graph` - 获取知识图谱数据
  - 查询参数：`categories` (可选，逗号分隔的类别列表)
  - 响应：JSON 对象，包含 `nodes` 和 `edges`

### 上下文管理

- `GET /api/context` - 获取学习者上下文
  - 响应：JSON 对象，包含 `profile`, `preferences`, `level`, `interests`
- `POST /api/context/update` - 更新学习者上下文
  - 请求参数：`profile`, `preferences`, `level`, `interests`
- `DELETE /api/context` - 使上下文缓存失效

## A2UI 组件

项目定义了以下自定义 A2UI 组件（在 `genetics_catalog.json` 中定义）：

| 组件名称              | 描述           | 用途                    | 关键属性                                               |
| --------------------- | -------------- | ----------------------- | ------------------------------------------------------ |
| PunnettSquare         | 孟德尔方格图   | 展示基因杂交后代比例    | parent1Genotype, parent2Genotype, trait, showPhenotype |
| DNAStructure          | DNA 双螺旋结构 | 展示 DNA 序列和碱基配对 | sequence, showLabels, highlightRegions                 |
| PhenotypeDistribution | 表型分布柱状图 | 展示群体表型分布        | data (phenotype, count, percentage), trait             |
| GeneExpression        | 基因表达水平   | 展示基因表达数据        | genes, expressionLevels, conditions                    |
| PedigreeChart         | 家系图         | 展示遗传疾病家系史      | generations, diseaseName, inheritancePattern           |
| CrossOverMap          | 交叉互换图谱   | 展示减数分裂交叉互换    | chromosome1, chromosome2, crossOverPoints              |

### A2UI 工作流程

1. **用户提问** → 后端接收消息
2. **意图识别** → IntentService 识别意图类型（10 种）
3. **文本生成** → GLM 生成文本回答
4. **A2UI 生成** → GLM 根据系统提示词生成 A2UI JSON
5. **Schema 验证** → 使用 `validate_and_fix_response()` 验证
6. **降级处理** → 验证失败时使用 `generate_local_a2ui()` 降级
7. **前端渲染** → Lit 渲染器解析 A2UI JSON 并渲染组件

### A2UI 消息格式

A2UI 使用 JSON 格式的消息列表，每个消息包含以下操作之一：

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
          "id": "punnett_square",
          "component": {
            "PunnettSquare": {
              "parent1Genotype": "Aa",
              "parent2Genotype": "aa",
              "trait": "花色",
              "showPhenotype": true
            }
          }
        }
      ]
    }
  },
  {
    "dataModelUpdate": {
      "surfaceId": "genetics_ui",
      "contents": [
        {
          "key": "_fallback",
          "valueBoolean": true
        }
      ]
    }
  }
]
```

## 开发进度

### 已完成阶段

- ✅ **阶段 0**: 项目初始化与配置
- ✅ **阶段 1**: 后端核心服务（GLM、Intent、Context）
- ✅ **阶段 2**: A2UI Schema 集成（v0.8）
- ✅ **阶段 3**: API 端点实现
- ✅ **阶段 4**: 测试与验证
- ✅ **阶段 5**: 前端实现（6 个自定义组件 + 应用模块）
- ✅ **阶段 6**: 集成测试
- ✅ **阶段 9**: AI 问答架构重构（非流式响应）
- ✅ **Bugfix**: A2UI 组件选择问题修复

### 核心功能清单

1. ✅ 项目初始化和配置
2. ✅ 后端核心服务（GLM、Intent、Context、A2UI）
3. ✅ A2UI Schema 集成和 6 个自定义组件定义
4. ✅ API 端点实现（会话管理、聊天、测验、知识图谱）
5. ✅ 前端实现（6 个自定义 Lit 组件、路由系统）
6. ✅ 从流式到非流式架构重构
7. ✅ 意图识别和关键词提取（10 种意图类型）
8. ✅ 双层响应架构和降级策略
9. ✅ 对话历史和上下文缓存（5 分钟 TTL）
10. ✅ 类型错误修复（TypeScript 和 Python）
11. ✅ A2UI 组件选择问题修复

### 待优化项

- 🔧 **修复 RAG 服务** - 当前 RAG 功能已停用，需要修复并重新启用
- 🧪 **端到端测试** - 完善前后端集成测试
- 📊 **性能优化** - 优化 A2UI 组件渲染性能
- 🎨 **UI 改进** - 改进用户界面交互体验

## 已完成的服务

### 后端服务

- ✅ **GLM 服务** (`glm_service.py`)
  - GLM-4.5-Air API 调用
  - 支持流式和非流式调用
  - 完整的错误处理和日志记录

- ✅ **A2UI 服务** (`a2ui_service.py`)
  - A2uiSchemaManager 初始化（v0.8）
  - 自定义 catalog 配置（genetics_catalog.json）
  - 系统提示词生成（`get_system_prompt()`）
  - A2UI 响应验证（`validate_and_fix_response()`）
  - Schema modifier 应用（remove_strict_validation）

- ✅ **Intent 服务** (`intent_service.py`)
  - 基于 GLM-4.5-Air 的意图分类
  - 支持 10 种意图类型：
    - **遗传学组件（6种）**: punnett_square, dna_structure, phenotype_distribution, gene_expression, pedigree_chart, cross_over_map
    - **其他意图（4种）**: quiz, video, general, greeting
  - 自动拼写修正和关键词扩展
  - 严格按优先级匹配意图

- ✅ **Context 服务** (`context_service.py`)
  - 用户画像和学习水平追踪
  - 上下文缓存（5 分钟 TTL）
  - 支持上下文更新和失效
  - 对话历史管理（10 条消息限制）

- ⚠️ **RAG 相关服务**（已停用）
  - Embedding 服务（文本向量化）
  - Vector Store 服务（向量存储和检索）
  - RAG 服务（知识库检索）
  - 注：当前 RAG 功能存在问题，已停用

### 前端组件

- ✅ **Vite + Lit 项目初始化**
  - 项目位置: `frontend/genetics-app`
  - TypeScript 支持
  - 已安装: lit ^3.3.1, vite ^7.3.1, typescript ^5.9.3

- ✅ **A2UI 依赖**
  - A2UI Lit 渲染器: @a2ui/lit (本地依赖)
  - A2UI Web 核心: @a2ui/web_core (本地依赖)
  - 响应式状态管理: @lit-labs/signals ^0.2.0
  - Markdown 渲染: marked ^17.0.3
  - 数学公式渲染: katex ^0.16.33

- ✅ **6 个自定义遗传学组件**
  - **PunnettSquare** (`punnett-square.ts`) - 孟德尔方格图
    - 自动计算配子和后代基因型
    - 表型识别和比例统计
    - 交互式单元格点击

  - **DNAStructure** (`dna-structure.ts`) - DNA 双螺旋结构
    - 碱基配对规则（A-T, C-G）
    - 序列验证和 GC 含量计算
    - 区域高亮显示

  - **PhenotypeDistribution** (`phenotype-distribution.ts`) - 表型分布柱状图
    - 百分比和数量标注
    - 颜色区分和图例
    - 交互式柱形点击

  - **GeneExpression** (`gene-expression.ts`) - 基因表达水平
    - 条形图和折线图双模式
    - 多基因表达数据展示
    - Canvas 折线图绘制

  - **PedigreeChart** (`pedigree-chart.ts`) - 家系图
    - 多代家系展示
    - 性别符号区分（♂/♀）
    - 表型标记（正常/患病/携带者）

  - **CrossOverMap** (`crossover-map.ts`) - 交叉互换图谱
    - 染色体可视化
    - 基因定位和颜色编码
    - 交叉点标记和脉冲动画

- ✅ **应用模块**
  - **App** (`app.ts`) - 应用入口，Router 集成
  - **HomePage** (`home-page.ts`) - 主页，功能导航
  - **ChatModule** (`chat-module.ts`) - AI 对话模块
    - 多会话管理
    - 非流式响应处理
    - Markdown 和 KaTeX 渲染
    - A2UI 组件集成
    - 打字机效果
  - **QuizModule** (`quiz-module.ts`) - 测验模块
  - **KnowledgeGraphModule** (`knowledge-graph-module.ts`) - 知识图谱
  - **Router** (`router.ts`) - 路由管理
  - **A2UIManager** (`a2ui-manager.ts`) - A2UI 消息解析和渲染

## 测试文件

### 后端测试

项目包含以下测试文件用于验证服务功能：

- `test_glm_service.py` - GLM 服务测试
- `test_embedding_service.py` - Embedding 服务测试
- `test_embedding_structure.py` - Embedding 结构测试
- `test_model_load.py` - 模型加载测试
- `test_vector_store.py` - Vector Store 测试
- `test_rag_service.py` - RAG 服务测试

### 前端测试

- `test-punnett.html` - PunnettSquare 组件测试
- `test-dna.html` - DNAStructure 组件测试
- `test-phenotype.html` - PhenotypeDistribution 组件测试
- `test-gene-expression.html` - GeneExpression 组件测试
- `test-pedigree.html` - PedigreeChart 组件测试
- `test-crossover.html` - CrossOverMap 组件测试
- `test-all-components.html` - 所有 6 个组件的综合测试

## 参考资料

- A2UI 文档: `c:\trae_coding\A2UI-main\docs\`
- A2UI 协议规范: `c:\trae_coding\A2UI-main\docs\specification\v0.8-a2ui.md`
- A2UI Schema Manager: `backend\python\a2ui_agent\src\a2ui\inference\schema\manager.py`
- A2UI Catalog: `backend\python\a2ui_agent\src\a2ui\inference\schema\catalog.py`
- 后端实现指南: `c:\trae_coding\backend-prompt.md`
- 前端实现指南: `c:\trae_coding\frontend-prompt.md`
- GLM API 文档: `c:\trae_coding\glmapi.md`

## A2UI 系统说明

项目使用内置系统提示词来管理 A2UI 组件和生成逻辑：

### 核心功能

1. **系统提示词生成** - `get_system_prompt()` 函数动态生成包含角色描述、工作流程和 UI 组件说明的系统提示词
2. **A2UI 响应验证** - `validate_a2ui_response()` 函数验证 LLM 生成的 A2UI JSON 格式
3. **本地降级生成** - `generate_local_a2ui()` 函数在 LLM 生成失败时提供简化的 A2UI 内容

### 系统提示词组件

- **ROLE_DESCRIPTION** - 定义 AI 作为生物遗传学教学助手的身份和核心能力
- **WORKFLOW_DESCRIPTION** - 描述问题理解、知识检索、可视化选择、响应生成的流程
- **UI_DESCRIPTION** - 列出所有可用组件（6 个自定义组件 + 标准 A2UI 组件）及其适用场景和参数要求

### 输出格式

使用 `---a2ui_JSON---` 分隔文本解释和 A2UI JSON 消息列表。

每个 A2UI JSON 消息对象必须包含且仅包含以下四个操作之一：

1. `beginRendering` - 信号客户端开始渲染
2. `surfaceUpdate` - 添加或更新组件
3. `dataModelUpdate` - 更新数据模型
4. `deleteSurface` - 删除表面

## 下一步工作

**已知的待优化项**:

- 🔧 **修复 RAG 服务** - 当前 RAG 功能存在网络连接问题，需要修复并重新启用
- 🧪 **端到端测试** - 完善前后端集成测试
- 📊 **性能优化** - 优化 A2UI 组件渲染性能
- 🎨 **UI 改进** - 改进用户界面交互体验

**已完成的核心功能**:

1. ✅ 项目初始化和配置
2. ✅ 后端核心服务（GLM、Embedding、Vector Store、RAG、Intent、Context）
3. ✅ A2UI Schema 集成和 6 个自定义组件定义
4. ✅ API 端点实现（会话管理、聊天、测验、知识图谱、上下文管理）
5. ✅ 前端实现（6 个自定义 Lit 组件、路由系统）
6. ✅ 从流式到非流式架构重构
7. ✅ 意图识别和关键词提取（10 种意图：6个遗传学组件 + 4个通用意图，支持拼写修正）
8. ✅ 双层响应架构和降级策略（支持所有6个遗传学组件以及quiz、video、general）
9. ✅ 对话历史和上下文缓存（5 分钟 TTL，10 条消息限制）
10. ✅ 类型错误修复（TypeScript 和 Python）
11. ✅ **Bugfix完成**: A2UI组件选择问题已修复（所有5个任务已完成）

- 集成a2ui_service的get_system_prompt和validate_and_fix_response
- IntentService支持10种意图类型
- 降级策略支持6个遗传学组件
- 使用validate_and_fix_response()验证A2UI响应
- 补充pedigree_chart和cross_over_map示例文件

## 前端关键实现要点

1. **自定义组件**: 6 个生物遗传学专用的可视化 Lit 组件
2. **组件注册**: 使用 `customElements.define()` 注册所有遗传学组件
3. **TypeScript 支持**: 完整的类型定义和装饰器支持
4. **中文界面**: 所有组件支持中文显示
5. **SPA 架构**: 基于 Router 的单页应用
6. **响应式设计**: 移动端和桌面端适配
7. **非流式接收**: 使用 `fetch()` + `await response.json()` 获取完整响应
8. **打字机效果**: 纯前端实现文本逐字显示（30 字符/秒）
9. **双层渲染**: 先显示文本，后异步渲染 A2UI 组件（500ms 延迟）
10. **错误处理**: A2UI 渲染失败时显示友好错误提示
11. **降级通知**: 显示降级内容时提供黄色警告通知

## 后端关键实现要点

1. **A2UI 集成**: 使用 `a2ui_service` 的标准化系统提示词生成符合 A2UI v0.8 协议的 JSON
2. **自定义组件**: `genetics_catalog.json` 定义 6 个生物遗传学专用可视化组件
3. **意图识别**: IntentService 基于 GLM-4.5-Air 识别 10 种意图类型
4. **双层响应**: 对话文本和 A2UI 内容分离生成
5. **非流式响应**: 后端一次性返回完整 JSON，不使用 SSE
6. **验证重试**: 使用 `validate_and_fix_response()` 验证 A2UI JSON
7. **降级策略**: A2UI 生成失败时使用 `generate_local_a2ui()` 降级
8. **上下文缓存**: 学习者上下文缓存 5 分钟，对话历史限制 10 条消息
9. **前后端联动**: 后端生成 A2UI JSON，前端使用 Lit 渲染器展示
10. **提示词生成**: 使用 `get_system_prompt()` 生成包含角色、工作流程、UI 组件说明的系统提示词
11. **意图识别增强**: 支持拼写自动修正、关键词扩展，严格按优先级匹配意图

## 构建和部署

### 前端构建

```bash
cd c:\trae_coding\A2UI-main\my-a2ui-project\frontend\genetics-app
npm run build
```

构建产物：

- `dist/index.html` - 入口 HTML
- `dist/assets/*.js` - 打包后的 JavaScript

### 前端预览

```bash
npm run preview
```

## 测试文件

### 后端测试

- `test_glm_service.py` - GLM 服务测试
- `test_intent_recognition.py` - 意图识别测试
- `test_api.py` - API 端点测试

### 前端测试

- `test-punnett.html` - PunnettSquare 组件测试
- `test-dna.html` - DNAStructure 组件测试
- `test-phenotype.html` - PhenotypeDistribution 组件测试
- `test-gene-expression.html` - GeneExpression 组件测试
- `test-pedigree.html` - PedigreeChart 组件测试
- `test-crossover.html` - CrossOverMap 组件测试
- `test-all-components.html` - 所有 6 个组件的综合测试

## 参考资料

- **A2UI 官方文档**: `backend/python/a2ui_agent/specification/`
  - v0.8 规范: `specification/v0_8/docs/a2ui_protocol.md`
  - v0.9 规范: `specification/v0_9/docs/a2ui_protocol.md`
  - v0.10 规范: `specification/v0_10/docs/a2ui_protocol.md`
- **A2UI Python SDK**: `backend/python/a2ui_agent/src/a2ui/`
  - Schema Manager: `inference/schema/manager.py`
  - Catalog: `inference/schema/catalog.py`
  - Validator: `inference/schema/validator.py`
- **项目文档**:
  - 验证报告: `A2UI_VALIDATION_REPORT.md`
  - 合规报告: `A2UI_COMPLIANCE_REPORT.md`
  - 最终验证: `A2UI_FINAL_VERIFICATION.md`

## 许可证

本项目仅供学习和研究使用。

## 联系方式

如有问题，请查阅项目文档或参考资料。

