import { useState, useEffect } from 'react';
import { Page } from './types';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import Students from './pages/Students';
import Attendance from './pages/Attendance';
import Courses from './pages/Courses';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';
import ClassroomCamera from './pages/ClassroomCamera';
import Teachers from './pages/Teachers';
import Login from './pages/Login';
import StudentLogin from './pages/StudentLogin';
import StudentDashboard from './pages/StudentDashboard';
import AdminStudentSpace from './pages/AdminStudentSpace';
import Classrooms from './pages/Classrooms';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('faceattend_auth') === 'true';
  });
  const [userRole, setUserRole] = useState<'admin' | 'teacher' | null>(() => {
    return (localStorage.getItem('faceattend_role') as 'admin' | 'teacher' | null) || null;
  });
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    const role = localStorage.getItem('faceattend_role');
    return role === 'teacher' ? 'teacher' : 'dashboard';
  });
  const [studentUser, setStudentUser] = useState<unknown>(() => {
    try {
      const saved = localStorage.getItem('faceattend_student');
      return saved ? JSON.parse(saved) : null;
    } catch (_e) {
      return null;
    }
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem('faceattend_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
      setUserRole(localStorage.getItem('faceattend_role') as 'admin' | 'teacher' | null);
    }
  }, []);

  // ─── PROTECTION ANTI-MOBILE (Réseau Local) ──────────────
  // Si l'utilisateur n'est pas sur le PC central (localhost) et tente d'accéder à l'admin ou au prof
  if (
    window.location.hostname !== 'localhost' &&
    (window.location.pathname.startsWith('/admin') ||
      window.location.pathname.startsWith('/teacher') ||
      window.location.pathname === '/')
  ) {
    window.location.href = '/portal';
    return null;
  }

  const handleLogin = (authenticated: boolean) => {
    if (authenticated) {
      const savedRole = localStorage.getItem('faceattend_role') as 'admin' | 'teacher' | null;
      setIsAuthenticated(true);
      setUserRole(savedRole);
      setCurrentPage(savedRole === 'teacher' ? 'teacher' : 'dashboard');
    } else {
      setIsAuthenticated(false);
    }
  };

  // ─── TERMINAL PUBLIC (Caméra) ─────────────────────────
  if (window.location.pathname === '/camera') {
    return <ClassroomCamera />;
  }

  // ─── PORTAIL ÉTUDIANT (Accessible via /portal pour le mobile) ──────────
  if (window.location.pathname === '/portal') {
    if (!studentUser) {
      return (
        <StudentLogin
          onLogin={(user) => {
            localStorage.setItem('faceattend_student', JSON.stringify(user));
            setStudentUser(user);
          }}
        />
      );
    }
    return (
      <StudentDashboard
        onLogout={() => {
          localStorage.removeItem('faceattend_student');
          setStudentUser(null);
        }}
      />
    );
  }

  // ─── PORTAIL ENSEIGNANT DÉDIÉ ─────────────────────────
  if (window.location.pathname === '/teacher') {
    if (!isAuthenticated || userRole !== 'teacher') {
      return <Login onLogin={handleLogin} forceRole="teacher" />;
    }
    return <TeacherDashboard mode="teacher" />;
  }

  // ─── REDIRECTION RACINE -> ADMIN ─────────────────────
  if (window.location.pathname === '/') {
    window.location.href = '/admin';
    return null;
  }

  // ─── PORTAIL ADMIN (/admin) ──────────────────────────
  if (window.location.pathname.startsWith('/admin')) {
    if (!isAuthenticated || userRole !== 'admin') {
      return <Login onLogin={handleLogin} forceRole="admin" />;
    }

    const handleLogout = () => {
      setIsAuthenticated(false);
      setUserRole(null);
      localStorage.removeItem('faceattend_auth');
      localStorage.removeItem('faceattend_role');
      localStorage.removeItem('faceattend_user');
      window.location.href = '/admin';
    };

    const renderAdminPage = () => {
      switch (currentPage) {
        case 'dashboard':
          return <Dashboard />;
        case 'teacher':
          return <TeacherDashboard mode="simulation" />;
        case 'teachers':
          return <Teachers />;
        case 'students':
          return <Students />;
        case 'attendance':
          return <Attendance />;
        case 'courses':
          return <Courses />;
        case 'alerts':
          return <Alerts />;
        case 'reports':
          return <Reports />;
        case 'classrooms':
          return <Classrooms />;
        case 'student_space':
          return <AdminStudentSpace />;
        default:
          return <Dashboard />;
      }
    };

    return (
      <div className="min-h-screen bg-slate-50">
        <Layout
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          onLogout={handleLogout}
        >
          {renderAdminPage()}
        </Layout>
      </div>
    );
  }

  // Fallback (404)
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-mono flex-col gap-4">
      <h1 className="text-4xl text-[#00f0ff]">404</h1>
      <p className="text-slate-400">Page introuvable. Veuillez utiliser /admin ou /teacher.</p>
    </div>
  );
}

export default App;
