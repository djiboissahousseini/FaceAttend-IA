import { useEffect, useState, useRef } from 'react';
import {
  Search,
  Plus,
  UserCheck,
  UserX,
  X,
  Upload,
  ChevronDown,
  Camera,
  Loader2,
  Trash2,
} from 'lucide-react';
import { Student, Department } from '../types';

const API = 'http://localhost:8000';

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterGroup, setFilterGroup] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    student_code: '',
    full_name: '',
    email: '',
    department_id: '',
    group_name: '',
    photo_url: '',
    enrolled_at: new Date().toISOString().split('T')[0],
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [studentsRes, deptsRes] = await Promise.all([
      fetch(`${API}/api/students`).then((r) => r.json()),
      fetch(`${API}/api/departments`).then((r) => r.json()),
    ]);
    setStudents(studentsRes ?? []);
    setDepartments(deptsRes ?? []);
    setLoading(false);
  }

  const filtered = students.filter((s) => {
    const matchSearch =
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.student_code.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchDept = !filterDept || s.department_id === filterDept;
    const matchGroup = filterGroup === 'ALL' || s.group_name === filterGroup;
    return matchSearch && matchDept && matchGroup;
  });

  const groups = ['ALL', ...new Set(students.map((s) => s.group_name).filter(Boolean))].sort();

  function handleEdit(student: Student) {
    setForm({
      student_code: student.student_code,
      full_name: student.full_name,
      email: student.email,
      department_id: student.department_id || '',
      group_name: student.group_name || '',
      photo_url: student.photo_url || '',
      enrolled_at: new Date(student.enrolled_at).toISOString().split('T')[0],
    });
    setEditingId(student.id);
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.full_name || !form.email || !form.student_code) return;
    setSaving(true);
    setSaveError(null);

    const url = editingId ? `${API}/api/students/${editingId}` : `${API}/api/students`;
    const method = editingId ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method: method,
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
      student_code: '',
      full_name: '',
      email: '',
      department_id: '',
      group_name: '',
      photo_url: '',
      enrolled_at: new Date().toISOString().split('T')[0],
    });
    fetchData();
  }

  async function toggleActive(id: string, current: boolean) {
    await fetch(`${API}/api/students/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !current }),
    });
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, is_active: !current } : s)));
  }

  async function deleteStudent(id: string, name: string) {
    try {
      console.log('Envoi de la requête DELETE pour:', name);
      const res = await fetch(`${API}/api/students/${id}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        setStudents((prev) => prev.filter((s) => s.id !== id));
        setDeletingId(null);
      } else {
        const errorText = await res.text();
        alert(`Erreur serveur (${res.status}): ${errorText}`);
      }
    } catch (err) {
      alert("Erreur de connexion au backend. Vérifiez qu'il est lancé sur le port 8000.");
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setSaveError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error("Erreur lors de l'upload");

      const data = await res.json();
      setForm({ ...form, photo_url: data.url });
    } catch (err) {
      setSaveError("Impossible d'uploader la photo. Vérifiez que le backend est lancé.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un étudiant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
          />
        </div>
        <div className="relative">
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-slate-700"
          >
            <option value="">Tous les départements</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-colors shrink-0"
        >
          <Plus size={16} />
          Ajouter
        </button>
      </div>

      {/* Group Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {groups.map((group) => (
          <button
            key={group}
            onClick={() => setFilterGroup(group || 'ALL')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              filterGroup === group
                ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
            }`}
          >
            {group === 'ALL' ? 'Tous les Groupes' : `Groupe ${group}`}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Liste des Étudiants</h3>
          <span className="text-slate-500 text-sm">
            {filtered.length} étudiant{filtered.length > 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Search size={36} className="mb-3 opacity-30" />
            <p className="text-sm">Aucun étudiant trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                    Étudiant
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3 hidden md:table-cell">
                    Code
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3 hidden lg:table-cell">
                    Groupe
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3 hidden lg:table-cell">
                    Inscription
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                    Statut
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                    IA
                  </th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <img
                            src={
                              student.photo_url ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(student.full_name)}&background=3b82f6&color=fff&size=40`
                            }
                            alt={student.full_name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                          />
                          {student.face_encoding && (
                            <span
                              className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"
                              title="Encodage facial enregistré"
                            />
                          )}
                        </div>
                        <div>
                          <p className="text-slate-800 font-medium text-sm">{student.full_name}</p>
                          <p className="text-slate-400 text-xs">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
                        {student.student_code}
                      </span>
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell">
                      <span className="text-slate-600 text-sm">{student.group_name ?? '—'}</span>
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell">
                      <span className="text-slate-500 text-sm">
                        {new Date(student.enrolled_at).toLocaleDateString('fr-FR')}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${student.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                      >
                        {student.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${student.face_encoding ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}
                      >
                        {student.face_encoding ? 'Enregistré' : 'Non enregistré'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {deletingId === student.id ? (
                          <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-100">
                            <button
                              onClick={() => deleteStudent(student.id, student.full_name)}
                              className="px-2 py-1 bg-red-500 text-white text-[10px] font-bold rounded hover:bg-red-600 transition-colors"
                            >
                              CONFIRMER
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="px-2 py-1 bg-white text-slate-500 text-[10px] font-bold rounded border border-slate-200 hover:bg-slate-50 transition-colors"
                            >
                              ANNULER
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(student)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-blue-500"
                              title="Modifier / Ajouter Photo"
                            >
                              <Camera size={16} />
                            </button>
                            <button
                              onClick={() => toggleActive(student.id, student.is_active)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
                              title={student.is_active ? 'Désactiver' : 'Activer'}
                            >
                              {student.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                            </button>
                            <button
                              onClick={() => setDeletingId(student.id)}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-500 transition-all text-red-500 hover:text-white border border-red-100"
                              title="Supprimer définitivement"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">
                {editingId ? "Modifier l'Étudiant" : 'Nouvel Étudiant'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
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
                    Code Étudiant *
                  </label>
                  <input
                    type="text"
                    value={form.student_code}
                    onChange={(e) => setForm({ ...form, student_code: e.target.value })}
                    placeholder="STU-0001"
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                  />
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
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Nom Complet *
                </label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Prénom Nom"
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="etudiant@univ.dz"
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Groupe</label>
                <input
                  type="text"
                  value={form.group_name}
                  onChange={(e) => setForm({ ...form, group_name: e.target.value })}
                  placeholder="ex: G1, G2, etc."
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Photo de l'Étudiant
                </label>
                <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 border-dashed rounded-2xl">
                  {form.photo_url ? (
                    <div className="relative group overflow-hidden rounded-xl border-2 border-white shadow-sm">
                      <img src={form.photo_url} alt="Preview" className="w-20 h-20 object-cover" />
                      <button
                        onClick={() => setForm({ ...form, photo_url: '' })}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={20} className="text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-slate-100 rounded-xl flex items-center justify-center text-slate-300">
                      {uploading ? (
                        <Loader2 size={24} className="animate-spin" />
                      ) : (
                        <Camera size={24} />
                      )}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 mb-2">
                      Choisissez une photo claire du visage pour la reconnaissance faciale.
                    </p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                      {uploading ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Upload size={13} />
                      )}
                      {form.photo_url ? 'Changer la photo' : 'Choisir une photo'}
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Date d'Inscription
                </label>
                <input
                  type="date"
                  value={form.enrolled_at}
                  onChange={(e) => setForm({ ...form, enrolled_at: e.target.value })}
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
                  onClick={() => {
                    setShowModal(false);
                    setEditingId(null);
                  }}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.full_name || !form.email || !form.student_code}
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
