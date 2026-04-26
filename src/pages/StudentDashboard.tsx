import { getPhotoUrl } from '../utils/image';
import React, { useEffect, useState } from 'react';
import { API_URL } from '../config';
const API = API_URL;
import {
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  History,
  User,
  Cpu,
  GraduationCap,
  LogOut,
  ScanFace,
  CalendarDays,
  Clock,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import StudentLayout from '../components/StudentLayout';
import { DOC_TITLE } from '../constants/documentTitles';
import { UNIVERSITY_LOGO_ALT, UNIVERSITY_LOGO_SRC } from '../constants/universityBranding';

interface StudentData {
  id: string;
  name: string;
  code: string;
  group: string;
  photo_url?: string;
  email?: string;
  filiere?: string;
  annee?: string;
}

interface StudentStats {
  attendance_rate: number;
  total_presences: number;
  total_absences: number;
  history: Array<{ status: string; course_name: string; date: string }>;
  modules: Array<{
    name: string;
    threshold: number;
    absences: number;
    presences: number;
    schedule_day?: string;
    schedule_time?: string;
    room?: string;
    teacher?: string;
    course_type?: string;
  }>;
}

interface StudentDashboardProps {
  onLogout: () => void;
  simulatedStudentId?: string;
}

export default function StudentDashboard({ onLogout, simulatedStudentId }: StudentDashboardProps) {
  const [student, setStudent] = useState<StudentData | null>(null);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = DOC_TITLE.studentApp;

    if (simulatedStudentId) {
      fetchStats(simulatedStudentId);
      return;
    }

    const saved = localStorage.getItem('faceattend_student');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setStudent(parsed);
        fetchStats(parsed.id);

        const interval = setInterval(() => {
          fetchStats(parsed.id);
        }, 30000);

        return () => clearInterval(interval);
      } catch (e) {
        console.error('Parse error', e);
        localStorage.removeItem('faceattend_student');
        window.location.href = '/portal';
      }
    } else {
      setLoading(false);
      window.location.href = '/portal';
    }
  }, [simulatedStudentId]);

  // ─── RE-SYNC ON TAB CHANGE ───
  useEffect(() => {
    if (student?.id) {
      fetchStats(student.id);
    }
  }, [activeTab, student?.id]);

  const fetchStats = async (studentId: string) => {
    try {
      const res = await fetch(`${API}/api/students/${studentId}/full-stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        if (data.student) {
          const mappedStudent = {
            ...data.student,
            // Le backend retourne déjà photo_url — on le garde tel quel
            photo_url: data.student.photo_url || data.student.photo || null,
          };
          setStudent((prev) => ({ ...prev, ...mappedStudent }));
        }
      }
    } catch (e) {
      console.error('Sync Error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !student?.id) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API}/api/students/${student.id}/photo`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        // Update local state and storage
        const updatedStudent = { ...student, photo_url: data.url };
        setStudent(updatedStudent);
        localStorage.setItem('faceattend_student', JSON.stringify(updatedStudent));
        // Force refresh stats to ensure AI encoding is ready
        fetchStats(student.id);
      } else {
        alert("Erreur lors de l'envoi de la photo.");
      }
    } catch (err) {
      console.error('Upload Error:', err);
      alert("Erreur réseau lors de l'envoi.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(16,185,129,0.3)]" />
      </div>
    );
  }

  // ─── En-tête établissement (sans logo image : réservé aux dashboards admin / enseignant) ───
  const UniversityHeader = () => (
    <div className="w-full relative bg-gradient-to-br from-slate-900 via-[#0b1219] to-slate-950 rounded-[2.5rem] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-white/5 overflow-hidden flex items-center min-h-[140px] mb-8 group transition-all duration-500 hover:border-emerald-500/20 hover:shadow-[0_20px_60px_rgba(16,185,129,0.1)]">
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -mr-32 -mt-32 transition-all duration-700 group-hover:bg-emerald-500/20" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 blur-[80px] rounded-full -ml-16 -mb-16" />
      <div className="flex items-center w-full relative z-10">
        <div className="w-20 h-20 rounded-[1.5rem] bg-white border border-emerald-500/25 flex items-center justify-center flex-shrink-0 shadow-[0_0_30px_rgba(16,185,129,0.15)] relative group-hover:scale-105 transition-transform duration-500 overflow-hidden p-2">
          <img
            src={UNIVERSITY_LOGO_SRC}
            alt={UNIVERSITY_LOGO_ALT}
            className="w-full h-full object-contain"
          />
        </div>
        <div className="ml-6 space-y-1">
          <div className="space-y-0">
            <h2 className="text-white font-black text-[17px] uppercase tracking-tighter leading-tight">
              Université Belhadj Bouchaïb
            </h2>
            <h3 className="text-slate-400 font-bold text-[13px] uppercase tracking-wider leading-none">
              Aïn Témouchent
            </h3>
          </div>
          <div className="flex items-center gap-2.5 pt-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)] animate-pulse" />
            <p className="text-emerald-400 text-[11px] font-black uppercase tracking-[0.3em]">
              {student?.filiere || 'Informatique'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    // ─── DASHBOARD TAB (Default Ultra-Neon View) ───
    if (activeTab === 'dashboard') {
      return (
        <div className="space-y-8 animate-in fade-in duration-700 flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-[-24px] px-2 relative z-20">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]" />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Live Sync Active</span>
            </div>
            <button 
              onClick={() => {
                setLoading(true);
                fetchStats(student?.id || simulatedStudentId || '');
              }}
              className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all active:scale-90"
              title="Actualiser mes données"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          <UniversityHeader />

          {/* HUGE Attendance Gauge - ILLUMINATED VIEW */}
          <div className="relative flex flex-col items-center py-6 w-full">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative w-72 h-72 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-slate-800/50 scale-[1.15]" />
              <div className="absolute inset-0 rounded-full border border-dashed border-slate-700/50 scale-[1.05] animate-[spin_60s_linear_infinite]" />

              <svg className="w-full h-full -rotate-90 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <circle
                  cx="144"
                  cy="144"
                  r="126"
                  className="stroke-slate-900 fill-transparent"
                  strokeWidth="14"
                />
                <circle
                  cx="144"
                  cy="144"
                  r="126"
                  className="fill-transparent transition-all duration-2000 ease-out stroke-emerald-500"
                  strokeWidth="14"
                  strokeDasharray="792"
                  strokeDashoffset={792 - (792 * (stats?.attendance_rate || 0)) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center mt-2">
                <p className="text-[12px] text-emerald-400 font-black uppercase tracking-[0.5em] mb-1 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
                  Assiduité
                </p>
                <span className="text-7xl font-black text-white tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                  {stats?.attendance_rate}%
                </span>
                <div className="w-16 h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/50 to-emerald-500/0 mt-3" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full max-w-[340px] mt-12 px-2">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col items-center justify-center gap-2 transition-all hover:border-emerald-500/50 shadow-2xl group">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-1 group-hover:scale-110 transition-transform">
                  <CheckCircle2 size={16} />
                </div>
                <p className="text-4xl font-black text-white">{stats?.total_presences}</p>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">
                  Présences
                </p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col items-center justify-center gap-2 transition-all hover:border-red-500/50 shadow-2xl group">
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 mb-1 group-hover:scale-110 transition-transform">
                  <XCircle size={16} />
                </div>
                <p className="text-4xl font-black text-white">{stats?.total_absences}</p>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">
                  Absences
                </p>
              </div>
            </div>
          </div>

          <div className="w-full pt-4 pb-8 px-2">
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 flex flex-col items-center gap-4 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-80" />
              <h1 className="text-2xl font-black text-white uppercase tracking-tight text-center leading-tight">
                {student?.name}
              </h1>

              <div className="flex flex-col items-center gap-2 -mt-2">
                <span className="text-[10px] font-black text-slate-500 tracking-[0.2em]">
                  {student?.email?.toLowerCase() || 'email@etudiant.univ'}
                </span>
                <span className="text-[12px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-4 py-1 rounded-full border border-emerald-500/20">
                  {student?.filiere || 'Filière non définie'}
                </span>
              </div>

              <div className="flex items-center gap-4 bg-black/60 px-6 py-2.5 rounded-full border border-slate-800">
                <div className="flex items-center gap-2">
                  <ScanFace size={14} className="text-emerald-400" />
                  <span className="text-[12px] font-black text-emerald-400 uppercase tracking-[0.3em] drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">
                    {student?.code}
                  </span>
                </div>
                <div className="w-[1px] h-4 bg-slate-800" />
                <div className="flex items-center gap-2">
                  <User size={14} className="text-slate-400" />
                  <span className="text-[12px] font-black text-slate-300 uppercase tracking-[0.3em]">
                    G{student?.group?.replace(/\D/g, '') || '2'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ─── MODULES TAB ───
    if (activeTab === 'modules') {
      return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <UniversityHeader />
          <div className="px-4 flex items-end justify-between">
            <div>
              <h3 className="text-white font-black text-2xl uppercase tracking-tighter drop-shadow-lg">
                Mes Modules
              </h3>
              <p className="text-emerald-400 text-[10px] font-black uppercase mt-1 tracking-[0.3em]">
                Suivi de présence expert
              </p>
            </div>
            <BookOpen className="text-emerald-500/20 mb-1" size={32} />
          </div>
          <div className="space-y-4 px-2">
            {stats?.modules.map((m, i) => {
              const totalSessions = m.presences + m.absences;
              const rate = totalSessions > 0 ? Math.round((m.presences / totalSessions) * 100) : 0;

              // Logique d'alerte experte
              const remainingAbsences = m.threshold - m.absences;
              const isThresholdReached = remainingAbsences <= 0;
              const isCritical = remainingAbsences === 1;
              const hasStarted = totalSessions > 0;

              return (
                <div
                  key={i}
                  className={`bg-slate-900 border ${isThresholdReached ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : isCritical ? 'border-orange-500/50' : 'border-slate-800 hover:border-emerald-500/50'} p-6 rounded-[2rem] space-y-4 transition-all duration-300 shadow-xl group relative overflow-hidden`}
                >
                  {isThresholdReached && (
                    <div className="absolute top-0 right-0 bg-red-500 text-white text-[8px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-widest animate-pulse">
                      Seuil Atteint
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-sm font-black text-white uppercase tracking-tight truncate block max-w-[200px]">
                        {m.name}
                      </span>
                      <div className="flex gap-2">
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                          {m.teacher || 'Professeur'}
                        </span>
                        {m.course_type && (
                          <span className="text-[8px] font-black text-emerald-500/80 uppercase tracking-widest bg-emerald-500/5 px-1.5 rounded">
                            {m.course_type}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-2xl font-black ${!hasStarted ? 'text-slate-700' : isThresholdReached ? 'text-red-500' : isCritical ? 'text-orange-400' : 'text-emerald-400'} drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]`}
                    >
                      {hasStarted ? `${rate}%` : '0%'}
                    </span>
                  </div>

                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5 relative">
                    <div className="absolute inset-0 bg-slate-800/30 w-full" />
                    <div
                      className={`h-full absolute left-0 top-0 transition-all duration-1000 ${isThresholdReached ? 'bg-red-500' : isCritical ? 'bg-orange-500' : 'bg-emerald-500'} relative overflow-hidden`}
                      style={{ width: `${rate}%` }}
                    >
                      {hasStarted && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider">
                          Présences
                        </span>
                        <span className="text-xs font-black text-white">{m.presences}</span>
                      </div>
                      <div className="w-[1px] h-4 bg-slate-800" />
                      <div className="flex flex-col">
                        <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider">
                          Absences
                        </span>
                        <span
                          className={`text-xs font-black ${m.absences > 0 ? 'text-red-400' : 'text-white'}`}
                        >
                          {m.absences}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`text-right px-3 py-1.5 rounded-xl border ${isThresholdReached ? 'bg-red-500/10 border-red-500/20' : 'bg-slate-950/50 border-white/5'}`}
                    >
                      {isThresholdReached ? (
                        <p className="text-[9px] text-red-500 font-black uppercase tracking-tighter">
                          ⚠️ Alerte Exclusion
                        </p>
                      ) : (
                        <p
                          className={`text-[9px] font-black uppercase tracking-tighter ${isCritical ? 'text-orange-400' : 'text-slate-400'}`}
                        >
                          Absences possibles :{' '}
                          <span className="text-white ml-1 font-black">{remainingAbsences}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // ─── SCANS TAB ───
    if (activeTab === 'scan') {
      return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <UniversityHeader />
          <div className="px-4 flex items-end justify-between">
            <div>
              <h3 className="text-white font-black text-2xl uppercase tracking-tighter">
                Historique Scans
              </h3>
              <p className="text-emerald-500/60 text-[10px] font-black uppercase mt-1 tracking-[0.3em]">
                Journal de bord sécurisé
              </p>
            </div>
            <History className="text-emerald-500/20 mb-1" size={32} />
          </div>
          <div className="space-y-3 px-2">
            {stats?.history.map((h, i) => {
              const isPresent = h.status === 'present';
              return (
                <div
                  key={i}
                  className={`bg-slate-900/40 border-l-4 ${isPresent ? 'border-l-emerald-500' : 'border-l-red-500'} border-y border-r border-white/5 p-4 rounded-2xl flex items-center justify-between transition-all hover:bg-slate-900/60 hover:scale-[1.01]`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPresent ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}
                    >
                      {isPresent ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[13px] font-black text-white uppercase tracking-tight truncate max-w-[150px]">
                        {h.course_name}
                      </p>
                      <p
                        className={`text-[9px] font-black uppercase tracking-[0.2em] ${isPresent ? 'text-emerald-500/70' : 'text-red-500/70'}`}
                      >
                        {isPresent ? 'Présence validée' : 'Absence marquée'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-black text-slate-300 uppercase tracking-tight">
                      {new Date(h.date).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                      {new Date(h.date).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // ─── TIMETABLE TAB ───
    if (activeTab === 'timetable') {
      const scheduledModules =
        stats?.modules.filter((m) => m.schedule_day && m.schedule_time) || [];

      const daysOrder = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      const groupedModules: Record<string, typeof scheduledModules> = {};

      scheduledModules.forEach((m) => {
        const day = m.schedule_day || 'Autre';
        if (!groupedModules[day]) groupedModules[day] = [];
        groupedModules[day].push(m);
      });

      const sortedDays = Object.keys(groupedModules).sort((a, b) => {
        const idxA = daysOrder.indexOf(a);
        const idxB = daysOrder.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        return a.localeCompare(b);
      });

      sortedDays.forEach((day) => {
        groupedModules[day].sort((a, b) =>
          (a.schedule_time || '').localeCompare(b.schedule_time || '')
        );
      });

      return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <UniversityHeader />
          <div className="px-4 flex items-end justify-between">
            <div>
              <h3 className="text-white font-black text-2xl uppercase tracking-tighter">
                Emploi du Temps
              </h3>
              <p className="text-emerald-500/60 text-[10px] font-black uppercase mt-1 tracking-[0.3em]">
                Planning Structuré
              </p>
            </div>
            <CalendarDays className="text-emerald-500/20 mb-1" size={32} />
          </div>
          <div className="space-y-6 px-2">
            {sortedDays.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2rem] text-center">
                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">
                  Aucun cours planifié
                </p>
              </div>
            ) : (
              sortedDays.map((day) => (
                <div key={day} className="space-y-3">
                  <h4 className="text-emerald-400 font-black uppercase tracking-[0.2em] text-xs pl-2 border-l-2 border-emerald-500">
                    {day}
                  </h4>
                  <div className="space-y-3">
                    {groupedModules[day].map((m, i) => (
                      <div
                        key={i}
                        className="bg-slate-900 border border-slate-800 p-5 rounded-[2rem] space-y-3 transition-all hover:border-emerald-500/50 shadow-xl group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl group-hover:bg-emerald-500/10 transition-colors" />

                        <div className="flex justify-between items-start relative z-10 gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-white font-black uppercase tracking-tight text-[15px] leading-tight">
                              {m.name}
                            </h4>
                            {m.course_type && (
                              <span
                                className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                                  m.course_type === 'TP'
                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                    : m.course_type === 'TD'
                                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                }`}
                              >
                                {m.course_type}
                              </span>
                            )}
                          </div>
                          {m.teacher && (
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider bg-slate-800/80 px-2 py-1 rounded-lg border border-white/5 shrink-0">
                              {m.teacher}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-2 relative z-10">
                          <div className="bg-slate-950/50 p-2.5 rounded-xl border border-white/5 flex items-center gap-2">
                            <Clock size={14} className="text-emerald-500/70" />
                            <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">
                              {m.schedule_time}
                            </span>
                          </div>
                          <div className="bg-slate-950/50 p-2.5 rounded-xl border border-white/5 flex items-center gap-2">
                            <MapPin size={14} className="text-emerald-500/70" />
                            <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest truncate">
                              {m.room || 'Non définie'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    // ─── PROFILE TAB ───
    if (activeTab === 'profile') {
      return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <UniversityHeader />
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 flex flex-col items-center gap-5 text-center mx-2 relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px] rounded-full -mr-10 -mt-10 pointer-events-none" />

            <div className="relative">
              <div className="absolute -inset-3 bg-emerald-500/20 rounded-full blur-xl opacity-40 animate-pulse" />
              <div className="absolute inset-0 rounded-full border-2 border-emerald-500/30 scale-110 animate-[spin_10s_linear_infinite] border-t-emerald-500 border-r-transparent" />
              <div className="relative w-28 h-28 rounded-full border border-emerald-500/50 p-1 bg-slate-950 z-10 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <img
                  src={
                    getPhotoUrl(student?.photo_url) ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(student?.name || '')}&background=10b981&color=000`
                  }
                  className="w-full h-full object-cover rounded-full"
                  alt="Profile"
                />
              </div>

              {/* UPLOAD BUTTON OVERLAY */}
              {!simulatedStudentId && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute bottom-0 right-0 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-slate-950 border-4 border-slate-950 hover:bg-emerald-400 transition-all active:scale-90 shadow-xl z-20 group"
                  title="Changer ma photo"
                >
                  {isUploading ? (
                    <RefreshCw size={18} className="animate-spin" />
                  ) : (
                    <ScanFace size={18} />
                  )}
                  
                  {/* Floating Tooltip */}
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Mise à jour IA
                  </div>
                </button>
              )}
            </div>

            {/* Hidden Input */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handlePhotoUpload}
            />

            <div className="space-y-1 z-10">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-none">
                {student?.name}
              </h2>
              <p className="text-emerald-500 text-[11px] font-black uppercase tracking-[0.4em]">
                {student?.code}
              </p>
            </div>
          </div>

          <div className="grid gap-3 px-2">
            {[
              {
                icon: <User size={20} />,
                label: 'Email Académique',
                value: student?.email?.toLowerCase() || 'N/A',
              },
              {
                icon: <BookOpen size={20} />,
                label: 'Filière / Département',
                value: student?.filiere || 'Informatique',
              },
              {
                icon: <Cpu size={20} />,
                label: "Groupe d'Étude",
                value: student?.group || 'Groupe 2',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-900 p-5 rounded-[1.5rem] border border-slate-800 flex items-center gap-5 transition-all hover:border-emerald-500/40 group shadow-lg"
              >
                <div className="w-12 h-12 rounded-[1rem] bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all">
                  {item.icon}
                </div>
                <div className="text-left flex-1">
                  <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.3em]">
                    {item.label}
                  </p>
                  <p className="text-[14px] font-black text-white mt-0.5 tracking-tight break-all">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {!simulatedStudentId && (
            <div className="px-2 pt-4 pb-6">
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-3 p-5 rounded-[1.5rem] bg-gradient-to-r from-red-500/5 to-red-500/10 border border-red-500/20 text-red-400 font-black uppercase text-[11px] tracking-[0.3em] transition-all hover:from-red-500/10 hover:to-red-500/20 hover:scale-[1.02]"
              >
                <LogOut size={18} />
                Déconnecter la session
              </button>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <StudentLayout onLogout={onLogout} activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="max-w-md mx-auto pb-20 px-4">{renderContent()}</div>
    </StudentLayout>
  );
}
