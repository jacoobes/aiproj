import faiss

dimension = 64

index = faiss.IndexFlatL2(d)

def add(data):
    return index.add(data)

def search(query_vector, k):
    return index.search(query_vector, k)
