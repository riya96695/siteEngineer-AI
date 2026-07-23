# -*- coding: utf-8 -*-
from dotenv import load_dotenv
import streamlit as st
import os

from langchain_groq import ChatGroq
from rag.rag_pipeline import answer_question, store_document
from ingestion.main_ingest import ingest
from utils.file_router import route_file
from streamlit_mic_recorder import mic_recorder
from groq import Groq

load_dotenv()

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

UPLOAD_DIR = "uploaded_docs"
os.makedirs(UPLOAD_DIR, exist_ok=True)

llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.0)

SYSTEM_PROMPT = """You are SiteEngineer AI — expert assistant for junior civil site engineers in India.

LANGUAGE RULE: Always respond in Hinglish — mix of Hindi and English.
Example: "IS 456 ke according, M25 concrete ka water cement ratio 0.50 hona chahiye. Site pe isse strictly follow karo."
Never respond in pure Hindi. Never respond in pure English. Always Hinglish only.

Always mention the relevant IS code clause when answering.
Be concise and practical — engineers are on site."""

st.set_page_config(
    page_title="SiteEngineer AI",
    page_icon="🏗️",
    layout="wide",
)

st.markdown("""
<style>
.stApp { background-color: #1a1a1a; color: #e0e0e0; }
[data-testid="stSidebar"] { background-color: #111111; }
.stButton > button { background-color: #ff7a20; color: white; border: none; border-radius: 8px; }
.stButton > button:hover { background-color: #e06010; }
.stTabs [data-baseweb="tab"] { color: #aaa; }
.stTabs [aria-selected="true"] { color: #ff7a20 !important; border-bottom: 2px solid #ff7a20 !important; }
.is-code-card { background: #242424; border: 0.5px solid #333; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
[data-testid="stChatMessage"] { margin-bottom: 1rem; }
.recent-chat { background:#1f1f1f; padding:8px 12px; border-radius:8px; margin-bottom:6px; font-size:12px; color:#aaa; border-left:2px solid #ff7a20; }
</style>
""", unsafe_allow_html=True)

# -------------------- SIDEBAR --------------------
with st.sidebar:
    st.markdown("## 🏗️ SiteEngineer AI")
    st.markdown("*Powered by LLM + RAG*")
    st.divider()

    st.markdown("### 🕐 Recent Chats")
    if "chat_history" in st.session_state and st.session_state.chat_history:
        user_msgs = [m["content"] for m in st.session_state.chat_history if m["role"] == "user"]
        if user_msgs:
            for msg in reversed(user_msgs[-5:]):
                short = msg[:35] + "..." if len(msg) > 35 else msg
                st.markdown(f'<div class="recent-chat">💬 {short}</div>', unsafe_allow_html=True)
        else:
            st.markdown("<p style='color:#555;font-size:12px'>Abhi koi chat nahi!</p>", unsafe_allow_html=True)
    else:
        st.markdown("<p style='color:#555;font-size:12px'>Abhi koi chat nahi!</p>", unsafe_allow_html=True)

    if st.button("🗑️ Clear Chat"):
        st.session_state.chat_history = []
        st.rerun()

    st.divider()
    st.markdown("### ℹ️ About")
    st.markdown("<p style='color:#666;font-size:12px'>AI assistant for junior civil site engineers in India. Powered by LLM + RAG.</p>", unsafe_allow_html=True)

# -------------------- TABS --------------------
tab1, tab2, tab3, tab4 = st.tabs([
    "💬 AI Chat",
    "📚 IS Code Library",
    "🧮 Calculator",
    "🏗️ My Project Space"
])

