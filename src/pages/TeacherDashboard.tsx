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
  Users,
  TrendingUp,
  MonitorPlay,
  PowerOff,
  PlayCircle,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { DashboardStats, Course, Session, Teacher } from '../types';
import { checkHealth, getDashboardStats, getCourses, getSessions, getTeachers } from '../lib/api';
import { getPhotoUrl } from '../utils/image';
import { API_URL } from '../config';

interface ConnectionStatus {
  api: 'online' | 'offline' | 'checking';
  db: 'online' | 'offline' | 'unknown';
  latency: number | null;
  lastChecked: string | null;
}

function isTeacher(value: unknown): value is Teacher {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<Teacher>;
  return (
    typeof candidate.id === 'number' &&
    typeof candidate.name === 'string' &&
    typeof candidate.email === 'string'
  );
}

function parseTeacherFromStorage(raw: string | null): Teacher | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return isTeacher(parsed) ? parsed : null;
  } catch {
    return null;
  }
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
    const parsed = parseTeacherFromStorage(localStorage.getItem('faceattend_simulated_teacher'));
    if (!parsed) localStorage.removeItem('faceattend_simulated_teacher');
    return parsed;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'live' | 'master'>('live');
  const [activeClassroom, setActiveClassroom] = useState<string>('Salle B1');
  const [activeSession, setActiveSession] = useState<Session | null>(null);

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
        const data = (await res.json().catch(() => null)) as any;
        if (data && typeof data.is_blocked === 'boolean') {
          setSecurityInfo(data);
        }
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

  useEffect(() => {
    const initAuth = async () => {
      try {
        const role = localStorage.getItem('faceattend_role');
        const userJson = localStorage.getItem('faceattend_user');

        if (role === 'teacher' && userJson) {
          const user = parseTeacherFromStorage(userJson);
          if (user) {
            setLoggedInTeacher(user);
          } else {
            localStorage.removeItem('faceattend_user');
          }
        } else if (role === 'admin') {
          try {
            const teachers = await getTeachers();
            setTeachersList(Array.isArray(teachers) ? (teachers as Teacher[]) : []);
          } catch (_e) {
            setTeachersList([]);
          }
        }
      } catch (e) {
        console.error('Failed to load teachers for auth', e);
      } finally {
        setAuthLoading(false);
      }
    };
    initAuth();
  }, []);

  const handleLogout = () => {
    const role = localStorage.getItem('faceattend_role');
    if (role === 'admin' && window.location.pathname !== '/teacher') {
      localStorage.removeItem('faceattend_simulated_teacher');
      setLoggedInTeacher(null);
      return;
    }
    setLoggedInTeacher(null);
    localStorage.removeItem('faceattend_teacher_auth');
    localStorage.removeItem('faceattend_user');
  };

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
      setStats(dashboardStats as DashboardStats);
      setAllCourses(Array.isArray(courseData) ? (courseData as Course[]) : []);
      setAllSessions(Array.isArray(sessionData) ? (sessionData as Session[]) : []);
    } catch (_e) {
      setError('Impossible de charger les données.');
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

  useEffect(() => {
    if (!activeClassroom) return;
    const fetchActive = async () => {
      try {
        const res = await fetch(`${API_URL}/api/sessions/active?room=${encodeURIComponent(activeClassroom)}`);
        if (res.ok) {
          const data = await res.json();
          setActiveSession(data?.id ? data : null);
        } else {
          setActiveSession(null);
        }
      } catch {
        setActiveSession(null);
      }
    };
    fetchActive();
    const inv = setInterval(fetchActive, 10000);
    return () => clearInterval(inv);
  }, [activeClassroom]);

  const sendCommand = (cmd: string, payload?: unknown) => {
    const commandData = {
      command: cmd,
      payload: payload,
      timestamp: Date.now(),
    };
    localStorage.setItem(`faceattend_cmd_${activeClassroom}`, JSON.stringify(commandData));
  };

  // ─── FILTER LOGIC (SECURED) ────────────────────────────────────────────────
  const myCourses = allCourses.filter((c) => {
    if (!loggedInTeacher?.name) return false;
    const tName = c.teacher_name || "";
    return tName === loggedInTeacher.name || tName.includes(loggedInTeacher.name);
  });
  
  const mySessions = allSessions.filter((s) => 
    String(s.teacher_id) === String(loggedInTeacher?.id) || 
    (loggedInTeacher?.name && s.teacher_name === loggedInTeacher.name)
  );

  const todayStr = new Date().toISOString().split('T')[0];
  const myTodaySessions = mySessions.filter((s) => s.session_date === todayStr);

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
        if (isTeacher(data)) {
          localStorage.setItem('faceattend_teacher_auth', 'true');
          localStorage.setItem('faceattend_user', JSON.stringify(data));
          setLoggedInTeacher(data);
        }
      } else {
        alert('Identifiants incorrects.');
      }
    } catch (_err) {
      alert('Erreur de connexion.');
    } finally {
      setAuthLoading(false);
    }
  };

  if (authLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-cyan-400 font-mono tracking-widest animate-pulse uppercase">Initialisation...</div>;

  if (!loggedInTeacher) {
    const isAdminMode = localStorage.getItem('faceattend_role') === 'admin' && window.location.pathname !== '/teacher';
    if (isAdminMode) {
      return (
        <div className="min-h-screen bg-[#050a10] flex items-center justify-center font-mono p-4">
          <div className="w-full max-w-md bg-slate-900 border border-[#00f0ff]/30 p-8 shadow-[0_0_50px_rgba(0,240,255,0.1)]">
            <div className="flex flex-col items-center mb-8">
              <ShieldCheck size={32} className="text-[#00f0ff] mb-4" />
              <h1 className="text-xl font-bold text-white tracking-widest uppercase text-center">Simulation Admin</h1>
            </div>
            <div className="space-y-4">
              <select value={selectedTeacherId} onChange={(e) => setSelectedTeacherId(e.target.value)} className="w-full bg-black/50 border border-[#00f0ff]/30 text-white text-sm p-3 outline-none">
                <option value="">-- CHOISIR UN ENSEIGNANT --</option>
                {teachersList.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <button onClick={() => {
                const teacher = teachersList.find((t) => t.id.toString() === selectedTeacherId);
                if (teacher) setLoggedInTeacher(teacher);
              }} disabled={!selectedTeacherId} className="w-full bg-[#00f0ff] hover:bg-[#00c0cc] text-slate-900 font-bold uppercase py-3">Inspecter</button>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center font-mono p-4">
        <div className="w-full max-w-md bg-slate-900 border border-blue-500/30 p-8">
          <div className="flex flex-col items-center mb-8">
            <GraduationCap size={32} className="text-blue-400 mb-4" />
            <h1 className="text-xl font-bold text-white uppercase tracking-widest">Portail Académique</h1>
          </div>
          <form onSubmit={handleTeacherLogin} className="space-y-5">
            <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full bg-black/50 border border-slate-700 text-white p-3" placeholder="Email Pro" required />
            <input type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} className="w-full bg-black/50 border border-slate-700 text-white p-3" placeholder="Mot de Passe" required />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 flex items-center justify-center gap-2"><Unlock size={16} /> Connexion</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-4">
          <div className="flex items-center gap-4">
            <img src={getPhotoUrl(loggedInTeacher?.photo_url) || `https://ui-avatars.com/api/?name=${encodeURIComponent(loggedInTeacher?.name || 'User')}`} alt="Avatar" className="w-16 h-16 rounded-2xl border-2 border-slate-200" />
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Pr. {loggedInTeacher?.name}</h1>
              <p className="text-slate-500 text-sm">{loggedInTeacher?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { checkConnection(); fetchData(); }} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Actualiser</button>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl"><LogOut size={14} /> Déconnexion</button>
          </div>
        </div>

        {/* Diagnostic Panel */}
        <div className="bg-slate-900 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 shadow-lg">
          <div className="sm:col-span-3 flex items-center gap-2 mb-1">
            <Activity size={16} className="text-cyan-400" />
            <h2 className="text-white text-xs font-bold uppercase tracking-widest">Diagnostic IA & Système</h2>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3"><Server size={18} className="text-emerald-400" /> <span className="text-white text-xs font-bold">API Backend</span></div>
            <div className={`w-2.5 h-2.5 rounded-full ${conn.api === 'online' ? 'bg-emerald-400' : 'bg-red-400'} animate-pulse`} />
          </div>
          <div className="bg-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3"><Database size={18} className="text-emerald-400" /> <span className="text-white text-xs font-bold">Base de Données</span></div>
            <div className={`w-2.5 h-2.5 rounded-full ${conn.db === 'online' ? 'bg-emerald-400' : 'bg-red-400'} animate-pulse`} />
          </div>
          <div className="bg-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3"><Zap size={18} className="text-cyan-400" /> <span className="text-white text-xs font-bold">Latence IA</span></div>
            <span className="text-cyan-400 font-bold">{conn.latency || '--'} ms</span>
          </div>
        </div>

        {/* Security Info (Only visible if Admin is inspecting) */}
        {localStorage.getItem('faceattend_role') === 'admin' && securityInfo && (
           <div className="bg-white border-2 border-amber-200 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 shadow-sm">
             <div className="sm:col-span-3 flex items-center gap-2 mb-2">
                <ShieldAlert size={16} className="text-amber-500" />
                <h3 className="text-sm font-black uppercase text-slate-800">Contrôle de Sécurité (Admin)</h3>
             </div>
             <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between">
                <div><p className="text-[10px] font-bold text-slate-400 uppercase">Statut Accès</p><p className={`font-bold ${securityInfo.is_blocked ? 'text-red-500' : 'text-emerald-500'}`}>{securityInfo.is_blocked ? 'BLOQUÉ' : 'ACTIF'}</p></div>
                <button onClick={toggleBlock} className="bg-slate-200 px-3 py-1 rounded-lg text-xs font-bold">{securityInfo.is_blocked ? 'Débloquer' : 'Bloquer'}</button>
             </div>
             <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Échecs</p>
                <p className="font-bold text-slate-800">{securityInfo.failed_attempts} tentatives</p>
             </div>
             <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between">
                <div><p className="text-[10px] font-bold text-slate-400 uppercase">Mot de Passe</p><p className="font-mono text-xs">{securityInfo.password}</p></div>
                <button onClick={resetPass} className="bg-blue-100 text-blue-600 px-3 py-1 rounded-lg text-xs font-bold">Reset</button>
             </div>
           </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3 text-red-600 text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <p className="text-xs font-bold text-slate-400 uppercase">Mes Cours</p>
              <BookOpen size={16} className="text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-slate-800">{myCourses.length}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
             <div className="flex justify-between items-start mb-4">
              <p className="text-xs font-bold text-slate-400 uppercase">Séances (Auj)</p>
              <Calendar size={16} className="text-emerald-500" />
            </div>
            <p className="text-3xl font-bold text-slate-800">{myTodaySessions.length}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
             <div className="flex justify-between items-start mb-4">
              <p className="text-xs font-bold text-slate-400 uppercase">Étudiants Global</p>
              <Users size={16} className="text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-slate-800">{stats?.totalStudents || 0}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
             <div className="flex justify-between items-start mb-4">
              <p className="text-xs font-bold text-slate-400 uppercase">Présence</p>
              <TrendingUp size={16} className="text-orange-500" />
            </div>
            <p className="text-3xl font-bold text-slate-800">{stats?.attendanceRate || 0}%</p>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr,400px] gap-6">
          <div className="space-y-6">
            {/* Monitor Header */}
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
               <div className="relative z-10">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <MonitorPlay className="text-blue-400" size={24} />
                    Monitoring de la Salle
                  </h2>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                    </span>
                    <span className="text-blue-400 text-xs font-bold uppercase tracking-widest">Liaison Terminal Active</span>
                  </div>
               </div>

               <div className="flex items-center gap-3 relative z-10">
                  <select 
                    value={activeClassroom} 
                    onChange={(e) => setActiveClassroom(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-white text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {['Salle B1', 'Salle B2', 'Amphi A', 'Labo IA'].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <button 
                    onClick={() => window.open('/camera', '_blank')}
                    className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-600/20"
                    title="Ouvrir le terminal"
                  >
                    <ExternalLink size={18} />
                  </button>
               </div>
            </div>

            {/* Active Session / Controls */}
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              {activeSession ? (
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <span className="bg-blue-100 text-blue-600 text-[10px] font-black uppercase px-2 py-1 rounded-lg mb-2 inline-block">Session en cours</span>
                    <h3 className="text-2xl font-black text-slate-900 leading-tight">{activeSession.course_name}</h3>
                    <p className="text-slate-500 font-medium">Groupe {activeSession.group_name} • {activeSession.classroom}</p>
                  </div>
                  <div className="flex gap-3 w-full md:w-auto">
                    <button 
                      onClick={() => sendCommand('OVERRIDE_TEACHER')}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/20"
                    >
                      <Unlock size={18} /> Ouvrir
                    </button>
                    <button 
                      onClick={() => sendCommand('FORCE_STANDBY')}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-red-500/20"
                    >
                      <PowerOff size={18} /> Fermer
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                    <Calendar size={32} />
                  </div>
                  <div className="max-w-xs mx-auto">
                    <h3 className="text-slate-800 font-bold">Aucune session active</h3>
                    <p className="text-slate-500 text-sm">Sélectionnez une session dans l'agenda ou attendez l'heure du cours.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Tabs List */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
               <div className="flex bg-slate-50 p-1.5 border-b">
                  <button 
                    onClick={() => setActiveTab('live')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'live' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <Activity size={14} /> Sessions du Jour
                  </button>
                  <button 
                    onClick={() => setActiveTab('master')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'master' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <BookOpen size={14} /> Agenda Master
                  </button>
               </div>

               <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
                  {activeTab === 'live' ? (
                    myTodaySessions.length === 0 ? (
                      <p className="p-12 text-center text-slate-400 text-sm italic">Aucun cours prévu aujourd'hui.</p>
                    ) : (
                      myTodaySessions.map(s => (
                        <div key={s.id} className="p-6 flex justify-between items-center hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-4">
                             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${s.id === activeSession?.id ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                <Clock size={20} />
                             </div>
                             <div>
                                <p className="font-bold text-slate-900">{s.course_name}</p>
                                <p className="text-xs text-slate-500 font-medium">Groupe {s.group_name} • {s.start_time}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-3">
                             {s.id === activeSession?.id ? (
                               <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase rounded-full animate-pulse">
                                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Live
                               </span>
                             ) : (
                               <button 
                                 onClick={() => sendCommand('FORCE_START_SESSION', { session_id: s.id })}
                                 className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                                 title="Lancer maintenant"
                               >
                                 <PlayCircle size={20} />
                               </button>
                             )}
                          </div>
                        </div>
                      ))
                    )
                  ) : (
                    myCourses.length === 0 ? (
                      <p className="p-12 text-center text-slate-400 text-sm italic">Aucun module assigné.</p>
                    ) : (
                      myCourses.map(c => (
                        <div key={c.id} className="p-6 flex justify-between items-center hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center">
                                <BookOpen size={20} />
                             </div>
                             <div>
                                <p className="font-bold text-slate-900">{c.name}</p>
                                <p className="text-xs text-slate-500 font-medium">{c.course_code} • {c.room}</p>
                             </div>
                          </div>
                          <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black uppercase rounded-full">
                             {c.schedule_day}
                          </span>
                        </div>
                      ))
                    )
                  )}
               </div>
            </div>
          </div>

          {/* Right Column: Mini Stats & History */}
          <div className="space-y-6">
             <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <TrendingUp size={18} className="text-orange-500" />
                  Performance Récente
                </h3>
                <div className="space-y-4">
                   {mySessions.slice(0, 3).map(s => (
                     <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                        <div className="min-w-0">
                           <p className="text-xs font-bold text-slate-800 truncate">{s.course_name}</p>
                           <p className="text-[10px] text-slate-400 uppercase font-bold">{s.session_date}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-xs font-black text-blue-600">85%</p>
                           <p className="text-[10px] text-slate-400 uppercase">Présence</p>
                        </div>
                     </div>
                   ))}
                   {mySessions.length === 0 && <p className="text-center text-slate-400 text-xs py-4">Aucune donnée historique.</p>}
                </div>
             </div>

             <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden">
                <div className="relative z-10">
                   <h3 className="font-bold text-lg mb-2">Centre d'Aide</h3>
                   <p className="text-indigo-100 text-sm mb-4">Besoin d'assistance avec le terminal biométrique ?</p>
                   <button className="w-full py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-sm font-bold transition-all">
                      Consulter le Guide
                   </button>
                </div>
                <GraduationCap size={120} className="absolute -bottom-10 -right-10 text-white/10 rotate-12" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
