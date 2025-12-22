from PIL import Image
from io import BytesIO

def preprocess_image_bytes(data: bytes, max_size=(1024,1024)) -> bytes:
    img = Image.open(BytesIO(data))
    # Ensure JPEG-compatible mode
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")
    img.thumbnail(max_size)
    buf = BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()