# ==================== TAB 1: AI CHAT ====================
with tab1:
    st.markdown("### 💬 Ask Your Site Question")

    if "chat_history" not in st.session_state:
        st.session_state.chat_history = []
    if "last_uploaded_file" not in st.session_state:
        st.session_state.last_uploaded_file = None

    for message in st.session_state.chat_history:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])

    st.markdown("<div style='height:80px'></div>", unsafe_allow_html=True)

    bottom_col1, bottom_col2, bottom_col3 = st.columns([1, 1, 1])

    with bottom_col1:
        audio = mic_recorder(
            start_prompt="🎤",
            stop_prompt="⏹",
            just_once=True,
            key="voice_input"
        )

    with bottom_col2:
        with st.popover("📎"):
            uploaded_files = st.file_uploader(
                "Upload Blueprint / PDF / Image",
                type=["pdf", "png", "jpg", "jpeg"],
                accept_multiple_files=True
            )
            if uploaded_files:
                for file in uploaded_files:
                    save_path = os.path.join(UPLOAD_DIR, file.name)
                    with open(save_path, "wb") as f:
                        f.write(file.getbuffer())
                    file_type = route_file(file)
                    content = ingest(file)
                    store_document(
                        content,
                        metadata={"source": file.name, "type": file_type}
                    )
                    st.session_state.last_uploaded_file = file
                st.success("File processed!")

    with bottom_col3:
        with st.popover("📷"):
            camera_photo = st.camera_input("Photo lo")
            if camera_photo:
                save_path = os.path.join(UPLOAD_DIR, "camera_photo.jpg")
                with open(save_path, "wb") as f:
                    f.write(camera_photo.getbuffer())
                content = ingest(camera_photo)
                store_document(
                    content,
                    metadata={"source": "camera_photo.jpg", "type": "image"}
                )
                st.session_state.last_uploaded_file = camera_photo
                st.success("Photo captured!")

    user_prompt = st.chat_input("Site pe koi sawaal poochho — Hindi ya English mein...")

    if audio:
        with open("temp_audio.wav", "wb") as f:
            f.write(audio["bytes"])
        with open("temp_audio.wav", "rb") as file:
            transcription = groq_client.audio.transcriptions.create(
                file=file,
                model="whisper-large-v3"
            )
        user_prompt = transcription.text
        st.chat_message("user").markdown(user_prompt)

    if user_prompt:
        st.session_state.chat_history.append(
            {"role": "user", "content": user_prompt}
        )

        try:
            from core.router import classify_query
            query_type = classify_query(user_prompt)

            if query_type == "is_code":
                assistant_response = answer_question(user_prompt)
            elif query_type == "blueprint":
                if st.session_state.last_uploaded_file:
                    file = st.session_state.last_uploaded_file
                    if file.type.startswith("image/"):
                        response = llm.invoke([
                            {"role": "system", "content": SYSTEM_PROMPT + " Analyze the blueprint carefully."},
                            {"role": "user", "content": user_prompt}
                        ])
                        assistant_response = response.content
                    else:
                        assistant_response = answer_question(user_prompt)
                else:
                    assistant_response = "Bhai pehle blueprint image upload karo, phir poochho!"
            else:
                response = llm.invoke([
                    {"role": "system", "content": SYSTEM_PROMPT},
                    *[{"role": m["role"], "content": m["content"]}
                      for m in st.session_state.chat_history]
                ])
                assistant_response = response.content

        except Exception:
            response = llm.invoke([
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ])
            assistant_response = response.content

        st.session_state.chat_history.append(
            {"role": "assistant", "content": assistant_response}
        )
        with st.chat_message("assistant"):
            st.markdown(assistant_response)

# ==================== TAB 2: IS CODE LIBRARY ====================
with tab2:
    st.markdown("### 📚 IS Code Library")
    st.markdown("PDF download karo aur directly read karo")

    is_codes = [
        {"name": "IS 456 — 2000", "desc": "Plain and Reinforced Concrete — Code of Practice", "use": "Columns, Beams, Slabs, Foundations", "file": "IS_456_2000.pdf"},
        {"name": "IS 800 — 2007", "desc": "General Construction in Steel — Code of Practice", "use": "Steel structures, Industrial sheds", "file": "IS_800_2007.pdf"},
        {"name": "IS 1200", "desc": "Method of Measurement of Building Works", "use": "Billing, Quantity estimation", "file": "IS_1200.pdf"},
        {"name": "IS 875", "desc": "Code of Practice for Design Loads", "use": "Dead load, Live load, Wind load", "file": "IS_875.pdf"},
    ]

    for i, code in enumerate(is_codes):
        with st.container():
            st.markdown(f"""
            <div class="is-code-card">
                <h4 style="color:#ff7a20;margin:0">{code['name']}</h4>
                <p style="color:#aaa;margin:4px 0">{code['desc']}</p>
                <p style="color:#666;font-size:12px">Used for: {code['use']}</p>
            </div>
            """, unsafe_allow_html=True)

            file_path = os.path.join("is_codes", code["file"])
            if os.path.exists(file_path):
                with open(file_path, "rb") as f:
                    st.download_button(
                        label="⬇️ Download",
                        data=f,
                        file_name=code["file"],
                        mime="application/pdf",
                        key=f"dl_{i}"
                    )
            else:
                st.warning(f"PDF not found: {code['file']}")

