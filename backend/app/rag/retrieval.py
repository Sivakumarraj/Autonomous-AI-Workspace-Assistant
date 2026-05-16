import chromadb

from app.services.embedding_service import generate_embedding

client = chromadb.PersistentClient(path="vector_store")

collection = client.get_or_create_collection(
    name="documents"
)


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