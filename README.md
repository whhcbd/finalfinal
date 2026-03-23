# 遗传学学习平台 (Genetics Learning Platform)

基于 A2UI 框架和智谱 GLM-4.7 模型的交互式生物遗传学教学平台。

## 项目概述

本项目是一个集成了 AI 对话、动态可视化组件生成和智能测验功能的生物遗传学教学平台。采用 **A2UI (Agent to UI)** 协议，实现 AI 代理与前端界面的标准化通信，支持动态生成遗传学专用的可视化组件。

### 核心特性

- 🤖 **AI 智能对话**: 基于 GLM-4.7 模型的自然语言交互
- 🎨 **A2UI 动态可视化**: AI 自动生成遗传学专用图表
- 🧬 **10 个自定义组件**: 7 个核心组件 + 2 个模拟器 + 1 个闪卡
- 🎯 **智能意图识别**: 自动识别 12 种意图类型
- 📝 **智能测验系统**: 多知识点测验，实时反馈
- 🌐 **知识图谱**: 交互式知识结构可视化
- 💬 **会话管理**: 多对话历史记录，本地持久化
- 🔄 **降级策略**: A2UI 生成失败时自动使用本地降级方案

## 技术栈

### 后端

| 技术                  | 版本   | 用途               |
| --------------------- | ------ | ------------------ |
| Python                | 3.10+  | 运行环境           |
| FastAPI               | -      | Web 框架           |
| GLM-4.7 / GLM-4-Flash | -      | 智谱 AI 大语言模型 |
| A2UI Python SDK       | v0.1.0 | A2UI 协议实现      |

### 前端

| 技术       | 版本    | 用途                |
| ---------- | ------- | ------------------- |
| Vite       | 7.x     | 构建工具            |
| Lit        | 3.3.1   | Web Components 框架 |
| TypeScript | 5.9.3   | 类型安全            |
| A2UI Lit   | 0.8.1   | A2UI 渲染器         |
| Plotly.js  | 3.4.0   | 交互式统计图表      |
| Chart.js   | 4.5.1   | 数据可视化          |
| KaTeX      | 0.16.33 | 数学公式渲染        |
| marked     | 17.0.3  | Markdown 渲染       |

## 快速开始

### 前置要求

- Python 3.10+
- Node.js 18+
- 虚拟环境 `.venv`（项目根目录）

### 启动服务

需要开两个终端窗口：

**终端 1 - 后端：**

```powershell
cd C:\trae_coding\A2UI-main\my-a2ui-project
.venv\Scripts\Activate.ps1
py -m uvicorn backend.main:app --reload --port 8000
```

**终端 2 - 前端：**

```powershell
cd C:\trae_coding\A2UI-main\my-a2ui-project\frontend\genetics-app
npm run dev
```

### 访问地址

| 服务     | 地址                       |
| -------- | -------------------------- |
| 前端界面 | http://localhost:5173      |
| 后端 API | http://localhost:8000      |
| API 文档 | http://localhost:8000/docs |

### 环境变量

在项目根目录创建 `.env` 文件：

```env
GLM_API_KEY=your_api_key_here
GLM_MODEL=glm-4.7
```

## 自定义组件

### 7 个核心遗传学组件

| 组件                      | 用途           | 交互功能                           |
| ------------------------- | -------------- | ---------------------------------- |
| **PunnettSquare**         | 孟德尔方格图   | 点击格子显示详情、随机受精模拟     |
| **DNAStructure**          | DNA 双螺旋结构 | 点击碱基显示配对规则、DNA 复制动画 |
| **PhenotypeDistribution** | 表型分布柱状图 | 点击柱状图显示统计                 |
| **GeneExpression**        | 基因表达水平   | 滑块调节表达水平、lac 操纵子模拟   |
| **PedigreeChart**         | 家系图         | 点击个体显示详情、高亮遗传路径     |
| **CrossOverMap**          | 交叉互换图谱   | 点击基因显示信息、交叉互换动画     |
| **CentralDogma**          | 中心法则演示   | DNA 复制、转录、翻译动画           |

