import logging
import os
from typing import List, Dict, Optional
from pathlib import Path

from .embedding_service import EmbeddingService
from .vector_store import VectorStore

logger = logging.getLogger(__name__)


def chunk_markdown_by_chapters(content: str) -> List[Dict]:
    chunks = []
    current_chapter = None
    current_content = []

    for line in content.split('\n'):
        if line.startswith('#'):
            if current_chapter is not None:
                chunks.append({
                    "chapter": current_chapter,
                    "content": '\n'.join(current_content)
                })
            current_chapter = line.strip('#').strip()
            current_content = []
        else:
            current_content.append(line)

    if current_chapter:
        chunks.append({
            "chapter": current_chapter,
            "content": '\n'.join(current_content)
        })

    return chunks


def split_into_paragraphs(chunk_content: str, max_chars: int = 500) -> List[str]:
    paragraphs = chunk_content.split('\n\n')
    result = []

    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
        
        if len(para) > max_chars:
            result.append(para[:max_chars].strip())
        else:
            result.append(para)

    return result


class RAGService:
    def __init__(self, vector_store=None, knowledge_base_path: Optional[str] = None):
        self.vector_store = vector_store
        self.embedding_service = None
        self._initialized = False
        self._disabled = False
        
        if knowledge_base_path is None:
            knowledge_base_path = os.getenv("KNOWLEDGE_BASE_PATH")
        
        if knowledge_base_path is None:
            logger.warning("KNOWLEDGE_BASE_PATH not set, RAG service will be disabled")
            self._disabled = True
            return
        
        self.knowledge_base_path = Path(knowledge_base_path)

    async def initialize(self):
        if self._initialized or self._disabled:
            return

        logger.info(f"Initializing RAG service with knowledge base: {self.knowledge_base_path}")

        if not self.knowledge_base_path.exists():
            logger.error(f"Knowledge base file not found: {self.knowledge_base_path}")
            self._disabled = True
            return

        try:
            if self.embedding_service is None:
                self.embedding_service = EmbeddingService()
            
            if self.vector_store is None:
                self.vector_store = VectorStore()

            content = self.knowledge_base_path.read_text(encoding='utf-8')

            chapters = chunk_markdown_by_chapters(content)
            logger.info(f"Found {len(chapters)} chapters")

            all_paragraphs = []
            all_documents = []

            for chapter in chapters:
                paragraphs = split_into_paragraphs(chapter['content'], max_chars=500)
                for para in paragraphs:
                    if len(para.strip()) > 50:
                        all_paragraphs.append(para)
                        all_documents.append({
                            "chapter": chapter['chapter'],
                            "content": para
                        })

            logger.info(f"Generated {len(all_paragraphs)} text chunks")

            embeddings = self.embedding_service.generate_embeddings(all_paragraphs)
            self.vector_store.add_documents(embeddings, all_documents)
            logger.info(f"Added {len(all_documents)} documents to vector store")

            self._initialized = True
            logger.info("RAG service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize RAG service: {e}")
            self._disabled = True

    async def retrieve(self, query: str, top_k: int = 3) -> List[Dict]:
        if not self._initialized:
            await self.initialize()

        query_embedding = self.embedding_service.generate_query_embedding(query)
        results = self.vector_store.search(query_embedding, top_k)
        return results

    async def get_context_for_query(self, query: str) -> str:
        if not self._initialized:
            await self.initialize()

        results = await self.retrieve(query, top_k=3)
        context_parts = []

        for result in results:
            doc = result['document']
            context_parts.append(
                f"【{doc['chapter']}】\n{doc['content']}"
            )

        return "\n\n".join(context_parts)
