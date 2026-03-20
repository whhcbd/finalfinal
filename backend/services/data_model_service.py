"""
Data Model Service - 数据模型管理服务

负责生成和管理 A2UI 数据模型，支持数据绑定和响应式更新
"""

import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)


class DataModelService:
    """数据模型服务"""

    def __init__(self):
        # 存储每个会话的数据模型
        self.session_data_models: Dict[str, Dict[str, Any]] = {}

    def get_data_model(self, session_id: str, surface_id: str = "genetics_ui") -> Dict[str, Any]:
        """获取指定会话和 surface 的数据模型"""
        if session_id not in self.session_data_models:
            self.session_data_models[session_id] = {}

        if surface_id not in self.session_data_models[session_id]:
            self.session_data_models[session_id][surface_id] = {}

        return self.session_data_models[session_id][surface_id]

    def update_data_model(self, session_id: str, surface_id: str, path: str, value: Any):
        """更新数据模型中的指定路径"""
        data_model = self.get_data_model(session_id, surface_id)

        # 解析路径并更新值
        keys = path.strip('/').split('/')
        current = data_model

        for key in keys[:-1]:
            if key not in current:
                current[key] = {}
            current = current[key]

        current[keys[-1]] = value
        logger.info(f"更新数据模型: session={session_id}, path={path}, value={value}")

    def generate_data_model_update_message(
        self,
        surface_id: str,
        updates: Dict[str, Any]
    ) -> dict:
        """生成 dataModelUpdate 消息

        Args:
            surface_id: Surface ID
            updates: 要更新的数据，格式为 {path: value}

        Returns:
            dataModelUpdate 消息
        """
        contents = []

        for path, value in updates.items():
            # 从路径中提取最后一个键
            key = path.strip('/').split('/')[-1]

            # 根据值类型选择合适的包装器
            if isinstance(value, str):
                contents.append({
                    "key": key,
                    "valueString": value
                })
            elif isinstance(value, bool):
                contents.append({
                    "key": key,
                    "valueBoolean": value
                })
            elif isinstance(value, (int, float)):
                contents.append({
                    "key": key,
                    "valueNumber": value
                })
            elif isinstance(value, list):
                contents.append({
                    "key": key,
                    "valueArray": value
                })
            elif isinstance(value, dict):
                contents.append({
                    "key": key,
                    "valueMap": self._dict_to_value_map(value)
                })

        return {
            "dataModelUpdate": {
                "surfaceId": surface_id,
                "contents": contents
            }
        }

    def _dict_to_value_map(self, data: dict) -> List[dict]:
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
                result.append({"key": key, "valueMap": self._dict_to_value_map(value)})
        return result

    def generate_initial_data_model(
        self,
        intent: str,
        user_message: str,
        extracted_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """根据意图生成初始数据模型

        Args:
            intent: 用户意图
            user_message: 用户消息
            extracted_data: 从用户消息中提取的数据

        Returns:
            初始数据模型
        """
        data_model = {}

        if intent == "punnett_square":
            # 为 Punnett Square 生成数据模型
            data_model = {
                "parent1": extracted_data.get("parent1", "Aa") if extracted_data else "Aa",
                "parent2": extracted_data.get("parent2", "aa") if extracted_data else "aa",
                "trait": extracted_data.get("trait", "花色") if extracted_data else "花色",
                "showPhenotype": True
            }

        elif intent == "dna_structure":
            data_model = {
                "sequence": extracted_data.get("sequence", "ATCGATCG") if extracted_data else "ATCGATCG",
                "showLabels": True,
                "highlightRegions": []
            }

        elif intent == "phenotype_distribution":
            data_model = {
                "trait": extracted_data.get("trait", "花色") if extracted_data else "花色",
                "data": [
                    {"phenotype": "紫色花", "count": 750, "percentage": 75},
                    {"phenotype": "白色花", "count": 250, "percentage": 25}
                ],
                "totalCount": 1000,
                "showPercentage": True
            }

        elif intent == "gene_expression":
            data_model = {
                "genes": ["GeneA", "GeneB"],
                "conditions": ["肝脏", "大脑"],
                "expressionLevels": [[10, 15], [8, 12]]
            }

        elif intent == "pedigree_chart":
            data_model = {
                "trait": "遗传病",
                "generations": [
                    {
                        "individuals": [
                            {"id": "1", "gender": "male", "phenotype": "normal"},
                            {"id": "2", "gender": "female", "phenotype": "carrier"}
                        ]
                    }
                ]
            }

        elif intent == "cross_over_map":
            data_model = {
                "chromosomeLength": 100,
                "genes": [
                    {"name": "GeneA", "position": 20, "color": "#1a73e8"},
                    {"name": "GeneB", "position": 60, "color": "#188038"}
                ],
                "crossoverPoints": [{"position": 40, "label": "交叉点1"}]
            }

        elif intent == "mendel_simulator":
            # 从用户消息中提取基因型
            parent1 = "Aa"
            parent2 = "Aa"
            trait_type = "single"

            if extracted_data:
                parent1 = extracted_data.get("parent1", "Aa")
                parent2 = extracted_data.get("parent2", "Aa")
            else:
                # 尝试从用户消息中提取基因型
                import re
                # 匹配 AaBb × AaBb 或 Aa × Aa 格式
                match = re.search(r'([A-Za-z]{2,4})\s*[×xX]\s*([A-Za-z]{2,4})', user_message)
                if match:
                    parent1 = match.group(1)
                    parent2 = match.group(2)
                    # 判断是单因子还是双因子
                    if len(parent1) == 4 and len(parent2) == 4:
                        trait_type = "double"

            data_model = {
                "parent1Genotype": parent1,
                "parent2Genotype": parent2,
                "traitType": trait_type,
                "simulationCount": 1000
            }

        elif intent == "natural_selection_simulator":
            data_model = {
                "populationSize": extracted_data.get("populationSize", 100) if extracted_data else 100,
                "initialDarkFrequency": extracted_data.get("initialDarkFrequency", 0.5) if extracted_data else 0.5,
                "environmentColor": extracted_data.get("environmentColor", "dark") if extracted_data else "dark",
                "generations": extracted_data.get("generations", 50) if extracted_data else 50
            }

        logger.info(f"生成初始数据模型: intent={intent}, keys={list(data_model.keys())}")
        return data_model

    def clear_session_data(self, session_id: str):
        """清除指定会话的数据模型"""
        if session_id in self.session_data_models:
            del self.session_data_models[session_id]
            logger.info(f"清除会话数据: session={session_id}")
