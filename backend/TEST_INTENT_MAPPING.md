# 意图识别与A2UI组件映射测试

## 测试目的

验证后台对不同输入会使用哪些A2UI组件。

## 测试方法

### 方法一：通过API测试（推荐）

```bash
cd c:\trae_coding\A2UI-main\my-a2ui-project\backend
python test_api_builtin.py
```

该脚本会自动测试所有意图类型并输出详细结果。

### 方法二：手动测试

使用curl或其他HTTP客户端：

```bash
# 测试孟德尔方格图意图
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "孟德尔杂交后代比例是多少？", "use_ui": true, "session_id": "test"}'

# 测试DNA结构意图
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "DNA的双螺旋结构是怎样的？", "use_ui": true, "session_id": "test"}'

# 测试表型分布意图
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "群体的表型分布情况如何？", "use_ui": true, "session_id": "test"}'

# 测试基因表达意图
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "基因表达水平是怎么变化的？", "use_ui": true, "session_id": "test"}'

# 测试家系图意图
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "这个遗传病的家系图怎么画？", "use_ui": true, "session_id": "test"}'

# 测试交叉互换图谱意图
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "减数分裂中的交叉互换现象是什么？", "use_ui": true, "session_id": "test"}'

# 测试测验意图
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "给我出一些遗传学的测验题目", "use_ui": true, "session_id": "test"}'

# 测试视频意图
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "我想看视频学习DNA结构", "use_ui": true, "session_id": "test"}'

# 测试一般性意图
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "基因型和表型的区别是什么？", "use_ui": true, "session_id": "test"}'

# 测试问候意图
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "你好", "use_ui": true, "session_id": "test"}'
```

## 意图与A2UI组件映射表

| 输入示例 | 预期意图 | A2UI组件 | 组件名称 |
|---------|----------|-----------|---------|
| 孟德尔杂交后代比例是多少？ | punnett_square | PunnettSquare | 孟德尔方格图 |
| DNA的双螺旋结构是怎样的？ | dna_structure | DNAStructure | DNA双螺旋结构 |
| 群体的表型分布情况如何？ | phenotype_distribution | PhenotypeDistribution | 表型分布柱状图 |
| 基因表达水平是怎么变化的？ | gene_expression | GeneExpression | 基因表达水平 |
| 这个遗传病的家系图怎么画？ | pedigree_chart | PedigreeChart | 家系图 |
| 减数分裂中的交叉互换现象是什么？ | cross_over_map | CrossOverMap | 交叉互换图谱 |
| 给我出一些遗传学的测验题目 | quiz | Quiz | 测验 |
| 我想看视频学习DNA结构 | video | Video | 视频 |
| 基因型和表型的区别是什么？ | general | Flashcard | 闪卡 |
| 你好 | greeting | 无组件 | 纯文本 |

## 10种意图类型详解

### 遗传学组件意图（6种）

1. **punnett_square** - 孟德尔方格图
   - 触发关键词：杂交、后代、比例、孟德尔、显性、隐性
   - 示例输入：
     - "Aa和aa杂交后代是什么"
     - "孟德尔遗传定律的后代比例"
     - "显性和隐性基因的杂交结果"

2. **dna_structure** - DNA双螺旋结构
   - 触发关键词：DNA、双螺旋、碱基、核苷酸、序列
   - 示例输入：
     - "DNA的结构是怎样的"
     - "碱基配对规则是什么"
     - "DNA双螺旋的组成"

3. **phenotype_distribution** - 表型分布柱状图
   - 触发关键词：表型、分布、比例、群体、统计
   - 示例输入：
     - "群体的表型分布情况"
     - "不同表型的比例"
     - "群体遗传的表型统计"

4. **gene_expression** - 基因表达水平
   - 触发关键词：表达、转录、翻译、mRNA、蛋白质
   - 示例输入：
     - "基因表达水平的变化"
     - "转录和翻译的过程"
     - "mRNA到蛋白质的合成"

