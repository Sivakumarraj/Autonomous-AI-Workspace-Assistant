from app.services.embedding_service import generate_embedding
from app.services.vector_service import collection


def retrieve_relevant_chunks(query: str, top_k: int = 3):

    query_embedding = generate_embedding(query)

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k
    )

    documents = results.get("documents", [])

    if not documents:
        return []

    return documents[0]