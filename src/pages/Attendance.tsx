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
  ShieldAlert,
  Cpu,
  PauseCircle,
  Trash2,
  Play,
  Users,
  Calendar
} from 'lucide-react';
import { Session, Student, Teacher, Course } from '../types';

import { API_URL } from '../config';
const API = API_URL;

interface SessionAttendanceStudent extends Student {
  attendance_id?: number | null;
  status?: 'present' | 'absent' | 'late' | 'excused' | null;
  timestamp?: string | null;
}

interface SessionAttendanceResponse {
  session: Session;
  students: SessionAttendanceStudent[];
}

async function readJsonSafe<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export default function Attendance() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classrooms, setClassrooms] = useState<string[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [sessionDetails, setSessionDetails] = useState<SessionAttendanceResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'live' | 'master'>('live');
  const [selectedAnticipateSession, setSelectedAnticipateSession] = useState<string>('');

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

  const [livenessEnabled, setLivenessEnabled] = useState(() => {
    const saved = localStorage.getItem('faceattend_liveness_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [autoTracking, setAutoTracking] = useState(() => {
    const saved = localStorage.getItem('faceattend_auto_tracking_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('faceattend_liveness_enabled', JSON.stringify(livenessEnabled));
  }, [livenessEnabled]);

  useEffect(() => {
    localStorage.setItem('faceattend_auto_tracking_enabled', JSON.stringify(autoTracking));
  }, [autoTracking]);

  // Sync with storage changes (e.g. if updated from camera or other dashboard)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'faceattend_liveness_enabled' && e.newValue) {
        setLivenessEnabled(JSON.parse(e.newValue));
      }
      if (e.key === 'faceattend_auto_tracking_enabled' && e.newValue) {
        setAutoTracking(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    Promise.all([fetchTeachers(), fetchSessions(), fetchCourses(), fetchClassrooms()]);
    const interval = setInterval(() => {
      fetchSessions();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedSessionId) {
      const interval = setInterval(() => {
        const pollSession = async () => {
          try {
            const res = await fetch(`${API}/api/sessions/${selectedSessionId}/attendance`);
            if (res.ok) {
              const data = await res.json();
              setSessionDetails(data);
            }
          } catch (e) {
            // silent fail on poll
          }
        };
        pollSession();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedSessionId]);

  async function fetchClassrooms() {
    try {
      const res = await fetch(`${API}/api/classrooms`);
      if (res.ok) {
        const data = await res.json();
        setClassrooms(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchCourses() {
    try {
      const res = await fetch(`${API}/api/courses`);
      if (res.ok) {
        const data = await res.json();
        setCourses(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    localStorage.setItem('faceattend_camera_classroom', activeClassroom);

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

    fetchActiveSession();
    const interval = setInterval(fetchActiveSession, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeClassroom]);

  // Command Sender
  const sendCommand = (cmd: string, payload?: unknown) => {
    const commandData = {
      command: cmd,
      payload: payload,
      timestamp: Date.now(),
    };
    localStorage.setItem(`faceattend_cmd_${activeClassroom}`, JSON.stringify(commandData));
  };

  const toggleLiveness = () => {
    const newVal = !livenessEnabled;
    setLivenessEnabled(newVal);
    sendCommand('TOGGLE_LIVENESS', { enabled: newVal });
  };

  const toggleAutoTracking = () => {
    const newVal = !autoTracking;
    setAutoTracking(newVal);
    sendCommand('TOGGLE_AUTO_TRACKING', { enabled: newVal });
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
      if (!res.ok) {
        setTeachers([]);
        return;
      }
      const data = await readJsonSafe<unknown>(res);
      setTeachers(Array.isArray(data) ? (data as Teacher[]) : []);
    } catch (_e) {
      console.error('Erreur lors de la récupération des enseignants');
      setTeachers([]);
    }
  }

  async function fetchSessions() {
    try {
      const res = await fetch(`${API}/api/sessions`);
      if (!res.ok) {
        setSessions([]);
        return;
      }
      const data = await readJsonSafe<unknown>(res);
      setSessions(Array.isArray(data) ? (data as Session[]) : []);
    } catch (_e) {
      console.error('Erreur lors de la récupération des sessions');
      setSessions([]);
    }
  }

  async function loadSession(sessionId: number) {
    setSelectedSessionId(sessionId);
    setSelectedCourse(null); // Clear selected course if loading a session
    try {
      const res = await fetch(`${API}/api/sessions/${sessionId}/attendance`);
      if (!res.ok) {
        setSessionDetails(null);
        return;
      }
      const data = await readJsonSafe<unknown>(res);
      if (
        data &&
        typeof data === 'object' &&
        'session' in data &&
        'students' in data &&
        Array.isArray((data as SessionAttendanceResponse).students)
      ) {
        setSessionDetails(data as SessionAttendanceResponse);
      } else {
        setSessionDetails(null);
      }
    } catch (_e) {
      console.error('Erreur lors du chargement de la session');
      setSessionDetails(null);
    }
  }

  async function loadCourseStudents(course: Course) {
    setSelectedCourse(course);
    setSelectedSessionId(null); // Clear selected session
    setSessionDetails(null); // Clear session details
    try {
      const res = await fetch(`${API}/api/courses/${course.id}/students`);
      if (res.ok) {
        const students = await res.json();
        // Mimic a session structure to reuse the UI
        setSessionDetails({
          session: {
            id: course.id,
            course_name: course.name,
            group_name: course.group_name || 'ALL',
            session_date: 'THÉORIQUE',
            teacher_name: course.teacher_name || 'N/A',
            classroom: course.room || 'N/A',
            start_time: course.schedule_day || 'N/A',
            status: 'theoretical'
          } as any,
          students: students.map((s: any) => ({ ...s, status: null, marked_at: null }))
        });
      }
    } catch (_e) {
      console.error('Erreur loading course students');
    }
  }

  async function deleteSession(id: number) {
    if (!confirm('Voulez-vous vraiment supprimer cette session ?')) return;
    try {
      const res = await fetch(`${API}/api/sessions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchSessions();
        if (selectedSessionId === id) {
          setSelectedSessionId(null);
          setSessionDetails(null);
        }
      }
    } catch (_e) {
      console.error('Erreur suppression session');
    }
  }

  async function createSession(launch = false) {
    if (!sessionForm.teacher_id || !sessionForm.course_name || !sessionForm.group_name) return;

    // Conflict detection
    const existingActive = sessions.find(s => s.classroom === sessionForm.classroom && s.status === 'active');
    
    if (existingActive) {
      if (launch) {
        if (!confirm(`Attention : Une session de "${existingActive.course_name}" est déjà en cours dans la ${sessionForm.classroom}. Voulez-vous l'arrêter pour lancer la nouvelle session ?`)) {
          return;
        }
        // Stop the existing one first
        await cancelActiveSession(existingActive.id);
      } else {
        alert(`Information : La salle ${sessionForm.classroom} est actuellement occupée par le cours "${existingActive.course_name}".\n\nLe cours que vous planifiez sera mis en attente dans la file de la Surveillance Directe.`);
      }
    }

    try {
      const sessionData = {
        ...sessionForm,
        teacher_id: Number(sessionForm.teacher_id),
        status: launch ? 'active' : 'scheduled',
        is_active: launch
      };

      const res = await fetch(`${API}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
      });
      if (!res.ok) return;
      const data = await readJsonSafe<{ id?: number }>(res);
      await fetchSessions();

      if (typeof data?.id === 'number') {
        loadSession(data.id);
        setActiveTab('live');
        if (launch) {
          sendCommand('FORCE_START_SESSION', { session_id: data.id });
          alert(`Session lancée avec succès sur le terminal : ${sessionForm.classroom}`);
        } else {
          alert(`Session planifiée avec succès pour le groupe ${sessionForm.group_name}`);
        }
      }
    } catch (e) {
      console.error('Erreur création session:', e);
    }
  }

  async function launchExistingSession(id: number) {
    const session = sessions.find(s => String(s.id) === String(id));
    if (!session) return;

    // Conflict detection
    const existingActive = sessions.find(s => s.classroom === session.classroom && s.status === 'active' && String(s.id) !== String(id));
    if (existingActive) {
      if (!confirm(`Attention : Une session de "${existingActive.course_name}" est déjà en cours dans la ${session.classroom}. Voulez-vous l'arrêter pour lancer celle-ci ?`)) {
        return;
      }
      await cancelActiveSession(existingActive.id);
    }

    try {
      const res = await fetch(`${API}/api/sessions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      });
      if (res.ok) {
        fetchSessions();
        loadSession(id);
        // Send command to camera
        localStorage.setItem(`faceattend_cmd_${session.classroom}`, JSON.stringify({
          command: 'FORCE_START_SESSION',
          payload: { session_id: id },
          timestamp: Date.now()
        }));
      }
    } catch (_e) {
      console.error('Erreur lancement session');
    }
  }

  async function markAttendance(studentId: string, status: string) {
    if (!selectedSessionId) return;
    try {
      const res = await fetch(`${API}/api/records/upsert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          session_id: selectedSessionId.toString(),
          status,
          method: 'manual',
        }),
      });
      if (!res.ok) return;
      loadSession(selectedSessionId);
    } catch (e) {
      console.error('Erreur marquage présence:', e);
    }
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

  const today = new Date().toISOString().split('T')[0];
  const anticipateSessions = sessions.filter(
    (s) =>
      s.status !== 'active' &&
      s.status !== 'closed' &&
      s.status !== 'cancelled' &&
      s.session_date === today
  );

  const rooms = classrooms.length > 0 ? classrooms : ['Salle B1', 'Salle B2', 'Amphi A', 'Labo IA'];

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

              <select
                value={sessionForm.course_name}
                onChange={(e) => {
                  setSessionForm({
                    ...sessionForm,
                    course_name: e.target.value
                  });
                }}
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none"
              >
                <option value="">Sélectionner Module</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} ({c.course_code})
                  </option>
                ))}
              </select>

              <select
                value={sessionForm.group_name}
                onChange={(e) => setSessionForm({ ...sessionForm, group_name: e.target.value })}
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none"
              >
                <option value="ALL">Tous les Groupes</option>
                <option value="01">Groupe 01</option>
                <option value="02">Groupe 02</option>
                <option value="03">Groupe 03</option>
                <option value="04">Groupe 04</option>
                <option value="demo 01">Groupe Demo 01</option>
              </select>

              <input
                type="date"
                value={sessionForm.session_date}
                onChange={(e) => setSessionForm({ ...sessionForm, session_date: e.target.value })}
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none"
              />
              <div className="flex gap-2">
                <input
                  type="time"
                  value={sessionForm.start_time}
                  onChange={(e) => setSessionForm({ ...sessionForm, start_time: e.target.value })}
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm"
                  title="Heure de début"
                />
                <input
                  type="time"
                  value={sessionForm.end_time}
                  onChange={(e) => setSessionForm({ ...sessionForm, end_time: e.target.value })}
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm"
                  title="Heure de fin"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <button
                onClick={() => createSession(false)}
                className="flex-1 py-3 bg-amber-50 border border-amber-200 text-amber-700 font-bold rounded-2xl hover:bg-amber-100 transition-all flex items-center justify-center gap-2"
              >
                <CalendarClock size={18} />
                Planifier (Agenda)
              </button>
              <button
                onClick={() => createSession(true)}
                className="flex-[1.5] py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
              >
                <MonitorPlay size={18} />
                Lancer Directement (Caméra)
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-3xl border border-blue-100 shadow-sm">
            <h2 className="text-lg font-bold text-blue-900 mb-2 flex items-center gap-2">
              <CalendarClock className="text-blue-500" />
              Lancement Anticipé
            </h2>
            <p className="text-xs text-blue-700 mb-4">
              Démarrer un cours prévu aujourd'hui (même s'il change de salle).
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
                    {s.start_time?.substring(0, 5)} : {s.course_name} (Initialement en {s.classroom})
                  </option>
                ))}
              </select>
              <button
                onClick={async () => {
                  if (selectedAnticipateSession) {
                    const session = sessions.find(s => String(s.id) === selectedAnticipateSession);
                    const needsRoomUpdate = session && session.classroom !== activeClassroom;

                    // 1. Activer en base de données et mettre à jour la salle si nécessaire
                    try {
                      await fetch(`${API}/api/sessions/${selectedAnticipateSession}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          status: 'active',
                          classroom: activeClassroom // On force la salle actuelle !
                        }),
                      });

                      if (needsRoomUpdate) {
                        alert(`Redirection : Le cours a été déplacé de ${session.classroom} vers ${activeClassroom}`);
                      }
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
              <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 mb-6 relative overflow-hidden group/card shadow-2xl">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />

                <div className="flex justify-between items-center mb-4 relative z-10">
                  <p className="text-blue-400 text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    Détection Active
                  </p>
                  {selectedSessionId === Number(activeSession.id) && sessionDetails && (
                    <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">
                      <span className="text-[10px] font-black text-emerald-500">
                        {sessionDetails.students.filter(s => s.status === 'present' || s.status === 'late').length} / {sessionDetails.students.length} PRÉSENTS
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-start mb-5 relative z-10">
                  <div className="flex-1">
                    <h4 className="text-xl font-black text-white leading-tight mb-1">{activeSession.course_name}</h4>
                    <p className="text-slate-400 text-xs font-bold">Professeur: {activeSession.teacher_name}</p>
                  </div>
                  <div className="bg-slate-900/60 px-3 py-2 rounded-xl border border-slate-700/50 text-center min-w-[70px]">
                    <p className="text-[7px] text-slate-500 font-black uppercase tracking-widest mb-0.5">Groupe</p>
                    <p className="text-sm font-black text-blue-400">{activeSession.group_name === 'ALL' ? 'TOUS' : activeSession.group_name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
                  <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-700/30">
                    <p className="text-[7px] text-slate-500 font-black uppercase tracking-widest mb-1">Planning Horaire</p>
                    <p className="text-xs font-bold text-slate-200">{activeSession.start_time?.substring(0, 5)} - {activeSession.end_time?.substring(0, 5)}</p>
                  </div>
                  <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-700/30">
                    <p className="text-[7px] text-slate-500 font-black uppercase tracking-widest mb-1">Date Séance</p>
                    <p className="text-xs font-bold text-slate-200">{new Date(activeSession.session_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</p>
                  </div>
                </div>

                <div className="flex gap-2 relative z-10">
                  <button
                    onClick={() => {
                      if (confirm("Voulez-vous clôturer cette session ? Tous les étudiants non scannés seront marqués absents.")) {
                        cancelActiveSession(activeSession.id);
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 rounded-xl text-[9px] font-black uppercase tracking-[0.1em] transition-all"
                  >
                    <XCircle size={14} />
                    Clôturer la session
                  </button>
                  <button
                    onClick={() => loadSession(Number(activeSession.id))}
                    className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-lg shadow-blue-500/20"
                    title="Voir les détails"
                  >
                    <Users size={16} />
                  </button>
                </div>
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
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <button
                  onClick={() => sendCommand('OVERRIDE_TEACHER')}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white p-3 rounded-xl flex flex-col items-center justify-center gap-2 transition-all"
                >
                  <Unlock size={20} className="text-emerald-400" />
                  <span className="text-xs font-medium text-center">Réveiller / Déverrouiller</span>
                </button>

                <button
                  onClick={() => {
                    if (confirm("Voulez-vous mettre le terminal en veille ? La caméra s'éteindra mais la session (si active) ne sera pas clôturée dans la base de données.")) {
                      sendCommand('FORCE_STANDBY');
                    }
                  }}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white p-3 rounded-xl flex flex-col items-center justify-center gap-2 transition-all"
                >
                  <PowerOff size={20} className="text-red-400" />
                  <span className="text-xs font-medium text-center">Mise en veille Terminal</span>
                </button>

                <button
                  onClick={() => sendCommand('PAUSE_SESSION')}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white p-3 rounded-xl flex flex-col items-center justify-center gap-2 transition-all"
                >
                  <PauseCircle size={20} className="text-yellow-400" />
                  <span className="text-xs font-medium text-center">Mettre en pause</span>
                </button>

                <button
                  onClick={() => sendCommand('REFRESH_TERMINAL')}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white p-3 rounded-xl flex flex-col items-center justify-center gap-2 transition-all"
                >
                  <RefreshCw size={20} className="text-blue-400" />
                  <span className="text-xs font-medium text-center">Redémarrer écran</span>
                </button>

                <button
                  onClick={toggleLiveness}
                  className={`border p-3 rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${livenessEnabled
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                    }`}
                >
                  <ShieldAlert size={20} className={livenessEnabled ? 'text-emerald-400' : 'text-slate-400'} />
                  <span className="text-xs font-medium text-center">Anti-Spoofing {livenessEnabled ? 'Actif' : 'Inactif'}</span>
                </button>

                <button
                  onClick={toggleAutoTracking}
                  className={`border p-3 rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${autoTracking
                      ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                    }`}
                >
                  <Cpu size={20} className={autoTracking ? 'text-blue-400' : 'text-slate-400'} />
                  <span className="text-xs font-medium text-center">Suivi IA {autoTracking ? 'Actif' : 'Inactif'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── LIVE ATTENDANCE GRID ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-[400px,1fr] gap-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col h-[600px] shadow-sm">
          {/* TABS SELECTOR */}
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
            <button
              onClick={() => setActiveTab('live')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'live'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <Video size={14} />
              Surveillance & Direct
            </button>
            <button
              onClick={() => setActiveTab('master')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'master'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <CalendarDays size={14} />
              Planning Global
            </button>
          </div>

          <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar">
            {/* LIVE CONTROL PANEL (ACTIVE ON CAMERA) */}
            {activeTab === 'live' && (
              <div className="mb-6">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 px-1">
                  Flux Caméra Actif (Cliquez pour voir les étudiants)
                </h3>
                {sessions.find(s => s.status === 'active' && s.classroom === activeClassroom) ? (
                  sessions
                    .filter(s => s.status === 'active' && s.classroom === activeClassroom)
                    .map(s => (
                      <button
                        key={s.id}
                        onClick={() => loadSession(Number(s.id))}
                        className={`w-full text-left bg-emerald-600 rounded-[2rem] p-6 text-white shadow-xl shadow-emerald-200 relative overflow-hidden group transition-all ${selectedSessionId === Number(s.id) ? 'ring-4 ring-emerald-300 ring-offset-2' : 'hover:scale-[1.02]'
                          }`}
                      >
                        <div className="relative z-10">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/30 shadow-lg">
                              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                              <span className="text-[10px] font-black uppercase tracking-wider text-white">SÉANCE ACTUELLE SUR CAMÉRA</span>
                            </div>
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                cancelActiveSession(s.id);
                              }}
                              className="w-10 h-10 rounded-full bg-white/10 hover:bg-red-500 flex items-center justify-center transition-all group/btn"
                              title="Arrêter la session"
                            >
                              <PowerOff size={18} className="group-hover/btn:scale-110 transition-transform" />
                            </div>
                          </div>

                          <h4 className="text-xl font-black mb-1">{s.course_name}</h4>
                          <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mb-4">
                            PROF: {s.teacher_name} • GRP {s.group_name}
                          </p>

                          <div className="flex gap-4">
                            <div className="bg-white/10 px-4 py-2 rounded-2xl">
                              <p className="text-[8px] text-emerald-200 font-bold uppercase">Débuté à</p>
                              <p className="text-sm font-black">{s.start_time}</p>
                            </div>
                            <div className="bg-white/10 px-4 py-2 rounded-2xl">
                              <p className="text-[8px] text-emerald-200 font-bold uppercase">Lieu</p>
                              <p className="text-sm font-black">{s.classroom}</p>
                            </div>
                          </div>
                        </div>
                        <Video size={140} className="absolute -bottom-10 -right-10 text-white/5 -rotate-12 group-hover:rotate-0 transition-all duration-700" />
                      </button>
                    ))
                ) : (
                  <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-8 text-center">
                    <MonitorPlay size={32} className="mx-auto text-slate-300 mb-3 opacity-50" />
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed">
                      Aucune session active sur la caméra.<br />L'IA lancera automatiquement le prochain cours prévu.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* UPCOMING / OTHER SESSIONS */}
            {activeTab === 'live' && (
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 px-1">
                Séances en Attente & Terminées
              </h3>
            )}

            {activeTab === 'live' ? (
              sessions
                .filter((s) =>
                  s.classroom === activeClassroom &&
                  s.status !== 'active' &&
                  (s.session_date === new Date().toISOString().split('T')[0])
                )
                .sort((a, b) => {
                  // Active sessions first (fallback just in case)
                  if (a.status === 'active' && b.status !== 'active') return -1;
                  if (a.status !== 'active' && b.status === 'active') return 1;
                  // Then by start time
                  return (a.start_time || '').localeCompare(b.start_time || '');
                })
                .map((s) => {
                  const isActiveSessionInRoom = sessions.some(act => act.status === 'active' && act.classroom === activeClassroom && act.id !== s.id);
                  const isScheduledConflict = (s.status === 'scheduled' || (!s.status && s.is_active === false)) && isActiveSessionInRoom;
                  
                  return (
                    <div
                      key={s.id}
                      className={`group relative p-4 rounded-2xl border-2 transition-all ${selectedSessionId === Number(s.id)
                          ? 'border-blue-500 bg-blue-50'
                          : s.status === 'closed'
                            ? 'border-slate-100 bg-slate-50 opacity-60'
                            : isScheduledConflict
                              ? 'border-orange-200 bg-orange-50/50 hover:border-orange-300'
                              : 'border-slate-50 hover:border-slate-200 bg-white'
                        }`}
                    >
                    <button
                      onClick={() => loadSession(Number(s.id))}
                      className="w-full text-left pr-8"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p
                          className={`font-bold text-sm leading-tight ${s.status === 'closed' ? 'line-through text-slate-400' : 'text-slate-800'}`}
                        >
                          {s.course_name}
                        </p>
                        <div className="flex gap-1.5">
                          {s.status === 'closed' ? (
                            <div className="flex items-center gap-1.5 bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full border border-slate-300">
                              <CheckCircle2 size={8} />
                              <span className="text-[9px] font-black uppercase">TERMINÉ</span>
                            </div>
                          ) : (s.status === 'scheduled' || (!s.status && s.is_active === false)) ? (
                            (() => {
                              const isActiveSessionInRoom = sessions.some(act => act.status === 'active' && act.classroom === activeClassroom && act.id !== s.id);
                              return (
                                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${
                                  isActiveSessionInRoom
                                    ? 'bg-orange-100 text-orange-600 border-orange-200'
                                    : 'bg-amber-100 text-amber-600 border-amber-200'
                                }`}>
                                  {isActiveSessionInRoom ? <AlertTriangle size={8} /> : <CalendarClock size={8} />}
                                  <span className="text-[9px] font-black uppercase">
                                    {isActiveSessionInRoom ? 'EN ATTENTE (SALLE OCCUPÉE)' : 'EN ATTENTE'}
                                  </span>
                                </div>
                              );
                            })()
                          ) : null}
                          <span className="text-[9px] bg-slate-800 text-white px-1.5 py-0.5 rounded font-black uppercase">
                            {s.group_name === 'ALL' ? 'TOUS LES GROUPES' : `GRP ${s.group_name}`}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 space-y-1">
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-1.5">
                          <CalendarDays size={10} className="text-blue-500" />
                          {new Date(s.session_date).toLocaleDateString('fr-FR')} · {s.start_time || '--:--'} - {s.end_time || '--:--'}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5">
                          <Users size={10} className="text-purple-500" />
                          Prof. {s.teacher_name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5">
                          <MonitorPlay size={10} className="text-emerald-500" />
                          {s.classroom}
                        </p>
                      </div>
                    </button>

                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      {s.status === 'scheduled' && (
                        <button
                          onClick={() => launchExistingSession(Number(s.id))}
                          className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors shadow-sm"
                          title="Lancer maintenant"
                        >
                          <Play size={14} />
                        </button>
                      )}

                      {s.status === 'active' && (
                        <button
                          onClick={() => cancelActiveSession(s.id)}
                          className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors shadow-sm"
                          title="Arrêter la session"
                        >
                          <XCircle size={14} />
                        </button>
                      )}

                      <button
                        onClick={(e) => { e.stopPropagation(); deleteSession(Number(s.id)); }}
                        className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors shadow-sm"
                        title="Supprimer catégoriquement de la base"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              (() => {
                const days = ['DIMANCHE', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
                const todayName = days[new Date().getDay()];
                const roomCourses = courses.filter((c) => c.room === activeClassroom);
                const todayCourses = roomCourses.filter((c) => c.schedule_day?.toUpperCase() === todayName);

                // Show today's courses if available, otherwise show all room courses as fallback
                const coursesToDisplay = todayCourses.length > 0 ? todayCourses : roomCourses;

                if (coursesToDisplay.length === 0) {
                  return (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center p-8 opacity-50">
                      <Calendar size={32} className="mb-2" />
                      <p className="text-xs">Aucun cours théorique répertorié pour cette salle.</p>
                    </div>
                  );
                }

                return coursesToDisplay.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => loadCourseStudents(c)}
                    className={`p-4 rounded-2xl border transition-all text-left w-full ${selectedCourse?.id === c.id
                        ? 'border-indigo-500 bg-indigo-50 shadow-md'
                        : 'border-slate-100 bg-white hover:border-indigo-200'
                      }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <p className="font-bold text-slate-800 text-sm leading-tight">{c.name}</p>
                      <span className="text-[9px] border border-indigo-200 text-indigo-600 px-1.5 py-0.5 rounded font-black uppercase tracking-widest bg-indigo-50/50">
                        PROGRAMMÉ
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-2">
                        <CalendarDays size={10} className="text-indigo-500" />
                        {c.schedule_day} · {c.schedule_time}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold flex items-center gap-2">
                        <Users size={10} className="text-purple-500" />
                        Prof: {c.teacher_name}
                      </p>
                      <div className="flex justify-between items-end pt-1">
                        <div className="flex gap-2">
                          <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-black flex items-center gap-1">
                            <MonitorPlay size={10} />
                            {c.room}
                          </span>
                          <span className="text-[9px] bg-slate-800 text-white px-2 py-0.5 rounded-full font-black uppercase">
                            {c.group_name === 'ALL' ? 'TOUS' : `GRP ${c.group_name}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl border border-indigo-100">
                          <Cpu size={12} className="animate-pulse" />
                          <span className="text-[9px] font-black uppercase tracking-widest">IA EN ATTENTE DE L'HEURE</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ));
              })()
            )}

            {activeTab === 'live' && sessions.filter(s => s.classroom === activeClassroom).length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center p-8">
                <Video size={32} className="mb-2 opacity-20" />
                <p className="text-xs">Aucune session enregistrée pour cette salle aujourd'hui.</p>
              </div>
            )}
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
                      {sessionDetails.session.status === 'theoretical' ? (
                        <>LISTE ABSOLUE DES INSCRITS • {sessionDetails.session.group_name}</>
                      ) : (
                        <>GROUPE {sessionDetails.session.group_name} • Listing Presence Direct</>
                      )}
                    </span>
                  </div>
                </div>
                {sessionDetails.session.status !== 'theoretical' && (
                  <div className="flex gap-2">
                    <div className="bg-emerald-50 px-3 py-2 rounded-2xl flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-black text-emerald-600 uppercase">
                        Présents:{' '}
                        {(sessionDetails.students || []).filter((s) => s.status === 'present').length}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-8 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                {Object.entries(
                  (sessionDetails.students || []).reduce(
                    (acc, s) => {
                      const grp = s.group_name || 'Sans Groupe';
                      if (!acc[grp]) acc[grp] = [];
                      acc[grp].push(s);
                      return acc;
                    },
                    {} as Record<string, SessionAttendanceStudent[]>
                  )
                )
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([group, groupStudents]) => (
                    <div key={group} className="space-y-4">
                      <div className="flex items-center gap-4 px-2">
                        <div className="h-px flex-1 bg-slate-100" />
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            {group === 'ALL' ? 'TOUS LES GROUPES' : `GROUPE ${group}`}
                          </span>
                          <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {groupStudents.filter((s) => s.status === 'present').length} / {groupStudents.length}
                          </span>
                        </div>
                        <div className="h-px flex-1 bg-slate-100" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {groupStudents.map((student) => (
                          <div
                            key={student.id}
                            className={`p-4 rounded-3xl border transition-all group/card relative overflow-hidden ${student.status === 'present'
                                ? 'bg-emerald-50/30 border-emerald-100'
                                : 'bg-white border-slate-100 hover:border-blue-200 shadow-sm hover:shadow-md'
                              }`}
                          >
                            <div className="flex items-center gap-3 relative z-10">
                              <div className="relative">
                                <img
                                  src={
                                    student.photo_url ||
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(student.full_name)}&background=f1f5f9&color=64748b`
                                  }
                                  alt={student.full_name}
                                  className={`w-12 h-12 rounded-2xl object-cover border-2 transition-all ${student.status === 'present' ? 'border-emerald-500 shadow-lg shadow-emerald-500/20' : 'border-white'
                                    }`}
                                />
                                {student.status === 'present' && (
                                  <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-white">
                                    <CheckCircle2 size={10} />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-800 truncate leading-tight">
                                  {student.full_name}
                                </p>
                                <p className="text-[10px] font-mono text-slate-400 uppercase mt-0.5">
                                  {student.student_code}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-4 relative z-10">
                              <button
                                onClick={() => markAttendance(student.id, 'present')}
                                className={`flex-1 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${student.status === 'present'
                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                    : 'bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'
                                  }`}
                              >
                                Présent
                              </button>
                              <button
                                onClick={() => markAttendance(student.id, 'absent')}
                                className={`flex-1 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${student.status === 'absent'
                                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                                    : 'bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600'
                                  }`}
                              >
                                Absent
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
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
