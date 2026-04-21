import { useEffect, useState, useRef } from 'react';
import { Search, Plus, X, Upload, Camera, Loader2, Trash2, Mail, User, Key } from 'lucide-react';
import { Teacher } from '../types';

const API = 'http://localhost:8000';

export default function Teachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    photo_url: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTeachers();
  }, []);

  async function fetchTeachers() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/teachers`);
      const data = await res.json();
      setTeachers(data ?? []);
    } catch (err) {
      console.error("Erreur lors de la récupération des enseignants:", err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = teachers.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase())
  );

  function handleEdit(teacher: Teacher) {
    setForm({
      name: teacher.name,
      email: teacher.email,
      password: '', // On ne récupère pas le mot de passe actuel pour sécurité
      photo_url: teacher.photo_url || '',
    });
    setEditingId(teacher.id);
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name || !form.email) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`${API}/api/teachers${editingId !== null ? `/${editingId}` : ''}`, {
        method: editingId !== null ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? "Erreur lors de l'enregistrement");
      }

      setShowModal(false);
      setEditingId(null);
      setForm({ name: '', email: '', password: '', photo_url: '' });
      fetchTeachers();
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // Note: Il n'y a pas d'endpoint DELETE /api/teachers dans le backend actuel
  // Je vais ajouter un message d'information ou omettre la fonction si non supportée
  async function deleteTeacher(id: number) {
     alert("La suppression des enseignants n'est pas encore implémentée dans le backend.");
     setDeletingId(null);
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
            placeholder="Rechercher un enseignant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
          />
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shrink-0"
        >
          <Plus size={16} />
          Ajouter un Enseignant
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Corps Enseignant</h3>
          <span className="text-slate-500 text-sm">
            {filtered.length} enseignant{filtered.length > 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 size={24} className="animate-spin text-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <User size={36} className="mb-3 opacity-30" />
            <p className="text-sm">Aucun enseignant trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                    Enseignant
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                    Contact
                  </th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            teacher.photo_url ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.name)}&background=0f172a&color=fff&size=40`
                          }
                          alt={teacher.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                        <div>
                          <p className="text-slate-800 font-medium text-sm">{teacher.name}</p>
                          <p className="text-slate-400 text-xs">ID: {teacher.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-slate-600 text-sm">
                        <Mail size={14} className="text-slate-400" />
                        {teacher.email}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {deletingId === teacher.id ? (
                           <div className="flex items-center gap-2">
                              <button 
                                onClick={() => deleteTeacher(teacher.id)}
                                className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                              >
                                Confirmer
                              </button>
                              <button 
                                onClick={() => setDeletingId(null)}
                                className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded hover:bg-slate-300"
                              >
                                Annuler
                              </button>
                           </div>
                        ) : (
                          <button
                            onClick={() => setDeletingId(teacher.id)}
                            className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(teacher)}
                          className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white transition-all"
                          title="Modifier Identifiants & Profil"
                        >
                          <Key size={16} />
                        </button>
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-white/20">
            <div className="flex items-center justify-between px-6 py-5 bg-slate-900 text-white">
              <div>
                <h3 className="font-bold text-lg">{editingId ? 'Modifier Enseignant' : 'Nouvel Enseignant'}</h3>
                <p className="text-slate-400 text-xs">
                  {editingId ? 'Mettre à jour les informations et la photo' : 'Ajouter un membre au corps enseignant'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                  setForm({ name: '', email: '', password: '', photo_url: '' });
                }}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                    Nom Complet
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Prénom Nom"
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                    Adresse Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="enseignant@univ.dz"
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                    Code PIN (Caméra) / Mot de passe {editingId && '(Laisser vide pour ignorer)'}
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                  Photo de l'Enseignant
                </label>
                <div className="flex items-center gap-5 p-4 bg-slate-50 border border-slate-200 border-dashed rounded-3xl">
                  {form.photo_url ? (
                    <div className="relative group overflow-hidden rounded-2xl border-4 border-white shadow-md">
                      <img
                        src={form.photo_url}
                        alt="Preview"
                        className="w-24 h-24 object-cover"
                      />
                      <button
                        onClick={() => setForm({ ...form, photo_url: '' })}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={24} className="text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center text-slate-300 shadow-sm border border-slate-100">
                      {uploading ? <Loader2 size={32} className="animate-spin text-blue-500" /> : <Camera size={32} />}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                      Utilisez une photo nette de face pour permettre l'authentification lors de l'ouverture des sessions.
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
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
                    >
                      {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                      {form.photo_url ? 'Changer' : 'Téléverser'}
                    </button>
                  </div>
                </div>
              </div>

              {saveError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-medium">
                  {saveError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3.5 border border-slate-200 text-slate-600 text-sm font-bold rounded-2xl hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.name || !form.email}
                  className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold rounded-2xl transition-all shadow-lg shadow-blue-500/25 active:scale-95"
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
