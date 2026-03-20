"""
Action Handler Service - 处理客户端发来的 action 消息

负责解析和分发用户操作（按钮点击、输入变化等）到对应的处理函数
"""

import logging
from typing import Dict, Any, Optional, Callable
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ActionHandler:
    """Action 消息处理器"""

    def __init__(self, glm_service, data_model_service, context_service):
        """初始化 Action Handler

        Args:
            glm_service: GLM 服务实例
            data_model_service: 数据模型服务实例
            context_service: 上下文服务实例
        """
        self.glm_service = glm_service
        self.data_model_service = data_model_service
        self.context_service = context_service

        # 注册 action 处理函数
        self.action_handlers: Dict[str, Callable] = {
            "recalculate": self._handle_recalculate,
            "update_genotype": self._handle_update_genotype,
            "generate_new_visualization": self._handle_generate_new_visualization,
            "reset": self._handle_reset,
            "cell_click": self._handle_cell_click,
            "simulate_fertilization": self._handle_simulate_fertilization,
            "individual_click": self._handle_individual_click,
            "bar_click": self._handle_bar_click,
            "slider_change": self._handle_slider_change,
            "toggle_lac_operon": self._handle_toggle_lac_operon,
            "toggle_lactose": self._handle_toggle_lactose,
            "base_click": self._handle_base_click,
            "start_replication": self._handle_start_replication,
            "replication_complete": self._handle_replication_complete,
            "reset_replication": self._handle_reset_replication,
            "phenotype_bar_click": self._handle_phenotype_bar_click,
            "filter_change": self._handle_filter_change,
            "gene_click": self._handle_gene_click,
            "crossover_click": self._handle_crossover_click,
            "start_crossover_animation": self._handle_start_crossover_animation,
            "crossover_animation_complete": self._handle_crossover_animation_complete,
            # Mendel Simulator actions
            "simulation_complete": self._handle_simulation_complete,
            "reset_simulation": self._handle_reset_simulation,
            "count_change": self._handle_count_change,
            "speed_change": self._handle_speed_change,
            "parent1_change": self._handle_parent1_change,
            "parent2_change": self._handle_parent2_change,
            # Natural Selection Simulator actions
            "start_simulation": self._handle_start_simulation,
            "pause_simulation": self._handle_pause_simulation,
            "stop_simulation": self._handle_stop_simulation,
            "population_change": self._handle_population_change,
            "frequency_change": self._handle_frequency_change,
            "environment_change": self._handle_environment_change,
            "selection_change": self._handle_selection_change,
        }

    async def handle_action(
        self,
        websocket: WebSocket,
        session_id: str,
        action_data: dict
    ) -> None:
        """处理 action 消息

        Args:
            websocket: WebSocket 连接
            session_id: 会话 ID
            action_data: action 消息数据，格式：
                {
                    "action": {
                        "name": "action_name",
                        "context": {...}
                    },
                    "surfaceId": "surface_id"
                }
        """
        action = action_data.get("action", {})
        action_name = action.get("name")
        context = action.get("context", {})
        surface_id = action_data.get("surfaceId", "genetics_ui")

        logger.info(f"处理 action: name={action_name}, surface={surface_id}, context={context}")

        if not action_name:
            logger.warning("Action 消息缺少 name 字段")
            await websocket.send_json({
                "type": "error",
                "message": "Action 消息缺少 name 字段"
            })
            return

        # 查找对应的处理函数
        handler = self.action_handlers.get(action_name)

        if handler:
            try:
                await handler(websocket, session_id, surface_id, context)
            except Exception as e:
                logger.error(f"处理 action 失败: {action_name}, error={e}")
                await websocket.send_json({
                    "type": "error",
                    "message": f"处理操作失败: {str(e)}"
                })
        else:
            logger.warning(f"未知的 action: {action_name}")
            await websocket.send_json({
                "type": "action_response",
                "message": f"收到操作: {action_name}（暂未实现）"
            })

    async def _handle_recalculate(
        self,
        websocket: WebSocket,
        session_id: str,
        surface_id: str,
        context: dict
    ) -> None:
        """处理重新计算操作

        用户修改了输入（如基因型），需要重新计算结果
        """
        logger.info(f"重新计算: session={session_id}, context={context}")

        # 从 context 中提取当前数据模型
        parent1 = context.get("parent1", "Aa")
        parent2 = context.get("parent2", "aa")
        trait = context.get("trait", "花色")

        # 更新会话的数据模型
        self.context_service.update_data_model_field(session_id, surface_id, "/parent1", parent1)
        self.context_service.update_data_model_field(session_id, surface_id, "/parent2", parent2)
        self.context_service.update_data_model_field(session_id, surface_id, "/trait", trait)

        # 生成 dataModelUpdate 消息
        update_message = self.data_model_service.generate_data_model_update_message(
            surface_id=surface_id,
            updates={
                "/parent1": parent1,
                "/parent2": parent2,
                "/trait": trait,
                "/showPhenotype": True
            }
        )

        # 发送更新消息（包装为 a2ui 类型）
        await websocket.send_json({
            "type": "a2ui",
            "message": update_message
        })
        logger.info(f"发送数据模型更新: {update_message}")

    async def _handle_update_genotype(
        self,
        websocket: WebSocket,
        session_id: str,
        surface_id: str,
        context: dict
    ) -> None:
        """处理基因型更新操作"""
        logger.info(f"更新基因型: session={session_id}, context={context}")

        # 提取更新的字段
        updates = {}

        if "parent1" in context:
            updates["/parent1"] = context["parent1"]
            self.context_service.update_data_model_field(session_id, surface_id, "/parent1", context["parent1"])

        if "parent2" in context:
            updates["/parent2"] = context["parent2"]
            self.context_service.update_data_model_field(session_id, surface_id, "/parent2", context["parent2"])

        # 生成并发送更新消息
        if updates:
            update_message = self.data_model_service.generate_data_model_update_message(
                surface_id=surface_id,
                updates=updates
            )
            await websocket.send_json({
                "type": "a2ui",
                "message": update_message
            })
            logger.info(f"发送基因型更新: {updates}")

    async def _handle_generate_new_visualization(
        self,
        websocket: WebSocket,
        session_id: str,
        surface_id: str,
        context: dict
    ) -> None:
        """处理生成新可视化操作

        用户点击按钮，基于当前数据模型生成新的可视化内容
        """
        logger.info(f"生成新可视化: session={session_id}, context={context}")

        # 获取当前数据模型
        current_data = self.context_service.get_data_model(session_id, surface_id)

        # 构造提示词，让 LLM 基于当前数据生成新的解释或可视化
        user_request = context.get("request", "请基于当前数据生成详细解释")

        try:
            # 调用 LLM 生成响应
            prompt = f"""用户当前的数据：
{current_data}

用户请求：{user_request}

请生成一个简短的文本响应（不要生成 A2UI JSON）。"""

            response = await self.glm_service.generate_response(
                prompt=prompt,
                history=[],
                temperature=0.7
            )

            # 发送文本响应
            await websocket.send_json({
                "type": "text_response",
                "message": response
            })

            logger.info(f"生成新可视化完成")

        except Exception as e:
            logger.error(f"生成新可视化失败: {e}")
            await websocket.send_json({
                "type": "error",
                "message": f"生成失败: {str(e)}"
            })

    async def _handle_reset(
        self,
        websocket: WebSocket,
        session_id: str,
        surface_id: str,
        context: dict
    ) -> None:
        """处理重置操作

        重置数据模型到初始状态
        """
        logger.info(f"重置数据模型: session={session_id}")

        # 生成默认数据模型
        default_data = {
            "/parent1": "Aa",
            "/parent2": "aa",
            "/trait": "花色",
            "/showPhenotype": True
        }

        # 更新会话数据模型
        for path, value in default_data.items():
            self.context_service.update_data_model_field(session_id, surface_id, path, value)

        # 生成并发送更新消息
        update_message = self.data_model_service.generate_data_model_update_message(
            surface_id=surface_id,
            updates=default_data
        )

        await websocket.send_json({
            "type": "a2ui",
            "message": update_message
        })
        logger.info(f"数据模型已重置")

    async def _handle_cell_click(
        self,
        websocket: WebSocket,
        session_id: str,
        surface_id: str,
        context: dict
    ) -> None:
        """处理 Punnett Square 格子点击操作

        显示格子的详细信息
        """
        logger.info(f"格子点击: session={session_id}, context={context}")

        # 从 context 中提取格子信息
        component = context.get("component", "punnett_square")
        row = context.get("row", 0)
        col = context.get("col", 0)
        genotype = context.get("genotype", "")
        phenotype = context.get("phenotype", "")

        # 更新数据模型，存储选中的格子信息
        updates = {
            "/selectedCell": {
                "row": row,
                "col": col,
                "genotype": genotype,
                "phenotype": phenotype
            }
        }

        # 生成并发送更新消息
        update_message = self.data_model_service.generate_data_model_update_message(
            surface_id=surface_id,
            updates=updates
        )

        await websocket.send_json({
            "type": "a2ui",
            "message": update_message
        })
        logger.info(f"格子点击处理完成: {genotype} at ({row}, {col})")

    async def _handle_simulate_fertilization(
        self,
        websocket: WebSocket,
        session_id: str,
        surface_id: str,
        context: dict
    ) -> None:
        """处理随机受精模拟操作

        记录模拟结果（前端已完成计算）
        """
        logger.info(f"随机受精模拟: session={session_id}, context={context}")

        # 从 context 中提取模拟信息
        count = context.get("count", 1000)
        results = context.get("results", {})

        # 可以在这里记录模拟结果用于分析
        logger.info(f"模拟完成: {count} 次, 结果: {results}")

        # 发送确认消息
        await websocket.send_json({
            "type": "action_response",
            "message": f"模拟完成: {count} 次受精"
        })

    async def _handle_individual_click(
        self,
        websocket: WebSocket,
        session_id: str,
        surface_id: str,
        context: dict
    ) -> None:
        """处理 Pedigree Chart 个体点击操作

        显示个体的详细信息
        """
        logger.info(f"个体点击: session={session_id}, context={context}")

        # 从 context 中提取个体信息
        component = context.get("component", "pedigree_chart")
        individual_id = context.get("individualId", "")
        gender = context.get("gender", "")
        phenotype = context.get("phenotype", "")
        generation = context.get("generation", 1)
        genotype = context.get("genotype", "")
        label = context.get("label", "")

        # 更新数据模型，存储选中的个体信息
        updates = {
            "/selectedIndividual": {
                "id": individual_id,
                "gender": gender,
                "phenotype": phenotype,
                "generation": generation,
                "genotype": genotype,
                "label": label
            }
        }

        # 生成并发送更新消息
        update_message = self.data_model_service.generate_data_model_update_message(
            surface_id=surface_id,
            updates=updates
        )

        await websocket.send_json({
            "type": "a2ui",
            "message": update_message
        })
        logger.info(f"个体点击处理完成: {label} ({individual_id}), 表型: {phenotype}")

    async def _handle_bar_click(
        self,
        websocket: WebSocket,
        session_id: str,
        surface_id: str,
        context: dict
    ) -> None:
        """处理 Gene Expression 柱状图点击操作

        显示基因在特定条件下的表达详情
        """
        logger.info(f"柱状图点击: session={session_id}, context={context}")

        # 从 context 中提取信息
        gene = context.get("gene", "")
        condition = context.get("condition", "")
        level = context.get("level", 0)

        # 更新数据模型，存储选中的柱状图信息
        updates = {
            "/selectedBar": {
                "gene": gene,
                "condition": condition,
                "level": level
            }
        }

        # 生成并发送更新消息
        update_message = self.data_model_service.generate_data_model_update_message(
            surface_id=surface_id,
            updates=updates
        )

        await websocket.send_json({
            "type": "a2ui",
            "message": update_message
        })
        logger.info(f"柱状图点击处理完成: {gene} - {condition}: {level}%")

    async def _handle_slider_change(
        self,
        websocket: WebSocket,
        session_id: str,
        surface_id: str,
        context: dict
    ) -> None:
        """处理滑块变化操作

        更新基因表达水平
        """
        logger.info(f"滑块变化: session={session_id}, context={context}")

        # 从 context 中提取信息
        gene = context.get("gene", "")
        condition_index = context.get("conditionIndex", 0)
        value = context.get("value", 0)

        # 更新数据模型
        updates = {
            f"/geneExpression/{gene}/{condition_index}": value
        }

        # 生成并发送更新消息
        update_message = self.data_model_service.generate_data_model_update_message(
            surface_id=surface_id,
            updates=updates
        )

        await websocket.send_json({
            "type": "a2ui",
            "message": update_message
        })
        logger.info(f"滑块变化处理完成: {gene} 条件 {condition_index} = {value}%")

    async def _handle_toggle_lac_operon(
        self,
        websocket: WebSocket,
        session_id: str,
        surface_id: str,
        context: dict
    ) -> None:
        """处理 lac 操纵子模式切换

        启用/禁用 lac 操纵子模拟
        """
        logger.info(f"lac 操纵子切换: session={session_id}, context={context}")

        enabled = context.get("enabled", False)

        # 更新数据模型
        updates = {
            "/lacOperonMode": enabled
        }

        # 生成并发送更新消息
        update_message = self.data_model_service.generate_data_model_update_message(
            surface_id=surface_id,
            updates=updates
        )

        await websocket.send_json({
            "type": "a2ui",
            "message": update_message
        })
        logger.info(f"lac 操纵子模式: {'启用' if enabled else '禁用'}")

    async def _handle_toggle_lactose(
        self,
        websocket: WebSocket,
        session_id: str,
        surface_id: str,
        context: dict
    ) -> None:
        """处理乳糖存在状态切换

        模拟乳糖对 lac 操纵子的影响
        """
        logger.info(f"乳糖状态切换: session={session_id}, context={context}")

        present = context.get("present", False)

        # 更新数据模型
        updates = {
            "/lactosePresent": present
        }

        # 生成并发送更新消息
        update_message = self.data_model_service.generate_data_model_update_message(
            surface_id=surface_id,
            updates=updates
        )

        await websocket.send_json({
            "type": "a2ui",
            "message": update_message
        })
        logger.info(f"乳糖状态: {'存在' if present else '不存在'}")

    async def _handle_base_click(
        self,
        websocket: WebSocket,
        session_id: str,
        surface_id: str,
        context: dict
    ) -> None:
        """处理 DNA Structure 碱基点击操作

        显示碱基配对规则和氢键信息
        """
        logger.info(f"碱基点击: session={session_id}, context={context}")

        # 从 context 中提取信息
        base = context.get("base", "")
        index = context.get("index", 0)
        pair = context.get("pair", "")
        is_top_strand = context.get("isTopStrand", True)

        # 更新数据模型，存储选中的碱基信息
        updates = {
            "/selectedBase": {
                "base": base,
                "index": index,
                "pair": pair,
                "isTopStrand": is_top_strand
            }
        }

        # 生成并发送更新消息
        update_message = self.data_model_service.generate_data_model_update_message(
            surface_id=surface_id,
            updates=updates
        )

        await websocket.send_json({
            "type": "a2ui",
            "message": update_message
        })
        logger.info(f"碱基点击处理完成: {base} (位置 {index}) 配对 {pair}")

    async def _handle_start_replication(
        self,
        websocket: WebSocket,
        session_id: str,
        surface_id: str,
        context: dict
    ) -> None:
        """处理 DNA 复制开始操作

        记录复制开始事件
        """
        logger.info(f"DNA 复制开始: session={session_id}, context={context}")

        sequence_length = context.get("sequenceLength", 0)

        # 更新数据模型
        updates = {
            "/replicationMode": True,
            "/replicationProgress": 0
        }

        # 生成并发送更新消息
        update_message = self.data_model_service.generate_data_model_update_message(
            surface_id=surface_id,
            updates=updates
        )

        await websocket.send_json({
            "type": "a2ui",
            "message": update_message
        })
        logger.info(f"DNA 复制开始: 序列长度 {sequence_length}")

    async def _handle_replication_complete(
        self,
        websocket: WebSocket,
        session_id: str,
        surface_id: str,
        context: dict
    ) -> None:
        """处理 DNA 复制完成操作

        记录复制完成事件
        """
        logger.info(f"DNA 复制完成: session={session_id}, context={context}")

        sequence_length = context.get("sequenceLength", 0)

        # 更新数据模型
        updates = {
            "/replicationMode": False,
            "/replicationProgress": 100
        }

        # 生成并发送更新消息
        update_message = self.data_model_service.generate_data_model_update_message(
            surface_id=surface_id,
            updates=updates
        )

        await websocket.send_json({
            "type": "a2ui",
            "message": update_message
        })
        logger.info(f"DNA 复制完成: 序列长度 {sequence_length}")

    async def _handle_reset_replication(
        self,
        websocket: WebSocket,
        session_id: str,
        surface_id: str,
        context: dict
    ) -> None:
        """处理 DNA 复制重置操作

        重置复制状态
        """
        logger.info(f"DNA 复制重置: session={session_id}")

        # 更新数据模型
        updates = {
            "/replicationMode": False,
            "/replicationProgress": 0
        }

        # 生成并发送更新消息
        update_message = self.data_model_service.generate_data_model_update_message(
            surface_id=surface_id,
            updates=updates
        )

        await websocket.send_json({
            "type": "a2ui",
            "message": update_message
        })
        logger.info(f"DNA 复制已重置")

    async def _handle_phenotype_bar_click(
        self,
        websocket: WebSocket,
        session_id: str,
        surface_id: str,
        context: dict
    ) -> None:
        """处理 Phenotype Distribution 柱状图点击操作

        显示表型详细统计信息
        """
        logger.info(f"表型柱状图点击: session={session_id}, context={context}")

        # 从 context 中提取信息
        phenotype = context.get("phenotype", "")
        count = context.get("count", 0)
        percentage = context.get("percentage", 0)

        # 更新数据模型，存储选中的表型信息
        updates = {
            "/selectedPhenotype": {
                "phenotype": phenotype,
                "count": count,
                "percentage": percentage
            }
        }

        # 生成并发送更新消息
        update_message = self.data_model_service.generate_data_model_update_message(
            surface_id=surface_id,
            updates=updates
        )

        await websocket.send_json({
            "type": "a2ui",
            "message": update_message
        })
        logger.info(f"表型柱状图点击处理完成: {phenotype} - {count} ({percentage}%)")

    async def _handle_filter_change(
        self,
        websocket: WebSocket,
        session_id: str,
        surface_id: str,
        context: dict
    ) -> None:
        """处理表型筛选变化操作

        更新筛选状态
        """
        logger.info(f"表型筛选变化: session={session_id}, context={context}")

        # 从 context 中提取信息
        selected_filters = context.get("selectedFilters", [])

        # 更新数据模型
        updates = {
            "/selectedFilters": selected_filters
        }

        # 生成并发送更新消息
        update_message = self.data_model_service.generate_data_model_update_message(
            surface_id=surface_id,
            updates=updates
        )

        await websocket.send_json({
            "type": "a2ui",
            "message": update_message
        })
        logger.info(f"表型筛选已更新: {len(selected_filters)} 个表型被选中")

    async def _handle_gene_click(
        self,
        websocket: WebSocket,
        session_id: str,
        surface_id: str,
        context: dict
    ) -> None:
        """处理 Crossover Map 基因点击操作

        显示基因详细信息
        """
        logger.info(f"基因点击: session={session_id}, context={context}")

        # 从 context 中提取信息
        name = context.get("name", "")
        position = context.get("position", 0)
        color = context.get("color", "")

        # 更新数据模型，存储选中的基因信息
        updates = {
            "/selectedGene": {
                "name": name,
                "position": position,
                "color": color
            }
        }

        # 生成并发送更新消息
        update_message = self.data_model_service.generate_data_model_update_message(
            surface_id=surface_id,
            updates=updates
        )

        await websocket.send_json({
            "type": "a2ui",
            "message": update_message
        })
        logger.info(f"基因点击处理完成: {name} at {position} cM")

    async def _handle_crossover_click(
        self,
        websocket: WebSocket,
        session_id: str,
        surface_id: str,
        context: dict
    ) -> None:
        """处理交叉互换点点击操作

        显示交叉互换详细信息
        """
        logger.info(f"交叉点点击: session={session_id}, context={context}")

        # 从 context 中提取信息
        position = context.get("position", 0)
        label = context.get("label", "")

        # 更新数据模型
        updates = {
            "/selectedCrossover": {
                "position": position,
                "label": label
            }
        }

        # 生成并发送更新消息
        update_message = self.data_model_service.generate_data_model_update_message(
            surface_id=surface_id,
            updates=updates
        )

        await websocket.send_json({
            "type": "a2ui",
            "message": update_message
        })
        logger.info(f"交叉点点击处理完成: {label} at {position} cM")

    async def _handle_start_crossover_animation(
        self,
        websocket: WebSocket,
        session_id: str,
        surface_id: str,
        context: dict
    ) -> None:
        """处理交叉互换动画开始操作

        记录动画开始事件
        """
        logger.info(f"交叉互换动画开始: session={session_id}, context={context}")

        position = context.get("position", 0)

        # 更新数据模型
        updates = {
            "/crossoverAnimating": True,
            "/crossoverPosition": position
        }

        # 生成并发送更新消息
        update_message = self.data_model_service.generate_data_model_update_message(
            surface_id=surface_id,
            updates=updates
        )

        await websocket.send_json({
            "type": "a2ui",
            "message": update_message
        })
        logger.info(f"交叉互换动画开始: 位置 {position} cM")

    async def _handle_crossover_animation_complete(
        self,
        websocket: WebSocket,
        session_id: str,
        surface_id: str,
        context: dict
    ) -> None:
        """处理交叉互换动画完成操作

        记录动画完成事件
        """
        logger.info(f"交叉互换动画完成: session={session_id}, context={context}")

        position = context.get("position", 0)

        # 更新数据模型
        updates = {
            "/crossoverAnimating": False
        }

        # 生成并发送更新消息
        update_message = self.data_model_service.generate_data_model_update_message(
            surface_id=surface_id,
            updates=updates
        )

        await websocket.send_json({
            "type": "a2ui",
            "message": update_message
        })
        logger.info(f"交叉互换动画完成: 位置 {position} cM")

        await websocket.send_json({
            "type": "a2ui",
            "message": update_message
        })
        logger.info(f"交叉互换动画完成: 位置 {position} cM")

    async def _handle_simulation_complete(
        self,
        websocket: WebSocket,
        session_id: str,
        surface_id: str,
        context: dict
    ) -> None:
        """处理孟德尔模拟完成操作"""
        logger.info(f"孟德尔模拟完成: session={session_id}, context={context}")

        parent1 = context.get("parent1", "")
        parent2 = context.get("parent2", "")
        count = context.get("count", 0)
        results = context.get("results", [])

        updates = {
            "/simulationResults": results,
            "/simulationComplete": True
        }

        update_message = self.data_model_service.generate_data_model_update_message(
            surface_id=surface_id,
            updates=updates
        )

        await websocket.send_json({
            "type": "a2ui",
            "message": update_message
        })
        logger.info(f"孟德尔模拟完成: {parent1} × {parent2}, {count} 次")

    async def _handle_reset_simulation(
        self,
        websocket: WebSocket,
        session_id: str,
        surface_id: str,
        context: dict
    ) -> None:
        """处理模拟重置操作"""
        logger.info(f"模拟重置: session={session_id}")

        updates = {
            "/simulationResults": [],
            "/simulationComplete": False
        }

        update_message = self.data_model_service.generate_data_model_update_message(
            surface_id=surface_id,
            updates=updates
        )

        await websocket.send_json({
            "type": "a2ui",
            "message": update_message
        })

    async def _handle_count_change(
        self,
        websocket: WebSocket,
        session_id: str,
        surface_id: str,
        context: dict
    ) -> None:
        """处理模拟次数变化"""
        count = context.get("count", 1000)
        logger.info(f"模拟次数变化: {count}")

        updates = {"/simulationCount": count}

        update_message = self.data_model_service.generate_data_model_update_message(
            surface_id=surface_id,
            updates=updates
        )

        await websocket.send_json({
            "type": "a2ui",
            "message": update_message
        })

    async def _handle_speed_change(
        self,
        websocket: WebSocket,
        session_id: str,
        surface_id: str,
        context: dict
    ) -> None:
        """处理模拟速度变化"""
        speed = context.get("speed", "fast")
        logger.info(f"模拟速度变化: {speed}")

        updates = {"/simulationSpeed": speed}

        update_message = self.data_model_service.generate_data_model_update_message(
            surface_id=surface_id,
            updates=updates
        )

        await websocket.send_json({
            "type": "a2ui",
            "message": update_message
        })

    async def _handle_parent1_change(
        self,
        websocket: WebSocket,
        session_id: str,
        surface_id: str,
        context: dict
    ) -> None:
        """处理亲本1基因型变化"""
        genotype = context.get("genotype", "")
        logger.info(f"亲本1基因型变化: {genotype}")

        updates = {"/parent1Genotype": genotype}

        update_message = self.data_model_service.generate_data_model_update_message(
            surface_id=surface_id,
            updates=updates
        )

        await websocket.send_json({
            "type": "a2ui",
            "message": update_message
        })

    async def _handle_parent2_change(
        self,
        websocket: WebSocket,
        session_id: str,
        surface_id: str,
        context: dict
    ) -> None:
        """处理亲本2基因型变化"""
        genotype = context.get("genotype", "")
        logger.info(f"亲本2基因型变化: {genotype}")

        updates = {"/parent2Genotype": genotype}

        update_message = self.data_model_service.generate_data_model_update_message(
            surface_id=surface_id,
            updates=updates
        )

        await websocket.send_json({
            "type": "a2ui",
            "message": update_message
        })

    async def _handle_start_simulation(
        self,
        websocket: WebSocket,
        session_id: str,
        surface_id: str,
        context: dict
    ) -> None:
        """处理自然选择模拟开始"""
        logger.info(f"自然选择模拟开始: session={session_id}, context={context}")

        updates = {
            "/isRunning": True,
            "/currentGeneration": 0
        }

        update_message = self.data_model_service.generate_data_model_update_message(
            surface_id=surface_id,
            updates=updates
        )

        await websocket.send_json({
            "type": "a2ui",
            "message": update_message
        })

    async def _handle_pause_simulation(
        self,
        websocket: WebSocket,
        session_id: str,
        surface_id: str,
        context: dict
    ) -> None:
        """处理模拟暂停/继续"""
        paused = context.get("paused", False)
        logger.info(f"模拟暂停状态: {paused}")

        updates = {"/isPaused": paused}

        update_message = self.data_model_service.generate_data_model_update_message(
            surface_id=surface_id,
            updates=updates
        )

        await websocket.send_json({
            "type": "a2ui",
            "message": update_message
        })

    async def _handle_stop_simulation(
        self,
        websocket: WebSocket,
        session_id: str,
        surface_id: str,
        context: dict
    ) -> None:
        """处理模拟停止"""
        logger.info(f"模拟停止: session={session_id}")

        updates = {
            "/isRunning": False,
            "/isPaused": False
        }

        update_message = self.data_model_service.generate_data_model_update_message(
            surface_id=surface_id,
            updates=updates
        )

        await websocket.send_json({
            "type": "a2ui",
            "message": update_message
        })

    async def _handle_population_change(
        self,
        websocket: WebSocket,
        session_id: str,
        surface_id: str,
        context: dict
    ) -> None:
        """处理种群大小变化"""
        size = context.get("size", 100)
        logger.info(f"种群大小变化: {size}")

        updates = {"/populationSize": size}

        update_message = self.data_model_service.generate_data_model_update_message(
            surface_id=surface_id,
            updates=updates
        )

        await websocket.send_json({
            "type": "a2ui",
            "message": update_message
        })

    async def _handle_frequency_change(
        self,
        websocket: WebSocket,
        session_id: str,
        surface_id: str,
        context: dict
    ) -> None:
        """处理初始基因频率变化"""
        freq_a = context.get("freqA", 0.5)
        logger.info(f"初始基因频率变化: {freq_a}")

        updates = {"/initialFreqA": freq_a}

        update_message = self.data_model_service.generate_data_model_update_message(
            surface_id=surface_id,
            updates=updates
        )

        await websocket.send_json({
            "type": "a2ui",
            "message": update_message
        })

    async def _handle_environment_change(
        self,
        websocket: WebSocket,
        session_id: str,
        surface_id: str,
        context: dict
    ) -> None:
        """处理环境类型变化"""
        env_type = context.get("type", "dark")
        logger.info(f"环境类型变化: {env_type}")

        updates = {"/environmentType": env_type}

        update_message = self.data_model_service.generate_data_model_update_message(
            surface_id=surface_id,
            updates=updates
        )

        await websocket.send_json({
            "type": "a2ui",
            "message": update_message
        })

    async def _handle_selection_change(
        self,
        websocket: WebSocket,
        session_id: str,
        surface_id: str,
        context: dict
    ) -> None:
        """处理选择压力强度变化"""
        strength = context.get("strength", 0.5)
        logger.info(f"选择压力强度变化: {strength}")

        updates = {"/selectionStrength": strength}

        update_message = self.data_model_service.generate_data_model_update_message(
            surface_id=surface_id,
            updates=updates
        )

        await websocket.send_json({
            "type": "a2ui",
            "message": update_message
        })

    def register_action_handler(self, action_name: str, handler: Callable) -> None:
        """注册自定义 action 处理函数

        Args:
            action_name: Action 名称
            handler: 处理函数，签名为 async def handler(websocket, session_id, surface_id, context)
        """
        self.action_handlers[action_name] = handler
        logger.info(f"注册 action 处理函数: {action_name}")
