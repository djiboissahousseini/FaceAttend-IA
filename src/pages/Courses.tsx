import { useEffect, useState } from 'react';
import {
  Search,
  Plus,
  BookOpen,
  Clock,
  MapPin,
  Users,
  X,
  ChevronDown,
  GraduationCap,
} from 'lucide-react';
import { Course, Department, Teacher } from '../types';

const API = 'http://localhost:8000';

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [enrollCounts, setEnrollCounts] = useState<Record<string, number>>({});
  const [form, setForm] = useState({
    course_code: '',
    name: '',
    teacher_name: '',
    department_id: '',
    semester: 'S1',
    schedule_day: '',
    schedule_time: '',
    room: '',
    group_name: 'ALL',
    absence_threshold: 5,
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [coursesRes, deptsRes, countsRes, teachersRes] = await Promise.all([
        fetch(`${API}/api/courses`).then(async (r) => {
          if (!r.ok) throw new Error('Erreur API');
          return r.json();
        }),
        fetch(`${API}/api/departments`).then(async (r) => {
          if (!r.ok) throw new Error('Erreur API');
          return r.json();
        }),
        fetch(`${API}/api/enrollments/counts`).then(async (r) => {
          if (!r.ok) throw new Error('Erreur API');
          return r.json();
        }),
        fetch(`${API}/api/teachers`).then(async (r) => {
          if (!r.ok) throw new Error('Erreur API');
          return r.json();
        }),
      ]);
      setCourses(coursesRes ?? []);
      setDepartments(deptsRes ?? []);
      setEnrollCounts(countsRes ?? {});
      setTeachers(teachersRes ?? []);
    } catch (e) {
      setError('Impossible de charger les cours ou départements.');
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(course: Course) {
    setForm({
      course_code: course.course_code,
      name: course.name,
      teacher_name: course.teacher_name,
      department_id: course.department_id || '',
      semester: course.semester,
      schedule_day: course.schedule_day,
      schedule_time: course.schedule_time,
      room: course.room,
      group_name: course.group_name || 'ALL',
      absence_threshold: course.absence_threshold,
    });
    setEditingId(course.id);
    setShowModal(true);
  }

  const filtered = courses.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.course_code.toLowerCase().includes(search.toLowerCase()) ||
      c.teacher_name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSave() {
    if (!form.name || !form.course_code || !form.teacher_name) return;
    setSaving(true);
    setSaveError(null);
    const res = await fetch(`${API}/api/courses${editingId ? `/${editingId}` : ''}`, {
      method: editingId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, department_id: form.department_id || null }),
    });
    setSaving(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setSaveError(`Erreur: ${err.detail ?? res.statusText}`);
      return;
    }
    setShowModal(false);
    setEditingId(null);
    setForm({
      course_code: '',
      name: '',
      teacher_name: '',
      department_id: '',
      semester: 'S1',
      schedule_day: '',
      schedule_time: '',
      room: '',
      group_name: 'ALL',
      absence_threshold: 5,
    });
    fetchData();
  }

  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const semesters = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'];

  const deptColors: Record<string, string> = {
    INFO: 'bg-blue-100 text-blue-700',
    MATH: 'bg-emerald-100 text-emerald-700',
    PHYS: 'bg-amber-100 text-amber-700',
    LSH: 'bg-rose-100 text-rose-700',
    ECO: 'bg-cyan-100 text-cyan-700',
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un cours..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
          />
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-colors shrink-0"
        >
          <Plus size={16} />
          Ajouter Cours
        </button>
      </div>

      {error ? (
        <div className="flex items-center justify-center py-16 text-red-600">{error}</div>
      ) : loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((course) => {
            const deptCode = (course.departments as { code?: string })?.code ?? '';
            return (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-blue-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <BookOpen size={18} className="text-blue-500" />
                    </div>
                    <div>
                      <p className="text-slate-800 font-semibold text-sm leading-tight">
                        {course.name}
                      </p>
                      <p className="text-slate-400 text-xs font-mono mt-0.5">
                        {course.course_code}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${deptColors[deptCode] ?? 'bg-slate-100 text-slate-600'}`}
                    >
                      {course.semester}
                    </span>
                    <button
                      onClick={() => handleEdit(course)}
                      className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all"
                    >
                      <Clock size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-slate-500">
                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <Users size={10} className="text-slate-500" />
                    </div>
                    <span className="text-xs">{course.teacher_name}</span>
                  </div>
                  {course.schedule_day && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <Clock size={10} className="text-slate-500" />
                      </div>
                      <span className="text-xs">
                        {course.schedule_day} · {course.schedule_time}
                      </span>
                    </div>
                  )}
                  {course.room && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <MapPin size={10} className="text-slate-500" />
                      </div>
                      <span className="text-xs">
                        {course.room}{' '}
                        {course.group_name !== 'ALL' && `· Groupe ${course.group_name}`}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Users size={13} className="text-slate-400" />
                    <span className="text-slate-500 text-xs">
                      {enrollCounts[course.id] ?? 0} étudiants
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 text-xs">Seuil:</span>
                    <span className="bg-red-50 text-red-600 text-xs font-semibold px-1.5 py-0.5 rounded-md">
                      {course.absence_threshold}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
              <h3 className="font-semibold text-slate-800">
                {editingId ? 'Modifier le Cours' : 'Nouveau Cours'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                  setForm({
                    course_code: '',
                    name: '',
                    teacher_name: '',
                    department_id: '',
                    semester: 'S1',
                    schedule_day: '',
                    schedule_time: '',
                    room: '',
                    group_name: 'ALL',
                    absence_threshold: 5,
                  });
                }}
                className="p-1.5 hover:bg-slate-100 rounded-lg"
              >
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Code Cours *
                  </label>
                  <input
                    type="text"
                    value={form.course_code}
                    onChange={(e) => setForm({ ...form, course_code: e.target.value })}
                    placeholder="INFO301"
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Semestre
                  </label>
                  <div className="relative">
                    <select
                      value={form.semester}
                      onChange={(e) => setForm({ ...form, semester: e.target.value })}
                      className="w-full appearance-none px-3 pr-8 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                    >
                      {semesters.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Nom du Cours *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Algorithmes et Structures de Données"
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Enseignant *
                </label>
                <div className="relative">
                  <select
                    value={form.teacher_name}
                    onChange={(e) => setForm({ ...form, teacher_name: e.target.value })}
                    className="w-full appearance-none px-3 pr-8 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-white"
                  >
                    <option value="">Sélectionner un enseignant...</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Département
                </label>
                <select
                  value={form.department_id}
                  onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                >
                  <option value="">Sélectionner...</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Jour</label>
                  <select
                    value={form.schedule_day}
                    onChange={(e) => setForm({ ...form, schedule_day: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                  >
                    <option value="">Sélectionner...</option>
                    {days.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Horaire</label>
                  <input
                    type="text"
                    value={form.schedule_time}
                    onChange={(e) => setForm({ ...form, schedule_time: e.target.value })}
                    placeholder="08:00-10:00"
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Salle</label>
                  <input
                    type="text"
                    value={form.room}
                    onChange={(e) => setForm({ ...form, room: e.target.value })}
                    placeholder="Salle A101"
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Groupe</label>
                  <select
                    value={form.group_name}
                    onChange={(e) => setForm({ ...form, group_name: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                  >
                    <option value="ALL">Tous les Groupes (Amphi)</option>
                    <option value="01">Groupe 01</option>
                    <option value="02">Groupe 02</option>
                    <option value="03">Groupe 03</option>
                    <option value="04">Groupe 04</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Seuil Absences
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={form.absence_threshold}
                  onChange={(e) =>
                    setForm({ ...form, absence_threshold: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                />
              </div>
            </div>
            <div className="flex flex-col gap-3 px-6 py-4 border-t border-slate-100">
              {saveError && (
                <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{saveError}</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.name || !form.course_code || !form.teacher_name}
                  className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
