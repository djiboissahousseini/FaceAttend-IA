import urllib.request
import json

def fetch_json(url):
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def upsert_alert(student_id, course_id):
    url = "http://localhost:8000/api/alerts/upsert"
    data = {
        "student_id": student_id,
        "course_id": course_id,
        "absence_count": 6,
        "threshold": 5,
        "status": "active",
        "notes": "Test de l'onglet alertes"
    }
    
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as response:
            print("Alert inserted successfully")
    except Exception as e:
        print(f"Error inserting alert: {e}")

# Fetch a student and a course
dashboard_data = fetch_json("http://localhost:8000/api/dashboard")
if not dashboard_data:
    print("Could not fetch dashboard")
    exit(1)

# We need a student and a course
records = fetch_json("http://localhost:8000/api/records")
if records and len(records) > 0:
    student_id = records[0]["student_id"]
    course_id = records[0].get("attendance_sessions", {}).get("course_id")
    if student_id and course_id:
        upsert_alert(student_id, course_id)
        exit(0)

print("Could not find a valid student and course to insert an alert.")
