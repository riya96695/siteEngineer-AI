from tools.arxiv_tool import search_arxiv

def research_agent(query: str):
    papers = search_arxiv(query)

    if not papers:
        return "No research papers found."

    response = "📚 Here are some research papers:\n\n"

    for i, p in enumerate(papers[:3], 1):
        response += f"{i}. {p['title']}\n"
        response += f"Summary: {p['summary'][:200]}...\n"
        response += f"🔗 {p['url']}\n\n"

    return response