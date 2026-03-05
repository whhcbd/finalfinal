import json
import logging
import sys
import os
import re
from typing import Optional, List
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

sys.path.insert(0, os.path.dirname(__file__))

from services.glm_service import GLMService
from services.rag_service import RAGService
from services.vector_store import VectorStore
from services.embedding_service import EmbeddingService
from services.intent_service import IntentService
from services.context_service import ContextService
from services.a2ui_service import get_system_prompt as get_a2ui_system_prompt, validate_and_fix_response

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# 降级策略默认值常量
DEFAULT_TRAIT = "花色"
DEFAULT_GENOTYPE_1 = "Aa"
DEFAULT_GENOTYPE_2 = "aa"
DEFAULT_DNA_SEQUENCE = "ATCGATCG"
DEFAULT_DISEASE_NAME = "遗传病"
DEFAULT_INHERITANCE_PATTERN = "常染色体隐性"

app = FastAPI(title="Genetics A2UI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEXT_ONLY_INSTRUCTION = "You are a genetics tutor. Provide detailed, accurate explanations in Chinese."

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    use_ui: bool = True
    context: Optional[List[dict]] = None

class ChatResponse(BaseModel):
    text: str
    a2ui: Optional[List[dict]] = None
    session_id: str
    intent: Optional[str] = None
    keywords: Optional[str] = None


glm_service = None
rag_service = None
intent_service = None
context_service = None


@app.on_event("startup")
async def startup_event():
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


def get_system_prompt(use_ui: bool = True) -> str:
    """获取系统提示词

    使用 a2ui_service 提供的标准化 System Prompt
    它已经包含了 genetics_catalog.json 中的所有组件定义和示例
    """
    if not use_ui:
        return TEXT_ONLY_INSTRUCTION

    # 使用 a2ui_service 提供的标准化 System Prompt
    # 它已经包含了 genetics_catalog.json 中的所有组件定义和示例
    return get_a2ui_system_prompt(use_ui=True)


async def generate_local_a2ui(intent: str, keywords: str, text: str) -> list:
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
            # 提取基因型
            genotypes = re.findall(r'\b[A-Z][a-z]\b|\b[A-Z]{2}\b|\b[a-z]{2}\b', text)
            parent1 = genotypes[0] if len(genotypes) > 0 else DEFAULT_GENOTYPE_1
            parent2 = genotypes[1] if len(genotypes) > 1 else DEFAULT_GENOTYPE_2

            a2ui_content.append({
                "surfaceUpdate": {
                    "surfaceId": "genetics_ui",
                    "components": [
                        {
                            "id": "punnett_square",
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
                            "id": "dna_structure",
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
                            "id": "phenotype_dist",
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
                            "id": "gene_expression",
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
                            "id": "pedigree",
                            "component": {
                                "PedigreeChart": {
                                    "generations": {"literalArray": [
                                        {
                                            "individuals": [
                                                {"id": "1", "gender": "male", "affected": False},
                                                {"id": "2", "gender": "female", "affected": False}
                                            ]
                                        },
                                        {
                                            "individuals": [
                                                {"id": "3", "gender": "male", "affected": True, "parents": ["1", "2"]}
                                            ]
                                        }
                                    ]},
                                    "diseaseName": {"literalString": DEFAULT_DISEASE_NAME},
                                    "inheritancePattern": {"literalString": DEFAULT_INHERITANCE_PATTERN},
                                    "showLegend": {"literalBoolean": True}
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
                            "id": "crossover",
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
                            "id": "quiz_component",
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
                            "id": "video_component",
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
                            "id": "flashcard_component",
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
    system_prompt = get_system_prompt(request.use_ui)

    user_message = request.message
    if context_info:
        user_message = f"相关上下文：\n{context_info}\n\n用户问题：{request.message}"

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message}
    ]

    # 生成文本响应
    text_response = await glm_service.call_llm(messages)
    logger.info(f"LLM 文本响应: {text_response[:200]}...")

    a2ui_data = None

    if request.use_ui:
        logger.info("开始 A2UI 组件生成...")
        try:
            ui_messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"""用户问题：{request.message}

请分析上述问题并生成对应的 A2UI 可视化界面。

⚠️ 关键要求：
1. 根据问题类型，**必须使用**以下自定义组件之一：
   - PunnettSquare（杂交、后代预测）
   - DNAStructure（DNA结构）
   - PhenotypeDistribution（表型分布）
   - GeneExpression（基因表达）
   - PedigreeChart（家系图）
   - CrossOverMap（交叉互换）

2. 严禁使用通用 Container + Text 组件组合

3. 组件参数必须从问题中提取或合理推断

以下是文本回答，请生成对应的可视化界面：
{text_response}

生成 A2UI JSON（使用 ---a2ui_JSON--- 分隔符）："""}
            ]

            ui_response = await glm_service.call_llm(ui_messages)
            logger.info(f"LLM A2UI 响应: {ui_response[:500]}...")

            # 使用 a2ui_service 的验证逻辑
            text_part, is_valid, error_msg = validate_and_fix_response(ui_response)

            if is_valid:
                logger.info("A2UI JSON 验证成功")

                # 解析 JSON 部分
                if "---a2ui_JSON---" in ui_response:
                    json_part = ui_response.split("---a2ui_JSON---", 1)[1]
                    json_cleaned = json_part.strip().lstrip("```json").rstrip("```").strip()

                    try:
                        # 尝试按行解析 JSON 对象
                        a2ui_data = []
                        for line in json_cleaned.split('\n'):
                            if line.strip():
                                a2ui_data.append(json.loads(line))
                    except json.JSONDecodeError:
                        # 如果按行解析失败，尝试整体解析
                        a2ui_data = json.loads(json_cleaned)

                logger.info(f"成功解析 A2UI JSON，包含 {len(a2ui_data) if a2ui_data else 0} 个消息")
            else:
                logger.warning(f"A2UI JSON 验证失败: {error_msg}")
                logger.debug(f"验证失败的响应内容: {ui_response[:1000]}")

            # 如果 A2UI 生成失败，使用本地降级
            if not a2ui_data:
                logger.warning("A2UI 生成失败或验证未通过，使用本地降级策略")
                logger.info(f"降级参数 - 意图: {intent}, 关键词: '{keywords}', 文本长度: {len(text_response)}")
                a2ui_data = await generate_local_a2ui(intent, keywords, text_response)
                if a2ui_data:
                    logger.info(f"成功生成本地降级 A2UI，包含 {len(a2ui_data)} 个消息")

        except Exception as e:
            logger.error(f"❌ A2UI 生成失败: {e}")
            logger.info("🔄 使用降级策略生成 A2UI")
            a2ui_data = await generate_local_a2ui(intent, keywords, text_response)

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
