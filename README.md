# 🏗️ SiteEngineer AI

An AI-powered assistant for junior civil site engineers in India. It combines IS code search, material calculations, structural design guidance, site photo analysis, and project tracking in one place.

Junior engineers on site often struggle to recall the exact IS code clause, calculate material quantities on the spot, and document daily progress properly. SiteEngineer AI helps with all three through a document-grounded RAG assistant, an AI agent that chains multiple steps, and a full project workspace, usable by chat, voice, or camera.

🔗 **Live demo:** https://site-engineer-ai.vercel.app/
*(Free hosting: the first request after inactivity can take up to a minute while the backend wakes up.)*

---

## ✨ Features

### AI & RAG
- 🤖 **Multi-step AI agent**: a query like *"design a column for 200 kN"* triggers IS code lookup, then calculation, then practical guidance
- 📚 **RAG over IS code PDFs** (IS 456, IS 875 and more): answers grounded in the documents, not just LLM memory
- 🔗 **Source citations**: every RAG answer shows the document and page it came from
- 🗂️ **Per-project knowledge bases**: each project has its own isolated document collection
- 🌊 **Streaming responses**

### Multimodal & Voice
- 📸 **Site photo analysis**: upload a crack, defect, or drawing, and the agent follows up with relevant guidance (Google Gemini Vision)
- 🎙️ **Voice input** (Whisper via Groq)

### Project Workspace
- 📋 Per-project daily work logs, stored in Supabase
- 📄 **PDF report export** from a project's logs
- 🤝 **View-only sharing** with a colleague by email
- 💬 Project-linked chat that uses only that project's documents

### UX
- 🌗 Dark/light theme, 📱 mobile responsive, skeleton loading, markdown-rendered answers
- 🔐 Supabase email auth with Row Level Security on all tables
- ⚠️ Built-in disclaimer: AI suggestions must be verified by a qualified engineer

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), React Router, React Markdown, jsPDF |
| Backend | FastAPI, LangChain (agents), ChromaDB |
| Embeddings | `sentence-transformers/all-MiniLM-L6-v2` |
| LLM | Groq |
| Vision | Google Gemini |
| Speech-to-text | Groq Whisper |
| Auth & DB | Supabase (Postgres, Auth, Row Level Security) |
| Deployment | Vercel (frontend), Render (backend), Docker |

---

## 🏗️ Architecture

```
User (chat / voice / photo)
        │
        ▼
  React Frontend ─────────► Supabase (auth, chat history, projects)
        │
        ▼
  FastAPI Backend
        │
        ├── /api/chat, /api/chat/stream ──► AI Agent
        │                                     ├── search_is_code      → RAG (ChromaDB)
        │                                     ├── calculate_material  → formula logic
        │                                     ├── solve_site_problem  → RAG (ChromaDB)
        │                                     └── design_helper       → RAG + reasoning
        ├── /api/chat/multimodal ──► Gemini Vision → Agent
        ├── /api/upload          ──► PDF/image ingestion → ChromaDB (per-project collection)
        └── /api/voice           ──► Groq Whisper
```

Each project maps to its own ChromaDB collection (`project_<id>`). Uploads without a project go to a shared `global` collection.

---

## ⚙️ Setup

### Backend
```bash
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn api:app --reload --port 8000
```

Create a `.env` file (no spaces around `=`, no quotes):
```
GROQ_API_KEY=your_key
GEMINI_API_KEY=your_key
```

### Frontend
```bash
npm install
npm run dev
```
Set your Supabase URL and anon key in `src/supabase.js`, and point `API` in `src/components/chat.jsx` to your backend URL.

### Database
Tables used: `conversations`, `chat_history`, `projects`, `project_logs`, `project_collaborators`, all with Row Level Security policies.

---

## 🐳 Run with Docker

```bash
docker compose up --build
```

The backend is then available at `http://localhost:8000`. Create the `.env` file first.

---

## ⚠️ Disclaimer

This tool provides AI-generated suggestions for educational and productivity purposes. Structural design, calculations, and site decisions must be verified by a qualified, licensed engineer before implementation.

---

## 🚀 Future Scope

- Role-based access (admin / engineer / viewer) for full team hierarchies
- Offline-first PWA for low-connectivity sites
- Usage analytics dashboard
- More IS codes (steel, geotechnical, plumbing)