5. **pedigree_chart** - 家系图
   - 触发关键词：家系、遗传病、家族、世代、遗传史
   - 示例输入：
     - "遗传病的家系图"
     - "家族遗传史"
     - "绘制家系图"

6. **cross_over_map** - 交叉互换图谱
   - 触发关键词：交叉互换、减数分裂、染色体、连锁
   - 示例输入：
     - "减数分裂中的交叉互换"
     - "染色体的交叉互换过程"
     - "基因连锁和交换"

### 其他意图（4种）

7. **quiz** - 测验
   - 触发关键词：测验、考试、测试、题目、题目
   - 示例输入：
     - "出一些遗传学题目"
     - "测试我的遗传学知识"
     - "做几道遗传学题"

8. **video** - 视频
   - 触发关键词：视频、观看、学习视频、教程
   - 示例输入：
     - "看视频学习DNA结构"
     - "找一些教学视频"
     - "观看相关视频"

9. **general** - 一般性问题
   - 触发关键词：一般性解释、概念、原理、区别
   - 示例输入：
     - "基因型和表型的区别"
     - "遗传学的核心原理"
     - "解释孟德尔定律"

10. **greeting** - 问候语
    - 触发关键词：你好、早上好、晚上好、hi、hello
    - 示例输入：
      - "你好"
      - "早上好"
      - "Hi"

## 降级策略

当LLM生成A2UI失败时，后台会使用降级策略：

1. **遗传学组件降级**（6种）：
   - punnett_square: 生成简单的孟德尔方格A2UI
   - dna_structure: 生成简单的DNA结构A2UI
   - phenotype_distribution: 生成简单的表型分布A2UI
   - gene_expression: 生成简单的基因表达A2UI
   - pedigree_chart: 生成简单的家系图A2UI
   - cross_over_map: 生成简单的交叉互换图谱A2UI

2. **通用意图降级**（3种）：
   - quiz: 生成测验A2UI
   - video: 生成视频列表A2UI
   - general: 生成闪卡A2UI

3. **问候语不降级**：
   - greeting: 返回纯文本问候，不生成A2UI

## 验证Bugfix完成情况

Bugfix修复后的改进：

### 修复前的问题
- ❌ 意图识别只支持4种（quiz、video、general、greeting）
- ❌ 降级策略不支持遗传学组件
- ❌ 没有pedigree_chart和cross_over_map的示例文件
- ❌ 使用内置系统提示词，未集成a2ui_service

### 修复后的改进
- ✅ 意图识别支持10种（6个遗传学组件 + 4个通用意图）
- ✅ 降级策略支持所有6个遗传学组件
- ✅ 补充了pedigree_chart和cross_over_map示例文件
- ✅ 集成了a2ui_service的get_system_prompt和validate_and_fix_response
- ✅ IntentService系统提示词包含所有6个遗传学组件的详细说明

## 测试检查清单

- [ ] 孟德尔方格图意图正确识别
- [ ] DNA结构意图正确识别
- [ ] 表型分布意图正确识别
- [ ] 基因表达意图正确识别
- [ ] 家系图意图正确识别
- [ ] 交叉互换图谱意图正确识别
- [ ] 测验意图正确识别
- [ ] 视频意图正确识别
- [ ] 一般性意图正确识别
- [ ] 问候意图正确识别
- [ ] 每种意图都能生成对应的A2UI组件
- [ ] 降级策略在LLM失败时正常工作
- [ ] 关键词提取准确
- [ ] 拼写修正功能正常

## 注意事项

1. **网络问题**：RAG服务需要连接HuggingFace下载模型，如果网络不通，服务启动会较慢，但不影响核心功能。

2. **降级内容**：降级策略生成的A2UI内容会包含`_fallback`标记，前端会显示黄色警告提示用户这是降级内容。

3. **验证函数**：使用`validate_and_fix_response()`函数验证LLM生成的A2UI JSON，确保符合A2UI v0.8协议。

4. **系统提示词**：IntentService使用自定义系统提示词，包含详细的意图分类和关键词映射，确保意图识别准确。
