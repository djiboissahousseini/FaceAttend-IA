
import os
import sys
from deepface import DeepFace

def test_liveness():
    # Use a placeholder image or a real one if available
    img_path = "/home/usain/Bureau/FaceAttend/backend/uploads/test.jpg"
    # Create a dummy image if not exists
    if not os.path.exists(img_path):
        import cv2
        import numpy as np
        dummy = np.zeros((200, 200, 3), dtype=np.uint8)
        cv2.imwrite(img_path, dummy)

    try:
        print("Testing DeepFace.extract_faces with anti_spoofing=True...")
        results = DeepFace.extract_faces(
            img_path=img_path,
            detector_backend="opencv",
            enforce_detection=False,
            anti_spoofing=True
        )
        print(f"Results: {results}")
        if results:
            print(f"Is Real: {results[0].get('is_real')}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_liveness()
