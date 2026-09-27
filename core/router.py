from langchain_groq import ChatGroq
import os

llm = ChatGroq(
    model="openai/gpt-oss-20b",
    temperature=0.0,
)


def classify_query(user_query: str) -> str:
    prompt = f"""You are a query classifier for a civil engineering AI tool.

Classify the following query into ONE of these categories:
- "is_code" → user asking about IS codes, standards, clauses, specifications
- "blueprint" → user asking about drawings, images, plans, details
- "calculator" → user asking for quantity, material, weight calculations
- "general" → general civil engineering question

Query: "{user_query}"

Reply with ONLY one word — the category name. Nothing else."""

    response = llm.invoke([
        {"role": "user", "content": prompt}
    ])

    result = response.content.strip().lower()

    valid = ["is_code", "blueprint", "calculator", "general"]
    if result not in valid:
        return "general"

    return result