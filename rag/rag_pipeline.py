import os
from dotenv import load_dotenv

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_groq import ChatGroq
from langchain_classic.chains import RetrievalQA
from langchain_core.documents import Document

load_dotenv()

working_dir = os.path.dirname(os.path.abspath(__file__))

embedding = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

llm = ChatGroq(
    model="openai/gpt-oss-20b",
    temperature=0.0,
)

VECTOR_DB_DIR = os.path.join(working_dir, "../doc_vectorstore")

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=2000,
    chunk_overlap=200
)

_vectordb_cache = {}


def get_vectordb(collection_name="global"):
    if collection_name not in _vectordb_cache:
        _vectordb_cache[collection_name] = Chroma(
            persist_directory=VECTOR_DB_DIR,
            embedding_function=embedding,
            collection_name=collection_name
        )
    return _vectordb_cache[collection_name]


def store_document(text, metadata=None, collection_name="global"):

    if metadata is None:
        metadata = {}

    doc = Document(page_content=text, metadata=metadata)

    texts = text_splitter.split_documents([doc])

    vectordb = get_vectordb(collection_name)
    vectordb.add_documents(texts)


def process_documents_to_chroma_db(file_paths, collection_name="global"):

    for file_path in file_paths:
        loader = PyPDFLoader(file_path)
        documents = loader.load()

        for doc in documents:
            store_document(
                text=doc.page_content,
                metadata={
                    "source": os.path.basename(file_path),
                    "type": "pdf"
                },
                collection_name=collection_name
            )


def answer_question(user_question, collection_name="global"):

    vectordb = get_vectordb(collection_name)

    retriever = vectordb.as_retriever(
        search_kwargs={"k": 4}
    )

    source_docs = retriever.invoke(user_question)

    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=retriever
    )

    response = qa_chain.invoke({"query": user_question})

    citations = []
    seen = set()

    for doc in source_docs:
        source_name = doc.metadata.get("source", "Unknown")
        page_num = doc.metadata.get("page")

        if page_num is not None:
            citation = f"{source_name}, Page {page_num + 1}"
        else:
            citation = source_name

        if citation not in seen:
            citations.append(citation)
            seen.add(citation)

    answer_text = response["result"]

    if citations:
        citation_text = "\n\n**Sources:** " + " | ".join(citations)
        answer_text += citation_text

    return answer_text