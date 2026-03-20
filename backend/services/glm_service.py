import os
import httpx
import json
import logging
import asyncio
from typing import AsyncGenerator, List, Dict, Optional

logger = logging.getLogger(__name__)


class GLMService:
    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        base_url: Optional[str] = None,
    ):
        self.api_key = api_key or os.getenv("GLM_API_KEY")
        self.model = model or os.getenv("GLM_MODEL", "glm-4.7")
        self.base_url = base_url or "https://open.bigmodel.cn/api/paas/v4/chat/completions"

        if not self.api_key:
            raise ValueError("GLM_API_KEY is required")

    async def call_llm_stream(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2000,
        top_p: float = 0.9,
    ) -> AsyncGenerator[str, None]:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }

        data = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "top_p": top_p,
            "stream": True,
        }

        try:
            # 增加超时时间到 120 秒，并设置更详细的超时配置
            # 添加 HTTP/2 禁用和连接池配置以提高稳定性
            timeout = httpx.Timeout(120.0, connect=10.0, read=120.0)
            limits = httpx.Limits(max_keepalive_connections=5, max_connections=10)
            async with httpx.AsyncClient(
                timeout=timeout,
                limits=limits,
                http2=False,  # 禁用 HTTP/2，使用 HTTP/1.1 更稳定
                follow_redirects=True
            ) as client:
                async with client.stream("POST", self.base_url, headers=headers, json=data) as response:
                    response.raise_for_status()

                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data_str = line[6:]

                            if data_str == "[DONE]":
                                break

                            try:
                                chunk_data = data_str.strip()
                                if not chunk_data:
                                    continue

                                chunk_json = json.loads(chunk_data)

                                if "choices" in chunk_json and len(chunk_json["choices"]) > 0:
                                    delta = chunk_json["choices"][0].get("delta", {})
                                    content = delta.get("content", "")

                                    if content:
                                        yield content

                            except json.JSONDecodeError as e:
                                logger.warning(f"Failed to parse SSE chunk: {e}")
                                continue

        except httpx.HTTPStatusError as e:
            logger.error(f"GLM API HTTP error: {e.response.status_code} - {e}")
            yield f"Error: HTTP {e.response.status_code}"
        except httpx.RequestError as e:
            logger.error(f"GLM API request error: {e}")
            yield "Error: Failed to connect to GLM API"
        except Exception as e:
            logger.error(f"Unexpected error calling GLM API: {e}")
            yield f"Error: {str(e)}"

    async def call_llm(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2000,
        top_p: float = 0.9,
        response_format: Optional[str] = None,
        max_retries: int = 3,
    ) -> str:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }

        data = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "top_p": top_p,
            "stream": False,
        }

        # 如果指定了 response_format，添加到请求中
        if response_format == "json":
            data["response_format"] = {"type": "json_object"}
            # 禁用思维链推理，避免 reasoning_tokens 耗尽 max_tokens
            data["thinking"] = {"type": "disabled"}

        # 重试逻辑
        for attempt in range(max_retries):
            try:
                # 增加超时时间到 120 秒，并设置更详细的超时配置
                # 添加 HTTP/2 禁用和连接池配置以提高稳定性
                timeout = httpx.Timeout(120.0, connect=10.0, read=120.0)
                limits = httpx.Limits(max_keepalive_connections=5, max_connections=10)
                async with httpx.AsyncClient(
                    timeout=timeout,
                    limits=limits,
                    http2=False,  # 禁用 HTTP/2，使用 HTTP/1.1 更稳定
                    follow_redirects=True
                ) as client:
                    response = await client.post(self.base_url, headers=headers, json=data)
                    response.raise_for_status()

                    result = response.json()

                    if "choices" in result and len(result["choices"]) > 0:
                        choice = result["choices"][0]
                        finish_reason = choice.get("finish_reason", "unknown")
                        content = choice["message"]["content"]
                        if not content:
                            logger.warning(f"GLM 返回空内容, finish_reason={finish_reason}, usage={result.get('usage')}")
                        return content
                    else:
                        raise ValueError("Invalid response format from GLM API")

            except httpx.HTTPStatusError as e:
                # 如果是 429 错误且还有重试次数，等待后重试
                if e.response.status_code == 429 and attempt < max_retries - 1:
                    wait_time = (attempt + 1) * 2  # 指数退避：2秒、4秒、6秒
                    logger.warning(f"GLM API 速率限制 (429)，{wait_time}秒后重试 (尝试 {attempt + 1}/{max_retries})")
                    await asyncio.sleep(wait_time)
                    continue
                logger.error(f"GLM API HTTP error: {e.response.status_code} - {e}")
                raise
            except httpx.RequestError as e:
                logger.error(f"GLM API request error: {e}")
                raise
            except Exception as e:
                logger.error(f"Unexpected error calling GLM API: {e}")
                raise

        # 如果所有重试都失败
        raise Exception("GLM API 请求失败，已达到最大重试次数")

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        stream: bool = False,
    ):
        messages = []

        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})

        messages.append({"role": "user", "content": prompt})

        if stream:
            return self.call_llm_stream(
                messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
        else:
            return await self.call_llm(
                messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )

    def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
    ):
        messages = []

        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})

        messages.append({"role": "user", "content": prompt})

        return self.call_llm_stream(
            messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
