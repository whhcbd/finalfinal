import json
import logging
import sys
import os
import re
from typing import Optional, List
from contextlib import asynccontextmanager
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 配置日志 - 必须在导入服务之前配置
log_dir = os.path.join(os.path.dirname(__file__), '..', 'logs')
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, 'backend.log')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(log_file, encoding='utf-8')
    ]
)

sys.path.insert(0, os.path.dirname(__file__))

from services.glm_service import GLMService
from services.rag_service import RAGService
from services.vector_store import VectorStore
from services.embedding_service import EmbeddingService
from services.intent_service import IntentService
from services.context_service import ContextService
from services.a2ui_service import get_system_prompt as get_a2ui_system_prompt, validate_and_fix_response

logger = logging.getLogger(__name__)

# 降级策略默认值常量
DEFAULT_TRAIT = "花色"
DEFAULT_GENOTYPE_1 = "Aa"
DEFAULT_GENOTYPE_2 = "aa"
DEFAULT_DNA_SEQUENCE = "ATCGATCG"
DEFAULT_DISEASE_NAME = "遗传病"
DEFAULT_INHERITANCE_PATTERN = "常染色体隐性"

# 全局服务实例
glm_service = None
rag_service = None
intent_service = None
context_service = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时初始化服务
    global glm_service, rag_service, intent_service, context_service

    logger.info("Starting up Genetics A2UI Backend...")

    try:
        glm_service = GLMService()
        logger.info("GLM Service initialized")
    except Exception as e:
        logger.error(f"Failed to initialize GLM Service: {e}")
        raise

    try:
        rag_service = RAGService(vector_store=None)
        logger.info("RAG Service initialized (will be lazy loaded on first use)")
    except Exception as e:
        logger.warning(f"Failed to initialize RAG Service: {e}")
        logger.warning("Continuing without RAG service - context retrieval will be disabled")
        rag_service = None

    try:
        intent_service = IntentService(glm_service)
        logger.info("Intent Service initialized")
    except Exception as e:
        logger.error(f"Failed to initialize Intent Service: {e}")
        raise

    try:
        context_service = ContextService()
        logger.info("Context Service initialized")
    except Exception as e:
        logger.error(f"Failed to initialize Context Service: {e}")
        raise

    logger.info("Core services initialized successfully")

    yield

    # 关闭时清理（如果需要）
    logger.info("Shutting down Genetics A2UI Backend...")

