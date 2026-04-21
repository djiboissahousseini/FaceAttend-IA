import React, { useEffect, useState } from 'react';
const API = 'http://localhost:8000';
import {
  TrendingUp,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Calendar,
  History,
  User,
  Cpu,
  GraduationCap,
  LogOut,
  LayoutDashboard,
  ScanFace
} from 'lucide-react';
import StudentLayout from '../components/StudentLayout';

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
  modules: Array<{ name: string; threshold: number; absences: number; presences: number }>;
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


  useEffect(() => {
    document.title = "FaceAttend | Étudiant";

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
        console.error("Parse error", e);
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
            photo_url: data.student.photo_url || data.student.photo || null
          };
          setStudent(prev => ({ ...prev, ...mappedStudent }));
        }
      }
    } catch (e) {
      console.error("Sync Error:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(16,185,129,0.3)]" />
      </div>
    );
  }

  // ─── CONSISTENT UNIVERSITY HEADER ───
  const UniversityHeader = () => (
    <div className="w-full relative bg-gradient-to-br from-slate-900 via-[#0b1219] to-slate-950 rounded-[2.5rem] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-white/5 overflow-hidden flex items-center min-h-[140px] mb-8 group transition-all duration-500 hover:border-emerald-500/20 hover:shadow-[0_20px_60px_rgba(16,185,129,0.1)]">
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -mr-32 -mt-32 transition-all duration-700 group-hover:bg-emerald-500/20" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 blur-[80px] rounded-full -ml-16 -mb-16" />
      <div className="flex items-center w-full relative z-10">
        <div className="w-20 h-20 rounded-[1.5rem] bg-white border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-[0_0_30px_rgba(255,255,255,0.05)] relative group-hover:scale-105 transition-transform duration-500">
          <img src="/logo5.jpeg" className="w-full h-full object-contain p-1.5" alt="Logo UAT" />
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
        <div className="ml-6 space-y-1">
          <div className="space-y-0">
            <h2 className="text-white font-black text-[17px] uppercase tracking-tighter leading-tight">Université Belhadj Bouchaïb</h2>
            <h3 className="text-slate-400 font-bold text-[13px] uppercase tracking-wider leading-none">Aïn Témouchent</h3>
          </div>
          <div className="flex items-center gap-2.5 pt-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)] animate-pulse" />
            <p className="text-emerald-400 text-[11px] font-black uppercase tracking-[0.3em]">Informatique</p>
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
          <UniversityHeader />

          {/* HUGE Attendance Gauge - ILLUMINATED VIEW */}
          <div className="relative flex flex-col items-center py-6 w-full">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative w-72 h-72 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-slate-800/50 scale-[1.15]" />
              <div className="absolute inset-0 rounded-full border border-dashed border-slate-700/50 scale-[1.05] animate-[spin_60s_linear_infinite]" />
              
              <svg className="w-full h-full -rotate-90 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <circle cx="144" cy="144" r="126" className="stroke-slate-900 fill-transparent" strokeWidth="14" />
                <circle
                  cx="144" cy="144" r="126" className="fill-transparent transition-all duration-2000 ease-out stroke-emerald-500"
                  strokeWidth="14" strokeDasharray="792"
                  strokeDashoffset={792 - (792 * (stats?.attendance_rate || 0)) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center mt-2">
                <p className="text-[12px] text-emerald-400/80 font-black uppercase tracking-[0.5em] mb-1">Assiduité</p>
                <span className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 tracking-tighter drop-shadow-lg">
                  {stats?.attendance_rate}%
                </span>
                <div className="w-16 h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/50 to-emerald-500/0 mt-3" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full max-w-[340px] mt-12 px-2">
              <div className="bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-3xl p-5 flex flex-col items-center justify-center gap-2 transition-all hover:bg-slate-900/80 hover:border-emerald-500/20 group">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-1 group-hover:scale-110 transition-transform">
                  <CheckCircle2 size={16} />
                </div>
                <p className="text-4xl font-black text-white">{stats?.total_presences}</p>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">Présences</p>
              </div>
              <div className="bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-3xl p-5 flex flex-col items-center justify-center gap-2 transition-all hover:bg-slate-900/80 hover:border-red-500/20 group">
                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 mb-1 group-hover:scale-110 transition-transform">
                  <XCircle size={16} />
                </div>
                <p className="text-4xl font-black text-slate-300">{stats?.total_absences}</p>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">Absences</p>
              </div>
            </div>
          </div>

          {/* Student Identity HUD - Card Style */}
          <div className="w-full pt-4 pb-8 px-2">
            <div className="bg-gradient-to-b from-slate-900/80 to-[#020617] backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 flex flex-col items-center gap-4 relative overflow-hidden">
              <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-50" />
              <h1 className="text-2xl font-black text-white uppercase tracking-tight text-center leading-tight">
                {student?.name}
              </h1>
              <div className="flex items-center gap-4 bg-black/40 px-6 py-2.5 rounded-full border border-white/5">
                <div className="flex items-center gap-2">
                  <ScanFace size={14} className="text-emerald-500" />
                  <span className="text-[12px] font-black text-emerald-400 uppercase tracking-[0.3em]">{student?.code}</span>
                </div>
                <div className="w-[1px] h-4 bg-white/20" />
                <div className="flex items-center gap-2">
                  <User size={14} className="text-slate-400" />
                  <span className="text-[12px] font-black text-slate-300 uppercase tracking-[0.3em]">G{student?.group?.replace(/\D/g, '') || '2'}</span>
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
              <h3 className="text-white font-black text-2xl uppercase tracking-tighter">Mes Modules</h3>
              <p className="text-emerald-500/60 text-[10px] font-black uppercase mt-1 tracking-[0.3em]">Suivi de présence expert</p>
            </div>
            <BookOpen className="text-emerald-500/20 mb-1" size={32} />
          </div>
          <div className="space-y-4 px-2">
            {stats?.modules.map((m, i) => {
              const rate = m.presences + m.absences > 0 ? Math.round((m.presences / (m.presences + m.absences)) * 100) : 100;
              const isWarning = rate < 80;
              return (
                <div key={i} className={`bg-slate-900/60 backdrop-blur-xl border ${isWarning ? 'border-red-500/20' : 'border-white/5 hover:border-emerald-500/20'} p-6 rounded-[2rem] space-y-4 transition-all duration-300 group`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-white uppercase tracking-tight truncate max-w-[180px]">{m.name}</span>
                    <span className={`text-2xl font-black ${isWarning ? 'text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]'}`}>{rate}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5 relative">
                    <div className="absolute inset-0 bg-slate-800/50 w-full" />
                    <div
                      className={`h-full absolute left-0 top-0 transition-all duration-1000 ${isWarning ? 'bg-red-500' : 'bg-emerald-500'} relative overflow-hidden`}
                      style={{ width: `${rate}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pt-1">
                    <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500/70" /> {m.presences} Présences</span>
                    <span className={`flex items-center gap-1.5 ${isWarning ? 'text-red-400 animate-pulse' : 'text-slate-500'}`}><AlertTriangle size={12} /> Seuil: {m.threshold}</span>
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
              <h3 className="text-white font-black text-2xl uppercase tracking-tighter">Historique Scans</h3>
              <p className="text-emerald-500/60 text-[10px] font-black uppercase mt-1 tracking-[0.3em]">Journal de bord sécurisé</p>
            </div>
            <History className="text-emerald-500/20 mb-1" size={32} />
          </div>
          <div className="space-y-3 px-2">
            {stats?.history.map((h, i) => {
              const isPresent = h.status === 'present';
              return (
                <div key={i} className={`bg-slate-900/40 border-l-4 ${isPresent ? 'border-l-emerald-500' : 'border-l-red-500'} border-y border-r border-white/5 p-4 rounded-2xl flex items-center justify-between transition-all hover:bg-slate-900/60 hover:scale-[1.01]`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPresent ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {isPresent ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[13px] font-black text-white uppercase tracking-tight truncate max-w-[150px]">{h.course_name}</p>
                      <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${isPresent ? 'text-emerald-500/70' : 'text-red-500/70'}`}>{isPresent ? 'Présence validée' : 'Absence marquée'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-black text-slate-300 uppercase tracking-tight">{new Date(h.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{new Date(h.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // ─── PROFILE TAB ───
    if (activeTab === 'profile') {
      return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <UniversityHeader />
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 flex flex-col items-center gap-5 text-center mx-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] rounded-full -mr-10 -mt-10 pointer-events-none" />
            
            <div className="relative">
              <div className="absolute -inset-3 bg-emerald-500/20 rounded-full blur-xl opacity-40 animate-pulse" />
              <div className="absolute inset-0 rounded-full border-2 border-emerald-500/30 scale-110 animate-[spin_10s_linear_infinite] border-t-emerald-500 border-r-transparent" />
              <div className="relative w-28 h-28 rounded-full border border-emerald-500/50 p-1 bg-slate-950 z-10 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <img
                  src={student?.photo_url ? (student.photo_url.startsWith('http') ? student.photo_url : `${API}${student.photo_url}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(student?.name || '')}&background=10b981&color=000`}
                  className="w-full h-full object-cover rounded-full"
                  alt="Profile"
                />
              </div>
            </div>
            <div className="space-y-1 z-10">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-none">{student?.name}</h2>
              <p className="text-emerald-500 text-[11px] font-black uppercase tracking-[0.4em]">{student?.code}</p>
            </div>
          </div>

          <div className="grid gap-3 px-2">
            {[
              { icon: <User size={20} />, label: 'Email Académique', value: student?.email || 'N/A' },
              { icon: <BookOpen size={20} />, label: 'Filière / Département', value: student?.filiere || 'Informatique' },
              { icon: <Cpu size={20} />, label: 'Groupe d\'Étude', value: student?.group || 'Groupe 2' },
            ].map((item, idx) => (
              <div key={idx} className="bg-slate-900/30 p-5 rounded-[1.5rem] border border-white/5 flex items-center gap-5 transition-all hover:bg-slate-900/60 hover:border-emerald-500/20 group">
                <div className="w-12 h-12 rounded-[1rem] bg-emerald-500/5 flex items-center justify-center text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500/10 transition-all">
                  {item.icon}
                </div>
                <div className="text-left flex-1">
                  <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.3em]">{item.label}</p>
                  <p className="text-[13px] font-black text-white uppercase mt-0.5 tracking-tight truncate">{item.value}</p>
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
    <StudentLayout
      student={student}
      onLogout={onLogout}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      <div className="max-w-md mx-auto pb-20 px-4">
        {renderContent()}
      </div>
    </StudentLayout>
  );
}
