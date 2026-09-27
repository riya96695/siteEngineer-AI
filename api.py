from fastapi import FastAPI, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
import os
import io
import json
import time
import logging
from dotenv import load_dotenv

load_dotenv()

from rag.rag_pipeline import answer_question, store_document
from agents.site_engineer_agent import run_agent


os.makedirs("logs", exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    handlers=[
        logging.FileHandler("logs/app.log", encoding="utf-8"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger("siteengineer")


app = FastAPI()


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = round(time.time() - start_time, 2)

    logger.info(
        f"{request.method} {request.url.path} "
        f"| status={response.status_code} | took={duration}s"
    )

    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


os.makedirs("uploaded_docs", exist_ok=True)


class ChatRequest(BaseModel):
    message: str
    chat_history: list = []
    project_id: str = None


@app.get("/")
def root():
    return {
        "status": "SiteEngineer AI Backend Running!"
    }


@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        collection = f"project_{request.project_id}" if request.project_id else "global"
        logger.info(f"[chat] query='{request.message[:80]}' collection={collection}")

        response = run_agent(
            request.message,
            request.chat_history,
            collection_name=collection
        )

        return {
            "response": response,
            "type": "agent"
        }

    except Exception as e:
        logger.error(f"[chat] error: {str(e)}")
        return {
            "response": str(e),
            "type": "error"
        }


@app.post("/api/chat/stream")
async def chat_stream(request: ChatRequest):

    async def generate():
        try:
            collection = f"project_{request.project_id}" if request.project_id else "global"
            logger.info(f"[chat/stream] query='{request.message[:80]}' collection={collection}")

            response = run_agent(
                request.message,
                request.chat_history,
                collection_name=collection
            )

            words = response.split(" ")

            for word in words:
                yield (
                    f"data: {json.dumps({'token': word + ' '})}\n\n"
                )

            yield (
                f"data: {json.dumps({'done': True})}\n\n"
            )

        except Exception as e:
            logger.error(f"[chat/stream] error: {str(e)}")
            yield (
                f"data: {json.dumps({'error': str(e)})}\n\n"
            )

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*"
        }
    )


@app.post("/api/chat/multimodal")
async def chat_multimodal(
    message: str = Form(...),
    chat_history: str = Form("[]"),
    file: UploadFile = File(...)
):
    try:
        import google.generativeai as genai

        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

        content = await file.read()
        ext = file.filename.split(".")[-1].lower()
        mime = "image/png" if ext == "png" else "image/jpeg"

        model = genai.GenerativeModel("gemini-3.6-flash")

        vision_response = model.generate_content([
            {
                "mime_type": mime,
                "data": content
            },
            (
                "Tum ek civil engineering expert ho. Is image ko dekh ke "
                "describe karo — agar ye site photo hai to koi defect/crack/"
                "issue dikhe to bataiye, agar blueprint/drawing hai to uske "
                "dimensions aur elements describe karo. Sirf factual "
                "description do, koi solution abhi mat do."
            )
        ])

        image_description = vision_response.text
        logger.info(f"[multimodal] file={file.filename} query='{message[:80]}'")

        combined_query = (
            f"[User ne ek image bheji hai. Image ka description: {image_description}]\n\n"
            f"User ka sawaal: {message}"
        )

        history = json.loads(chat_history)
        response = run_agent(combined_query, history)

        return {
            "response": response,
            "image_description": image_description,
            "type": "multimodal"
        }

    except Exception as e:
        logger.error(f"[multimodal] error: {str(e)}")
        return {
            "response": str(e),
            "type": "error"
        }


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...), project_id: str = Form(None)):
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
            return {
                "status": "error",
                "message": "Sirf PDF ya Image upload karo!"
            }

        collection = f"project_{project_id}" if project_id else "global"

        store_document(
            text,
            metadata={
                "source": file.filename,
                "type": ext
            },
            collection_name=collection
        )

        logger.info(f"[upload] file={file.filename} collection={collection}")

        return {
            "status": "success",
            "filename": file.filename
        }

    except Exception as e:
        logger.error(f"[upload] error: {str(e)}")
        return {
            "status": "error",
            "message": str(e)
        }


@app.post("/api/voice")
async def transcribe_voice(file: UploadFile = File(...)):
    try:
        content = await file.read()

        with open("temp_audio.wav", "wb") as f:
            f.write(content)

        from groq import Groq

        groq_client = Groq(
            api_key=os.getenv("GROQ_API_KEY")
        )

        with open("temp_audio.wav", "rb") as audio:

            transcription = groq_client.audio.transcriptions.create(
                file=audio,
                model="whisper-large-v3"
            )

        logger.info(f"[voice] transcribed='{transcription.text[:80]}'")

        return {
            "text": transcription.text
        }

    except Exception as e:
        logger.error(f"[voice] error: {str(e)}")
        return {
            "status": "error",
            "message": str(e)
        }


@app.get("/api/is-codes/{filename}")
async def download_is_code(filename: str):

    file_path = f"is_codes/{filename}"

    if os.path.exists(file_path):

        return FileResponse(
            path=file_path,
            filename=filename,
            media_type="application/pdf"
        )

    return {
        "error": "File not found"
    }