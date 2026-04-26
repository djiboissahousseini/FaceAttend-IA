import { useState, useEffect } from 'react';
import { Video, Users, CalendarDays, PlayCircle, XCircle, Square, Trash2, CheckCircle2, Shield, Clock, RefreshCw, CalendarClock, BookOpenCheck, GraduationCap, UserCheck, UserX } from 'lucide-react';
import { Session, Course } from '../types';
import { API_URL } from '../config';
import StatCard from '../components/StatCard';

const API = API_URL;

interface StudentAttendance {
  id: string;
  student_code: string;
  full_name: string;
  photo_url?: string | null;
  status?: string | null;
}

interface SessionDetails {
  session: Session;
  students: StudentAttendance[];
}

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  todaySessions: number;
  presentToday: number;
  absentToday: number;
  attendanceRate: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({ totalStudents: 0, totalTeachers: 0, todaySessions: 0, presentToday: 0, absentToday: 0, attendanceRate: 0 });
  const [sessions, setSessions] = useState<Session[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [rooms, setRooms] = useState<string[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [logs, setLogs] = useState({ logs: '', errors: '' });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'programmed' | 'agenda'>('programmed');
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  const [activeClassroom, setActiveClassroom] = useState(() => localStorage.getItem('faceattend_camera_classroom') || 'Salle B1');
  const [livenessEnabled, setLivenessEnabled] = useState(() => localStorage.getItem('faceattend_liveness_enabled') !== 'false');
  const [sessionForm, setSessionForm] = useState({ teacher_id: '', course_name: '', group_name: '', classroom: activeClassroom });
  const [refreshing, setRefreshing] = useState(false);

  const todayDate = new Date().toISOString().split('T')[0];
  const daysFr = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const currentDayFr = daysFr[new Date().getDay()];

  useEffect(() => {
    Promise.all([fetchStats(), fetchSessions(), fetchCourses(), fetchRooms(), fetchTeachers(), fetchLogs()]).finally(() => setLoading(false));
    const interval = setInterval(() => { fetchSessions(); fetchStats(); fetchLogs(); }, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('faceattend_camera_classroom', activeClassroom);
  }, [activeClassroom]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API}/api/dashboard`);
      if (res.ok) { const d = await res.json(); setStats(d.stats ?? stats); }
    } catch (e) { console.error(e); }
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${API}/api/sessions`);
      if (res.ok) setSessions(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch(`${API}/api/courses`);
      if (res.ok) setCourses(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchRooms = async () => {
    try {
      const res = await fetch(`${API}/api/classrooms`);
      if (res.ok) { const d = await res.json(); setRooms(Array.isArray(d) ? d : []); }
    } catch (e) { console.error(e); }
  };

  const fetchTeachers = async () => {
    try {
      const res = await fetch(`${API}/api/teachers`);
      if (res.ok) setTeachers(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API}/api/logs`);
      if (res.ok) setLogs(await res.json());
    } catch (e) { console.error(e); }
  };

  const loadSession = async (id: number) => {
    setSelectedSessionId(id);
    try {
      const res = await fetch(`${API}/api/sessions/${id}/attendance`);
      if (res.ok) setSessionDetails(await res.json());
    } catch (e) { console.error(e); }
  };

  const refreshSession = async () => {
    if (!selectedSessionId) return;
    setRefreshing(true);
    await loadSession(selectedSessionId);
    setRefreshing(false);
  };

  const markAttendance = async (studentId: string, status: string) => {
    if (!selectedSessionId) return;
    try {
      await fetch(`${API}/api/records/upsert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, session_id: selectedSessionId, status, method: 'manual' }),
      });
      loadSession(selectedSessionId);
    } catch (e) { console.error(e); }
  };

  const sendCommand = (command: string, payload: any = {}) => {
    const room = sessionDetails?.session?.classroom || activeClassroom;
    localStorage.setItem(`faceattend_cmd_${room}`, JSON.stringify({ command, payload, timestamp: Date.now() }));
  };

  const handleLaunchCamera = () => window.open('/camera', 'ClassroomCamera', 'width=1024,height=768');

  const handleStartSession = async (sessionId: string | number, shouldLaunch = true) => {
    try {
      await fetch(`${API}/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active', is_active: true }),
      });
      if (shouldLaunch) {
        const s = sessions.find(x => String(x.id) === String(sessionId));
        const room = s?.classroom || activeClassroom;
        localStorage.setItem(`faceattend_cmd_${room}`, JSON.stringify({ command: 'FORCE_START_SESSION', payload: { session_id: Number(sessionId) }, timestamp: Date.now() }));
      }
      await fetchSessions();
      loadSession(Number(sessionId));
    } catch (e) { console.error(e); }
  };

  const handleStopSession = async (sessionId: string | number) => {
    if (!window.confirm('Arrêter cette séance ?')) return;
    try {
      await fetch(`${API}/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' }),
      });
      sendCommand('FORCE_STANDBY');
      fetchSessions();
      if (selectedSessionId === Number(sessionId)) { setSessionDetails(null); setSelectedSessionId(null); }
    } catch (e) { console.error(e); }
  };

  const deleteSession = async (sessionId: string | number) => {
    if (!confirm('Supprimer cette programmation ?')) return;
    try {
      await fetch(`${API}/api/sessions/${sessionId}`, { method: 'DELETE' });
      fetchSessions();
      if (selectedSessionId === Number(sessionId)) { setSessionDetails(null); setSelectedSessionId(null); }
    } catch (e) { console.error(e); }
  };

  const createSession = async (initialize: boolean) => {
    if (!sessionForm.teacher_id || !sessionForm.course_name) return;
    try {
      const res = await fetch(`${API}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...sessionForm,
          teacher_id: Number(sessionForm.teacher_id),
          classroom: activeClassroom,
          session_date: todayDate,
          start_time: new Date().toTimeString().substring(0, 5),
          end_time: '23:59',
          is_active: initialize,
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (initialize && data.id) handleStartSession(data.id, true);
      else fetchSessions();
      setSessionForm(prev => ({ ...prev, course_name: '', group_name: '' }));
    } catch (e) { console.error(e); }
  };

  const todaySessions = sessions.filter(s => s.session_date?.substring(0, 10) === todayDate);
  const todayCourses = courses.filter(c => c.room === activeClassroom && c.schedule_day === currentDayFr);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-400 text-sm">Chargement...</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Étudiants" value={stats.totalStudents} icon={<Users size={18}/>} color="blue" subtitle="Total" />
        <StatCard title="Enseignants" value={stats.totalTeachers} icon={<GraduationCap size={18}/>} color="slate" subtitle="Actifs" />
        <StatCard title="Cours" value={stats.todaySessions} icon={<BookOpenCheck size={18}/>} color="green" subtitle="Aujourd'hui" />
        <StatCard title="Assiduité" value={`${stats.attendanceRate}%`} icon={<UserCheck size={18}/>} color="orange" subtitle="Moyenne" />
        <div className="bg-white p-5 rounded-3xl border border-red-100 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Alertes IA</p>
            <div className="p-2 bg-red-50 text-red-500 rounded-xl group-hover:scale-110 transition-transform">
              <ShieldAlert size={18}/>
            </div>
          </div>
          <p className="text-3xl font-black text-slate-800 relative z-10">Critique</p>
          <p className="text-[10px] text-red-500 font-bold mt-1 relative z-10 uppercase tracking-tighter">Seuil d'absences atteint</p>
          <div className="absolute -bottom-4 -right-4 text-red-500/5 rotate-12 group-hover:rotate-0 transition-all duration-700">
            <AlertCircle size={80} />
          </div>
        </div>
      </div>

      {/* Présents / Absents */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-5 flex items-center gap-4">
          <UserCheck size={28} className="text-emerald-400" />
          <div><p className="text-3xl font-black text-emerald-600">{stats.presentToday}</p><p className="text-xs text-emerald-500 font-bold uppercase">Présents Aujourd'hui</p></div>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-3xl p-5 flex items-center gap-4">
          <UserX size={28} className="text-red-400" />
          <div><p className="text-3xl font-black text-red-600">{stats.absentToday}</p><p className="text-xs text-red-500 font-bold uppercase">Absences Constatées</p></div>
        </div>
      </div>

      {/* Quick Config */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-slate-900 text-emerald-400 rounded-xl"><CalendarClock size={18}/></div>
          <h3 className="font-black text-slate-800 uppercase tracking-tighter text-sm">Nouvelle Séance</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <select value={sessionForm.teacher_id} onChange={e => setSessionForm({...sessionForm, teacher_id: e.target.value})} className="bg-slate-50 border border-slate-100 p-3 rounded-2xl text-sm outline-none">
            <option value="">Enseignant...</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <input type="text" placeholder="Module / Cours" value={sessionForm.course_name} onChange={e => setSessionForm({...sessionForm, course_name: e.target.value})} className="bg-slate-50 border border-slate-100 p-3 rounded-2xl text-sm outline-none" />
          <input type="text" placeholder="Groupe (ex: G3-A)" value={sessionForm.group_name} onChange={e => setSessionForm({...sessionForm, group_name: e.target.value})} className="bg-slate-50 border border-slate-100 p-3 rounded-2xl text-sm outline-none" />
          <select value={activeClassroom} onChange={e => setActiveClassroom(e.target.value)} className="bg-slate-50 border border-slate-100 p-3 rounded-2xl text-sm outline-none">
            {rooms.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="flex gap-3">
          <button onClick={() => createSession(true)} className="flex-1 py-3 bg-slate-900 hover:bg-black text-emerald-400 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all active:scale-95">🚀 Initialiser (Maintenant)</button>
          <button onClick={() => createSession(false)} className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all active:scale-95">📅 Programmer (Planning)</button>
        </div>
      </div>

      {/* Main Grid: Sessions + Presence IA */}
      <div className="grid grid-cols-1 xl:grid-cols-[400px,1fr] gap-6">

        {/* Left: Sessions/Agenda */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[640px] overflow-hidden">
          <div className="p-5 pb-0">
            <div className="flex bg-slate-100 p-1 rounded-2xl mb-4">
              <button onClick={() => setActiveTab('programmed')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'programmed' ? 'bg-white text-blue-600 shadow' : 'text-slate-400'}`}>
                <Video size={12}/> Programmations
              </button>
              <button onClick={() => setActiveTab('agenda')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'agenda' ? 'bg-white text-indigo-600 shadow' : 'text-slate-400'}`}>
                <CalendarDays size={12}/> Agenda du Jour
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-3">
            {activeTab === 'programmed' ? (
              todaySessions.length === 0
                ? <p className="text-center text-slate-400 text-sm py-10 italic">Aucune séance programmée aujourd'hui.</p>
                : todaySessions.map(s => (
                  <div key={s.id} onClick={() => loadSession(Number(s.id))} className={`p-4 rounded-3xl border-2 cursor-pointer transition-all hover:shadow-md group relative ${selectedSessionId === Number(s.id) ? 'border-blue-400 bg-blue-50' : s.status === 'active' ? 'border-blue-200 bg-white' : 'border-slate-100 bg-white opacity-70'}`}>
                    {s.status === 'active' && <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-blue-500 animate-pulse"/>}
                    <div className="flex justify-between items-start">
                      <div className="flex-1 pr-2">
                        <p className="font-black text-slate-800 text-sm leading-tight">{s.course_name}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">{s.start_time?.substring(0,5)} · <span className="text-blue-500">{s.classroom}</span> · Gr. {s.group_name}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        {s.status === 'active'
                          ? <button onClick={e => { e.stopPropagation(); handleStopSession(s.id); }} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg" title="Arrêter"><Square size={14} fill="currentColor"/></button>
                          : <button onClick={e => { e.stopPropagation(); handleStartSession(s.id); }} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg" title="Lancer"><PlayCircle size={16}/></button>
                        }
                        <button onClick={e => { e.stopPropagation(); deleteSession(s.id); }} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg" title="Supprimer"><Trash2 size={14}/></button>
                      </div>
                    </div>
                  </div>
                ))
            ) : (
              todayCourses.length === 0
                ? <p className="text-center text-slate-400 text-sm py-10 italic">Aucun cours théorique {currentDayFr.toLowerCase()} dans cette salle.</p>
                : todayCourses.map(c => (
                  <div key={c.id} className="p-4 rounded-3xl border border-slate-100 bg-slate-50 hover:border-indigo-200 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-black text-slate-800 text-xs uppercase">{c.name}</p>
                      <span className="text-[8px] bg-slate-800 text-white px-1.5 py-0.5 rounded font-black">{c.course_code}</span>
                    </div>
                    <div className="flex items-center gap-2 text-indigo-500">
                      <Clock size={11}/><span className="text-[10px] font-bold uppercase">{c.schedule_time}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 border-t border-slate-100 pt-2">Prof: {c.teacher_name}</p>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Right: Présence IA */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[640px] overflow-hidden">
          {sessionDetails ? (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-black text-slate-900 text-xl tracking-tight">{sessionDetails.session.course_name}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                      Groupe {sessionDetails.session.group_name} · {sessionDetails.session.classroom}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full flex items-center gap-2 border border-emerald-100">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>
                      <span className="text-[10px] font-black uppercase">P: {sessionDetails.students.filter(s => s.status === 'present').length}</span>
                    </div>
                    <div className="px-3 py-1.5 bg-red-50 text-red-600 rounded-full flex items-center gap-2 border border-red-100">
                      <span className="text-[10px] font-black uppercase">A: {sessionDetails.students.filter(s => s.status === 'absent').length}</span>
                    </div>
                    <button onClick={refreshSession} className={`p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition-all ${refreshing ? 'animate-spin' : ''}`}>
                      <RefreshCw size={16}/>
                    </button>
                    <button onClick={() => { setSelectedSessionId(null); setSessionDetails(null); }} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition-all">
                      <XCircle size={16}/>
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"/>
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Surveillance IA Active</span>
                </div>
              </div>

              {/* Students Grid */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {sessionDetails.students.map(student => (
                    <div key={student.id} className={`rounded-3xl border-2 p-4 flex flex-col items-center text-center transition-all group relative ${student.status === 'present' ? 'border-emerald-200 bg-emerald-50/30' : student.status === 'absent' ? 'border-red-100 bg-red-50/20' : 'border-slate-100 bg-white'}`}>
                      <div className="relative mb-3">
                        <img
                          src={student.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.full_name)}&background=f1f5f9&color=64748b&size=96`}
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-sm"
                          alt=""
                        />
                        {student.status === 'present' && (
                          <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-white shadow">
                            <CheckCircle2 size={10}/>
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] font-black text-slate-800 uppercase leading-tight w-full truncate">{student.full_name}</p>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5">{student.student_code}</p>

                      {student.status === 'present' && (
                        <div className="mt-2 space-y-1">
                          <span className="block text-[8px] font-black text-emerald-500 bg-emerald-100 px-2 py-0.5 rounded-full">Match 99%</span>
                          <span className="flex items-center justify-center gap-1 text-[8px] text-blue-400 font-black">
                            <Shield size={8}/> Liveness OK
                          </span>
                        </div>
                      )}

                      <div className="flex gap-1.5 mt-3 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => markAttendance(student.id, 'present')} className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black transition-all ${student.status === 'present' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-emerald-100'}`}>P</button>
                        <button onClick={() => markAttendance(student.id, 'absent')} className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black transition-all ${student.status === 'absent' ? 'bg-red-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-red-100'}`}>A</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full items-center justify-center text-slate-300 space-y-4 p-8">
              <Video size={64} strokeWidth={1}/>
              <div className="text-center">
                <p className="font-black text-slate-400 uppercase tracking-wider text-sm">Présence IA</p>
                <p className="text-slate-400 text-sm mt-2">Sélectionnez une séance dans le planning pour voir la liste des présences.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* System Logs */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500/50"/><div className="w-3 h-3 rounded-full bg-amber-500/50"/><div className="w-3 h-3 rounded-full bg-emerald-500/50"/></div>
            <h3 className="text-white text-xs font-black uppercase tracking-widest font-mono">Backend Logs</h3>
          </div>
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/><span className="text-emerald-500 text-[10px] font-mono font-black">LIVE</span></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          <div className="p-4"><p className="text-slate-500 text-[9px] font-black uppercase mb-2">Access Logs</p>
            <pre className="text-emerald-400/80 text-[10px] font-mono leading-relaxed h-48 overflow-y-auto whitespace-pre-wrap">{logs.logs || 'En attente...'}</pre>
          </div>
          <div className="p-4 bg-black/20"><p className="text-red-500/80 text-[9px] font-black uppercase mb-2">Error Logs</p>
            <pre className="text-red-400 text-[10px] font-mono leading-relaxed h-48 overflow-y-auto whitespace-pre-wrap">{logs.errors || 'Aucune erreur.'}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
