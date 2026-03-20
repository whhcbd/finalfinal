import asyncio
import json
import logging
import sys
import os
import re
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
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
from services.data_model_service import DataModelService
from services.action_handler import ActionHandler
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
glm_fast_service = None  # 用于文本生成的快速模型
rag_service = None
intent_service = None
context_service = None
data_model_service = None
action_handler = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时初始化服务
    global glm_service, glm_fast_service, rag_service, intent_service, context_service, data_model_service, action_handler

    logger.info("Starting up Genetics A2UI Backend...")

    try:
        glm_service = GLMService()  # glm-4.7，用于 A2UI 生成
        glm_fast_service = GLMService(model="glm-4-flash")  # 快速模型，用于文本生成
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

    try:
        data_model_service = DataModelService()
        logger.info("Data Model Service initialized")
    except Exception as e:
        logger.error(f"Failed to initialize Data Model Service: {e}")
        raise

    try:
        action_handler = ActionHandler(glm_service, data_model_service, context_service)
        logger.info("Action Handler initialized")
    except Exception as e:
        logger.error(f"Failed to initialize Action Handler: {e}")
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

    # 确保所有遗传学自定义组件都有 interactive 属性
    interactive_components = {'DNAStructure', 'PunnettSquare', 'PhenotypeDistribution', 'GeneExpression', 'PedigreeChart', 'CrossOverMap', 'CentralDogma'}
    for message in a2ui_data:
        if 'surfaceUpdate' in message:
            components = message['surfaceUpdate'].get('components', [])
            for comp in components:
                if 'component' in comp:
                    for comp_name, comp_props in comp['component'].items():
                        if comp_name in interactive_components and isinstance(comp_props, dict):
                            if 'interactive' not in comp_props:
                                comp_props['interactive'] = {'literalBoolean': True}
                                logger.debug(f'🔧 注入 interactive 属性: {comp_name}')

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
                                    "highlightRegions": {"literalArray": []},
                                    "interactive": {"literalBoolean": True}
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
                                    "showPercentage": {"literalBoolean": True},
                                    "interactive": {"literalBoolean": True}
                                }
                            }
                        }
                    ]
                }
            })

        elif intent == "central_dogma":
            a2ui_content.append({
                "surfaceUpdate": {
                    "surfaceId": "genetics_ui",
                    "components": [
                        {
                            "id": "main_component",
                            "component": {
                                "CentralDogma": {
                                    "dnaSequence": {"literalString": "ATCGATCG"},
                                    "animationSpeed": {"literalNumber": 1000},
                                    "phase": {"literalString": "idle"}
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
                                    ]},
                                    "interactive": {"literalBoolean": True}
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
                                    "trait": {"literalString": DEFAULT_DISEASE_NAME},
                                    "interactive": {"literalBoolean": True}
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
                                    ]},
                                    "interactive": {"literalBoolean": True}
                                }
                            }
                        }
                    ]
                }
            })

        elif intent == "mendel_simulator":
            # 从用户消息中提取基因型
            genotypes = re.findall(r'(?<![A-Za-z])([A-Za-z]{2,4})(?![A-Za-z])', user_message)
            parent1 = "Aa"
            parent2 = "Aa"
            trait_type = "single"

            if len(genotypes) >= 2:
                parent1 = genotypes[0]
                parent2 = genotypes[1]
                if len(parent1) == 4 and len(parent2) == 4:
                    trait_type = "double"
            elif len(genotypes) == 1:
                parent1 = parent2 = genotypes[0]
                if len(parent1) == 4:
                    trait_type = "double"

            logger.info(f"孟德尔模拟器: parent1={parent1}, parent2={parent2}, trait_type={trait_type}")

            a2ui_content.append({
                "surfaceUpdate": {
                    "surfaceId": "genetics_ui",
                    "components": [
                        {
                            "id": "main_component",
                            "component": {
                                "MendelSimulator": {
                                    "parent1Genotype": {"literalString": parent1},
                                    "parent2Genotype": {"literalString": parent2},
                                    "traitType": {"literalString": trait_type},
                                    "simulationCount": {"literalNumber": 1000},
                                    "interactive": {"literalBoolean": True}
                                }
                            }
                        }
                    ]
                }
            })

        elif intent == "natural_selection_simulator":
            a2ui_content.append({
                "surfaceUpdate": {
                    "surfaceId": "genetics_ui",
                    "components": [
                        {
                            "id": "main_component",
                            "component": {
                                "NaturalSelectionSimulator": {
                                    "populationSize": {"literalNumber": 100},
                                    "initialDarkFrequency": {"literalNumber": 0.5},
                                    "environmentColor": {"literalString": "dark"},
                                    "generations": {"literalNumber": 50},
                                    "interactive": {"literalBoolean": True}
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

    # 构建对话历史（用于意图识别的上下文）
    conversation_history = []
    if request.history:
        # 将前端传来的历史转换为标准格式
        for msg in request.history[-6:]:  # 最近 3 轮对话
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if content:
                conversation_history.append({"role": role, "content": content})

    # 意图识别（带上下文）
    intent_result = await intent_service.identify_intent(request.message, conversation_history)
    intent = intent_result.get("intent", "general")
    keywords = intent_result.get("keywords", "")

    logger.info(f"意图识别结果: intent={intent}, keywords={keywords}")
    if conversation_history:
        logger.info(f"使用了 {len(conversation_history)} 条历史消息作为上下文")

    # 判断是否需要使用A2UI组件
    # 只有以下意图才需要可视化组件
    UI_REQUIRED_INTENTS = [
        "punnett_square",
        "dna_structure",
        "phenotype_distribution",
        "gene_expression",
        "pedigree_chart",
        "cross_over_map",
        "mendel_simulator",
        "natural_selection_simulator",
        "central_dogma"
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
    try:
        text_response = await glm_service.call_llm(messages)
        logger.info(f"LLM 文本响应（原始）: {text_response[:200]}...")
    except Exception as e:
        logger.error(f"生成文本响应失败: {e}")
        # 返回友好的错误信息
        error_message = "抱歉，AI 服务暂时无法响应。这可能是由于网络连接问题或服务器繁忙。请稍后重试。"
        raise HTTPException(status_code=500, detail=error_message)

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


@app.get("/api/quiz/questions")
async def get_quiz_questions(category: str):
    """获取指定类别的测验题目"""
    try:
        from data.quiz_questions import QUIZ_QUESTIONS
        return QUIZ_QUESTIONS.get(category, [])
    except Exception as e:
        logger.error(f"Failed to load quiz questions: {e}")
        return []


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


# WebSocket 连接管理器
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        self.active_connections[session_id] = websocket
        logger.info(f"WebSocket 连接建立: session_id={session_id}")

    def disconnect(self, session_id: str):
        if session_id in self.active_connections:
            del self.active_connections[session_id]
            logger.info(f"WebSocket 连接断开: session_id={session_id}")

    async def send_message(self, session_id: str, message: dict):
        if session_id in self.active_connections:
            websocket = self.active_connections[session_id]
            await websocket.send_json(message)

    async def send_text(self, session_id: str, text: str):
        if session_id in self.active_connections:
            websocket = self.active_connections[session_id]
            await websocket.send_text(text)


manager = ConnectionManager()


@app.websocket("/ws/chat/{session_id}")
async def websocket_chat(websocket: WebSocket, session_id: str):
    """WebSocket 聊天端点"""
    await manager.connect(websocket, session_id)

    try:
        while True:
            # 接收客户端消息
            data = await websocket.receive_json()
            logger.info(f"收到 WebSocket 消息: session_id={session_id}, type={data.get('type')}")

            message_type = data.get("type")

            if message_type == "chat":
                # 处理聊天消息
                await handle_chat_message(websocket, session_id, data)

            elif message_type == "action":
                # 处理用户操作（按钮点击等）
                await handle_action_message(websocket, session_id, data)

            else:
                logger.warning(f"未知的消息类型: {message_type}")
                await websocket.send_json({
                    "type": "error",
                    "message": f"未知的消息类型: {message_type}"
                })

    except WebSocketDisconnect:
        manager.disconnect(session_id)
        logger.info(f"客户端断开连接: session_id={session_id}")

    except Exception as e:
        logger.error(f"WebSocket 错误: {e}")
        manager.disconnect(session_id)


async def handle_chat_message(websocket: WebSocket, session_id: str, data: dict):
    """处理聊天消息"""
    global glm_service, glm_fast_service, rag_service, intent_service, context_service

    message = data.get("message", "")
    use_ui = data.get("use_ui", True)
    history = data.get("history", [])

    logger.info(f"处理聊天消息: message={message[:100]}..., use_ui={use_ui}")

    try:
        # 构建对话历史
        conversation_history = []
        if history:
            for msg in history[-6:]:
                role = msg.get("role", "user")
                content = msg.get("content", "")
                if content:
                    conversation_history.append({"role": role, "content": content})

        # 意图识别
        intent_result = await intent_service.identify_intent(message, conversation_history)
        intent = intent_result.get("intent", "general")
        keywords = intent_result.get("keywords", "")

        logger.info(f"意图识别结果: intent={intent}, keywords={keywords}")

        # 判断是否需要使用A2UI组件
        UI_REQUIRED_INTENTS = [
            "punnett_square",
            "dna_structure",
            "phenotype_distribution",
            "gene_expression",
            "pedigree_chart",
            "cross_over_map",
            "mendel_simulator",
            "natural_selection_simulator",
            "central_dogma"
        ]

        should_use_ui = use_ui and (intent in UI_REQUIRED_INTENTS)

        # 问候/闲聊直接返回固定回复，跳过 RAG 和 LLM
        NO_RAG_INTENTS = {"greeting", "chitchat", "farewell"}
        if intent in NO_RAG_INTENTS:
            greeting_reply = "你好！我是遗传学教学助手，可以帮你解答遗传学相关问题，也可以通过互动图表来展示遗传学概念。请问有什么我可以帮助你的？"
            await websocket.send_json({"type": "text_chunk", "chunk": greeting_reply})
            await websocket.send_json({"type": "text", "text": greeting_reply, "intent": intent, "keywords": keywords})
            await websocket.send_json({"type": "complete"})
            context_service.add_message(session_id, message, greeting_reply)
            logger.info(f"[快速回复] greeting/chitchat，跳过 RAG 和 LLM")
            return

        # 上下文检索
        context_info = ""
        if rag_service and not rag_service._disabled:
            try:
                context_info = await rag_service.get_context_for_query(message)
                if context_info:
                    logger.info(f"成功检索到相关上下文，长度: {len(context_info)} 字符")
            except Exception as e:
                logger.warning(f"RAG 检索失败: {e}")

        # 构建 LLM 消息
        system_prompt_text_only = TEXT_ONLY_INSTRUCTION
        user_message = message
        if context_info:
            user_message = f"相关上下文：\n{context_info}\n\n用户问题：{message}"

        messages = [
            {"role": "system", "content": system_prompt_text_only},
            {"role": "user", "content": user_message}
        ]

        # 生成文本响应（流式，逐 token 推送）
        text_chunks = []
        async for chunk in glm_fast_service.call_llm_stream(messages):
            text_chunks.append(chunk)
            await websocket.send_json({
                "type": "text_chunk",
                "chunk": chunk
            })

        text_response = "".join(text_chunks)
        logger.info(f"LLM 文本响应: {text_response[:200]}...")

        # 清理文本响应
        text_response = clean_text_response(text_response)

        # 发送完整文本（用于历史记录）
        await websocket.send_json({
            "type": "text",
            "text": text_response,
            "intent": intent,
            "keywords": keywords
        })

        # 先发完成信号，前端可以立即解除等待、显示文字
        await websocket.send_json({"type": "complete"})
        logger.info("发送完成信号")

        # 管理会话上下文
        context_service.add_message(session_id, message, text_response)

        # A2UI 在后台异步生成，完成后单独推送（不阻塞 complete）
        if should_use_ui:
            logger.info("启动后台 A2UI 生成任务...")
            asyncio.create_task(
                _generate_and_send_a2ui(websocket, intent, keywords, text_response, message, session_id)
            )
        else:
            # 无 A2UI，立即通知前端关闭 loading
            await websocket.send_json({"type": "a2ui_complete"})

    except Exception as e:
        logger.error(f"处理聊天消息失败: {e}")
        await websocket.send_json({
            "type": "error",
            "message": "抱歉，处理您的消息时出现错误，请稍后重试。"
        })


async def _generate_and_send_a2ui(websocket: WebSocket, intent: str, keywords: str, text: str, user_message: str, session_id: str):
    """后台生成 A2UI 并推送，不阻塞 complete 信号"""
    try:
        a2ui_data = await generate_a2ui_component(intent, keywords, text, user_message, session_id)
        if a2ui_data:
            for a2ui_message in a2ui_data:
                await websocket.send_json({
                    "type": "a2ui",
                    "message": a2ui_message
                })
                logger.info(f"[后台] 发送 A2UI 消息: {list(a2ui_message.keys())}")
            await websocket.send_json({"type": "a2ui_complete"})
            logger.info("[后台] A2UI 发送完成")
    except Exception as e:
        logger.error(f"[后台] A2UI 生成失败: {e}")


async def handle_action_message(websocket: WebSocket, session_id: str, data: dict):
    """处理用户操作消息（按钮点击等）"""
    global action_handler

    logger.info(f"处理 action 消息: {data}")

    try:
        await action_handler.handle_action(websocket, session_id, data)
    except Exception as e:
        logger.error(f"处理 action 消息失败: {e}")
        await websocket.send_json({
            "type": "error",
            "message": f"处理操作失败: {str(e)}"
        })


def clean_text_response(text: str) -> str:
    """清理文本响应，移除意外的JSON或分隔符"""
    delimiter_patterns = [
        r'---\s*a2ui_JSON\s*---',
        r'---a2ui_JSON---',
        r'---\s*a2ui\s*---',
        r'\n\s*\[',
    ]

    for pattern in delimiter_patterns:
        if re.search(pattern, text, re.IGNORECASE):
            parts = re.split(pattern, text, maxsplit=1, flags=re.IGNORECASE)
            text = parts[0].strip()
            break

    if "```" in text:
        text = re.sub(r'```json.*?```', '', text, flags=re.DOTALL)
        text = re.sub(r'```.*?```', '', text, flags=re.DOTALL)
        text = text.strip()

    json_pattern = r'\n\s*[\[{][\s\S]*$'
    if re.search(json_pattern, text):
        text = re.sub(json_pattern, '', text).strip()

    return text.strip()


async def generate_a2ui_component(intent: str, keywords: str, text: str, user_message: str, session_id: str) -> Optional[List[dict]]:
    """生成 A2UI 组件（使用数据绑定）"""
    global glm_service, data_model_service

    try:
        # 生成初始数据模型
        initial_data = data_model_service.generate_initial_data_model(intent, user_message)

        # 保存到会话状态
        context_service.set_data_model(session_id, "genetics_ui", initial_data)

        logger.info(f"生成初始数据模型: {initial_data}")

        ui_messages = [
            {"role": "system", "content": get_system_prompt(use_ui=True, intent=intent)},
            {"role": "user", "content": f"""用户问题：{user_message}

意图类型：{intent}

请生成 A2UI JSON 数组，使用数据绑定。

⚠️ 关键要求：

1. 使用数据绑定（path）而不是静态值（literalString）：
   - 正确：{{"parent1Genotype": {{"path": "/parent1"}}}}
   - 错误：{{"parent1Genotype": {{"literalString": "Aa"}}}}

2. 必须包含以下消息（按顺序）：
   a) beginRendering - 开始渲染并指定根组件
   b) surfaceUpdate - 定义组件结构（使用 path 绑定）
   c) dataModelUpdate - 设置初始数据

3. beginRendering 示例：
   {{"beginRendering": {{"surfaceId": "genetics_ui", "root": "main_component"}}}}

4. surfaceUpdate 示例（使用 path）：
   {{"surfaceUpdate": {{"surfaceId": "genetics_ui", "components": [
     {{"id": "main_component", "component": {{"PunnettSquare": {{
       "parent1Genotype": {{"path": "/parent1"}},
       "parent2Genotype": {{"path": "/parent2"}},
       "trait": {{"path": "/trait"}}
     }}}}}}
   ]}}}}

5. dataModelUpdate 示例：
   {{"dataModelUpdate": {{"surfaceId": "genetics_ui", "contents": [
     {{"key": "parent1", "valueString": "Aa"}},
     {{"key": "parent2", "valueString": "aa"}},
     {{"key": "trait", "valueString": "花色"}}
   ]}}}}

6. 如果意图是 pedigree_chart，必须使用 PedigreeChart 组件且 generations 为数组格式：
   surfaceUpdate 示例（使用 path 绑定）：
   {{"surfaceUpdate": {{"surfaceId": "genetics_ui", "components": [
     {{"id": "main_component", "component": {{"PedigreeChart": {{
       "generations": {{"path": "/generations"}},
       "trait": {{"path": "/trait"}}
     }}}}}}
   ]}}}})

   dataModelUpdate 示例（generations 是数组，每元素含 individuals 列表）：
   {{"dataModelUpdate": {{"surfaceId": "genetics_ui", "contents": [
     {{"key": "generations", "valueArray": [
       {{"individuals": [
         {{"id": "1", "gender": "male", "phenotype": "carrier", "generation": 0, "spouseId": "2"}},
         {{"id": "2", "gender": "female", "phenotype": "carrier", "generation": 0, "spouseId": "1"}}
       ]}},
       {{"individuals": [
         {{"id": "3", "gender": "male", "phenotype": "affected", "generation": 1, "parents": {{"father": "1", "mother": "2"}}}},
         {{"id": "4", "gender": "female", "phenotype": "normal", "generation": 1, "parents": {{"father": "1", "mother": "2"}}}}
       ]}}
     ]}},
     {{"key": "trait", "valueString": "性状名称"}}
   ]}}}})

   关键规则：
   - gender: "male" 或 "female"
   - phenotype: "normal"、"affected" 或 "carrier"
   - generation 从 0 开始（0=第一代，1=第二代）
   - parents 包含 father 和 mother 的 id
   - spouseId 表示配偶 id（无子女配偶对也要填写）
   - 根据题目内容生成完整的多代家系数据
   - 每个 individual 必须填写 genotype 字段（根据遗传规律推算，如 "Aa"、"aa"、"X^AY"、"X^aX^A" 等）

现在生成包含这3个消息的 JSON 数组："""}
        ]

        ui_response = await glm_service.call_llm(ui_messages, response_format="json", max_tokens=6000)
        logger.info(f"LLM A2UI 响应长度: {len(ui_response)}, 内容: {repr(ui_response[:300])}")

        try:
            a2ui_data = json.loads(ui_response.strip())
            logger.info(f"成功解析 A2UI JSON，包含 {len(a2ui_data)} 个消息")

            # 转换 createSurface 为 beginRendering（兼容 v0.8）
            for i, msg in enumerate(a2ui_data):
                if "createSurface" in msg:
                    logger.info("检测到 createSurface，转换为 beginRendering")
                    surface_id = msg["createSurface"]["surfaceId"]
                    # 查找 surfaceUpdate 中的根组件 ID
                    root_component_id = None
                    for update_msg in a2ui_data:
                        if "surfaceUpdate" in update_msg:
                            components = update_msg["surfaceUpdate"].get("components", [])
                            if components and len(components) > 0:
                                root_component_id = components[0]["id"]
                                break

                    # 替换为 beginRendering
                    a2ui_data[i] = {
                        "beginRendering": {
                            "surfaceId": surface_id,
                            "root": root_component_id or "main_component"
                        }
                    }
                    logger.info(f"已转换为 beginRendering，root={root_component_id}")

            # 验证是否包含必要的消息
            has_create_surface = any("createSurface" in msg for msg in a2ui_data)
            has_begin_rendering = any("beginRendering" in msg for msg in a2ui_data)
            has_surface_update = any("surfaceUpdate" in msg for msg in a2ui_data)
            has_data_model_update = any("dataModelUpdate" in msg for msg in a2ui_data)

            if not (has_create_surface or has_begin_rendering) or not has_surface_update:
                logger.warning("缺少必要的消息类型，使用降级策略")
                a2ui_data = None
            elif not has_data_model_update:
                # 如果缺少 dataModelUpdate，自动生成
                logger.info("自动生成 dataModelUpdate 消息")
                data_model_msg = data_model_service.generate_data_model_update_message(
                    "genetics_ui",
                    {f"/{k}": v for k, v in initial_data.items()}
                )
                a2ui_data.append(data_model_msg)

        except json.JSONDecodeError as e:
            logger.error(f"JSON 解析失败: {e}")
            a2ui_data = None

        # 如果生成失败，使用本地降级（带数据绑定）
        if not a2ui_data:
            logger.warning("A2UI 生成失败，使用本地降级策略（数据绑定版本）")
            a2ui_data = generate_local_a2ui_with_binding(intent, initial_data)

        return a2ui_data

    except Exception as e:
        logger.error(f"❌ A2UI 生成失败: {e}")
        return generate_local_a2ui_with_binding(intent, data_model_service.generate_initial_data_model(intent, user_message))


def generate_local_a2ui_with_binding(intent: str, data_model: Dict[str, Any]) -> List[dict]:
    """生成使用数据绑定的本地降级 A2UI"""
    logger.info(f"生成数据绑定版本的降级 A2UI: intent={intent}")

    a2ui_messages = []

    # 根据意图生成组件定义（使用 path 绑定）
    if intent == "punnett_square":
        a2ui_messages.append({
            "beginRendering": {
                "surfaceId": "genetics_ui",
                "root": "main_component"
            }
        })
        a2ui_messages.append({
            "surfaceUpdate": {
                "surfaceId": "genetics_ui",
                "components": [
                    {
                        "id": "main_component",
                        "component": {
                            "PunnettSquare": {
                                "parent1Genotype": {"path": "/parent1"},
                                "parent2Genotype": {"path": "/parent2"},
                                "trait": {"path": "/trait"},
                                "showPhenotype": {"path": "/showPhenotype"},
                                "interactive": {"literalBoolean": True}
                            }
                        }
                    }
                ]
            }
        })

    elif intent == "dna_structure":
        a2ui_messages.append({
            "beginRendering": {
                "surfaceId": "genetics_ui",
                "root": "main_component"
            }
        })
        a2ui_messages.append({
            "surfaceUpdate": {
                "surfaceId": "genetics_ui",
                "components": [
                    {
                        "id": "main_component",
                        "component": {
                            "DNAStructure": {
                                "sequence": {"path": "/sequence"},
                                "showLabels": {"path": "/showLabels"},
                                "highlightRegions": {"path": "/highlightRegions"},
                                "interactive": {"literalBoolean": True}
                            }
                        }
                    }
                ]
            }
        })

    elif intent == "phenotype_distribution":
        a2ui_messages.append({
            "beginRendering": {
                "surfaceId": "genetics_ui",
                "root": "main_component"
            }
        })
        a2ui_messages.append({
            "surfaceUpdate": {
                "surfaceId": "genetics_ui",
                "components": [
                    {
                        "id": "main_component",
                        "component": {
                            "PhenotypeDistribution": {
                                "trait": {"path": "/trait"},
                                "data": {"path": "/data"},
                                "totalCount": {"path": "/totalCount"},
                                "showPercentage": {"path": "/showPercentage"},
                                "interactive": {"literalBoolean": True}
                            }
                        }
                    }
                ]
            }
        })

    elif intent == "central_dogma":
        a2ui_messages.append({
            "beginRendering": {
                "surfaceId": "genetics_ui",
                "root": "main_component"
            }
        })
        a2ui_messages.append({
            "surfaceUpdate": {
                "surfaceId": "genetics_ui",
                "components": [
                    {
                        "id": "main_component",
                        "component": {
                            "CentralDogma": {
                                "dnaSequence": {"literalString": "ATCGATCG"},
                                "animationSpeed": {"literalNumber": 1000},
                                "phase": {"literalString": "idle"}
                            }
                        }
                    }
                ]
            }
        })

    elif intent == "gene_expression":
        a2ui_messages.append({
            "beginRendering": {
                "surfaceId": "genetics_ui",
                "root": "main_component"
            }
        })
        a2ui_messages.append({
            "surfaceUpdate": {
                "surfaceId": "genetics_ui",
                "components": [
                    {
                        "id": "main_component",
                        "component": {
                            "GeneExpression": {
                                "genes": {"path": "/genes"},
                                "conditions": {"path": "/conditions"},
                                "expressionLevels": {"path": "/expressionLevels"},
                                "interactive": {"literalBoolean": True}
                            }
                        }
                    }
                ]
            }
        })

    elif intent == "pedigree_chart":
        a2ui_messages.append({
            "beginRendering": {
                "surfaceId": "genetics_ui",
                "root": "main_component"
            }
        })
        a2ui_messages.append({
            "surfaceUpdate": {
                "surfaceId": "genetics_ui",
                "components": [
                    {
                        "id": "main_component",
                        "component": {
                            "PedigreeChart": {
                                "generations": {"path": "/generations"},
                                "trait": {"path": "/trait"},
                                "interactive": {"literalBoolean": True}
                            }
                        }
                    }
                ]
            }
        })

    elif intent == "cross_over_map":
        a2ui_messages.append({
            "beginRendering": {
                "surfaceId": "genetics_ui",
                "root": "main_component"
            }
        })
        a2ui_messages.append({
            "surfaceUpdate": {
                "surfaceId": "genetics_ui",
                "components": [
                    {
                        "id": "main_component",
                        "component": {
                            "CrossOverMap": {
                                "chromosomeLength": {"path": "/chromosomeLength"},
                                "genes": {"path": "/genes"},
                                "crossoverPoints": {"path": "/crossoverPoints"},
                                "interactive": {"literalBoolean": True}
                            }
                        }
                    }
                ]
            }
        })

    elif intent == "mendel_simulator":
        a2ui_messages.append({
            "beginRendering": {
                "surfaceId": "genetics_ui",
                "root": "main_component"
            }
        })
        a2ui_messages.append({
            "surfaceUpdate": {
                "surfaceId": "genetics_ui",
                "components": [
                    {
                        "id": "main_component",
                        "component": {
                            "MendelSimulator": {
                                "parent1Genotype": {"path": "/parent1Genotype"},
                                "parent2Genotype": {"path": "/parent2Genotype"},
                                "traitType": {"path": "/traitType"},
                                "simulationCount": {"path": "/simulationCount"},
                                "interactive": {"literalBoolean": True}
                            }
                        }
                    }
                ]
            }
        })

    elif intent == "natural_selection_simulator":
        a2ui_messages.append({
            "beginRendering": {
                "surfaceId": "genetics_ui",
                "root": "main_component"
            }
        })
        a2ui_messages.append({
            "surfaceUpdate": {
                "surfaceId": "genetics_ui",
                "components": [
                    {
                        "id": "main_component",
                        "component": {
                            "NaturalSelectionSimulator": {
                                "populationSize": {"path": "/populationSize"},
                                "initialDarkFrequency": {"path": "/initialDarkFrequency"},
                                "environmentColor": {"path": "/environmentColor"},
                                "generations": {"path": "/generations"},
                                "interactive": {"literalBoolean": True}
                            }
                        }
                    }
                ]
            }
        })

    else:
        # 默认使用 PunnettSquare
        a2ui_messages.append({
            "beginRendering": {
                "surfaceId": "genetics_ui",
                "root": "main_component"
            }
        })
        a2ui_messages.append({
            "surfaceUpdate": {
                "surfaceId": "genetics_ui",
                "components": [
                    {
                        "id": "main_component",
                        "component": {
                            "PunnettSquare": {
                                "parent1Genotype": {"path": "/parent1"},
                                "parent2Genotype": {"path": "/parent2"},
                                "trait": {"path": "/trait"},
                                "showPhenotype": {"path": "/showPhenotype"},
                                "interactive": {"literalBoolean": True}
                            }
                        }
                    }
                ]
            }
        })

    # 生成 dataModelUpdate 消息
    contents = []
    for key, value in data_model.items():
        if isinstance(value, str):
            contents.append({"key": key, "valueString": value})
        elif isinstance(value, bool):
            contents.append({"key": key, "valueBoolean": value})
        elif isinstance(value, (int, float)):
            contents.append({"key": key, "valueNumber": value})
        elif isinstance(value, list):
            contents.append({"key": key, "valueArray": value})
        elif isinstance(value, dict):
            # 对于复杂对象，转换为 valueMap
            contents.append({"key": key, "valueMap": _dict_to_value_map(value)})

    a2ui_messages.append({
        "dataModelUpdate": {
            "surfaceId": "genetics_ui",
            "contents": contents
        }
    })

    logger.info(f"生成了 {len(a2ui_messages)} 条 A2UI 消息（数据绑定版本）")
    return a2ui_messages


def _dict_to_value_map(data: dict) -> List[dict]:
    """将字典转换为 A2UI valueMap 格式"""
    result = []
    for key, value in data.items():
        if isinstance(value, str):
            result.append({"key": key, "valueString": value})
        elif isinstance(value, bool):
            result.append({"key": key, "valueBoolean": value})
        elif isinstance(value, (int, float)):
            result.append({"key": key, "valueNumber": value})
        elif isinstance(value, list):
            result.append({"key": key, "valueArray": value})
        elif isinstance(value, dict):
            result.append({"key": key, "valueMap": _dict_to_value_map(value)})
    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

