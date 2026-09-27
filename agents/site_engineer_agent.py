from langchain_groq import ChatGroq
from langchain.agents import create_agent as langchain_create_agent
from rag.rag_pipeline import answer_question
import os


llm = ChatGroq(
    model="openai/gpt-oss-20b",
    temperature=0.0,
    api_key=os.getenv("GROQ_API_KEY")
)


SYSTEM_PROMPT = """
You are SiteEngineer AI — expert assistant for junior civil
site engineers in India.

Rules:
1. Always respond in Hinglish.
2. Give practical site-engineering advice.
3. Mention relevant IS code whenever applicable.
4. Mention clause number when available.
5. Do not invent IS code clauses.
6. Use IS Code Search for pure IS code lookup questions.
7. Use Material Calculator for material quantity calculations.
8. Use Site Problem Solver for construction problems.
9. Use Design Helper for structural design questions (column, beam,
   slab, footing design) — combine IS code lookup with practical
   design steps and calculations in one answer.
10. For complex questions, use MULTIPLE tools in sequence if needed —
    e.g. first check IS code, then calculate, then suggest.
11. If information is insufficient, clearly say so.
12. Keep answers concise and practical.
"""


def build_tools(collection_name="global"):
    """Har collection ke liye alag tools banata hai, closure ke through
    collection_name ko bind karke — isse ek hi tool function alag
    projects ke documents pe kaam kar sakta hai."""

    def search_is_code(query: str) -> str:
        """Search relevant IS code clauses and standards for a given civil engineering query."""
        return answer_question(query, collection_name=collection_name)

    def calculate_material(query: str) -> str:
        """Calculate material quantity (concrete, cement, steel, or brick) based on the query."""
        query_lower = query.lower()

        if "concrete" in query_lower or "cement" in query_lower:
            return """
Concrete calculation formula:

Dry Volume = Wet Volume × 1.54

Cement Bags =
(Dry Volume × Cement Ratio / Total Ratio) / 0.0347

Sand =
Dry Volume × Sand Ratio / Total Ratio

Aggregate =
Dry Volume × Aggregate Ratio / Total Ratio

M25 nominal mix = 1 : 1 : 2
(Cement : Sand : Aggregate)
"""

        elif "steel" in query_lower:
            return """
Steel weight formula:

Weight = D² / 162 × Length × Number of Bars

D = diameter in mm
Length = length in metres
Weight = kg
"""

        elif "brick" in query_lower:
            return """
Brick quantity:

Approximately 55 bricks per m² for half-brick wall.
Approximately 110 bricks per m² for one-brick wall.

Actual quantity depends on brick size and mortar joint.
"""

        return "Please specify concrete, cement, steel, or brick calculation."

    def solve_site_problem(problem: str) -> str:
        """Provide a practical solution for a civil site engineering problem, citing IS code if applicable."""
        query = (
            f"Site problem: {problem}. "
            "Give a practical solution for a civil site engineer "
            "and mention relevant IS code and clause if available."
        )
        return answer_question(query, collection_name=collection_name)

    def design_helper(query: str) -> str:
        """Guide structural design questions (column, beam, slab, footing) by combining
        relevant IS code clauses with standard design considerations. Use this when the
        user asks to 'design' a structural element, not just calculate material quantity."""
        is_code_context = answer_question(
            f"IS code clauses and design requirements for: {query}",
            collection_name=collection_name
        )
        return (
            f"IS Code reference found:\n{is_code_context}\n\n"
            "Ab is context ke aadhar par practical design steps aur "
            "minimum dimensions/reinforcement guidance do, aur agar user ne "
            "load ya dimension diya hai to us par calculation bhi karo."
        )

    return [search_is_code, calculate_material, solve_site_problem, design_helper]


_agent_cache = {}


def create_agent(collection_name="global"):
    if collection_name not in _agent_cache:
        tools = build_tools(collection_name)
        _agent_cache[collection_name] = langchain_create_agent(
            model=llm,
            tools=tools,
            system_prompt=SYSTEM_PROMPT
        )
    return _agent_cache[collection_name]


def run_agent(query: str, chat_history: list = None, collection_name="global") -> str:
    try:
        if chat_history is None:
            chat_history = []

        agent = create_agent(collection_name)

        messages = []

        for message in chat_history:
            if isinstance(message, dict):
                role = message.get("role")
                content = message.get("content")

                if role in ["user", "assistant"] and content:
                    messages.append({
                        "role": role,
                        "content": content
                    })

        messages.append({
            "role": "user",
            "content": query
        })

        result = agent.invoke({
            "messages": messages
        })

        if "messages" in result and result["messages"]:
            return result["messages"][-1].content

        return "Kuch issue hua — dobara try karo!"

    except Exception as e:
        return f"Agent error: {str(e)}"