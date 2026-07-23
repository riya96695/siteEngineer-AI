import arxiv

def search_arxiv(query, max_results=5):
    search = arxiv.Search(
        query=query,
        max_results=max_results,
        sort_by=arxiv.SortCriterion.SubmittedDate
    )

    papers = []

    for result in search.results():
        papers.append({
            "title": result.title,
            "summary": result.summary,
            "url": result.entry_id
        })

    return papers