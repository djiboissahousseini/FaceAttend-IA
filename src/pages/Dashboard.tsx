import { useEffect, useState } from 'react';
import { BookOpenCheck, GraduationCap, UserCheck, UserX, Users } from 'lucide-react';
import StatCard from '../components/StatCard';
import { AttendanceRecord, DashboardStats } from '../types';
const API = 'http://localhost:8000';

interface RecentRecord extends AttendanceRecord {
  student?: {
    name: string;
    matricule: string;
    photo_url?: string | null;
  };
  session?: {
    course_name: string;
  };
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    todaySessions: 0,
    presentToday: 0,
    absentToday: 0,
    attendanceRate: 0,
  });
  const [recentRecords, setRecentRecords] = useState<RecentRecord[]>([]);
  const [logs, setLogs] = useState({ logs: '', errors: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchDashboard() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/dashboard`);
      if (!res.ok) throw new Error('Erreur API');
      const data = await res.json();
      setStats(data.stats ?? stats);
      setRecentRecords(data.recentRecords ?? []);
      fetchLogs();
    } catch (e) {
      setError('Impossible de charger les statistiques.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchLogs() {
    try {
      const res = await fetch(`${API}/api/logs`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error('Log fetch error', e);
    }
  }

  const statusClasses: Record<string, string> = {
    present: 'bg-emerald-100 text-emerald-700',
    absent: 'bg-red-100 text-red-700',
    late: 'bg-amber-100 text-amber-700',
    excused: 'bg-blue-100 text-blue-700',
  };

  const statusLabels: Record<string, string> = {
    present: 'Présent',
    absent: 'Absent',
    late: 'Retard',
    excused: 'Excusé',
  };

  if (error) {
    return <div className="flex items-center justify-center h-64 text-red-600">{error}</div>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Étudiants Actifs"
          value={stats.totalStudents}
          icon={<Users size={20} />}
          color="blue"
          subtitle="Base locale"
        />
        <StatCard
          title="Enseignants"
          value={stats.totalTeachers}
          icon={<GraduationCap size={20} />}
          color="slate"
          subtitle="Tables locales"
        />
        <StatCard
          title="Sessions du Jour"
          value={stats.todaySessions}
          icon={<BookOpenCheck size={20} />}
          color="green"
          subtitle="Aujourd'hui"
        />
        <StatCard
          title="Taux de Présence"
          value={`${stats.attendanceRate}%`}
          icon={<UserCheck size={20} />}
          color="red"
          subtitle="Tous les enregistrements"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Aujourd'hui</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <UserCheck size={18} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700">{stats.presentToday}</p>
                <p className="text-xs text-emerald-600">Présents</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-100">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <UserX size={18} className="text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-700">{stats.absentToday}</p>
                <p className="text-xs text-red-600">Absents</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Activité Récente</h3>
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {recentRecords.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Aucune présence enregistrée</p>
            ) : (
              recentRecords.map((record) => (
                <div
                  key={`${record.session_id}-${record.student_id}-${record.timestamp}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-100"
                >
                  <img
                    src={
                      record.student?.photo_url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(record.student?.name ?? '')}&background=3b82f6&color=fff`
                    }
                    alt={record.student?.name ?? ''}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {record.student?.name}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {record.student?.matricule} · {record.session?.course_name}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusClasses[record.status ?? 'absent']}`}
                  >
                    {statusLabels[record.status ?? 'absent']}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ─── SYSTEM LOGS VIEWER ──────────────────────────────────────────────── */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5 mr-2">
              <div className="w-3 h-3 rounded-full bg-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-amber-500/50" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
            </div>
            <h3 className="text-white text-xs font-bold uppercase tracking-widest font-mono">
              Backend System Logs
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-500 text-[10px] font-mono font-bold">LIVE SYNC</span>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          <div className="p-4 space-y-2">
            <p className="text-slate-500 text-[10px] font-bold uppercase mb-2">
              Access Logs (STDOUT)
            </p>
            <pre className="text-emerald-400/80 text-[10px] font-mono leading-relaxed h-64 overflow-y-auto custom-scrollbar whitespace-pre-wrap">
              {logs.logs || 'En attente de données...'}
            </pre>
          </div>
          <div className="p-4 space-y-2 bg-black/20">
            <p className="text-red-500/80 text-[10px] font-bold uppercase mb-2">
              Error Logs (STDERR)
            </p>
            <pre className="text-red-400 text-[10px] font-mono leading-relaxed h-64 overflow-y-auto custom-scrollbar whitespace-pre-wrap">
              {logs.errors || 'Aucune erreur détectée.'}
            </pre>
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `,
        }}
      />
    </div>
  );
}
