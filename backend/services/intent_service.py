from typing import TypedDict, Optional
import json
import logging
import re
from .glm_service import GLMService

logger = logging.getLogger(__name__)


class IntentResult(TypedDict):
    intent: str
    keywords: str


class IntentService:
    def __init__(self, glm_service: GLMService):
        self.glm_service = glm_service
        self.system_prompt = self._build_system_prompt()
        self.keyword_patterns = self._build_keyword_patterns()

    def _build_system_prompt(self) -> str:
        return """
你是一个意图识别助手，用于识别用户在生物遗传学学习中的需求。

## 重要：上下文感知
- 你会收到对话历史记录，必须结合上下文理解用户意图
- 如果用户说"是的"、"好的"、"可以"、"画一个"、"展示一下"等模糊表达，需要参考之前的对话判断具体意图
- 例如：如果之前讨论了"杂交"，用户说"画一个"，意图应该是 punnett_square
- 例如：如果之前讨论了"DNA结构"，用户说"展示一下"，意图应该是 dna_structure
- 例如：如果之前讨论了"家系遗传"，用户说"可以"，意图应该是 pedigree_chart

## INTENT CLASSIFICATION（严格按照以下规则分类）

**punnett_square**：当用户提到以下词汇时
- 杂交、后代基因型、测交、自交、配子、孟德尔方格图、旁氏图
- Aa、aa、AA、AaBb、aabb、RrYy等具体基因型
- "杂交会产生"、"后代基因型"、"配子组合"、"棋盘"、"双因子杂交"、"单因子杂交"
- "分析...杂交实验"、"用孟德尔方格图"、"用旁氏图"、"展示后代"
- "画一个"、"展示"、"可视化"（需结合上下文判断）
- 注意：如果问的是"比例"、"分布"、"F2代表型"但没有提到具体基因型，必须是phenotype_distribution，不能是punnett_square
- 注意：如果用户问的是"表型分布"、"后代比例"、"表现型比例"，即使提到了"杂交"，也应该是phenotype_distribution
- 注意：如果明确提到"孟德尔方格图"、"旁氏图"、"Punnett Square"，必须是punnett_square

**dna_structure**：当用户提到以下词汇时
- DNA、双螺旋、碱基、核苷酸、碱基配对、磷酸
- A-T、C-G、脱氧核糖、ATCG
- "DNA结构"、"碱基配对"、"双螺旋"

**phenotype_distribution**：当用户提到以下词汇时
- 表型、表现型、分布、比例、统计、群体
- "显性和隐性的比例"、"表型分布"、"群体中"
- F2代、F1代、后代比例、紫色花、白色花、3:1、9:3:3:1
- "比例是多少"、"分布情况"、"表型统计"
- "豌豆杂交实验后代的表型分布"、"杂交后代的表型比例"、"展示...比例"
- 重要：只要用户问的核心是"表型比例"或"表型分布"，即使句子中包含"杂交"，也应该是phenotype_distribution

**gene_expression**：当用户提到以下词汇时
- 基因表达、转录、翻译、RNA、蛋白质、调控、启动子
- mRNA、tRNA、rRNA、表达水平
- "基因表达"、"转录和翻译"

**pedigree_chart**：当用户提到以下词汇时
- 家系、家族、遗传病、世代、祖先
- 系谱图、家系图、遗传模式、常染色体、X连锁

**cross_over_map**：当用户提到以下词汇时
- 交叉互换、连锁、重组、交换、减数分裂、交叉点
- 基因连锁、交叉图谱、重组频率、染色体交换
- "交叉互换位置"、"基因位置"、"染色体位置"、"交叉发生"
- "基因A和基因B"、"两个基因"、"基因间"
- 注意：只要提到"交叉"+"基因"或"交叉"+"染色体"，就应该是 cross_over_map

**mendel_simulator**：当用户提到以下词汇时
- 孟德尔模拟器、孟德尔实验、模拟受精、验证孟德尔定律、随机受精
- "模拟...杂交"、"验证...比例"、"卡方检验"、"统计验证"
- "模拟 Aa × Aa"、"模拟 AaBb × AaBb"、"模拟...次"
- "看看是不是 3:1"、"看看是不是 9:3:3:1"
- 注意：如果明确提到"模拟"+"杂交"或"验证"+"比例"或"随机受精"，应该是 mendel_simulator 而不是 punnett_square

**natural_selection_simulator**：当用户提到以下词汇时
- 自然选择、种群演化、基因频率、选择压力、适应度、捕食者
- "模拟自然选择"、"种群演化"、"基因频率变化"、"环境选择"
- 哈迪-温伯格平衡、种群遗传、深色浅色、环境背景
- "初始种群"、"世代演化"、"适应度变化"

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
  "intent": "<punnett_square|dna_structure|phenotype_distribution|gene_expression|pedigree_chart|cross_over_map|mendel_simulator|natural_selection_simulator|quiz|video|general|greeting>",
  "keywords": "<逗号分隔的英文关键词，至少一个>"
}

## EXAMPLES
用户: "Aa和aa杂交后代是什么"
输出: {"intent": "punnett_square", "keywords": "genotype, inheritance, Mendel, cross, offspring"}

用户: "DNA的双螺旋结构是什么"
输出: {"intent": "dna_structure", "keywords": "DNA, structure, double helix, base pairing"}

用户: "群体中显性和隐性的比例"
输出: {"intent": "phenotype_distribution", "keywords": "phenotype, distribution, ratio, population"}

用户: "F2代中紫色花和白色花的比例是多少"
输出: {"intent": "phenotype_distribution", "keywords": "F2, phenotype, ratio, purple flower, white flower, distribution"}

用户: "什么是转录和翻译"
输出: {"intent": "gene_expression", "keywords": "transcription, translation, RNA, protein, expression"}

用户: "绘制家系图"
输出: {"intent": "pedigree_chart", "keywords": "pedigree, family, inheritance pattern"}

用户: "交叉互换发生在什么时期"
输出: {"intent": "cross_over_map", "keywords": "crossover, linkage, meiosis, recombination"}

用户: "基因A和基因B的交叉互换位置在哪里"
输出: {"intent": "cross_over_map", "keywords": "gene, crossover, linkage, chromosome, position"}

用户: "用孟德尔模拟器验证 Aa × Aa 的分离比例"
输出: {"intent": "mendel_simulator", "keywords": "Mendel, simulation, cross, ratio, verification"}

用户: "模拟 AaBb × AaBb 的自由组合，看看是不是 9:3:3:1"
输出: {"intent": "mendel_simulator", "keywords": "simulation, dihybrid cross, ratio, Mendel, independent assortment"}

用户: "模拟自然选择，初始种群 100 个体，50% 深色 50% 浅色"
输出: {"intent": "natural_selection_simulator", "keywords": "natural selection, population, evolution, gene frequency, adaptation"}

用户: "测试我对孟德尔遗传定律的理解"
输出: {"intent": "quiz", "keywords": "Mendel, genetics, inheritance, dominant, recessive"}

用户: "我想看视频了解DNA结构"
输出: {"intent": "video", "keywords": "DNA, structure, double helix, nucleotides"}

用户: "你好"
输出: {"intent": "greeting", "keywords": ""}

用户: "基因型和表型的区别是什么"
输出: {"intent": "general", "keywords": "genotype, phenotype, gene, inheritance"}
"""

    def _build_keyword_patterns(self) -> dict:
        """构建生物遗传学术语的正则表达式模式
        
        Returns:
            dict: 关键词类别到正则表达式模式的映射
        """
        patterns = {
            'genotype': r'(?:(?:基因型)|(?:A[ABa])|(?:[aA]a)|(?:[AB]{2})|genotype)',
            'phenotype': r'(?:(?:表型)|phenotype)',
            'inheritance': r'(?:(?:遗传)|(?:杂交)|inheritance|cross)',
            'mendel': r'(?:(?:孟德尔)|Mendel)',
            'punnett': r'(?:(?:孟德尔方格图)|(?:旁氏图)|(?:Punnett)|(?:方格图))',
            'dominant': r'(?:(?:显性)|dominant)',
            'recessive': r'(?:(?:隐性)|recessive)',
            'dna': r'(?:(?:DNA结构)|(?:DNA)|(?:碱基)|base)',
            'chromosome': r'(?:(?:染色体)|chromosome)',
            'gene': r'(?:(?:基因)|gene)',
            'mutation': r'(?:(?:变异)|(?:突变)|mutation)',
            'allele': r'(?:(?:等位基因)|allele)',
            'homozygous': r'(?:(?:纯合)|(?:同源)|homozygous)',
            'heterozygous': r'(?:(?:杂合)|heterozygous)',
            'test_cross': r'(?:(?:测交)|test.?cross)',
            'f1': r'(?:(?:F1代)|(?:F1)|(?:子一代))',
            'f2': r'(?:(?:F2代)|(?:F2)|(?:子二代))',
            'transcription': r'(?:(?:转录)|transcription)',
            'translation': r'(?:(?:翻译)|translation)',
            'expression': r'(?:(?:表达)|expression)',
            'protein': r'(?:(?:蛋白质)|protein)',
            'rna': r'(?:(?:mRNA)|(?:tRNA)|(?:rRNA)|RNA)',
            'nucleotide': r'(?:(?:核苷酸)|nucleotide)',
            'pedigree': r'(?:(?:家系)|pedigree)',
            'linkage': r'(?:(?:连锁)|linkage)',
            'crossover': r'(?:(?:交叉互换)|(?:交叉)|(?:互换)|(?:交换)|(?:交叉点)|(?:重组)|crossover|recombination)',
            'mitosis': r'(?:(?:有丝分裂)|mitosis)',
            'meiosis': r'(?:(?:减数分裂)|meiosis)',
            'gamete': r'(?:(?:配子)|gamete)',
            'zygote': r'(?:(?:合子)|zygote)',
            'genetic_engineering': r'(?:(?:基因工程)|(?:CRISPR)|(?:基因编辑)|genetic.?engineering|CRISPR|gene.?editing)',
            'double_helix': r'(?:(?:双螺旋)|(?:double.?helix))'
        }
        return patterns

    def _extract_keywords_fallback(self, user_message: str) -> str:
        """Rule-based keyword extraction fallback method.

        Used when LLM fails to extract keywords.
        Matches common genetics terminology using regex.

        Args:
            user_message: User input text

        Returns:
            str: Comma-separated keywords string
        """
        found_keywords = set()
        
        for keyword_category, pattern in self.keyword_patterns.items():
            try:
                if re.search(pattern, user_message, re.IGNORECASE | re.UNICODE):
                    found_keywords.add(keyword_category)
            except re.error as e:
                logger.warning(f"Regex pattern error for {keyword_category}: {e}")
        
        if not found_keywords:
            logger.warning(f"Rule-based keyword extraction found no keywords in: {user_message}")
            return ""
        
        keywords_str = ", ".join(sorted(found_keywords))
        logger.info(f"Rule-based keyword extraction: {keywords_str}")
        return keywords_str

    def _rule_based_intent(self, user_message: str) -> Optional[str]:
        """用规则快速判断意图，无法确定时返回 None（交给 LLM）"""
        msg = user_message.strip()

        # 问候
        if re.match(r'^(你好|嗨|hi|hello|早上好|晚上好|早|晚安)[！!。.,，?？\s]*$', msg, re.IGNORECASE):
            return 'greeting'

        # 关键词规则（越具体越靠前）
        rules = [
            ('central_dogma',               r'^中心法则|展示中心法则|演示中心法则|DNA复制|DNA.{0,3}复制|转录.{0,3}翻译|mRNA翻译|蛋白质合成|核糖体.{0,5}翻译|解旋|RNA聚合酶|中心法则演示|展示DNA复制|展示转录|展示翻译|DNA转录|mRNA翻译|遗传信息|基因转录|蛋白质合成过程|转录翻译$'),
            ('mendel_simulator',             r'模拟.{0,10}(杂交|受精)|验证.{0,10}(比例|定律)|随机受精|卡方检验|孟德尔模拟'),
            ('natural_selection_simulator',  r'自然选择|种群演化|基因频率|选择压力|适应度|捕食者|哈迪.?温伯格'),
            ('punnett_square',               r'孟德尔方格图|旁氏图|[Pp]unnett|[a-Za-z]{2}[×x\t][a-Za-z]{2}|杂交.{0,15}(后代|基因型)|测交|自交|配子'),
            ('dna_structure',                r'^DNA.{0,5}(结构|双螺旋)|双螺旋|碱基配对|核苷酸|脱氧核糖|DNA序列|碱基序列$'),
            ('cross_over_map',               r'交叉互换|基因连锁|重组频率|染色体交换|连锁.{0,10}基因'),
            ('pedigree_chart',               r'家系图|系谱图|家系图|遗传病.{0,10}(世代|家族)|X连锁|常染色体.{0,5}(显|隐)性'),
            ('gene_expression',              r'基因表达|转录.{0,5}翻译|mRNA|tRNA|rRNA|启动子|调控.{0,5}基因'),
            ('phenotype_distribution',       r'表型.{0,10}(分布|比例)|表现型.{0,10}(分布|比例)|f[12]代.{0,10}(比例|分布)|9.?3.?3.?1|显性.{0,5}隐性.{0,5}比例'),
            ('quiz',                         r'测验|测试.{0,5}(知识|理解)|出题|生成题目|考题'),
            ('video',                        r'看视频|视频讲解|演示视频|视频.{0,5}了解'),
        ]

        for intent, pattern in rules:
            if re.search(pattern, msg, re.IGNORECASE | re.UNICODE):
                return intent

        return None  # 无法确定，交给 LLM

    async def identify_intent(self, user_message: str, conversation_history: list = None) -> IntentResult:
        """Identify user intent and extract keywords

        Args:
            user_message: 当前用户消息
            conversation_history: 对话历史，格式为 [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]
        """
        # 先用规则快速判断，明确命中则直接返回，省掉一次 LLM 调用
        rule_intent = self._rule_based_intent(user_message)
        if rule_intent is not None:
            keywords = self._extract_keywords_fallback(user_message)
            logger.info(f"[规则匹配] intent={rule_intent}, keywords={keywords}")
            return IntentResult(intent=rule_intent, keywords=keywords)

        logger.info("规则未命中，调用 LLM 识别意图")
        messages = [
            {"role": "system", "content": self.system_prompt}
        ]

        # 添加对话历史上下文（最近 3 轮对话）
        if conversation_history:
            recent_history = conversation_history[-6:]  # 最近 3 轮（每轮 2 条消息）
            messages.extend(recent_history)
            logger.info(f"意图识别使用了 {len(recent_history)} 条历史消息作为上下文")
            logger.debug(f"历史消息: {[msg.get('content', '')[:50] for msg in recent_history]}")

        # 添加当前用户消息
        messages.append({"role": "user", "content": user_message})

        response_text = ""
        try:
            response_text = await self.glm_service.call_llm(
                messages=messages,
                temperature=0.1,  # 降低温度，让输出更确定
                max_tokens=1000  # 增加 token 限制，确保完整输出
            )

            logger.info(f"Intent recognition raw response: {response_text[:200]}")

            # 清理 markdown 代码块
            cleaned_text = response_text.strip()
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:]  # 移除 ```json
            if cleaned_text.startswith("```"):
                cleaned_text = cleaned_text[3:]  # 移除 ```
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]  # 移除结尾的 ```
            cleaned_text = cleaned_text.strip()

            result = json.loads(cleaned_text)

            intent = result.get("intent", "general")
            keywords = result.get("keywords", "").strip()

            logger.info(f"Identified intent: {intent}, keywords: {keywords}")

            if not keywords:
                logger.warning(f"LLM returned empty keywords, using fallback extraction")
                keywords = self._extract_keywords_fallback(user_message)

            return IntentResult(
                intent=intent,
                keywords=keywords
            )
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse intent JSON: {e}, response: {response_text}")
            return IntentResult(intent="general", keywords=self._extract_keywords_fallback(user_message))
        except Exception as e:
            logger.error(f"Error identifying intent: {e}, response: {response_text}")
            return IntentResult(intent="general", keywords=self._extract_keywords_fallback(user_message))
