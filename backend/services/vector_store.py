import logging
from typing import List, Dict
import numpy as np
import faiss
import pickle

logger = logging.getLogger(__name__)


class VectorStore:
    def __init__(self, dimension: int = 384):
        self.dimension = dimension
        self.index = faiss.IndexFlatL2(dimension)
        self.documents: List[Dict] = []

    def add_documents(self, embeddings: np.ndarray, documents: List[Dict]):
        self.index.add(embeddings.astype('float32'))  # type: ignore[arg-type]
        self.documents.extend(documents)

    def search(self, query_embedding: np.ndarray, top_k: int = 5) -> List[Dict]:
        query_embedding = query_embedding.reshape(1, -1).astype('float32')
        distances, indices = self.index.search(query_embedding, top_k)  # type: ignore[call-arg]

        results = []
        for i, (dist, idx) in enumerate(zip(distances[0], indices[0])):
            if idx < len(self.documents):
                results.append({
                    "document": self.documents[idx],
                    "score": float(1 / (1 + dist)),
                    "rank": i + 1
                })

        return results

    def save(self, path: str):
        faiss.write_index(self.index, f"{path}.index")
        with open(f"{path}.pkl", "wb") as f:
            pickle.dump(self.documents, f)

    def load(self, path: str):
        self.index = faiss.read_index(f"{path}.index")
        with open(f"{path}.pkl", "rb") as f:
            self.documents = pickle.load(f)
