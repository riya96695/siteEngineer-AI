import pytesseract
from PIL import Image

# ✅ ADD THIS LINE HERE
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"


def process_image(file):
    image = Image.open(file)

    # OCR
    text = pytesseract.image_to_string(image)

    caption = "This image contains textual or visual information."

    return text + "\n" + caption