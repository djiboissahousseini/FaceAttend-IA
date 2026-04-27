import requests
import json

data = {
    "student_id": "00000000-0000-0000-0000-000000000000",
    "course_id": "00000000-0000-0000-0000-000000000000",
    "absence_count": 5,
    "threshold": 5,
    "status": "active",
    "notes": "Test"
}

try:
    # Get a real student and course
    r = requests.get('http://localhost:8000/api/dashboard')
    print("Dashboard loaded")
except Exception as e:
    print(e)
