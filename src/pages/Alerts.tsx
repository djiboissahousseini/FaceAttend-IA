import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Bell, Filter, Search, ChevronDown } from 'lucide-react';
import { AbsenceAlert } from '../types';

const API = 'http://localhost:8000';

export default function Alerts() {
  const [alerts, setAlerts] = useState<AbsenceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'acknowledged' | 'resolved'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAlerts();
  }, []);

  async function fetchAlerts() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/alerts`);
      if (!res.ok) throw new Error('Erreur API');
      const data = await res.json();
      setAlerts(data ?? []);
    } catch (_e) {
      setError('Impossible de charger les alertes.');
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: 'acknowledged' | 'resolved') {
    const resolved_at = status === 'resolved' ? new Date().toISOString() : null;
    await fetch(`${API}/api/alerts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, resolved_at }),
    });
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status, resolved_at: resolved_at ?? a.resolved_at } : a
      )
    );
  }

  const filtered = alerts.filter((a) => {
    const matchStatus = filter === 'all' || a.status === filter;
    const studentName = (a.students as { full_name?: string })?.full_name ?? '';
    const courseName = (a.courses as { name?: string })?.name ?? '';
    const matchSearch =
      studentName.toLowerCase().includes(search.toLowerCase()) ||
      courseName.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const counts = {
    all: alerts.length,
    active: alerts.filter((a) => a.status === 'active').length,
    acknowledged: alerts.filter((a) => a.status === 'acknowledged').length,
    resolved: alerts.filter((a) => a.status === 'resolved').length,
  };

  const severityColor = (count: number, threshold: number) => {
    const ratio = count / threshold;
    if (ratio >= 2)
      return {
        bar: 'bg-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
        badge: 'bg-red-600 text-white',
        label: 'Critique',
      };
    if (ratio >= 1.5)
      return {
        bar: 'bg-orange-500',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        badge: 'bg-orange-500 text-white',
        label: 'Élevé',
      };
    return {
      bar: 'bg-amber-400',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      badge: 'bg-amber-400 text-white',
      label: 'Modéré',
    };
  };

  if (error) {
    return <div className="flex items-center justify-center h-64 text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher étudiant ou cours..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
          />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={filter}
            onChange={(e) =>
              setFilter(e.target.value as 'all' | 'active' | 'acknowledged' | 'resolved')
            }
            className="appearance-none pl-8 pr-8 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-slate-700"
          >
            <option value="all">Toutes ({counts.all})</option>
            <option value="active">Actives ({counts.active})</option>
            <option value="acknowledged">Reconnues ({counts.acknowledged})</option>
            <option value="resolved">Résolues ({counts.resolved})</option>
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Alertes',
            value: counts.all,
            color: 'text-slate-700',
            bg: 'bg-slate-50 border-slate-200',
          },
          {
            label: 'Actives',
            value: counts.active,
            color: 'text-red-600',
            bg: 'bg-red-50 border-red-100',
          },
          {
            label: 'Reconnues',
            value: counts.acknowledged,
            color: 'text-amber-600',
            bg: 'bg-amber-50 border-amber-100',
          },
          {
            label: 'Résolues',
            value: counts.resolved,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50 border-emerald-100',
          },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} border rounded-2xl p-4 text-center`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center py-16 text-slate-400">
          <Bell size={40} className="mb-3 opacity-20" />
          <p className="text-sm font-medium">Aucune alerte</p>
          <p className="text-xs mt-1">Toutes les situations sont sous contrôle</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => {
            const sev = severityColor(alert.absence_count, alert.threshold);
            const student = alert.students as {
              full_name?: string;
              photo_url?: string;
              student_code?: string;
              email?: string;
              departments?: { name?: string };
            };
            const course = alert.courses as {
              name?: string;
              course_code?: string;
              teacher_name?: string;
            };
            return (
              <div
                key={alert.id}
                className={`${sev.bg} border ${sev.border} rounded-2xl p-5 transition-all`}
              >
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={
                        student?.photo_url ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(student?.full_name ?? '')}&background=ef4444&color=fff&size=48`
                      }
                      alt={student?.full_name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                    {alert.status === 'active' && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                        <AlertTriangle size={8} className="text-white" />
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-slate-800 font-semibold text-sm">
                            {student?.full_name}
                          </h3>
                          <span className="font-mono text-xs bg-white/80 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200/60">
                            {student?.student_code}
                          </span>
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${sev.badge}`}
                          >
                            {sev.label}
                          </span>
                        </div>
                        <p className="text-slate-500 text-xs mt-0.5">{student?.email}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {alert.status === 'active' && (
                          <>
                            <button
                              onClick={() => updateStatus(alert.id, 'acknowledged')}
                              className="text-xs px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                            >
                              Reconnaître
                            </button>
                            <button
                              onClick={() => updateStatus(alert.id, 'resolved')}
                              className="text-xs px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium flex items-center gap-1"
                            >
                              <CheckCircle size={12} /> Résoudre
                            </button>
                          </>
                        )}
                        {alert.status === 'acknowledged' && (
                          <button
                            onClick={() => updateStatus(alert.id, 'resolved')}
                            className="text-xs px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium flex items-center gap-1"
                          >
                            <CheckCircle size={12} /> Résoudre
                          </button>
                        )}
                        {alert.status === 'resolved' && (
                          <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-100 px-3 py-1.5 rounded-lg">
                            <CheckCircle size={12} /> Résolu
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-3">
                      <div className="flex-1 min-w-40">
                        <p className="text-slate-500 text-xs mb-1">Cours</p>
                        <p className="text-slate-700 text-sm font-medium">{course?.name}</p>
                        <p className="text-slate-400 text-xs">{course?.teacher_name}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-1">Absences</p>
                        <div className="flex items-center gap-2">
                          <span className="text-red-600 font-bold text-lg leading-none">
                            {alert.absence_count}
                          </span>
                          <span className="text-slate-400 text-xs">/ seuil {alert.threshold}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1.5">
                          {Array.from({ length: Math.min(alert.threshold + 2, 12) }).map((_, i) => (
                            <div
                              key={i}
                              className={`h-2 flex-1 rounded-full ${i < alert.absence_count ? sev.bar : 'bg-white/60'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-1">Généré le</p>
                        <p className="text-slate-700 text-sm">
                          {new Date(alert.generated_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
