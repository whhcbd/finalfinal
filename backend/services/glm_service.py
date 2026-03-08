import os
import httpx
import json
import logging
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
        self.model = model or os.getenv("GLM_MODEL", "glm-4.5-air")
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
            async with httpx.AsyncClient(timeout=60.0) as client:
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

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(self.base_url, headers=headers, json=data)
                response.raise_for_status()

                result = response.json()

                if "choices" in result and len(result["choices"]) > 0:
                    return result["choices"][0]["message"]["content"]
                else:
                    raise ValueError("Invalid response format from GLM API")

        except httpx.HTTPStatusError as e:
            logger.error(f"GLM API HTTP error: {e.response.status_code} - {e}")
            raise
        except httpx.RequestError as e:
            logger.error(f"GLM API request error: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error calling GLM API: {e}")
            raise

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
