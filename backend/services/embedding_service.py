import os
import tempfile
from pathlib import Path
from dotenv import load_dotenv
import socket

load_dotenv()

cache_dir = Path(tempfile.gettempdir()) / "huggingface_cache"
cache_dir.mkdir(parents=True, exist_ok=True)

os.environ['HF_HOME'] = str(cache_dir)
os.environ['TRANSFORMERS_CACHE'] = str(cache_dir)
os.environ['HF_HUB_CACHE'] = str(cache_dir)
os.environ['HF_DATASETS_CACHE'] = str(cache_dir)
os.environ['HF_HUB_OFFLINE'] = '1'

import logging
from typing import List, Optional
import numpy as np
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)


class EmbeddingService:
    def __init__(self, model_name: Optional[str] = None):
        self.model_name = model_name or os.getenv("EMBEDDING_MODEL_NAME", "paraphrase-multilingual-MiniLM-L12-v2")
        self.model: Optional[SentenceTransformer] = None
        self._initialized = False
        self._load_error = None

    def _try_load_model(self):
        if self._initialized or self._load_error:
            return
        
        try:
            logger.info(f"Loading embedding model: {self.model_name}")
            logger.info(f"Using cache directory: {cache_dir}")
            
            self.model = SentenceTransformer(self.model_name)
            self._initialized = True
            
            logger.info("Embedding model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            self._load_error = str(e)
            self._initialized = True

    def _load_model(self):
        self._try_load_model()
        if self._load_error:
            raise Exception(f"Embedding model not available: {self._load_error}")

    def generate_embeddings(self, texts: List[str]) -> np.ndarray:
        if self.model is None:
            self._load_model()
        assert self.model is not None  # Type narrowing
        embeddings = self.model.encode(texts)
        return embeddings

    def generate_query_embedding(self, query: str) -> np.ndarray:
        if self.model is None:
            self._load_model()
        assert self.model is not None  # Type narrowing
        embedding = self.model.encode([query])[0]
        return embedding

    @property
    def embedding_dimension(self) -> Optional[int]:
        if self.model is None:
            self._load_model()
        assert self.model is not None  # Type narrowing
        return self.model.get_sentence_embedding_dimension()
