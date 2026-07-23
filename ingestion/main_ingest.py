from utils.file_router import route_file
from ingestion.pdf_pipeline import process_pdf
from ingestion.image_pipeline import process_image

def ingest(file):
    file_type = route_file(file)

    if file_type == "pdf":
        return process_pdf(file)

    elif file_type == "image":
        return process_image(file)

    else:
        raise ValueError("Unsupported file")