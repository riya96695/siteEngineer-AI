from pdfminer.six import extract_text

def process_pdf(file):
    text = extract_text(file)
    return text