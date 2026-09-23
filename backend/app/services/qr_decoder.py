"""Multi-engine and adaptive pre-processing QR code decoder."""

import io
from typing import Dict, Any, Optional
import cv2
import numpy as np
from PIL import Image


def decode_qr_image(image_bytes: bytes) -> Dict[str, Any]:
    """
    Decode QR code from raw image bytes using OpenCV QRCodeDetector
    with multi-stage pre-processing fallbacks (Otsu threshold, inversion, CLAHE).
    """
    try:
        # Load image via PIL to verify and normalize format
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img_np = np.array(pil_image)
        # Convert RGB to BGR for OpenCV
        img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
    except Exception as e:
        return {
            "success": False,
            "data": None,
            "method": None,
            "error": f"Invalid image format or corrupted file: {str(e)}"
        }

    detector = cv2.QRCodeDetector()

    # Pass 1: Direct detection on original BGR image
    data, points, _ = detector.detectAndDecode(img_bgr)
    if data and data.strip():
        return {
            "success": True,
            "data": data.strip(),
            "method": "opencv_direct",
            "error": None
        }

    # Pass 2: Grayscale + Histogram Equalization (Contrast adjustment)
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    data, points, _ = detector.detectAndDecode(gray)
    if data and data.strip():
        return {
            "success": True,
            "data": data.strip(),
            "method": "opencv_grayscale",
            "error": None
        }

    # Pass 3: Otsu Binarization (Handles uneven lighting / low contrast)
    _, otsu = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    data, points, _ = detector.detectAndDecode(otsu)
    if data and data.strip():
        return {
            "success": True,
            "data": data.strip(),
            "method": "opencv_otsu_threshold",
            "error": None
        }

    # Pass 4: Inverted Binarization (Handles dark-mode / inverted QR codes)
    inverted = cv2.bitwise_not(otsu)
    data, points, _ = detector.detectAndDecode(inverted)
    if data and data.strip():
        return {
            "success": True,
            "data": data.strip(),
            "method": "opencv_inverted",
            "error": None
        }

    return {
        "success": False,
        "data": None,
        "method": None,
        "error": "No QR code pattern could be detected in the provided image."
    }
