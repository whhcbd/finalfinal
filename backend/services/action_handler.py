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

    def register_action_handler(self, action_name: str, handler: Callable) -> None:
        """注册自定义 action 处理函数

        Args:
            action_name: Action 名称
            handler: 处理函数，签名为 async def handler(websocket, session_id, surface_id, context)
        """
        self.action_handlers[action_name] = handler
        logger.info(f"注册 action 处理函数: {action_name}")
