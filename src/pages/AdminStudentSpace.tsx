import { useState, useEffect, useRef } from 'react';
import {
  Search,
  User,
  ShieldCheck,
  Activity,
  ArrowLeft,
  Check,
  AlertCircle,
  Loader2,
  ImagePlus,
  QrCode,
  X,
} from 'lucide-react';
import { Student } from '../types';
import StudentDashboard from './StudentDashboard';

import { API_URL, NETWORK_IP } from '../config';
import { getPhotoUrl } from '../utils/image';
const API = API_URL;

export default function AdminStudentSpace() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // États de modification
  const [editCode, setEditCode] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [deviceIP, setDeviceIP] = useState(NETWORK_IP);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await fetch(`${API}/api/students`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch (e) {
      console.error('Failed to fetch students', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStudent = (student: Student) => {
    setSelectedStudentId(student.id);
    setEditCode(student.student_code);
    setEditEmail(student.email);
    setStatus(null);
  };

  const handleBack = () => {
    setSelectedStudentId(null);
    fetchStudents();
  };

  const currentStudent = students.find((s) => s.id === selectedStudentId);

  const filteredStudents = students.filter(
    (s) =>
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.student_code.toLowerCase().includes(search.toLowerCase())
  );

  if (selectedStudentId && currentStudent) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {showQR && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-300">
              <button
                onClick={() => setShowQR(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors"
              >
                <X size={24} />
              </button>

              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                    <QrCode size={32} />
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    Accès Mobile
                  </h3>
                  <p className="text-slate-500 text-sm mt-1">
                    Configurez l'IP pour votre téléphone
                  </p>
                </div>

                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Adresse IP du PC
                  </label>
                  <input
                    type="text"
                    value={deviceIP}
                    onChange={(e) => setDeviceIP(e.target.value)}
                    placeholder="Ex: 192.168.43.10"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500 transition-all"
                  />
                  <p className="text-[9px] text-slate-400 italic px-1 leading-relaxed">
                    Tapez 'ipconfig' (Windows) ou 'ifconfig' (Linux) dans un terminal pour trouver
                    votre IP Wi-Fi.
                  </p>
                </div>

                <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 flex justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`http://${deviceIP}:5173/portal?email=${currentStudent.email}&code=${currentStudent.student_code}`)}`}
                    alt="QR Code"
                    className="w-48 h-48 mix-blend-multiply"
                  />
                </div>

                <div className="bg-emerald-50 p-4 rounded-2xl text-[10px] text-emerald-700 font-bold uppercase tracking-widest leading-relaxed break-all">
                  Lien Magique : Connexion Automatique Active
                </div>

                <button
                  onClick={() => setShowQR(false)}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all"
                >
                  Prêt pour le Scan
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-slate-600 hover:text-emerald-500 transition-colors font-bold uppercase text-xs tracking-widest"
          >
            <ArrowLeft size={16} /> Retour à la sélection
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQR(true)}
              className="flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-200"
            >
              <QrCode size={12} /> QR Code
            </button>
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
              <ShieldCheck size={12} /> Simulation Active : {currentStudent.full_name}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          <div className="lg:col-span-3 bg-[#020617] rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl min-h-[600px]">
            <StudentDashboard
              key={`${selectedStudentId}-${currentStudent.photo_url}`}
              onLogout={() => {}}
              simulatedStudentId={selectedStudentId}
            />
          </div>

          <div className="space-y-6 sticky top-6">
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-4 flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-500" /> Actions Admin
              </h3>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                  Code Matricule (Password)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-emerald-500 transition-all"
                  />
                  <button
                    disabled={isUpdating || editCode === currentStudent.student_code}
                    onClick={async () => {
                      console.log('Updating matricule for:', selectedStudentId, 'to:', editCode);
                      setIsUpdating(true);
                      try {
                        const res = await fetch(`${API}/api/students/${selectedStudentId}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ student_code: editCode }),
                        });
                        console.log('Response status:', res.status);
                        if (res.ok) {
                          setStatus({ type: 'success', msg: 'Matricule mis à jour' });
                          fetchStudents();
                        } else {
                          const err = await res.json();
                          console.error('Update failed:', err);
                          setStatus({ type: 'error', msg: err.detail || 'Erreur' });
                        }
                      } catch (e) {
                        console.error('Network error:', e);
                        setStatus({ type: 'error', msg: 'Erreur réseau' });
                      } finally {
                        setIsUpdating(false);
                      }
                    }}
                    className="bg-emerald-500 text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-600 transition-colors disabled:opacity-30"
                  >
                    {isUpdating ? <Loader2 size={14} className="animate-spin" /> : 'OK'}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                  Email (Identifiant)
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-emerald-500 transition-all"
                  />
                  <button
                    disabled={isUpdating || editEmail === currentStudent.email}
                    onClick={async () => {
                      console.log('Updating email for:', selectedStudentId, 'to:', editEmail);
                      setIsUpdating(true);
                      try {
                        const res = await fetch(`${API}/api/students/${selectedStudentId}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email: editEmail }),
                        });
                        console.log('Response status:', res.status);
                        if (res.ok) {
                          setStatus({ type: 'success', msg: 'Email mis à jour' });
                          fetchStudents();
                        } else {
                          const err = await res.json();
                          console.error('Update failed:', err);
                          setStatus({ type: 'error', msg: err.detail || 'Erreur' });
                        }
                      } catch (e) {
                        console.error('Network error:', e);
                        setStatus({ type: 'error', msg: 'Erreur réseau' });
                      } finally {
                        setIsUpdating(false);
                      }
                    }}
                    className="bg-emerald-500 text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-600 transition-colors disabled:opacity-30"
                  >
                    {isUpdating ? <Loader2 size={14} className="animate-spin" /> : 'OK'}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                  Photo d'Identité
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    setIsUpdating(true);
                    setStatus(null);

                    const formData = new FormData();
                    formData.append('file', file);
                    console.log('Uploading photo for:', selectedStudentId);

                    try {
                      const res = await fetch(`${API}/api/students/${selectedStudentId}/photo`, {
                        method: 'POST',
                        body: formData,
                      });
                      console.log('Upload status:', res.status);

                      if (res.ok) {
                        setStatus({ type: 'success', msg: 'Photo mise à jour !' });
                        fetchStudents();
                      } else {
                        const err = await res.json();
                        console.error('Upload failed:', err);
                        setStatus({ type: 'error', msg: err.detail || 'Erreur upload' });
                      }
                    } catch (e) {
                      console.error('Network error during upload:', e);
                      setStatus({ type: 'error', msg: 'Erreur réseau' });
                    } finally {
                      setIsUpdating(false);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }
                  }}
                />
                <button
                  disabled={isUpdating}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition-all"
                >
                  {isUpdating ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ImagePlus size={16} />
                  )}
                  Changer la photo
                </button>
              </div>

              <div className="min-h-[40px]">
                {status && (
                  <div
                    className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest p-3 rounded-xl animate-in slide-in-from-top-1 ${
                      status.type === 'success'
                        ? 'text-emerald-600 bg-emerald-50'
                        : 'text-red-600 bg-red-50'
                    }`}
                  >
                    {status.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                    {status.msg}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <button
                  onClick={async () => {
                    setIsUpdating(true);
                    try {
                      const res = await fetch(`${API}/api/students/${selectedStudentId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ is_active: !currentStudent.is_active }),
                      });
                      if (res.ok) fetchStudents();
                    } finally {
                      setIsUpdating(false);
                    }
                  }}
                  className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] border transition-all ${
                    currentStudent.is_active
                      ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
                      : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  {currentStudent.is_active ? "Bloquer l'accès" : "Débloquer l'accès"}
                </button>

                <button
                  onClick={async () => {
                    if (!confirm(`Supprimer définitivement ${currentStudent.full_name} ?`)) return;
                    const res = await fetch(`${API}/api/students/${selectedStudentId}`, {
                      method: 'DELETE',
                    });
                    if (res.ok) handleBack();
                  }}
                  className="w-full py-4 rounded-2xl bg-red-50 text-red-600 border border-red-200 font-black uppercase text-[10px] tracking-[0.2em] hover:bg-red-100 transition-all"
                >
                  Supprimer Profil
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
            Simulation Étudiant
          </h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
            Audit et vérification des comptes
          </p>
        </div>
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher un étudiant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <button
              key={student.id}
              onClick={() => handleSelectStudent(student)}
              className="group bg-white p-6 rounded-[2.2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-emerald-500/30 transition-all text-left relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-3xl group-hover:bg-emerald-500/10 transition-colors" />

              <div className="flex items-center gap-5 relative z-10">
                <div className="w-14 h-14 rounded-2xl border-2 border-slate-100 overflow-hidden bg-slate-50 shrink-0">
                  <img
                    src={
                      getPhotoUrl(student.photo_url) ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(student.full_name)}&background=10b981&color=fff`
                    }
                    alt={student.full_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-slate-900 font-black uppercase tracking-tight truncate leading-tight">
                    {student.full_name}
                  </p>
                  <p className="text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                    {student.student_code}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400 text-[9px] font-bold uppercase tracking-widest">
                  <Activity
                    size={12}
                    className={student.is_active ? 'text-emerald-500' : 'text-amber-500'}
                  />
                  {student.is_active ? 'Compte Actif' : 'Compte Bloqué'}
                </div>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                  <ShieldCheck size={18} />
                </div>
              </div>
            </button>
          ))}

          {filteredStudents.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-300">
              <User size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">
                Aucun étudiant trouvé
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
