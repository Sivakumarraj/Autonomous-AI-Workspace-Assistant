import chromadb
import uuid

client = chromadb.PersistentClient(path="vector_store")

collection = client.get_or_create_collection(
    name="documents"
)


def store_embeddings(chunks, embeddings):

    for chunk, embedding in zip(chunks, embeddings):

        collection.add(
            documents=[chunk],
            embeddings=[embedding],
            ids=[str(uuid.uuid4())]
        )