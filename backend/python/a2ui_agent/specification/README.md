# 规范文档

这个文件夹里存放着 A2UI（Agent to UI）的技术规范文档。

## 什么是规范文档？

想象一下，规范文档就像一本"说明书"或"游戏规则书"。它定义了：
- 智能代理和客户端之间如何沟通
- 界面应该长什么样
- 数据应该如何流动
- 各种组件（按钮、输入框、图片等）如何工作

有了这个规范，不同的人开发的程序才能互相配合工作。

## 文件夹结构

这里有三个版本的规范，每个版本都是一个独立的文件夹：

| 版本 | 说明 |
|------|------|
| [v0_8](v0_8/) | 0.8 版本的规范（旧版本） |
| [v0_9](v0_9/) | 0.9 版本的规范（较新版本） |
| [v0_10](v0_10/) | 0.10 版本的规范（最新版本，正在开发中） |

**建议**：如果你是第一次学习，建议从 [v0_10](v0_10/) 开始，这是最新、最完善的版本。

## 每个版本里有什么？

每个版本文件夹都包含以下内容：

### 📚 docs/ - 文档目录
这里存放着详细的技术文档，解释了 A2UI 的各个方面：

- **a2ui_protocol.md** - A2UI 协议的核心文档，定义了消息如何流动
- **a2ui_custom_functions.md** - 自定义函数的说明
- **a2ui_extension_specification.md** - 如何扩展 A2UI 的规范
- **evolution_guide.md** - 版本之间的变化指南（v0.9 和 v0.10）
- **renderer_guide.md** - 渲染器开发指南（部分版本有）

### 📋 json/ - JSON Schema 定义
这里存放着 JSON 格式的定义文件，用来验证数据是否正确：

- **common_types.json** - 通用的数据类型定义
- **basic_catalog.json** - 基础组件目录（按钮、文本框等）
- **server_to_client.json** - 服务器发给客户端的消息格式
- **client_to_server.json** - 客户端发给服务器的消息格式
- **server_capabilities.json** - 服务器能力的描述
- **a2ui_client_capabilities.json** - 客户端能力的描述
- **a2ui_client_data_model.json** - 客户端数据模型的格式

这些 JSON Schema 就像是"模板"，程序可以用它们来检查生成的界面定义是否正确。

### 🧪 test/ - 测试用例
这里放着各种测试例子，帮助理解规范和验证实现：

