// src/pages/TeacherDashboard.tsx
import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Calendar,
  RefreshCw,
  Server,
  Database,
  Clock,
  Zap,
  AlertCircle,
  Activity,
  GraduationCap,
  Unlock,
  LogOut,
  ShieldCheck,
  X,
  ShieldAlert,
  Key,
  Lock,
} from 'lucide-react';
import { DashboardStats, Course, Session, Teacher } from '../types';
import { checkHealth, getDashboardStats, getCourses, getSessions, getTeachers } from '../lib/api';
import { API_URL } from '../config';
const _API = API_URL;

interface ConnectionStatus {
  api: 'online' | 'offline' | 'checking';
  db: 'online' | 'offline' | 'unknown';
  latency: number | null;
  lastChecked: string | null;
}

export default function TeacherDashboard() {
  // ─── Authentication State ───────────────────────────────────────────────────
  const [teachersList, setTeachersList] = useState<Teacher[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [securityInfo, setSecurityInfo] = useState<{
    is_blocked: boolean;
    failed_attempts: number;
    password: string;
  } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // ─── Dashboard State ────────────────────────────────────────────────────────
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [loggedInTeacher, setLoggedInTeacher] = useState<Teacher | null>(() => {
    // Tenter de récupérer le prof en mémoire (pour résister au rafraîchissement F5)
    const saved = localStorage.getItem('faceattend_simulated_teacher');
    return saved ? JSON.parse(saved) : null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sauvegarder le prof dès qu'il change
  useEffect(() => {
    if (loggedInTeacher) {
      localStorage.setItem('faceattend_simulated_teacher', JSON.stringify(loggedInTeacher));
      fetchSecurity(loggedInTeacher.id.toString());
    } else {
      localStorage.removeItem('faceattend_simulated_teacher');
    }
  }, [loggedInTeacher]);

  const [conn, setConn] = useState<ConnectionStatus>({
    api: 'checking',
    db: 'unknown',
    latency: null,
    lastChecked: null,
  });

  const fetchSecurity = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/teachers/${id}/security`);
      if (res.ok) {
        const data = await res.json();
        setSecurityInfo(data);
      }
    } catch (e) {
      console.error('Error fetching security info', e);
    }
  };

  const toggleBlock = async () => {
    if (!loggedInTeacher) return;
    try {
      const res = await fetch(`${API_URL}/api/teachers/${loggedInTeacher.id}/toggle-block`, {
        method: 'POST',
      });
      if (res.ok) fetchSecurity(loggedInTeacher.id.toString());
    } catch (e) {
      console.error(e);
    }
  };

  const resetPass = async () => {
    if (!loggedInTeacher) return;
    if (!confirm("Réinitialiser le mot de passe à 'password123' ?")) return;
    try {
      const res = await fetch(`${API_URL}/api/teachers/${loggedInTeacher.id}/reset-password`, {
        method: 'POST',
      });
      if (res.ok) {
        alert('Mot de passe réinitialisé !');
        fetchSecurity(loggedInTeacher.id.toString());
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 1. Initial Load: Check auth from global localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const role = localStorage.getItem('faceattend_role');
        const userJson = localStorage.getItem('faceattend_user');

        if (role === 'teacher' && userJson) {
          const user = JSON.parse(userJson);
          setLoggedInTeacher(user);
        } else if (role === 'admin') {
          const teachers = await getTeachers();
          setTeachersList(teachers);
        }
      } catch (e) {
        console.error('Failed to load teachers for auth', e);
      } finally {
        setAuthLoading(false);
      }
    };
    initAuth();
  }, []);

  useEffect(() => {
    if (loggedInTeacher && localStorage.getItem('faceattend_role') === 'admin') {
      fetchSecurity(loggedInTeacher.id.toString());
    }
  }, [loggedInTeacher]);

  const handleLogout = () => {
    const role = localStorage.getItem('faceattend_role');

    // Si c'est un admin qui inspectait, on annule juste la sélection du prof
    // pour le renvoyer à l'écran de sélection de la Simulation Admin.
    if (role === 'admin' && window.location.pathname !== '/teacher') {
      localStorage.removeItem('faceattend_simulated_teacher');
      setLoggedInTeacher(null);
      return;
    }

    // Sinon c'est un prof, on se déconnecte vraiment de l'espace
    setLoggedInTeacher(null);
    localStorage.removeItem('faceattend_teacher_auth');
    localStorage.removeItem('faceattend_user');
  };

  // ─── Connection check ─────────────────────────────────────────────────────
  const checkConnection = useCallback(async () => {
    setConn((prev) => ({ ...prev, api: 'checking' }));
    const t0 = performance.now();
    try {
      const health = await checkHealth();
      const latency = Math.round(performance.now() - t0);
      setConn({
        api: health.status === 'Online' ? 'online' : 'offline',
        db: health.database === 'Online' ? 'online' : 'offline',
        latency,
        lastChecked: new Date().toLocaleTimeString('fr-FR'),
      });
    } catch {
      setConn({
        api: 'offline',
        db: 'unknown',
        latency: null,
        lastChecked: new Date().toLocaleTimeString('fr-FR'),
      });
    }
  }, []);

  // ─── Data fetch (Only when logged in) ──────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!loggedInTeacher) return;
    setLoading(true);
    setError(null);
    try {
      const [dashboardStats, courseData, sessionData] = await Promise.all([
        getDashboardStats(),
        getCourses(),
        getSessions(),
      ]);
      setStats(dashboardStats);
      setAllCourses(courseData);
      setAllSessions(sessionData);
    } catch (_e) {
      setError('Impossible de charger les données. Assurez-vous que le backend est démarré.');
    } finally {
      setLoading(false);
    }
  }, [loggedInTeacher]);

  useEffect(() => {
    document.title = 'FaceAttend | Enseignant';
    if (loggedInTeacher) {
      checkConnection();
      fetchData();
      const interval = setInterval(checkConnection, 30_000);
      return () => clearInterval(interval);
    }
  }, [loggedInTeacher, checkConnection, fetchData]);

  // ─── FILTER DATA FOR LOGGED IN TEACHER ONLY ───────────────────────────────
  const myCourses = allCourses.filter((c) => c.teacher_name === loggedInTeacher?.name);
  const mySessions = allSessions.filter((s) => s.teacher_name === loggedInTeacher?.name);

  const todayStr = new Date().toISOString().split('T')[0];
  const myTodaySessions = mySessions.filter((s) => s.session_date === todayStr);

  // ─── Teacher Login Handler ──────────────────────────────────────────────
  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/teachers/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('faceattend_teacher_auth', 'true');
        localStorage.setItem('faceattend_user', JSON.stringify(data));
        setLoggedInTeacher(data);
      } else {
        alert('Identifiants incorrects ou compte bloqué.');
      }
    } catch (_err) {
      alert('Erreur de connexion au serveur.');
    } finally {
      setAuthLoading(false);
    }
  };

  // ─── Login Screen Render (Dual Mode) ─────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-cyan-400 font-mono tracking-widest animate-pulse uppercase">
        Initialisation du Portail...
      </div>
    );
  }

  if (!loggedInTeacher) {
    const isAdminMode =
      localStorage.getItem('faceattend_role') === 'admin' &&
      window.location.pathname !== '/teacher';

    if (isAdminMode) {
      return (
        <div className="min-h-screen bg-[#050a10] flex items-center justify-center font-mono p-4">
          <div className="w-full max-w-md bg-slate-900 border border-[#00f0ff]/30 p-8 shadow-[0_0_50px_rgba(0,240,255,0.1)]">
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 rounded-full bg-[#00f0ff]/10 flex items-center justify-center border border-[#00f0ff]/50 mb-4">
                <ShieldCheck size={32} className="text-[#00f0ff]" />
              </div>
              <h1 className="text-xl font-bold text-white tracking-widest uppercase">
                Simulation Admin
              </h1>
              <p className="text-[#00f0ff]/60 text-[10px] mt-1 tracking-widest text-center uppercase">
                Mode Inspection : Sélectionnez un Profil
              </p>
            </div>

            <div className="space-y-4">
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full bg-black/50 border border-[#00f0ff]/30 text-white text-sm p-3 outline-none focus:border-[#00f0ff]"
              >
                <option value="">-- CHOISIR UN ENSEIGNANT --</option>
                {teachersList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => {
                  const teacher = teachersList.find((t) => t.id.toString() === selectedTeacherId);
                  if (teacher) setLoggedInTeacher(teacher);
                }}
                disabled={!selectedTeacherId}
                className="w-full bg-[#00f0ff] hover:bg-[#00c0cc] text-slate-900 font-bold uppercase tracking-widest py-3 transition-all disabled:opacity-50"
              >
                Inspecter le Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Sinon, c'est le portail prof pur
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center font-mono p-4">
        <div className="w-full max-w-md bg-slate-900 border border-blue-500/30 p-8 shadow-[0_0_50px_rgba(59,130,246,0.1)]">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/50 mb-4 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
              <GraduationCap size={32} className="text-blue-400" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-widest uppercase">
              Portail Académique
            </h1>
            <p className="text-blue-400/60 text-[10px] mt-1 tracking-widest uppercase">
              Espace Enseignant Sécurisé
            </p>
          </div>

          <form onSubmit={handleTeacherLogin} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                Email Professionnel
              </label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-black/50 border border-slate-700 text-white text-sm p-3 outline-none focus:border-blue-500 transition-colors"
                placeholder="pr.nom@univ.dz"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                Mot de Passe
              </label>
              <input
                type="password"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                className="w-full bg-black/50 border border-slate-700 text-white text-sm p-3 outline-none focus:border-blue-500 transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest py-4 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
            >
              <Unlock size={16} />
              Accéder à ma Session
            </button>
          </form>

          <p className="text-slate-600 text-[10px] mt-8 text-center leading-relaxed">
            Ce portail est exclusivement réservé au corps enseignant.
            <br />
            Toute tentative d'accès non autorisée est enregistrée.
          </p>
        </div>
      </div>
    );
  }

  // ─── Status helpers ───────────────────────────────────────────────────────
  const StatusDot = ({ status }: { status: 'online' | 'offline' | 'checking' | 'unknown' }) => {
    if (status === 'checking')
      return <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse inline-block" />;
    if (status === 'online')
      return (
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
      );
    return <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />;
  };

  // ─── Stat Card ────────────────────────────────────────────────────────────
  const StatCard = ({
    title,
    value,
    icon,
    color,
    subtitle,
  }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: 'blue' | 'green' | 'purple' | 'orange';
    subtitle?: string;
  }) => {
    const colors = {
      blue: 'bg-blue-500 shadow-blue-500/30',
      green: 'bg-emerald-500 shadow-emerald-500/30',
      purple: 'bg-violet-500 shadow-violet-500/30',
      orange: 'bg-orange-500 shadow-orange-500/30',
    };
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
            <p className="text-3xl font-bold text-slate-800 mt-1 leading-none">{value}</p>
            {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          </div>
          <div className={`p-2.5 rounded-xl text-white shadow-lg ${colors[color]}`}>{icon}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-4">
          <div className="flex items-center gap-4">
            <img
              src={
                loggedInTeacher?.photo_url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(loggedInTeacher?.name || 'User')}&background=020617&color=00f0ff`
              }
              alt={loggedInTeacher?.name || 'User'}
              className="w-16 h-16 rounded-2xl shadow-md border-2 border-slate-200"
            />
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Bienvenue, Pr. {loggedInTeacher?.name}
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">{loggedInTeacher?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                checkConnection();
                fetchData();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-medium rounded-xl transition-colors shadow-sm"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Actualiser
            </button>
            <button
              onClick={handleLogout}
              className={`flex items-center gap-2 px-4 py-2 border text-sm font-medium rounded-xl transition-colors shadow-sm ${
                localStorage.getItem('faceattend_role') === 'admin'
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-600 border-amber-100'
                  : 'bg-red-50 hover:bg-red-100 text-red-600 border-red-100'
              }`}
            >
              {localStorage.getItem('faceattend_role') === 'admin' ? (
                <>
                  <X size={14} />
                  Quitter l'Inspection
                </>
              ) : (
                <>
                  <LogOut size={14} />
                  Déconnecter
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── CONNECTION STATUS PANEL ────────────────────────────────────────── */}
        <div className="bg-slate-900 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 shadow-lg">
          <div className="sm:col-span-3 flex items-center gap-2 mb-1">
            <Activity size={16} className="text-cyan-400" />
            <h2 className="text-white text-sm font-bold uppercase tracking-widest">
              Diagnostic Système & Reconnaissance IA
            </h2>
            <span className="ml-auto text-slate-500 text-xs">
              {conn.lastChecked ? `Vérifié à ${conn.lastChecked}` : 'En cours…'}
            </span>
          </div>

          <div className="bg-slate-800 rounded-xl p-4 flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${conn.api === 'online' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}
            >
              <Server
                size={18}
                className={conn.api === 'online' ? 'text-emerald-400' : 'text-red-400'}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-bold">API Backend</p>
              <p className="text-slate-400 text-[10px] truncate">{API_URL}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <StatusDot status={conn.api} />
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-4 flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${conn.db === 'online' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}
            >
              <Database
                size={18}
                className={conn.db === 'online' ? 'text-emerald-400' : 'text-red-400'}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-bold">Base de Données</p>
              <p className="text-slate-400 text-[10px]">PostgreSQL (Local)</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <StatusDot status={conn.db} />
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-cyan-500/20">
              <Zap size={18} className="text-cyan-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-bold">Latence IA</p>
              <p className="text-slate-400 text-[10px]">Modèle FaceNet</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-xl font-bold text-cyan-400">
                {conn.latency !== null ? `${conn.latency}` : '—'}
              </span>
              <span className="text-slate-500 text-[10px]">ms</span>
            </div>
          </div>

          {conn.api === 'offline' && (
            <div className="sm:col-span-3 text-xs text-red-400 mt-2">
              Le backend d'intelligence artificielle est déconnecté. Le système ne reconnaîtra pas
              les étudiants.
            </div>
          )}
        </div>

        {/* ── SECURITY MANAGEMENT PANEL (Admin Only) ─────────────────────────── */}
        {localStorage.getItem('faceattend_role') === 'admin' && securityInfo && (
          <div className="bg-slate-900 border-2 border-amber-500/30 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 shadow-[0_0_30px_rgba(245,158,11,0.15)] animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="sm:col-span-3 flex items-center gap-2 mb-1">
              <ShieldCheck size={16} className="text-amber-400" />
              <h2 className="text-white text-sm font-bold uppercase tracking-widest">
                Contrôle de Sécurité & Accès
              </h2>
              <span className="ml-auto text-amber-500/60 text-[10px] font-mono font-bold px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded">
                MODE INSPECTION ADMIN
              </span>
            </div>

            <div className="bg-slate-800 rounded-xl p-4 flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${securityInfo.is_blocked ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}
              >
                {securityInfo.is_blocked ? (
                  <Lock size={18} className="text-red-400" />
                ) : (
                  <Unlock size={18} className="text-emerald-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-bold">Statut du Compte</p>
                <p
                  className={
                    securityInfo.is_blocked
                      ? 'text-red-400 text-[10px]'
                      : 'text-emerald-400 text-[10px]'
                  }
                >
                  {securityInfo.is_blocked ? 'COMPTE BLOQUÉ' : 'ACCÈS AUTORISÉ'}
                </p>
              </div>
              <button
                onClick={toggleBlock}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                  securityInfo.is_blocked
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30'
                }`}
              >
                {securityInfo.is_blocked ? 'Débloquer' : 'Bloquer'}
              </button>
            </div>

            <div className="bg-slate-800 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/20">
                <ShieldAlert size={18} className="text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-bold">Échecs Connexion</p>
                <p className="text-slate-400 text-[10px]">
                  {securityInfo.failed_attempts} tentative(s)
                </p>
              </div>
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full ${i < securityInfo.failed_attempts ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`}
                  />
                ))}
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/20">
                <Key size={18} className="text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-bold">Mot de Passe Actuel</p>
                <p className="text-slate-400 text-[10px] font-mono tracking-wider">
                  {securityInfo.password}
                </p>
              </div>
              <button
                onClick={resetPass}
                className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-bold uppercase rounded-lg transition-all shadow-lg shadow-blue-500/20"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* ── STAT CARDS (Filtered) ─────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-slate-200/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Mes Cours"
              value={myCourses.length}
              icon={<BookOpen size={20} />}
              color="blue"
              subtitle="Enseignant principal"
            />
            <StatCard
              title="Mes Séances (Auj)"
              value={myTodaySessions.length}
              icon={<Calendar size={20} />}
              color="green"
              subtitle="Programmées aujourd'hui"
            />
            <StatCard
              title="Global: Étudiants"
              value={stats?.totalStudents ?? 0}
              icon={<Users size={20} />}
              color="purple"
              subtitle="Inscrits à l'institut"
            />
            <StatCard
              title="Global: Taux Présence"
              value={stats?.attendanceRate !== undefined ? `${stats.attendanceRate}%` : 'N/A'}
              icon={<TrendingUp size={20} />}
              color="orange"
              subtitle="Moyenne aujourd'hui"
            />
          </div>
        )}

        {/* ── COURSES & SESSIONS (Filtered) ─────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Séances du Jour */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <GraduationCap size={16} className="text-blue-500" />
                <h3 className="font-semibold text-slate-800">Séances du Jour</h3>
              </div>
              <span className="ml-auto text-xs bg-emerald-100 px-2 py-0.5 rounded-lg text-emerald-600 font-bold">
                {myTodaySessions.length}
              </span>
            </div>
            <div className="divide-y divide-slate-50">
              {myTodaySessions.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">
                  Aucune séance prévue pour vous aujourd'hui.
                </p>
              ) : (
                myTodaySessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 text-sm">{session.course_name}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Groupe <span className="font-bold">{session.group_name}</span> •{' '}
                        {session.classroom || 'Salle inconnue'}
                      </p>
                    </div>
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-emerald-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Planifiée
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Mes Modules */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <Calendar size={16} className="text-purple-500" />
              <h3 className="font-semibold text-slate-800">Mes Modules d'Enseignement</h3>
              <span className="ml-auto text-xs bg-slate-200 px-2 py-0.5 rounded-lg text-slate-600 font-bold">
                {myCourses.length}
              </span>
            </div>
            <div className="divide-y divide-slate-50">
              {myCourses.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">
                  Vous n'avez aucun cours assigné dans la base.
                </p>
              ) : (
                myCourses.map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 text-sm">{course.name}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Code: {course.course_code} • Salle: {course.room || 'Non assignée'}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 bg-blue-50 text-blue-600 rounded-lg shrink-0 border border-blue-100">
                      {course.schedule_day || 'Jours variés'} {course.schedule_time}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Historique */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden lg:col-span-2">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <Clock size={16} className="text-emerald-500" />
              <h3 className="font-semibold text-slate-800">Historique de Mes Séances</h3>
              <span className="ml-auto text-xs bg-slate-200 px-2 py-0.5 rounded-lg text-slate-600 font-bold">
                {mySessions.length}
              </span>
            </div>
            <div className="divide-y divide-slate-50">
              {mySessions.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">
                  Aucune séance enregistrée pour vos cours.
                </p>
              ) : (
                mySessions.slice(0, 8).map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 text-sm">{session.course_name}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Groupe <span className="font-bold">{session.group_name}</span> •{' '}
                        {session.classroom || 'Salle inconnue'}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-lg shrink-0 border border-blue-100">
                      {new Date(session.session_date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
