from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
import os

# -------- LLM --------
llm = ChatGroq(
    model="openai/gpt-oss-20b",
    temperature=0.0,
)

# -------- SYSTEM PROMPT --------
SYSTEM_PROMPT = """You are SiteEngineer AI — expert assistant for junior civil site engineers in India.

LANGUAGE RULE: ALWAYS respond in Hinglish — mix of Hindi and English ONLY.
Example: "IS 456 ke according, M25 concrete ka water cement ratio 0.50 hona chahiye."
NEVER respond in pure Hindi. NEVER respond in pure English. ALWAYS Hinglish only.

Always mention relevant IS code clause when answering.
Be concise and practical — engineers are on site."""


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