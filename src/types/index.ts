export interface Teacher {
  id: number;
  name: string;
  email: string;
  photo_url?: string;
  pin_code?: string;
  password?: string;
}

export interface Session {
  id: string;
  course_id?: string;
  teacher_id: string;
  course_name: string;
  group_name: string;
  classroom?: string;
  session_date: string;
  start_time?: string;
  end_time?: string;
  teacher_name?: string;
  status?: string;
  is_active?: boolean;
  is_manual?: boolean;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  created_at: string;
}

export interface Student {
  id: string;
  student_code: string;
  full_name: string;
  email: string;
  department_id: string | null;
  photo_url: string;
  face_encoding: object | null;
  enrolled_at: string;
  is_active: boolean;
  name?: string;
  matricule?: string;
  group_name?: string;
  created_at: string;
  departments?: Department;
}

export interface Course {
  id: string;
  course_code: string;
  name: string;
  teacher_name: string;
  department_id: string | null;
  semester: string;
  schedule_day: string;
  schedule_time: string;
  room: string;
  group_name: string;
  absence_threshold: number;
  created_at: string;
  departments?: Department;
}

export interface CourseEnrollment {
  id: string;
  student_id: string;
  course_id: string;
  enrolled_at: string;
  students?: Student;
  courses?: Course;
}

export interface AttendanceSession {
  id: string;
  course_id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  status: 'active' | 'completed' | 'cancelled';
  notes: string;
  created_at: string;
  courses?: Course;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  marked_at: string;
  method: 'facial' | 'manual';
  confidence_score: number | null;
  students?: Student;
  attendance_sessions?: AttendanceSession;
}

export interface AbsenceAlert {
  id: string;
  student_id: string;
  course_id: string;
  absence_count: number;
  threshold: number;
  status: 'active' | 'resolved' | 'acknowledged';
  generated_at: string;
  resolved_at: string | null;
  notes: string;
  students?: Student;
  courses?: Course;
}

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalCourses?: number;
  todaySessions: number;
  activeAlerts?: number;
  presentToday: number;
  absentToday: number;
  attendanceRate: number;
}

export type Page =
  | 'dashboard'
  | 'teacher'
  | 'teachers'
  | 'students'
  | 'courses'
  | 'attendance'
  | 'classroom'
  | 'alerts'
  | 'reports';
