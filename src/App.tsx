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
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('faceattend_admin_token') === 'true';
  });
  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('faceattend_teacher_token') === 'true';
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
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('faceattend_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    if (window.location.pathname.startsWith('/portal')) {
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
      
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', theme === 'dark' ? '#020617' : '#f8fafc');
      }
    } else {
      // Pour l'admin/prof/caméra, on s'assure que le mode sombre est actif par défaut
      // car le design original de l'application est basé sur ce mode.
      root.classList.remove('light');
      root.classList.add('dark');
      
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', '#020617');
      }
    }
  }, [theme, window.location.pathname]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  // ─── PROTECTION ANTI-MOBILE (Réseau Local) ──────────────
  // Si l'utilisateur n'est pas sur le PC central (localhost/127.0.0.1) 
  // et tente d'accéder à l'admin, au prof ou à la caméra
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (
    !isLocal &&
    (window.location.pathname.startsWith('/admin') ||
      window.location.pathname.startsWith('/teacher') ||
      window.location.pathname.startsWith('/camera') ||
      window.location.pathname === '/')
  ) {
    window.location.href = '/portal';
    return null;
  }

  const handleLogin = (authenticated: boolean) => {
    if (authenticated) {
      const savedRole = localStorage.getItem('faceattend_role') as 'admin' | 'teacher' | null;
      if (savedRole === 'admin') {
        setIsAdminAuthenticated(true);
        setCurrentPage('dashboard');
      } else if (savedRole === 'teacher') {
        setIsTeacherAuthenticated(true);
        setCurrentPage('teacher');
      }
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
          key={`login-${theme}`}
          onLogin={(user) => {
            localStorage.setItem('faceattend_student', JSON.stringify(user));
            setStudentUser(user);
          }}
          theme={theme}
        />
      );
    }
    return (
      <StudentDashboard
        key={`dash-${theme}`}
        onLogout={() => {
          localStorage.removeItem('faceattend_student');
          setStudentUser(null);
        }}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  // ─── PORTAIL ENSEIGNANT DÉDIÉ ─────────────────────────
  if (window.location.pathname.startsWith('/teacher')) {
    if (!isTeacherAuthenticated) {
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
    if (!isAdminAuthenticated) {
      return <Login onLogin={handleLogin} forceRole="admin" />;
    }

    const handleLogout = () => {
      setIsAdminAuthenticated(false);
      localStorage.removeItem('faceattend_admin_token');
      localStorage.removeItem('faceattend_role');
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
