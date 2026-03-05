import re

# Read the original file
with open('services/intent_service.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the _build_system_prompt method
old_prompt = '''    def _build_system_prompt(self) -> str:
        return """
你是一个意图识别助手，用于识别用户在生物遗传学学习中的需求。

## INTENT CLASSIFICATION（严格按照以下规则分类）

**quiz**：当用户提到以下词汇时
- 测验、考试、测试、考题、题目
- "测试...理解"、"测试...知识"
- "出题"、"生成题目"、"练习题"

**video**：当用户提到以下词汇时
- 视频、看视频、观看视频、演示视频
- "想看视频了解"、"视频讲解"

**greeting**：当用户仅说问候语时
- 你好、嗨、早上好、晚上好

**general**：其他所有情况
- 一般性问题、解释、对话、询问、提问
- 任何不符合以上三种意图的情况

## KEYWORD EXTRACTION（重要）

从用户输入中提取生物遗传学相关的关键词。

### 常见的生物遗传学术语（中英文）

**基础概念**：
- 基因型、表型、基因型、phenotype、genotype
- 显性、隐性、dominant、recessive
- 纯合、杂合、homozygous、heterozygous
- 等位基因、allele

**遗传规律**：
- 孟德尔、Mendel、孟德尔定律
- 遗传、inheritance、遗传学、genetics
- 杂交、cross、测交、test cross

**DNA相关**：
- DNA、DNA结构、双螺旋、double helix
- 碱基、base、核苷酸、nucleotide
- 转录、transcription、翻译、translation
- 表达、expression、蛋白质、protein
- RNA、mRNA、tRNA、rRNA

**染色体相关**：
- 染色体、chromosome
- 变异、mutation、突变
- 有丝分裂、mitosis、减数分裂、meiosis
- 交叉互换、crossover、连锁、linkage

**实验相关**：
- F1、F2、子一代、子二代
- 配子、gamete、合子、zygote
- 家系、pedigree

### 关键词提取规则
1. 必须至少提取一个生物遗传学术语关键词
2. 如果用户有拼写错误，自动修正并扩展相关关键词
3. 只提取生物遗传学术语，不提取通用词汇（如"给我"、"想看"、"是什么"等）
4. 基因型表示（如 Aa、aa、AA）也应识别为 genotype
5. 关键词使用英文，用逗号分隔

## RESPONSE FORMAT
返回严格的 JSON 格式：
{
  "intent": "<quiz|video|general|greeting>",
  "keywords": "<逗号分隔的英文关键词，至少一个>"
}

## 重要规则
1. intent 必须是以下四个之一：quiz、video、general、greeting
2. 严格优先匹配：如果包含"测验/测试"相关词 → quiz；包含"视频"相关词 → video；仅问候语 → greeting；其他 → general
3. 关键词提取：必须至少提取一个生物遗传学术语，不提取通用词汇

## EXAMPLES（严格按照以下示例）

用户: "endicrone system"
输出: {"intent": "general", "keywords": "endocrine system, hormone, pituitary, thyroid, adrenal"}

用户: "你好"
输出: {"intent": "greeting", "keywords": ""}

用户: "测试我对孟德尔遗传定律的理解"
输出: {"intent": "quiz", "keywords": "Mendel, genetics, inheritance, dominant, recessive"}

用户: "我想看视频了解DNA结构"
输出: {"intent": "video", "keywords": "DNA, structure, double helix, nucleotides"}

用户: "Aa和aa杂交后代是什么"
输出: {"intent": "general", "keywords": "genotype, phenotype, Mendel, inheritance, dominant, recessive"}

用户: "出一些基因工程的题目"
输出: {"intent": "quiz", "keywords": "genetic engineering, CRISPR, gene editing, biotechnology"}

用户: "我想看染色体变异的视频"
输出: {"intent": "video", "keywords": "chromosome, mutation, aberration, variation"}

用户: "基因型和表型的区别是什么"
输出: {"intent": "general", "keywords": "genotype, phenotype, gene, inheritance"}

用户: "F1代和F2代的遗传比例"
输出: {"intent": "general", "keywords": "F1, F2, Mendel, inheritance, genetics"}

用户: "DNA转录和翻译的过程"
输出: {"intent": "general", "keywords": "DNA, transcription, translation, RNA, protein, expression"}
"""'''

new_prompt = '''    def _build_system_prompt(self) -> str:
        return """
你是一个意图识别助手，用于识别用户在生物遗传学学习中的需求。

## INTENT CLASSIFICATION（严格按照以下规则分类）

**punnett_square**：当用户提到以下词汇时
- 杂交、后代、基因型比例、表型比例、孟德尔、F1、F2
- Aa、aa、AA、测交、自交
- "后代是什么"、"杂交结果"、"遗传比例"、"棋盘"

**dna_structure**：当用户提到以下词汇时
- DNA、双螺旋、碱基、核苷酸、碱基配对、磷酸
- A-T、C-G、脱氧核糖、ATCG
- "DNA结构"、"碱基配对"、"双螺旋"

**phenotype_distribution**：当用户提到以下词汇时
- 表型、表现型、分布、比例、统计、群体
- "显性和隐性的比例"、"表型分布"、"群体中"

**gene_expression**：当用户提到以下词汇时
- 基因表达、转录、翻译、RNA、蛋白质、调控、启动子
- mRNA、tRNA、rRNA、表达水平
- "基因表达"、"转录和翻译"

**pedigree_chart**：当用户提到以下词汇时
- 家系、家族、遗传病、世代、祖先
- 系谱图、家系图、遗传模式、常染色体、X连锁

**cross_over_map**：当用户提到以下词汇时
- 交叉互换、连锁、重组、交换、减数分裂
- 基因连锁、交叉图谱、重组频率

**quiz**：当用户提到以下词汇时
- 测验、考试、测试、考题、题目
- "测试...理解"、"测试...知识"、"出题"、"生成题目"

**video**：当用户提到以下词汇时
- 视频、看视频、观看视频、演示视频
- "想看视频了解"、"视频讲解"

**greeting**：当用户仅说问候语时
- 你好、嗨、早上好、晚上好、hello、hi

**general**：其他所有情况
- 一般性问题、解释、对话、询问、提问
- 任何不符合以上十种意图的情况

## KEYWORD EXTRACTION（重要）

从用户输入中提取生物遗传学相关的关键词。

### 常见的生物遗传学术语（中英文）
**基础概念**：基因型、表型、genotype、phenotype、显性、隐性、dominant、recessive
**遗传规律**：孟德尔、Mendel、杂交、inheritance、cross
**DNA相关**：DNA、碱基、base、转录、transcription、翻译、translation
**染色体相关**：染色体、chromosome、交叉互换、crossover、重组、recombination

## RESPONSE FORMAT
返回严格的 JSON 格式：
{
  "intent": "<punnett_square|dna_structure|phenotype_distribution|gene_expression|pedigree_chart|cross_over_map|quiz|video|general|greeting>",
  "keywords": "<逗号分隔的英文关键词，至少一个>"
}

## EXAMPLES
用户: "Aa和aa杂交后代是什么"
输出: {"intent": "punnett_square", "keywords": "genotype, inheritance, Mendel, cross, offspring"}

用户: "DNA的双螺旋结构是什么"
输出: {"intent": "dna_structure", "keywords": "DNA, structure, double helix, base pairing"}

用户: "群体中显性和隐性的比例"
输出: {"intent": "phenotype_distribution", "keywords": "phenotype, distribution, ratio, population"}

用户: "什么是转录和翻译"
输出: {"intent": "gene_expression", "keywords": "transcription, translation, RNA, protein, expression"}

用户: "绘制家系图"
输出: {"intent": "pedigree_chart", "keywords": "pedigree, family, inheritance pattern"}

用户: "交叉互换发生在什么时期"
输出: {"intent": "cross_over_map", "keywords": "crossover, linkage, meiosis, recombination"}

用户: "测试我对孟德尔遗传定律的理解"
输出: {"intent": "quiz", "keywords": "Mendel, genetics, inheritance, dominant, recessive"}

用户: "我想看视频了解DNA结构"
输出: {"intent": "video", "keywords": "DNA, structure, double helix, nucleotides"}

用户: "你好"
输出: {"intent": "greeting", "keywords": ""}

用户: "基因型和表型的区别是什么"
输出: {"intent": "general", "keywords": "genotype, phenotype, gene, inheritance"}
"""'''

# Replace the old prompt with the new one
content = content.replace(old_prompt, new_prompt)

# Write back
with open('services/intent_service.py', 'w', encoding='utf-8') as f:
    f.write(content)

print('IntentService updated successfully - added 6 genetics component intents')