### 2 个模拟器组件

| 组件                          | 用途             | 核心功能                               |
| ----------------------------- | ---------------- | -------------------------------------- |
| **MendelSimulator**           | 孟德尔实验模拟器 | 随机受精模拟、卡方检验、Plotly.js 图表 |
| **NaturalSelectionSimulator** | 自然选择模拟器   | 种群演化、Canvas 渲染、Chart.js 曲线   |

## 项目结构

```
my-a2ui-project/
├── .env                      # 环境变量配置
├── .venv/                    # Python 虚拟环境
├── requirements.txt          # Python 依赖
├── README.md
│
├── backend/                  # 后端代码
│   ├── main.py               # FastAPI 应用入口
│   ├── services/             # 核心服务
│   │   ├── glm_service.py    # GLM API 调用
│   │   ├── intent_service.py # 意图识别
│   │   ├── context_service.py# 会话上下文
│   │   ├── a2ui_service.py   # A2UI 系统提示词
│   │   └── action_handler.py # 用户操作处理
│   ├── schemas/
│   │   └── genetics_catalog.json  # 组件目录定义
│   ├── examples/genetics_examples/ # A2UI 组件示例
│   └── python/a2ui_agent/    # A2UI Python SDK
│
├── frontend/                 # 前端代码
│   ├── genetics-app/         # 主应用
│   │   ├── src/
│   │   │   ├── app.ts        # 应用入口
│   │   │   ├── router.ts     # 路由管理
│   │   │   ├── chat-module.ts# AI 对话
│   │   │   ├── quiz-module.ts# 测验模块
│   │   │   ├── a2ui-renderer.ts
│   │   │   └── components/genetics/  # 遗传学组件
│   │   └── package.json
│   ├── lit/                  # A2UI Lit 渲染器
│   └── web_core/             # A2UI Web 核心
│
├── docs/                     # 项目文档
│   ├── guides/               # 开发指南
│   └── improvements/         # 改进记录
│
└── scripts/                  # 启动脚本
    ├── start-backend.bat
    └── start-frontend.bat
```

## API 端点

### 聊天

- `POST /api/chat` - AI 对话
- `WebSocket /ws/chat/{session_id}` - 实时聊天（流式响应）

### 测验

- `GET /api/quiz/questions?category={category}` - 获取测验题目

### 健康检查

- `GET /` - API 状态
- `GET /health` - 服务健康状态

## 意图类型

系统支持识别以下 12 种意图：

| 意图                        | 触发组件                  |
| --------------------------- | ------------------------- |
| punnett_square              | PunnettSquare             |
| dna_structure               | DNAStructure              |
| phenotype_distribution      | PhenotypeDistribution     |
| gene_expression             | GeneExpression            |
| pedigree_chart              | PedigreeChart             |
| cross_over_map              | CrossOverMap              |
| central_dogma               | CentralDogma              |
| mendel_simulator            | MendelSimulator           |
| natural_selection_simulator | NaturalSelectionSimulator |
| quiz                        | -                         |
| video                       | -                         |
| general / greeting          | Flashcard                 |

## 前端构建

```bash
cd frontend/genetics-app
npm run build    # 构建生产版本
npm run preview  # 预览构建结果
```

## 许可证

本项目仅供学习和研究使用。

## 更新日志

### 2026-03-20

- ✅ 添加 CentralDogma 中心法则组件（DNA 复制、转录、翻译完整动画）
- ✅ 更新 README 文档，简化启动说明
- ✅ 修正虚拟环境启动命令

### 2026-03-18

- ✅ 交互功能增强项目完成（阶段一至九）
- ✅ 为 6 个核心组件添加交互功能
- ✅ 创建通用 CSS 动画库（40+ 可复用动画）
- ✅ 集成 2 个模拟器组件
- ✅ 添加 34 个后端 action handlers
- ✅ 安装 Plotly.js 和 Chart.js 依赖
