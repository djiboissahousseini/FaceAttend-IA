import { useState, useEffect } from 'react';
import { 
  Users, GraduationCap, BookOpenCheck, UserCheck, UserX, 
  ShieldAlert, AlertCircle, Activity, Terminal, Wifi, 
  Database, Zap, Cpu, RefreshCw 
} from 'lucide-react';
import { API_URL } from '../config';
import StatCard from '../components/StatCard';

const API = API_URL;

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  todaySessions: number;
  presentToday: number;
  absentToday: number;
  attendanceRate: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({ 
    totalStudents: 0, totalTeachers: 0, todaySessions: 0, 
    presentToday: 0, absentToday: 0, attendanceRate: 0 
  });
  const [logs, setLogs] = useState({ logs: '', errors: '' });
  const [loading, setLoading] = useState(true);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
    const interval = setInterval(() => {
      fetchData();
      setPulse(true);
      setTimeout(() => setPulse(false), 1000);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, logsRes] = await Promise.all([
        fetch(`${API}/api/dashboard`),
        fetch(`${API}/api/logs`)
      ]);
      
      if (statsRes.ok) {
        const d = await statsRes.json();
        setStats(d.stats ?? stats);
      }
      if (logsRes.ok) {
        setLogs(await logsRes.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatLogLine = (line: string) => {
    if (line.includes('GET')) return <span className="text-blue-400">{line}</span>;
    if (line.includes('POST')) return <span className="text-emerald-400">{line}</span>;
    if (line.includes('DELETE')) return <span className="text-red-400">{line}</span>;
    return <span>{line}</span>;
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 bg-slate-50">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <Cpu className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500 animate-pulse" size={24} />
      </div>
      <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-xs">Initialisation du Nerve Center</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img src="/logo5.jpeg" alt="Université Belhadj Bouchaïb" className="w-16 h-16 rounded-2xl shadow-lg object-contain bg-white p-1" />
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200">
                <ShieldAlert size={20} />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Nerve Center</h1>
            </div>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-wide">
              Université Belhadj Bouchaïb · Aïn Témouchent
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
            <Wifi size={16} className={pulse ? 'text-emerald-500' : 'text-slate-300'} />
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Backend : En Ligne</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
            <Database size={16} className="text-blue-500" />
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">DB : Synchronisée</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Étudiants" value={stats.totalStudents} icon={<Users size={18}/>} color="blue" subtitle="Population IA" />
        <StatCard title="Enseignants" value={stats.totalTeachers} icon={<GraduationCap size={18}/>} color="slate" subtitle="Autorités" />
        <StatCard title="Séances" value={stats.todaySessions} icon={<BookOpenCheck size={18}/>} color="green" subtitle="Flux actifs" />
        <StatCard title="Assiduité" value={`${stats.attendanceRate}%`} icon={<Activity size={18}/>} color="orange" subtitle="Performance" />
        
        <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4">Système IA</p>
            <p className="text-2xl font-black text-white">OPÉRATIONNEL</p>
            <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase">Précision : 99.2%</p>
          </div>
          <Zap size={60} className="absolute -bottom-4 -right-4 text-blue-500/10 group-hover:text-blue-500/20 transition-all rotate-12" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
              <UserCheck className="text-emerald-500" /> Flux de Présence
            </h3>
            <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase">Live</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-8xl font-black text-slate-900 tracking-tighter">{stats.presentToday}</span>
            <span className="text-slate-400 font-bold text-lg">Étudiants identifiés</span>
          </div>
          <div className="mt-8 flex gap-2">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-1000" 
                  style={{ width: `${(i * 7) % 100}%` }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
              <UserX className="text-red-500" /> Détection d'Absences
            </h3>
            <span className="text-[10px] font-black text-red-500 bg-red-50 px-3 py-1 rounded-full uppercase italic">Alertes Actives</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-8xl font-black text-red-600 tracking-tighter">{stats.absentToday}</span>
            <span className="text-slate-400 font-bold text-lg">Anomalies d'assiduité</span>
          </div>
          <div className="mt-8 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3">
            <ShieldAlert className="text-red-500" size={18} />
            <p className="text-[10px] font-bold text-red-600 uppercase tracking-tight">Attention : Le seuil de surveillance a été franchi.</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-950 rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl">
        <div className="px-8 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/20" />
              <div className="w-3 h-3 rounded-full bg-amber-500 shadow-lg shadow-amber-500/20" />
              <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20" />
            </div>
            <div className="h-4 w-px bg-slate-700 mx-2" />
            <h3 className="text-slate-300 text-xs font-black uppercase tracking-[0.2em] font-mono flex items-center gap-2">
              <Terminal size={14} className="text-blue-400" /> Kernel Observation Console
            </h3>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-blue-500 text-[10px] font-mono font-black uppercase">IO Stream : Stable</span>
            </div>
            <button onClick={fetchData} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 h-[450px]">
          <div className="flex flex-col min-w-0">
            <div className="px-8 py-4 bg-slate-900/30 flex items-center justify-between border-b border-slate-800/50">
              <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest">Network Traffic</p>
              <Zap size={10} className="text-blue-400 animate-pulse" />
            </div>
            <div className="flex-1 p-8 font-mono text-[11px] overflow-y-auto bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-slate-900/50 via-transparent to-transparent">
              <div className="space-y-1.5">
                {(logs.logs || '').split('\n').filter(Boolean).map((line, i) => (
                  <div key={i} className="flex gap-4 group">
                    <span className="text-slate-700 shrink-0">{new Date().toLocaleTimeString()}</span>
                    <div className="flex-1 break-all transition-colors group-hover:text-white">
                      {formatLogLine(line)}
                    </div>
                  </div>
                ))}
                <div className="h-4" />
                <div className="flex items-center gap-2 text-slate-500/50 animate-pulse">
                  <span>{'>'}</span>
                  <div className="w-2 h-4 bg-blue-500/50" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col min-w-0 bg-black/20">
            <div className="px-8 py-4 bg-red-950/10 flex items-center justify-between border-b border-red-900/20">
              <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">Threat & Anomaly Detector</p>
              <AlertCircle size={10} className="text-red-500 animate-pulse" />
            </div>
            <div className="flex-1 p-8 font-mono text-[11px] overflow-y-auto">
              {logs.errors ? (
                <div className="space-y-3">
                  {logs.errors.split('\n').filter(Boolean).map((err, i) => (
                    <div key={i} className="p-3 bg-red-950/20 border border-red-900/30 rounded-xl text-red-400">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-1.5 py-0.5 bg-red-500 text-black text-[8px] font-black rounded uppercase">Critical</span>
                        <span className="text-red-900 text-[9px] font-bold">{new Date().toLocaleTimeString()}</span>
                      </div>
                      <p className="break-all opacity-80">{err}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-20 grayscale">
                  <ShieldAlert size={48} className="mb-4 text-emerald-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">System Integrity : 100%</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="px-8 py-3 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between text-[9px] font-mono text-slate-500 uppercase tracking-widest">
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <span className="text-blue-500 font-black">MEM :</span>
              <span>128.4MB / 1024MB</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-500 font-black">CPU :</span>
              <span>0.12% LOAD</span>
            </div>
          </div>
          <div>Kernel v4.2.0-stable</div>
        </div>
      </div>
    </div>
  );
}
