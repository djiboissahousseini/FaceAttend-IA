import { useEffect, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  AlertTriangle,
  MonitorPlay,
  ExternalLink,
  Video,
  Unlock,
  PowerOff,
  RefreshCw,
  PlayCircle,
  CalendarClock,
  XCircle,
} from 'lucide-react';
import { Session, Student, Teacher } from '../types';

const API = 'http://localhost:8000';

interface SessionAttendanceStudent extends Student {
  attendance_id?: number | null;
  status?: 'present' | 'absent' | 'late' | 'excused' | null;
  timestamp?: string | null;
}

interface SessionAttendanceResponse {
  session: Session;
  students: SessionAttendanceStudent[];
}

export default function Attendance() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [sessionDetails, setSessionDetails] = useState<SessionAttendanceResponse | null>(null);

  // Forms
  const [sessionForm, setSessionForm] = useState({
    teacher_id: '',
    course_name: '',
    group_name: '',
    classroom: 'Salle B1',
    session_date: new Date().toISOString().split('T')[0],
    start_time: '08:00',
    end_time: '10:00',
  });

  // Telemetry & Control
  const [activeClassroom, setActiveClassroom] = useState<string>(() => {
    return localStorage.getItem('faceattend_camera_classroom') || 'Salle B1';
  });
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [anticipateSessions, setAnticipateSessions] = useState<Session[]>([]);
  const [selectedAnticipateSession, setSelectedAnticipateSession] = useState('');

  useEffect(() => {
    Promise.all([fetchTeachers(), fetchSessions()]);
  }, []);

  useEffect(() => {
    localStorage.setItem('faceattend_camera_classroom', activeClassroom);
    // Mise à jour anticipateSessions pour le menu déroulant
    setAnticipateSessions(sessions.filter((s) => s.classroom === activeClassroom));

    let cancelled = false;
    const fetchActiveSession = async () => {
      try {
        const res = await fetch(
          `${API}/api/sessions/active?room=${encodeURIComponent(activeClassroom)}`
        );
        if (!res.ok) {
          if (!cancelled) setActiveSession(null);
          return;
        }
        const data = await res.json();
        if (!cancelled) setActiveSession(data?.id ? data : null);
      } catch {
        if (!cancelled) setActiveSession(null);
      }
    };

    fetchActiveSession(); // Appel immédiat
    const interval = setInterval(fetchActiveSession, 15000); // Rafraîchissement toutes les 15s
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeClassroom, sessions]);

  // Command Sender
  const sendCommand = (cmd: string, payload?: unknown) => {
    const commandData = {
      command: cmd,
      payload: payload,
      timestamp: Date.now(),
    };
    localStorage.setItem(`faceattend_cmd_${activeClassroom}`, JSON.stringify(commandData));
  };

  const handleLaunchCamera = () => {
    window.open(
      '/camera',
      'ClassroomCamera',
      'toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=1024,height=768'
    );
  };

  async function fetchTeachers() {
    try {
      const res = await fetch(`${API}/api/teachers`);
      const data = await res.json();
      setTeachers(data ?? []);
    } catch (_e) {
      console.error('Erreur lors de la récupération des enseignants');
    }
  }

  async function fetchSessions() {
    try {
      const res = await fetch(`${API}/api/sessions`);
      const data = await res.json();
      setSessions(data ?? []);
    } catch (_e) {
      console.error('Erreur lors de la récupération des sessions');
    }
  }

  async function loadSession(sessionId: number) {
    setSelectedSessionId(sessionId);
    try {
      const res = await fetch(`${API}/api/sessions/${sessionId}/attendance`);
      const data = await res.json();
      setSessionDetails(data);
    } catch (_e) {
      console.error('Erreur lors du chargement de la session');
    }
  }

  async function createSession() {
    if (!sessionForm.teacher_id || !sessionForm.course_name || !sessionForm.group_name) return;
    const res = await fetch(`${API}/api/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...sessionForm, teacher_id: Number(sessionForm.teacher_id) }),
    });
    const data = await res.json();
    await fetchSessions();
    if (data.id) loadSession(data.id);
  }

  async function markAttendance(studentId: string, status: string) {
    if (!selectedSessionId) return;
    await fetch(`${API}/api/records/upsert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: studentId,
        session_id: selectedSessionId.toString(),
        status,
        method: 'manual',
      }),
    });
    loadSession(selectedSessionId);
  }

  async function cancelActiveSession(sessionId: number | string) {
    try {
      await fetch(`${API}/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'closed',
          end_time: new Date().toTimeString().substring(0, 5),
        }),
      });
    } catch (e) {
      console.error('Erreur annulation session:', e);
    }
    sendCommand('FORCE_STANDBY');
    setActiveSession(null);
    await fetchSessions();
  }

  const rooms = ['Salle B1', 'Salle B2', 'Amphi A', 'Labo IA'];

  return (
    <div className="space-y-6">
      {/* ─── COMMAND CENTER HEADER ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl shadow-lg border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <MonitorPlay className="text-blue-400" size={28} />
            Centre de Commande
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Supervisez et prenez le contrôle des caméras dans les salles.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={activeClassroom}
            onChange={(e) => setActiveClassroom(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 p-3 outline-none"
          >
            {rooms.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button
            onClick={handleLaunchCamera}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-500/20"
          >
            <ExternalLink size={18} />
            Ouvrir Écran Salle
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── CONFIGURATION & PLANNING ─── */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-50 text-indigo-500 rounded-xl">
                <ClipboardList size={20} />
              </div>
              <h3 className="font-bold text-slate-800 text-lg">Programmer une Séance</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={sessionForm.teacher_id}
                onChange={(e) => setSessionForm({ ...sessionForm, teacher_id: e.target.value })}
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none"
              >
                <option value="">Sélectionner Enseignant</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              <select
                value={sessionForm.classroom}
                onChange={(e) => setSessionForm({ ...sessionForm, classroom: e.target.value })}
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none"
              >
                {rooms.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={sessionForm.course_name}
                onChange={(e) => setSessionForm({ ...sessionForm, course_name: e.target.value })}
                placeholder="Module / Cours"
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none"
              />
              <input
                type="text"
                value={sessionForm.group_name}
                onChange={(e) => setSessionForm({ ...sessionForm, group_name: e.target.value })}
                placeholder="Section / Groupe"
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none"
              />

              <input
                type="date"
                value={sessionForm.session_date}
                onChange={(e) => setSessionForm({ ...sessionForm, session_date: e.target.value })}
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none col-span-1 md:col-span-2"
              />
            </div>
            <button
              onClick={createSession}
              className="mt-4 w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-2xl transition-all"
            >
              Initialiser la session
            </button>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-3xl border border-blue-100 shadow-sm">
            <h2 className="text-lg font-bold text-blue-900 mb-2 flex items-center gap-2">
              <CalendarClock className="text-blue-500" />
              Lancement Anticipé
            </h2>
            <p className="text-xs text-blue-700 mb-4">
              Forcez le démarrage d'un cours prévu aujourd'hui avant son heure.
            </p>
            <div className="space-y-3">
              <select
                value={selectedAnticipateSession}
                onChange={(e) => setSelectedAnticipateSession(e.target.value)}
                className="w-full bg-white border border-blue-200 text-slate-800 text-sm rounded-xl p-3 outline-none"
              >
                <option value="">-- Choisir un cours --</option>
                {anticipateSessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.session_date?.substring(0, 10)} · {s.start_time?.substring(0, 5)} :{' '}
                    {s.course_name} ({s.teacher_name})
                  </option>
                ))}
              </select>
              <button
                onClick={async () => {
                  if (selectedAnticipateSession) {
                    // 1. Activer en base de données immédiatement
                    try {
                      await fetch(`${API}/api/sessions/${selectedAnticipateSession}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'active' }), // status 'active' mettra is_active à true via notre backend
                      });
                    } catch (e) {
                      console.error('Erreur activation DB:', e);
                    }

                    // 2. Déployer sur le terminal
                    sendCommand('FORCE_START_SESSION', {
                      session_id: Number(selectedAnticipateSession),
                    });

                    // 3. Rafraîchir l'UI locale
                    await fetchSessions();
                  }
                }}
                disabled={!selectedAnticipateSession}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold py-3 rounded-xl flex justify-center items-center gap-2 transition-all"
              >
                <PlayCircle size={18} />
                Déployer sur Terminal
              </button>
            </div>
          </div>
        </div>

        {/* ─── LIVE TELEMETRY & TACTICAL OVERRIDES ─── */}
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col h-full relative overflow-hidden">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2 relative z-10">
            <Video className="text-blue-400" />
            Statut de la Caméra : {activeClassroom}
          </h2>

          <div className="relative z-10 flex-1 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-green-400 text-sm font-semibold">Connecté</span>
            </div>

            {activeSession ? (
              <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 mb-6">
                <p className="text-blue-400 text-xs font-bold uppercase mb-1">
                  Cours en cours de détection
                </p>
                <p className="text-xl font-bold text-white mb-1">{activeSession.course_name}</p>
                <p className="text-slate-400 text-sm mb-4">
                  Professeur: {activeSession.teacher_name}
                </p>
                <button
                  onClick={() => cancelActiveSession(activeSession.id)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                >
                  <XCircle size={14} />
                  Annuler ce cours
                </button>
              </div>
            ) : (
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 text-center mb-6">
                <p className="text-slate-400 text-sm font-medium">
                  Aucune session active détectée pour cette salle.
                </p>
              </div>
            )}

            <div className="mt-auto border-t border-slate-800 pt-6">
              <p className="text-sm text-slate-300 font-bold mb-4">
                Commandes Manuelles (Administrateur)
              </p>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => sendCommand('OVERRIDE_TEACHER')}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white p-3 rounded-xl flex flex-col items-center justify-center gap-2 transition-all"
                >
                  <Unlock size={20} className="text-emerald-400" />
                  <span className="text-xs font-medium text-center">Ouvrir la session</span>
                </button>

                <button
                  onClick={() => sendCommand('FORCE_STANDBY')}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white p-3 rounded-xl flex flex-col items-center justify-center gap-2 transition-all"
                >
                  <PowerOff size={20} className="text-red-400" />
                  <span className="text-xs font-medium text-center">Fermer la session</span>
                </button>

                <button
                  onClick={() => sendCommand('REFRESH_TERMINAL')}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white p-3 rounded-xl flex flex-col items-center justify-center gap-2 transition-all"
                >
                  <RefreshCw size={20} className="text-blue-400" />
                  <span className="text-xs font-medium text-center">Redémarrer l'écran</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── LIVE ATTENDANCE GRID ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-[360px,1fr] gap-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col h-[600px]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <CalendarDays size={18} className="text-blue-500" />
              <h3 className="font-bold text-slate-800">Sessions du Jour</h3>
            </div>
          </div>
          <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar">
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => loadSession(Number(s.id))}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                  selectedSessionId === Number(s.id)
                    ? 'border-blue-500 bg-blue-50 shadow-sm shadow-blue-500/10'
                    : 'border-slate-50 hover:border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="font-bold text-slate-800 leading-tight">{s.course_name}</p>
                  <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-black uppercase">
                    {s.group_name}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    {s.teacher_name}
                  </p>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1.5 uppercase font-medium">
                    <CalendarDays size={10} />
                    {new Date(s.session_date).toLocaleDateString('fr-FR')} ·{' '}
                    {s.classroom || 'Salle n/a'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col h-[600px]">
          {!sessionDetails ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-3 opacity-50">
              <AlertTriangle size={48} />
              <p className="font-medium">
                Veuillez sélectionner une session pour voir les présences en direct
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="font-black text-slate-900 text-2xl tracking-tight">
                    {sessionDetails.session.course_name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Groupe {sessionDetails.session.group_name}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="text-xs font-bold text-slate-400 italic">
                      Listing Presence Direct
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="bg-emerald-50 px-3 py-2 rounded-2xl flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-black text-emerald-600 uppercase">
                      Présents:{' '}
                      {sessionDetails.students.filter((s) => s.status === 'present').length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                {sessionDetails.students.map((student) => (
                  <div
                    key={student.id}
                    className="p-4 rounded-3xl border border-slate-100 bg-white hover:border-blue-200 transition-all group/card relative overflow-hidden"
                  >
                    <div className="flex items-center gap-3 relative z-10">
                      <img
                        src={
                          student.photo_url ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(student.full_name)}&background=f1f5f9&color=64748b`
                        }
                        alt={student.full_name}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-sm"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate leading-none mb-1">
                          {student.full_name}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400 uppercase">
                          {student.student_code}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 relative z-10">
                      <button
                        onClick={() => markAttendance(student.id, 'present')}
                        className={`flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                          student.status === 'present'
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                            : 'bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'
                        }`}
                      >
                        Présent
                      </button>
                      <button
                        onClick={() => markAttendance(student.id, 'absent')}
                        className={`flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                          student.status === 'absent'
                            ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                            : 'bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600'
                        }`}
                      >
                        Absent
                      </button>
                    </div>
                    {student.status === 'present' && (
                      <div className="absolute -top-6 -right-6 w-12 h-12 bg-emerald-500/10 rounded-full flex items-end justify-start p-2">
                        <CheckCircle2 size={12} className="text-emerald-500" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
