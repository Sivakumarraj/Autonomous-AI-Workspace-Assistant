import chromadb

client = chromadb.PersistentClient(path="vector_store")

collection = client.get_or_create_collection(
    name="documents"
)


def store_embeddings(chunks, embeddings):

    for index, (chunk, embedding) in enumerate(
        zip(chunks, embeddings)
    ):

        collection.add(
            documents=[chunk],
            embeddings=[embedding],
            ids=[f"doc_{index}"]
        )