app = FastAPI(title="Genetics A2UI Backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEXT_ONLY_INSTRUCTION = """你是一位遗传学教学助手。请用中文提供详细、准确的解释。

⚠️ 严格规则 - 你必须遵守：
1. 只提供纯文本解释（2-4 段落）
2. 绝对不要包含任何 JSON 代码
3. 绝对不要包含任何 A2UI 格式
4. 绝对不要使用分隔符（如 ---a2ui_JSON---）
5. 绝对不要包含代码块
6. 绝对不要使用 markdown 代码围栏（```json, ```）
7. 绝对不要输出数组 [] 或对象 {}
8. 绝对不要在文本后面添加任何结构化数据
9. 只提供清晰的教育性文本，用中文书写
10. 保持回答简洁明了

你的回答应该是纯文本段落，就像在课堂上向学生解释概念一样。不要添加任何技术格式或数据结构。"""

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    use_ui: bool = True
    context: Optional[List[dict]] = None
    history: Optional[List[dict]] = None

class ChatResponse(BaseModel):
    text: str
    a2ui: Optional[List[dict]] = None
    session_id: str
    intent: Optional[str] = None
    keywords: Optional[str] = None


def get_system_prompt(use_ui: bool = True, intent: str = None) -> str:
    """获取系统提示词

    使用 a2ui_service 提供的标准化 System Prompt
    它已经包含了 genetics_catalog.json 中的所有组件定义和示例

    Args:
        use_ui: 是否使用 UI 模式
        intent: 用户意图，用于加载对应的示例
    """
    if not use_ui:
        return TEXT_ONLY_INSTRUCTION

    # 使用 a2ui_service 提供的标准化 System Prompt
    # 它已经包含了 genetics_catalog.json 中的所有组件定义和示例
    return get_a2ui_system_prompt(use_ui=True, intent=intent)


def fix_a2ui_wrappers(a2ui_data):
    """自动为 A2UI JSON 添加类型包装器

    LLM 有时会忘记使用 literalString, literalBoolean 等包装器
    这个函数会自动检测并添加缺失的包装器
    """
    if not isinstance(a2ui_data, list):
        return a2ui_data

    fixed_count = 0

    for message in a2ui_data:
        if "surfaceUpdate" in message:
            components = message["surfaceUpdate"].get("components", [])
            for comp in components:
                if "component" in comp:
                    for comp_name, comp_props in comp["component"].items():
                        if isinstance(comp_props, dict):
                            for prop_name, prop_value in list(comp_props.items()):
                                # 如果值不是字典（即没有包装器），添加包装器
                                if not isinstance(prop_value, dict):
                                    if isinstance(prop_value, str):
                                        comp_props[prop_name] = {"literalString": prop_value}
                                        fixed_count += 1
                                        logger.debug(f"🔧 添加 literalString 包装器: {prop_name} = {prop_value}")
                                    elif isinstance(prop_value, bool):
                                        comp_props[prop_name] = {"literalBoolean": prop_value}
                                        fixed_count += 1
                                        logger.debug(f"🔧 添加 literalBoolean 包装器: {prop_name} = {prop_value}")
                                    elif isinstance(prop_value, (int, float)):
                                        comp_props[prop_name] = {"literalNumber": prop_value}
                                        fixed_count += 1
                                        logger.debug(f"🔧 添加 literalNumber 包装器: {prop_name} = {prop_value}")
                                    elif isinstance(prop_value, list):
                                        comp_props[prop_name] = {"literalArray": prop_value}
                                        fixed_count += 1
                                        logger.debug(f"🔧 添加 literalArray 包装器: {prop_name}")

    if fixed_count > 0:
        logger.info(f"✅ 自动修复了 {fixed_count} 个缺失的类型包装器")

    return a2ui_data


def validate_component_structure(a2ui_data, intent):
    """验证组件数据结构是否正确

    检查关键属性是否为正确的类型
    如果发现结构性错误，返回False以触发降级
    """
    if not isinstance(a2ui_data, list) or len(a2ui_data) < 2:
        return True  # 基本结构问题会在其他地方处理

    try:
        for message in a2ui_data:
            if "surfaceUpdate" in message:
                components = message["surfaceUpdate"].get("components", [])
                for comp in components:
                    if "component" in comp:
                        for comp_name, comp_props in comp["component"].items():
                            # 验证PedigreeChart
                            if comp_name == "PedigreeChart":
                                generations = comp_props.get("generations", {})
                                # 检查generations是否为数组（可能被包装在literalArray中）
                                if isinstance(generations, dict) and "literalArray" in generations:
                                    gen_array = generations["literalArray"]
                                elif isinstance(generations, list):
                                    gen_array = generations
                                else:
                                    # generations不是数组，是错误的格式
                                    logger.warning(f"❌ PedigreeChart.generations 格式错误: {type(generations).__name__} = {generations}")
                                    return False

                                # 验证数组内容
                                if not isinstance(gen_array, list) or len(gen_array) == 0:
                                    logger.warning(f"❌ PedigreeChart.generations 为空或格式错误")
                                    return False

                            # 验证GeneExpression
                            elif comp_name == "GeneExpression":
                                genes = comp_props.get("genes", {})
                                if isinstance(genes, dict) and "literalArray" in genes:
                                    gene_array = genes["literalArray"]
                                elif isinstance(genes, list):
                                    gene_array = genes
                                else:
                                    logger.warning(f"❌ GeneExpression.genes 格式错误")
                                    return False

                                # 验证genes数组中的对象结构
                                if isinstance(gene_array, list) and len(gene_array) > 0:
                                    first_gene = gene_array[0]
                                    if isinstance(first_gene, str):
                                        # 错误：应该是对象数组，不是字符串数组
                                        logger.warning(f"❌ GeneExpression.genes 应该是对象数组，不是字符串数组")
                                        return False

                            # 验证CrossOverMap
                            elif comp_name == "CrossOverMap":
                                # 检查是否使用了错误的属性名
                                if "chromosome1" in comp_props or "chromosome2" in comp_props:
                                    logger.warning(f"❌ CrossOverMap 使用了错误的属性名 (chromosome1/chromosome2)")
                                    return False

        return True
    except Exception as e:
        logger.error(f"验证组件结构时出错: {e}")
        return True  # 出错时不阻止，让后续逻辑处理


async def generate_local_a2ui(intent: str, keywords: str, text: str, user_message: str = "") -> list:
    """本地降级生成 A2UI

    根据意图选择合适的组件，而不是只用通用组件
    参数格式严格遵循 genetics_catalog.json 和示例文件
    """
    try:
        logger.info(f"使用本地降级生成 A2UI: intent={intent}, keywords={keywords}")

        a2ui_content = [
            {
                "beginRendering": {
                    "surfaceId": "genetics_ui",
                    "root": "main_component"
                }
            }
        ]

        # 根据意图选择组件
        if intent == "punnett_square":
            # 提取基因型 - 只从用户问题中提取
            # 支持多基因位点：Aa, AaBb, AaBbCc, aabb, AABB 等
            # 匹配模式：连续的成对字母（每对是一个基因位点）
            # 例如：Aa (单基因), AaBb (双基因), aabb (双基因纯合), AABB (双基因纯合)

            # 先尝试匹配多基因位点（4个或更多字母的基因型）
            multi_loci = re.findall(r'(?<![A-Za-z])([A-Za-z]{4,})(?![A-Za-z])', user_message)

            # 过滤出有效的基因型（必须是偶数长度，且只包含A-Z和a-z）
            valid_multi = []
            for g in multi_loci:
                if len(g) % 2 == 0 and all(c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz' for c in g):
                    valid_multi.append(g)

            # 再匹配单基因位点（2个字母）
            single_loci = re.findall(r'(?<![A-Za-z])([A-Z][a-z]|[A-Z]{2}|[a-z]{2})(?![A-Za-z])', user_message)

            # 合并结果：优先使用多基因位点
            all_genotypes = valid_multi + single_loci

            # 去重并保持顺序
            seen = set()
            unique_genotypes = []
            for g in all_genotypes:
                if g not in seen:
                    seen.add(g)
                    unique_genotypes.append(g)

            # 如果找到基因型，使用它们；否则使用默认值
            if len(unique_genotypes) >= 2:
                parent1 = unique_genotypes[0]
                parent2 = unique_genotypes[1]
            elif len(unique_genotypes) == 1:
                # 如果只找到一个基因型，两个亲本都用它（自交）
                parent1 = parent2 = unique_genotypes[0]
            else:
                # 没找到基因型，使用默认值
                parent1 = DEFAULT_GENOTYPE_1
                parent2 = DEFAULT_GENOTYPE_2

            logger.info(f"提取的基因型: parent1={parent1}, parent2={parent2}")

            a2ui_content.append({
                "surfaceUpdate": {
                    "surfaceId": "genetics_ui",
                    "components": [
                        {
                            "id": "main_component",
                            "component": {
                                "PunnettSquare": {
                                    "parent1Genotype": {"literalString": parent1},
                                    "parent2Genotype": {"literalString": parent2},
                                    "trait": {"literalString": DEFAULT_TRAIT},
                                    "showPhenotype": {"literalBoolean": True}
                                }
                            }
                        }
                    ]
                }
            })

        elif intent == "dna_structure":
            # 提取 DNA 序列
            sequences = re.findall(r'[ATCGatcg]{3,}', text)
            sequence = sequences[0] if sequences else DEFAULT_DNA_SEQUENCE

            a2ui_content.append({
                "surfaceUpdate": {
                    "surfaceId": "genetics_ui",
                    "components": [
                        {
                            "id": "main_component",
                            "component": {
                                "DNAStructure": {
                                    "sequence": {"literalString": sequence},
                                    "showLabels": {"literalBoolean": True},
                                    "highlightRegions": {"literalArray": []}
                                }
                            }
                        }
                    ]
                }
            })

        elif intent == "phenotype_distribution":
            a2ui_content.append({
                "surfaceUpdate": {
                    "surfaceId": "genetics_ui",
                    "components": [
                        {
                            "id": "main_component",
                            "component": {
                                "PhenotypeDistribution": {
                                    "trait": {"literalString": DEFAULT_TRAIT},
                                    "data": {"literalArray": [
                                        {"phenotype": "紫色花", "count": 750, "percentage": 75},
                                        {"phenotype": "白色花", "count": 250, "percentage": 25}
                                    ]},
                                    "totalCount": {"literalNumber": 1000},
                                    "showPercentage": {"literalBoolean": True}
                                }
                            }
                        }
                    ]
                }
            })

        elif intent == "gene_expression":
            # 使用前端组件实际接受的参数：genes, expressionLevels, conditions
            a2ui_content.append({
                "surfaceUpdate": {
                    "surfaceId": "genetics_ui",
                    "components": [
                        {
                            "id": "main_component",
                            "component": {
                                "GeneExpression": {
                                    "genes": {"literalArray": [
                                        {"gene": "GeneA", "expressionLevels": [10, 15]}
                                    ]},
                                    "expressionLevels": {"literalArray": [[10, 15]]},
                                    "conditions": {"literalArray": [
                                        {"name": "肝脏", "color": "#1a73e8"},
                                        {"name": "大脑", "color": "#188038"}
                                    ]}
                                }
                            }
                        }
                    ]
                }
            })

        elif intent == "pedigree_chart":
            a2ui_content.append({
                "surfaceUpdate": {
                    "surfaceId": "genetics_ui",
                    "components": [
                        {
                            "id": "main_component",
                            "component": {
                                "PedigreeChart": {
                                    "generations": {"literalArray": [
                                        {
                                            "individuals": [
                                                {"id": "1", "gender": "male", "phenotype": "normal", "generation": 0},
                                                {"id": "2", "gender": "female", "phenotype": "carrier", "generation": 0}
                                            ]
                                        },
                                        {
                                            "individuals": [
                                                {"id": "3", "gender": "male", "phenotype": "normal", "generation": 1, "parents": {"father": "1", "mother": "2"}},
                                                {"id": "4", "gender": "female", "phenotype": "carrier", "generation": 1, "parents": {"father": "1", "mother": "2"}},
                                                {"id": "5", "gender": "male", "phenotype": "affected", "generation": 1, "parents": {"father": "1", "mother": "2"}}
                                            ]
                                        },
                                        {
                                            "individuals": [
                                                {"id": "6", "gender": "female", "phenotype": "normal", "generation": 2, "parents": {"father": "3", "mother": "4"}},
                                                {"id": "7", "gender": "male", "phenotype": "carrier", "generation": 2, "parents": {"father": "3", "mother": "4"}}
                                            ]
                                        }
                                    ]},
                                    "trait": {"literalString": DEFAULT_DISEASE_NAME}
                                }
                            }
                        }
                    ]
                }
            })

        elif intent == "cross_over_map":
            a2ui_content.append({
                "surfaceUpdate": {
                    "surfaceId": "genetics_ui",
                    "components": [
                        {
                            "id": "main_component",
                            "component": {
                                "CrossOverMap": {
                                    "chromosomeLength": {"literalNumber": 100},
                                    "genes": {"literalArray": [
                                        {"name": "GeneA", "position": 20, "color": "#1a73e8"},
                                        {"name": "GeneB", "position": 60, "color": "#188038"}
                                    ]},
                                    "crossoverPoints": {"literalArray": [
                                        {"position": 40, "label": "交叉点1"}
                                    ]}
                                }
                            }
                        }
                    ]
                }
            })

        elif intent == "quiz":
            a2ui_content.append({
                "surfaceUpdate": {
                    "surfaceId": "genetics_ui",
                    "components": [
                        {
                            "id": "main_component",
                            "component": {
                                "Container": {
                                    "children": [
                                        {
                                            "id": "quiz_text",
                                            "component": {
                                                "Text": {
                                                    "text": {"literalString": f"基于关键词 {keywords if keywords else '遗传学'} 的测验题目正在生成中...\n\n{text[:300]}..."}
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    ]
                }
            })

        elif intent == "video":
            a2ui_content.append({
                "surfaceUpdate": {
                    "surfaceId": "genetics_ui",
                    "components": [
                        {
                            "id": "main_component",
                            "component": {
                                "Container": {
                                    "children": [
                                        {
                                            "id": "video_text",
                                            "component": {
                                                "Text": {
                                                    "text": {"literalString": f"关于 {keywords if keywords else '遗传学'} 的视频资源正在准备中...\n\n{text[:300]}..."}
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    ]
                }
            })

        else:  # general 或 greeting
            # 使用 Flashcard 展示关键概念（前端已有 flashcard.ts 组件）
            lines = text.split('\n')
            question = ""
            answer = ""
            for i, line in enumerate(lines):
                if line.startswith('#') or '是什么' in line or '什么是' in line:
                    question = line.replace('#', '').replace('是什么', '').replace('什么是', '').strip()
                    if question and i + 1 < len(lines):
                        answer = '\n'.join(lines[i+1:i+6])
                        break

            if not question:
                question = keywords if keywords else "遗传学概念"
            if not answer:
                answer = text[:500]

            a2ui_content.append({
                "surfaceUpdate": {
                    "surfaceId": "genetics_ui",
                    "components": [
                        {
                            "id": "main_component",
                            "component": {
                                "Flashcard": {
                                    "front": question,
                                    "back": answer,
                                    "category": "基本概念"
                                }
                            }
                        }
                    ]
                }
            })

        a2ui_content.append({
            "dataModelUpdate": {
                "surfaceId": "genetics_ui",
                "contents": [
                    {
                        "key": "_fallback",
                        "valueBoolean": True
                    }
                ]
            }
        })

        return a2ui_content

    except Exception as e:
        logger.error(f"本地降级生成 A2UI 失败: {e}")
        return []


@app.post("/api/chat")
async def chat(request: ChatRequest):
    global glm_service, rag_service, intent_service, context_service

    logger.info(f"收到聊天请求: message={request.message[:100]}..., session_id={request.session_id}, use_ui={request.use_ui}")

    # 意图识别
    intent_result = await intent_service.identify_intent(request.message)
    intent = intent_result.get("intent", "general")
    keywords = intent_result.get("keywords", "")

    logger.info(f"意图识别结果: intent={intent}, keywords={keywords}")

    # 判断是否需要使用A2UI组件
    # 只有以下意图才需要可视化组件
    UI_REQUIRED_INTENTS = [
        "punnett_square",
        "dna_structure",
        "phenotype_distribution",
        "gene_expression",
        "pedigree_chart",
        "cross_over_map"
    ]

    should_use_ui = request.use_ui and (intent in UI_REQUIRED_INTENTS)
    logger.info(f"是否使用A2UI: {should_use_ui} (intent={intent}, request.use_ui={request.use_ui})")

    # 上下文检索
    context_info = ""
    if rag_service and not rag_service._disabled:
        try:
            context_info = await rag_service.get_context_for_query(request.message)
            if context_info:
                logger.info(f"成功检索到相关上下文，长度: {len(context_info)} 字符")
        except Exception as e:
            logger.warning(f"RAG 检索失败: {e}")
            context_info = ""

    # 构建 LLM 消息
    system_prompt_text_only = TEXT_ONLY_INSTRUCTION  # 使用纯文本 prompt，不包含 A2UI schema

    user_message = request.message
    if context_info:
        user_message = f"相关上下文：\n{context_info}\n\n用户问题：{request.message}"

    messages = [
        {"role": "system", "content": system_prompt_text_only},
        {"role": "user", "content": user_message}
    ]

    # 生成文本响应
    text_response = await glm_service.call_llm(messages)
    logger.info(f"LLM 文本响应（原始）: {text_response[:200]}...")

    # 增强的清理逻辑：移除任何意外的JSON或分隔符
    # 1. 检查并移除 a2ui 分隔符（支持多种格式）
    delimiter_patterns = [
        r'---\s*a2ui_JSON\s*---',  # 标准格式，允许空格
        r'---a2ui_JSON---',         # 精确格式
        r'---\s*a2ui\s*---',        # 简化格式
        r'\n\s*\[',                 # 检测换行后直接跟 JSON 数组
    ]

    for pattern in delimiter_patterns:
        if re.search(pattern, text_response, re.IGNORECASE):
            logger.warning(f"⚠️ 检测到文本响应中包含分隔符模式: {pattern}")
            # 使用正则表达式分割，取第一部分
            parts = re.split(pattern, text_response, maxsplit=1, flags=re.IGNORECASE)
            text_response = parts[0].strip()
            logger.info(f"✅ 清理后的文本响应: {text_response[:200]}...")
            break

    # 2. 移除 markdown 代码块
    if "```" in text_response:
        logger.warning("⚠️ 检测到文本响应中包含代码块，正在清理...")
        text_response = re.sub(r'```json.*?```', '', text_response, flags=re.DOTALL)
        text_response = re.sub(r'```.*?```', '', text_response, flags=re.DOTALL)
        text_response = text_response.strip()
        logger.info(f"✅ 清理后的文本响应: {text_response[:200]}...")

    # 3. 移除任何看起来像 JSON 数组或对象的内容
    # 检测从换行符开始的 JSON 结构
    json_pattern = r'\n\s*[\[{][\s\S]*$'
    if re.search(json_pattern, text_response):
        logger.warning("⚠️ 检测到文本响应末尾包含 JSON 结构，正在清理...")
        text_response = re.sub(json_pattern, '', text_response).strip()
        logger.info(f"✅ 清理后的文本响应: {text_response[:200]}...")

    # 4. 最终清理：确保没有尾随的特殊字符
    text_response = text_response.strip()

    a2ui_data = None

    if should_use_ui:
        logger.info("开始 A2UI 组件生成...")
        try:
            ui_messages = [
                {"role": "system", "content": get_system_prompt(use_ui=True, intent=intent)},
                {"role": "user", "content": f"""用户问题：{request.message}

意图类型：{intent}

请生成 A2UI JSON 数组。

⚠️ 关键要求：

1. 你必须使用以下自定义遗传学组件之一：
   - PunnettSquare（用于遗传杂交）
   - DNAStructure（用于 DNA 序列）
   - PhenotypeDistribution（用于表型比例）
   - GeneExpression（用于基因表达水平）
   - PedigreeChart（用于家系遗传图）
   - CrossOverMap（用于染色体交叉互换）

2. 禁止使用标准组件：Container、Column、Row、Text、Card

3. JSON 结构（严格遵守）：
   - 第一个消息：beginRendering，设置 surfaceId="genetics_ui" 和 root="main_component"
   - 第二个消息：surfaceUpdate，包含组件定义
   - ⚠️ 组件的 id 必须是 "main_component"（不能是其他名称如 "crossover", "punnett" 等）

4. 输出格式（严格遵守）：
   - 只输出 JSON 数组，不要有任何其他内容
   - 不要包含任何解释文本
   - 不要使用 markdown 代码块（```json）
   - 不要使用分隔符（---a2ui_JSON---）
   - 直接输出 JSON 数组

示例格式（注意 id 必须是 "main_component"）：
[
  {{"beginRendering": {{"surfaceId": "genetics_ui", "root": "main_component"}}}},
  {{"surfaceUpdate": {{"surfaceId": "genetics_ui", "components": [
    {{"id": "main_component", "component": {{"CrossOverMap": {{...}}}}}}
  ]}}}}
]

现在生成 JSON："""}
            ]

            # 使用 JSON 模式调用 LLM
            ui_response = await glm_service.call_llm(
                ui_messages,
                response_format="json"
            )
            logger.info(f"LLM A2UI 响应: {ui_response[:500]}...")

            # 直接解析 JSON，不需要分隔符
            try:
                a2ui_data = json.loads(ui_response.strip())
                logger.info(f"成功解析 A2UI JSON，包含 {len(a2ui_data)} 个消息")

                # 🔧 自动修复：为缺少包装器的属性值添加包装器
                a2ui_data = fix_a2ui_wrappers(a2ui_data)
                logger.info("✅ A2UI JSON 包装器检查完成")

                # 🔍 验证组件数据结构
                is_valid = validate_component_structure(a2ui_data, intent)
                if not is_valid:
                    logger.warning(f"⚠️ 组件数据结构验证失败，使用降级数据")
                    a2ui_data = None

            except json.JSONDecodeError as e:
                logger.error(f"JSON 解析失败: {e}")
                logger.debug(f"解析失败的响应内容: {ui_response[:1000]}")
                a2ui_data = None

            # 如果 A2UI 生成失败，使用本地降级
            if not a2ui_data:
                logger.warning("A2UI 生成失败或验证未通过，使用本地降级策略")
                logger.info(f"降级参数 - 意图: {intent}, 关键词: '{keywords}', 文本长度: {len(text_response)}")
                a2ui_data = await generate_local_a2ui(intent, keywords, text_response, request.message)
                if a2ui_data:
                    logger.info(f"成功生成本地降级 A2UI，包含 {len(a2ui_data)} 个消息")

        except Exception as e:
            logger.error(f"❌ A2UI 生成失败: {e}")
            logger.info("🔄 使用降级策略生成 A2UI")
            a2ui_data = await generate_local_a2ui(intent, keywords, text_response, request.message)

    # 管理会话上下文
    if request.session_id:
        context_service.add_message(request.session_id, request.message, text_response)

    return ChatResponse(
        text=text_response,
        a2ui=a2ui_data,
        session_id=request.session_id or "default",
        intent=intent,
        keywords=keywords
    )


@app.get("/")
async def root():
    return {"message": "Genetics A2UI Backend API", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "healthy", "services": {
        "glm": glm_service is not None,
        "rag": rag_service is not None,
        "intent": intent_service is not None,
        "context": context_service is not None
    }}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
