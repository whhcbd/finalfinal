import time
from typing import Dict, Tuple, Optional, Any
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


@dataclass
class LearnerContext:
    profile: str
    preferences: str
    level: str
    interests: list[str]
    updated_at: float


class ContextService:
    def __init__(self):
        self._context_cache: Dict[str, Tuple[LearnerContext, float]] = {}
        self._cache_ttl = 300  # 5 分钟缓存
        # 数据模型状态管理
        self._session_data_models: Dict[str, Dict[str, Any]] = {}  # {session_id: {surface_id: data_model}}

    def get_context(self, learner_id: str = "default") -> LearnerContext:
        """获取学习者上下文（带缓存）"""
        now = time.time()

        if learner_id in self._context_cache:
            context, cached_at = self._context_cache[learner_id]
            if now - cached_at < self._cache_ttl:
                logger.info(f"Context cache hit for {learner_id}")
                return context

        # Cache miss，加载新上下文
        context = self._load_fresh_context(learner_id)
        self._context_cache[learner_id] = (context, now)
        logger.info(f"Loaded fresh context for {learner_id}")
        return context

    def _load_fresh_context(self, learner_id: str) -> LearnerContext:
        """加载新的学习者上下文"""
        # 这里可以从数据库或文件加载
        # 简化版本：返回默认上下文
        return LearnerContext(
            profile="生物遗传学学习者",
            preferences="偏好中文解释，喜欢具体例子",
            level="中级",
            interests=["孟德尔遗传", "DNA结构", "基因表达", "突变"],
            updated_at=time.time()
        )

    def update_context(self, learner_id: str = "default", **kwargs):
        """更新学习者上下文"""
        current_context = self.get_context(learner_id)
        
        for key, value in kwargs.items():
            if hasattr(current_context, key):
                setattr(current_context, key, value)
        
        current_context.updated_at = time.time()
        self._context_cache[learner_id] = (current_context, time.time())
        logger.info(f"Updated context for {learner_id}: {kwargs}")

    def invalidate_cache(self, learner_id: Optional[str] = None):
        """使缓存失效"""
        if learner_id:
            self._context_cache.pop(learner_id, None)
            logger.info(f"Invalidated cache for {learner_id}")
        else:
            self._context_cache.clear()
            logger.info("Cleared all context cache")

    def add_message(self, session_id: str, user_message: str, assistant_response: str):
        """添加会话消息（用于未来的会话管理功能）

        Args:
            session_id: 会话ID
            user_message: 用户消息
            assistant_response: 助手响应
        """
        # 当前为占位实现，未来可以扩展为完整的会话历史管理
        logger.debug(f"Session {session_id}: User: {user_message[:50]}... | Assistant: {assistant_response[:50]}...")
        pass

    def get_cache_stats(self) -> Dict[str, Any]:
        """获取缓存统计信息"""
        now = time.time()
        active_count = sum(
            1 for _, cached_at in self._context_cache.values()
            if now - cached_at < self._cache_ttl
        )
        expired_count = len(self._context_cache) - active_count

        return {
            "total_entries": len(self._context_cache),
            "active_entries": active_count,
            "expired_entries": expired_count,
            "cache_ttl_seconds": self._cache_ttl
        }

    # 数据模型状态管理方法

    def get_data_model(self, session_id: str, surface_id: str = "genetics_ui") -> Dict[str, Any]:
        """获取指定会话和 surface 的数据模型"""
        if session_id not in self._session_data_models:
            self._session_data_models[session_id] = {}

        if surface_id not in self._session_data_models[session_id]:
            self._session_data_models[session_id][surface_id] = {}

        return self._session_data_models[session_id][surface_id]

    def set_data_model(self, session_id: str, surface_id: str, data_model: Dict[str, Any]):
        """设置指定会话和 surface 的数据模型"""
        if session_id not in self._session_data_models:
            self._session_data_models[session_id] = {}

        self._session_data_models[session_id][surface_id] = data_model
        logger.info(f"设置数据模型: session={session_id}, surface={surface_id}, keys={list(data_model.keys())}")

    def update_data_model_field(self, session_id: str, surface_id: str, path: str, value: Any):
        """更新数据模型中的指定字段

        Args:
            session_id: 会话ID
            surface_id: Surface ID
            path: 字段路径，如 "/parent1" 或 "/genes/0/name"
            value: 新值
        """
        data_model = self.get_data_model(session_id, surface_id)

        # 解析路径并更新值
        keys = path.strip('/').split('/')
        current = data_model

        for key in keys[:-1]:
            if key not in current:
                current[key] = {}
            current = current[key]

        current[keys[-1]] = value
        logger.info(f"更新数据模型字段: session={session_id}, path={path}, value={value}")

    def merge_data_model(self, session_id: str, surface_id: str, updates: Dict[str, Any]):
        """合并更新到数据模型

        Args:
            session_id: 会话ID
            surface_id: Surface ID
            updates: 要合并的更新
        """
        data_model = self.get_data_model(session_id, surface_id)
        data_model.update(updates)
        logger.info(f"合并数据模型: session={session_id}, updates={list(updates.keys())}")

    def clear_session_data_model(self, session_id: str):
        """清除指定会话的所有数据模型"""
        if session_id in self._session_data_models:
            del self._session_data_models[session_id]
            logger.info(f"清除会话数据模型: session={session_id}")