- **cases/** - 各种测试场景的 JSON 文件
  - `contact_form_example.jsonl` - 联系人表单的完整例子
  - `button_checks.json` - 按钮验证的例子
  - `text_variants.json` - 文本变体的例子
  - 等等...

你可以把这些测试用例当作学习材料，看看 A2UI 的消息到底长什么样。

### 🤖 eval/ - 评估工具
这是一个用来测试和评估的工具，看看各种大语言模型（LLM）能不能正确生成 A2UI 的代码。

**主要功能：**
- 让大语言模型根据提示词生成 A2UI 界面
- 验证生成的内容是否符合规范
- 测试不同模型的表现（Gemini、OpenAI、Anthropic 等）

**如何使用：**
```bash
cd specification/v0_10/eval
pnpm install
# 设置你的 API 密钥
cp .env.example .env
# 编辑 .env 文件，填入 API 密钥

# 运行所有测试（会消耗很多配额！）
pnpm run evalAll

# 只运行单个测试
pnpm run eval --model=gemini-2.5-flash-lite --prompt=loginForm
```

## A2UI 协议的核心概念

### 消息类型

A2UI 使用四种基本的消息来构建界面：

1. **createSurface** - 创建一个"画布"
   - 就像画画前要先准备好画纸
   - 定义界面的主题和基本信息

2. **updateComponents** - 添加或更新组件
   - 在画布上画按钮、输入框、文本等
   - 可以分多次发送，逐步完善界面

3. **updateDataModel** - 更新数据
   - 修改界面显示的内容
   - 不需要重新发送整个界面结构

4. **deleteSurface** - 删除画布
   - 清理不再需要的界面

### 组件目录（Catalog）

组件目录就像一个"工具箱"，里面定义了所有可用的界面组件：

**基础组件：**
- **Text** - 显示文字
- **Button** - 可点击的按钮
- **TextField** - 文本输入框
- **CheckBox** - 复选框
- **Image** - 显示图片
- **Row/Column** - 横向/纵向布局
- **Card** - 卡片容器
- **List** - 列表
- 等等...

**函数：**
- **required** - 检查必填项
- **email** - 验证邮箱格式
- **regex** - 正则表达式检查
- **formatString** - 格式化字符串
- 等等...

### 数据绑定

A2UI 支持把界面组件和数据"绑定"在一起：

- **单向绑定**：数据变化时，界面自动更新
- **双向绑定**：用户输入时，数据也跟着变化
- **路径引用**：用类似 `/user/name` 这样的路径来引用数据

## 传输层

A2UI 协议本身不规定用哪种方式传输数据，它可以用：

- **A2A 协议** - 专门为智能代理设计的协议
- **WebSocket** - 实时双向通信
- **SSE (Server-Sent Events)** - 服务器推送事件
- **HTTP** - 普通的网页请求
- 等等...

就像你可以用快递、平邮、电子邮件等方式发送信件，内容都是一样的。

## 如何使用这些规范？

### 如果你是开发者

1. **学习阶段**
   - 从 [v0_10/docs/a2ui_protocol.md](v0_10/docs/a2ui_protocol.md) 开始阅读
   - 查看 [v0_10/json/](v0_10/json/) 里的 JSON Schema 理解数据结构
   - 学习 [v0_10/test/cases/](v0_10/test/cases/) 里的例子

2. **开发智能代理**
   - 使用 `server_to_client.json` 作为消息模板
   - 参考 `basic_catalog.json` 选择合适的组件
   - 使用 eval 工具测试生成的界面

3. **开发客户端**
   - 实现 `server_to_client.json` 定义的消息解析
   - 实现 `basic_catalog.json` 中的所有组件
   - 支持数据绑定和事件处理

### 如果你是学习者

1. **从例子开始**
   - 打开 `v0_10/test/cases/contact_form_example.jsonl`
   - 这是一个完整的联系人表单例子
   - 试着理解每一行 JSON 的含义

2. **阅读文档**
   - 先看协议概览，了解整体思路
   - 再看组件说明，了解各种组件的用法
   - 最后看数据绑定，理解数据如何流动

3. **动手尝试**
   - 使用 eval 工具让 AI 生成界面
   - 修改提示词，看看生成的界面有什么变化

## 版本演进

A2UI 的规范在不断改进：

| 版本 | 主要变化 |
|------|----------|
| v0.8 | 基础版本 |
| v0.9 | 增加了自定义组件支持、更多验证功能 |
| v0.10 | 最新版本，正在开发中，功能更完善 |

查看 [evolution_guide.md](v0_10/docs/evolution_guide.md) 了解详细的版本变化。

## 贡献规范

如果你发现规范有问题或有改进建议，可以：

1. 在 [A2UI 仓库](https://github.com/google/A2UI) 提交 Issue
2. 发起 Pull Request 修改文档
3. 使用 eval 工具验证你的改动

## 相关资源

- [A2UI 主 README](../README.md)
- [A2UI 示例项目](../samples/)
- [A2UI 渲染器实现](../renderers/)
- [A2A 协议](https://a2a-protocol.org/latest/)

## 常见问题

**Q: 我应该用哪个版本？**
A: 建议使用 v0.10，这是最新版本，功能最完善。

**Q: 规范会经常变化吗？**
A: 新版本会添加新功能，但会尽量保持向后兼容。查看 evolution_guide 了解变化。

**Q: 我可以自定义组件吗？**
A: 可以！规范支持自定义组件目录，你可以定义自己的组件。

**Q: eval 工具会消耗很多 API 配额吗？**
A: 是的，运行所有测试会消耗大量配额。建议先用单个测试调试。
