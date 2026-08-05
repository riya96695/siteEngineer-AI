from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
import os

# -------- LLM --------
llm = ChatGroq(
    model="gemma2-9b-it",  # "it" = instruction tuned
    temperature=0.0,
)

# -------- SYSTEM PROMPT --------
SYSTEM_PROMPT = """You are SiteEngineer AI — an expert assistant for junior civil site engineers in India.

You help with:
- IS code queries (IS 456, IS 800, IS 1200, IS 875)
- Blueprint and drawing analysis
- Material quantity calculations
- Construction site problem solving

Rules:
- Always mention the relevant IS code clause when answering
- Be concise and practical — engineers are on site
- Support both Hindi and English questions
- If unsure, say so — never give wrong technical advice
- For calculations, show the formula and steps clearly
"""


def get_llm():
    return llm


def get_system_prompt():
    return SYSTEM_PROMPT


def chat_with_llm(user_message, chat_history=None):
    if chat_history is None:
        chat_history = []

    messages = [SystemMessage(content=SYSTEM_PROMPT)]

    for msg in chat_history:
        messages.append(msg)

    messages.append(HumanMessage(content=user_message))

    response = llm.invoke(messages)
    return response.content