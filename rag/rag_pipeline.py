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

# -------- EMBEDDINGS --------
embedding = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

# -------- LLM --------
llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0
)

# -------- VECTOR DB PATH --------
VECTOR_DB_DIR = os.path.join(working_dir, "../doc_vectorstore")

# -------- TEXT SPLITTER --------
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=2000,
    chunk_overlap=200
)

# =========================================================
# ✅ SINGLETON VECTOR DB (IMPORTANT OPTIMIZATION)
# =========================================================
vectordb = Chroma(
    persist_directory=VECTOR_DB_DIR,
    embedding_function=embedding
)

# =========================================================
# ✅ GENERIC STORAGE FUNCTION
# =========================================================
def store_document(text, metadata=None):

    if metadata is None:
        metadata = {}

    doc = Document(page_content=text, metadata=metadata)

    texts = text_splitter.split_documents([doc])

    vectordb.add_documents(texts)


# =========================================================
# ✅ PDF PROCESSING
# =========================================================
def process_documents_to_chroma_db(file_paths):

    for file_path in file_paths:
        loader = PyPDFLoader(file_path)
        documents = loader.load()

        for doc in documents:
            store_document(
                text=doc.page_content,
                metadata={
                    "source": os.path.basename(file_path),
                    "type": "pdf"
                }
            )


# =========================================================
# ✅ QUESTION ANSWERING (IMPROVED RETRIEVAL)
# =========================================================
def answer_question(user_question):

    retriever = vectordb.as_retriever(
        search_kwargs={"k": 4}   # slightly better context
    )

    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=retriever
    )

    response = qa_chain.invoke({"query": user_question})

    return response["result"]