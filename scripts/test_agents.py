import requests
import sys
import time

BASE_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:5173"

def test_backend_health():
    print("🔍 Testing Backend Health...")
    try:
        response = requests.get(f"{BASE_URL}/api/classrooms")
        if response.status_code == 200:
            print("✅ Backend is UP and database is connected.")
            return True
        else:
            print(f"❌ Backend returned status code {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend is DOWN: {e}")
        return False

def test_frontend_health():
    print("\n🔍 Testing Frontend Health...")
    try:
        response = requests.get(FRONTEND_URL)
        if response.status_code == 200:
            print("✅ Frontend is UP (Vite is serving).")
            return True
        else:
            print(f"❌ Frontend returned status code {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Frontend is DOWN: {e}")
        return False

def test_api_endpoints():
    print("\n🔍 Testing Critical API Endpoints...")
    endpoints = [
        "/api/departments",
        "/api/teachers",
        "/api/students",
        "/api/courses"
    ]
    all_ok = True
    for ep in endpoints:
        try:
            res = requests.get(f"{BASE_URL}{ep}")
            if res.status_code == 200:
                data = res.json()
                count = len(data) if isinstance(data, list) else "N/A"
                print(f"✅ {ep}: OK (Found {count} items)")
            else:
                print(f"❌ {ep}: Error {res.status_code}")
                all_ok = False
        except Exception as e:
            print(f"❌ {ep}: Exception {e}")
            all_ok = False
    return all_ok

def test_recognition_endpoint():
    print("\n🔍 Testing Recognition API...")
    # Using a valid session ID from the database
    session_id = "1" 
    payload = {
        "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        "target_type": "student",
        "liveness_enabled": False
    }
    try:
        res = requests.post(f"{BASE_URL}/api/sessions/{session_id}/recognize", json=payload)
        # It should return a valid response even if no match is found
        if res.status_code == 200:
            data = res.json()
            print(f"✅ Recognition API: OK (Result: {data.get('message', 'No message')})")
            return True
        else:
            print(f"❌ Recognition API: Failed with {res.status_code}")
            return False
    except Exception as e:
        print(f"❌ Recognition API: Exception {e}")
        return False

def test_teacher_login():
    print("\n🔍 Testing Teacher Login...")
    payload = {
        "email": "benarbi@univ-temouchent.dz",
        "password": "password123"
    }
    try:
        res = requests.post(f"{BASE_URL}/api/teachers/login", json=payload)
        if res.status_code == 200:
            print("✅ Teacher Login: OK")
            return True
        else:
            print(f"❌ Teacher Login: Failed with {res.status_code} ({res.text})")
            return False
    except Exception as e:
        print(f"❌ Teacher Login: Exception {e}")
        return False

def test_course_creation():
    print("\n🔍 Testing Course Creation...")
    course_code = f"TEST-{int(time.time())}"
    payload = {
        "course_code": course_code,
        "name": "Automated Test Course",
        "teacher_name": "Dr. Test Agent",
        "department_id": None,
        "semester": "S1",
        "schedule_day": "Monday",
        "schedule_time": "10:00",
        "room": "Virtual Lab",
        "group_name": "ALL",
        "course_type": "TP",
        "absence_threshold": 3
    }
    try:
        res = requests.post(f"{BASE_URL}/api/courses", json=payload)
        if res.status_code == 200:
            print(f"✅ Course Creation: OK (Code: {course_code})")
            return True
        else:
            print(f"❌ Course Creation: Failed with {res.status_code}")
            return False
    except Exception as e:
        print(f"❌ Course Creation: Exception {e}")
        return False

def test_session_creation():
    print("\n🔍 Testing Session Planning...")
    # We need a teacher_id. We'll use ID 1 from previous tests.
    payload = {
        "teacher_id": 1,
        "course_name": "Automated Test Course",
        "group_name": "ALL",
        "classroom": "Virtual Lab",
        "session_date": "2026-04-27",
        "start_time": "10:00",
        "end_time": "12:00"
    }
    try:
        res = requests.post(f"{BASE_URL}/api/sessions", json=payload)
        if res.status_code == 200:
            print("✅ Session Planning: OK")
            return True
        else:
            # Maybe it fails if ID 1 doesn't exist or something, but we check the logic
            print(f"❌ Session Planning: Failed with {res.status_code} ({res.text})")
            return False
    except Exception as e:
        print(f"❌ Session Planning: Exception {e}")
        return False

def main():
    print("========================================")
    print("   FaceAttend Agentic Testing Script    ")
    print("========================================\n")
    
    b_health = test_backend_health()
    f_health = test_frontend_health()
    
    if not b_health:
        print("\n⚠️ Backend is not reachable. Skipping further tests.")
        sys.exit(1)
        
    test_api_endpoints()
    test_teacher_login()
    test_course_creation()
    test_session_creation()
    test_recognition_endpoint()
    
    print("\n========================================")
    print("          Testing Completed             ")
    print("========================================")

if __name__ == "__main__":
    main()
