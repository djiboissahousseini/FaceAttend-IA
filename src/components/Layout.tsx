import { ReactNode } from 'react';
import {
  LayoutDashboard,
  Users,
  Camera,
  Cpu,
  Menu,
  X,
  BookOpen,
  BellRing,
  BarChart3,
  MonitorPlay,
  GraduationCap,
  LogOut,
} from 'lucide-react';
import { Page } from '../types';

interface LayoutProps {
  children: ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  onLogout?: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Tableau de Bord', icon: <LayoutDashboard size={20} /> },
  { id: 'teacher', label: 'Espace Professeur', icon: <GraduationCap size={20} /> },
  { id: 'teachers', label: 'Enseignants', icon: <Users size={20} /> },
  { id: 'students', label: 'Étudiants', icon: <Users size={20} /> },
  { id: 'attendance', label: 'Présence IA', icon: <Camera size={20} /> },
  { id: 'courses', label: 'Cours & Groupes', icon: <BookOpen size={20} /> },
  { id: 'alerts', label: 'Alertes Absences', icon: <BellRing size={20} /> },
  { id: 'reports', label: 'Rapports', icon: <BarChart3 size={20} /> },
  { id: 'student_space', label: 'Simulation Étudiants', icon: <MonitorPlay size={20} /> },
];

export default function Layout({
  children,
  currentPage,
  onNavigate,
  sidebarOpen,
  setSidebarOpen,
  onLogout,
}: LayoutProps) {
  const userRole = localStorage.getItem('faceattend_role') || 'admin';
  const userJson = localStorage.getItem('faceattend_user');
  const user = userJson ? JSON.parse(userJson) : null;


  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 flex flex-col w-64 bg-slate-900 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700/50">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30">
            <Cpu size={20} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm leading-tight">FaceAttend</h1>
            <p className="text-slate-400 text-xs">Système Intelligent</p>
          </div>
          <button
            className="ml-auto lg:hidden text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 pb-2">
            Navigation
          </p>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id as Page);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                currentPage === item.id
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {item.icon}
              {item.label}
              {item.id === 'attendance' && (
                <span className="ml-auto flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-green-400">Live</span>
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-slate-700/50">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${userRole === 'admin' ? 'bg-blue-500' : 'bg-purple-500'}`}>
              {userRole === 'admin' ? 'AD' : (user?.name?.substring(0, 2).toUpperCase() || 'PR')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">
                {userRole === 'admin' ? 'Administrateur' : user?.name}
              </p>
              <p className="text-slate-400 text-xs truncate">
                {userRole === 'admin' ? 'admin@univ.dz' : user?.email}
              </p>
            </div>
            {onLogout && (
              <button 
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Déconnexion"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center gap-4 px-6 py-4 bg-white border-b border-slate-200 shrink-0">
          <button
            className="lg:hidden text-slate-500 hover:text-slate-700"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>
          <div>
            <h2 className="text-slate-800 font-semibold text-lg">
              {navItems.find((n) => n.id === currentPage)?.label ?? 'Tableau de Bord'}
            </h2>
            <p className="text-slate-400 text-xs">
              {new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-700 text-xs font-medium">Système Actif</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
