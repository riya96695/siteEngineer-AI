def route_file(file):
    if file.type == "application/pdf":
        return "pdf"
    elif file.type.startswith("image/"):
        return "image"
    else:
        return "unsupported"