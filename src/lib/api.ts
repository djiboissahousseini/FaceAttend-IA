// ─── FaceAttend — API Layer (Backend local FastAPI sur port 8000) ─────────────
const API = 'http://localhost:8000';

// ─── Helper fetch ─────────────────────────────────────────────────────────────
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? res.statusText);
  }
  return res.json();
}

// ─── Health / Connection ──────────────────────────────────────────────────────
export async function checkHealth(): Promise<{ status: string; database: string }> {
  return apiFetch('/api/health');
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export async function getDashboardStats() {
  const data = await apiFetch<{ stats: any; recentRecords: any[] }>('/api/dashboard');
  return data.stats;
}

// ─── Courses ─────────────────────────────────────────────────────────────────
export async function getCourses() {
  return apiFetch<any[]>('/api/courses');
}

// ─── Sessions ────────────────────────────────────────────────────────────────
export async function getSessions() {
  return apiFetch<any[]>('/api/sessions');
}

// ─── Teachers ────────────────────────────────────────────────────────────────
export async function getTeachers() {
  return apiFetch<any[]>('/api/teachers');
}

// ─── Students ────────────────────────────────────────────────────────────────
export async function getStudents() {
  return apiFetch<any[]>('/api/students');
}

// ─── Departments ─────────────────────────────────────────────────────────────
export async function getDepartments() {
  return apiFetch<any[]>('/api/departments');
}

// ─── Alerts ──────────────────────────────────────────────────────────────────
export async function getAlerts() {
  return apiFetch<any[]>('/api/alerts');
}

// ─── Attendance Records for a session ────────────────────────────────────────
export async function getSessionRecords(sessionId: string) {
  return apiFetch<any[]>(`/api/sessions/${sessionId}/records`);
}

// ─── File Upload ──────────────────────────────────────────────────────────────
export async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API}/api/upload`, { method: 'POST', body: formData });
  if (!res.ok) throw new Error("Échec de l'upload");
  const data = await res.json();
  return data.url as string;
}

// ─── Face Recognition ────────────────────────────────────────────────────────
export async function recognizeFace(sessionId: string | number, imageBase64: string) {
  return apiFetch<any>(`/api/sessions/${sessionId}/recognize`, {
    method: 'POST',
    body: JSON.stringify({ image: imageBase64 }),
  });
}

// ─── Upsert attendance record ─────────────────────────────────────────────────
export async function upsertRecord(payload: {
  session_id: string;
  student_id: string;
  status: string;
  method: string;
  confidence_score?: number | null;
}) {
  return apiFetch<any>('/api/records/upsert', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ─── Create Teacher ───────────────────────────────────────────────────────────
export async function createTeacher(payload: { name: string; email: string; photo_url?: string }) {
  return apiFetch<any>('/api/teachers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ─── Create Session ───────────────────────────────────────────────────────────
export async function createSession(payload: {
  teacher_id: number;
  course_name: string;
  group_name: string;
  classroom?: string;
  session_date: string;
}) {
  return apiFetch<{ id: number }>('/api/sessions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
