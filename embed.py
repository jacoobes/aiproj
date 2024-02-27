import faiss

dimension = 64

index = faiss.IndexFlatL2(dimension)

def add(data):
    return index.add(data)

def search(query_vector, k):
    return index.search(query_vector, k)
