from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import io
from dotenv import load_dotenv
from fastapi.responses import FileResponse

load_dotenv()

from rag.rag_pipeline import answer_question, store_document
from chatbot import chat_with_llm
from core.router import classify_query

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploaded_docs", exist_ok=True)

class ChatRequest(BaseModel):
    message: str
    chat_history: list = []

@app.get("/")
def root():
    return {"status": "SiteEngineer AI Backend Running!"}

@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        query_type = classify_query(request.message)
        if query_type == "is_code":
            response = answer_question(request.message)
        else:
            response = chat_with_llm(
                request.message,
                request.chat_history
            )
        return {"response": response, "type": query_type}
    except Exception as e:
        return {"response": str(e), "type": "error"}

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        content = await file.read()
        save_path = f"uploaded_docs/{file.filename}"
        with open(save_path, "wb") as f:
            f.write(content)

        ext = file.filename.split(".")[-1].lower()

        if ext == "pdf":
            from ingestion.pdf_pipeline import process_pdf
            file_like = io.BytesIO(content)
            file_like.name = file.filename
            text = process_pdf(file_like)

        elif ext in ["png", "jpg", "jpeg"]:
            from ingestion.image_pipeline import process_image
            file_like = io.BytesIO(content)
            file_like.name = file.filename
            text = process_image(file_like)

        else:
            return {"status": "error", "message": "Sirf PDF ya Image upload karo!"}

        store_document(text, metadata={
            "source": file.filename,
            "type": ext
        })

        return {"status": "success", "filename": file.filename}

    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/api/voice")
async def transcribe_voice(file: UploadFile = File(...)):
    try:
        content = await file.read()
        with open("temp_audio.wav", "wb") as f:
            f.write(content)

        from groq import Groq
        groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

        with open("temp_audio.wav", "rb") as audio:
            transcription = groq_client.audio.transcriptions.create(
                file=audio,
                model="whisper-large-v3"
            )

        return {"text": transcription.text}

    except Exception as e:
        return {"status": "error", "message": str(e)}
    
@app.get("/api/is-codes/{filename}")
async def download_is_code(filename: str):
    file_path = f"is_codes/{filename}"
    if os.path.exists(file_path):
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type="application/pdf"
        )
    return {"error": "File not found"}