# ==================== TAB 3: CALCULATOR ====================
with tab3:
    st.markdown("### 🧮 Material Calculator")

    calc_type = st.selectbox(
        "Calculator choose karo:",
        ["Concrete Mix Calculator", "Steel Weight Calculator", "Brick & Mortar Calculator"]
    )

    if calc_type == "Concrete Mix Calculator":
        st.markdown("#### Concrete Mix — M Grade")
        grade = st.selectbox("Concrete Grade:", ["M15", "M20", "M25", "M30"])
        volume = st.number_input("Volume (cubic meters):", min_value=0.1)
        ratios = {"M15": (1, 2, 4), "M20": (1, 1.5, 3), "M25": (1, 1, 2), "M30": (1, 0.75, 1.5)}

        if st.button("Calculate"):
            c, s, a = ratios[grade]
            total = c + s + a
            dry_vol = volume * 1.54
            cement_bags = (dry_vol * c / total) / 0.0347
            sand = dry_vol * s / total
            aggregate = dry_vol * a / total
            st.success(f"""
            **{volume} m³ of {grade} ke liye:**
            - 🏭 Cement: **{cement_bags:.1f} bags** (50kg each)
            - 🏖️ Sand: **{sand:.2f} m³**
            - 🪨 Aggregate: **{aggregate:.2f} m³**
            """)

    elif calc_type == "Steel Weight Calculator":
        st.markdown("#### Steel Bar Weight")
        diameter = st.selectbox("Bar Diameter (mm):", [8, 10, 12, 16, 20, 25, 32])
        length = st.number_input("Length (meters):", min_value=0.1)
        nos = st.number_input("Number of bars:", min_value=1, step=1)

        if st.button("Calculate"):
            weight = (diameter**2 / 162) * length * nos
            st.success(f"""
            **Steel Weight:**
            - 🔩 {nos} bars of {diameter}mm × {length}m
            - ⚖️ Total Weight: **{weight:.2f} kg**
            """)

    elif calc_type == "Brick & Mortar Calculator":
        st.markdown("#### Brick & Mortar for Wall")
        length = st.number_input("Wall Length (m):", min_value=0.1)
        height = st.number_input("Wall Height (m):", min_value=0.1)
        thickness = st.selectbox("Wall Thickness:", ["Half brick (115mm)", "One brick (230mm)"])

        if st.button("Calculate"):
            area = length * height
            if "Half" in thickness:
                bricks = area * 55
                mortar = area * 0.03
            else:
                bricks = area * 110
                mortar = area * 0.06
            st.success(f"""
            **{length}m × {height}m wall ke liye:**
            - 🧱 Bricks: **{int(bricks)} bricks**
            - 🪣 Mortar: **{mortar:.2f} m³**
            """)

# ==================== TAB 4: MY PROJECT SPACE ====================
with tab4:
    st.markdown("### 🏗️ My Project Space")

    from project_space.project_manager import (
        load_projects, save_project,
        add_daily_log, get_project_logs
    )

    projects = load_projects()
    col1, col2 = st.columns([1, 2])

    with col1:
        st.markdown("#### My Projects")
        project_names = [p["name"] for p in projects]

        if project_names:
            selected = st.selectbox("Select Project:", project_names)
        else:
            selected = None
            st.info("Abhi koi project nahi hai!")

        st.markdown("#### Naya Project Banao")
        new_name = st.text_input("Project Name:")
        new_location = st.text_input("Site Location:")

        if st.button("Create Project"):
            if new_name:
                save_project(new_name, new_location)
                st.success(f"Project '{new_name}' ban gaya!")
                st.rerun()

    with col2:
        if selected:
            st.markdown(f"#### 📋 {selected} — Daily Log")
            logs = get_project_logs(selected, projects)

            if logs:
                for log in reversed(logs[-5:]):
                    st.markdown(f"""
**{log['date']}**
{log['work']}
*Notes: {log.get('notes', 'None')}*

---
                    """)
            else:
                st.info("Abhi koi log nahi — pehla entry daalo!")

            st.markdown("#### Aaj Ka Kaam Log Karo")
            work_done = st.text_area("Aaj kya kaam kiya:")
            notes = st.text_input("Notes/Issues:")

            if st.button("Save Log"):
                if work_done:
                    add_daily_log(selected, work_done, notes, projects)
                    st.success("Log save ho gaya!")
                    st.rerun()