import React, { useState, useEffect } from 'react';
const API = 'http://localhost:8000';
import { Mail, ShieldCheck, Zap, ArrowRight, GraduationCap, Fingerprint, Eye, EyeOff } from 'lucide-react';
import { logger } from '../utils/logger';

interface StudentLoginProps {
  onLogin: (student: any) => void;
}

export default function StudentLogin({ onLogin }: StudentLoginProps) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showCode, setShowCode] = useState(false);


  useEffect(() => {
    document.title = "FaceAttend | Login Étudiant";
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    logger.info(`Tentative de connexion: ${email}`, 'STUDENT_PORTAL');

    try {
      const res = await fetch(`${API}/api/student/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, student_code: code })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Identifiants incorrects');
      }

      const student = await res.json();
      logger.info(`Connexion réussie pour l'étudiant ID: ${student.id}`, 'STUDENT_PORTAL');
      localStorage.setItem('faceattend_student', JSON.stringify(student));
      onLogin(student);
    } catch (err: any) {
      logger.error(`Échec de connexion (${email}): ${err.message}`, 'STUDENT_PORTAL');
      setError(err.message);
      setLoading(false);
    }
  };

  // ─── THEME DEFINITIONS (Emerald Clone of Admin) ──────────────────────────
  const theme = {
    container: 'bg-[#020617]',
    card: 'bg-[#0b1219] border-slate-800 shadow-2xl',
    accentText: 'text-emerald-500',
    accentBg: 'bg-emerald-500',
    accentHover: 'hover:bg-emerald-400',
    glowBg: 'from-emerald-500 to-blue-600',
    blob1: 'bg-emerald-500/5',
    blob2: 'bg-blue-500/5',
    inputFocus: 'focus:ring-emerald-500/30 focus:border-emerald-500',
    iconColor: 'text-emerald-500',
    gridLines: 'linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)',
    buttonText: 'text-slate-950',
    title: 'Portrait Étudiant',
    subtitle: 'Accès Portail Académique',
    iconBg: 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
  };

  return (
    <div className={`min-h-screen ${theme.container} flex items-center justify-center p-4 font-sans selection:bg-white/20 relative overflow-hidden`}>

      {/* ─── BACKGROUND EFFECTS ─── */}
      <div className="absolute inset-0 pointer-events-none transition-opacity duration-1000">
        <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] ${theme.blob1} blur-[140px] rounded-full`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] ${theme.blob2} blur-[140px] rounded-full`} />
        <div
          className="absolute inset-0 transition-all duration-1000"
          style={{ backgroundImage: theme.gridLines, backgroundSize: '40px 40px', opacity: 0.3 }}
        />
      </div>

      <div className="w-full max-w-md relative animate-in fade-in zoom-in-95 duration-700 ease-out z-10">
        {/* Glow behind card */}
        <div className={`absolute -inset-1 bg-gradient-to-r ${theme.glowBg} rounded-[2rem] blur-lg opacity-20`}></div>

        <div className={`relative ${theme.card} border rounded-3xl p-8`}>

          {/* ─── HEADER ─── */}
          <div className="flex flex-col items-center mb-8 animate-in slide-in-from-top-4 fade-in duration-700 delay-100 fill-mode-both">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center border mb-5 transition-all duration-700 ${theme.iconBg}`}>
              <GraduationCap size={40} className={theme.iconColor} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight text-center">
              {theme.title}
            </h1>
            <p className="text-slate-400 text-sm mt-1.5 font-medium tracking-wide">{theme.subtitle}</p>
          </div>

          {/* ─── FORM ─── */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="animate-in slide-in-from-bottom-4 fade-in duration-700 delay-300 fill-mode-both">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 pl-1">
                Email Professionnel
              </label>
              <div className="relative group">
                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:${theme.accentText} transition-colors duration-300`}>
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`block w-full pl-11 pr-4 py-3.5 bg-black/40 border border-slate-700/50 text-white rounded-xl ${theme.inputFocus} transition-all duration-300 placeholder:text-slate-600 outline-none`}
                  placeholder="prenom.nom@student.univ.dz"
                  required
                />
              </div>
            </div>

            <div className="animate-in slide-in-from-bottom-4 fade-in duration-700 delay-400 fill-mode-both">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 pl-1">
                Code Étudiant (Matricule)
              </label>
              <div className="relative group">
                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:${theme.accentText} transition-colors duration-300`}>
                  <Fingerprint size={18} />
                </div>
                <input
                  type={showCode ? "text" : "password"}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className={`block w-full pl-11 pr-12 py-3.5 bg-black/40 border border-slate-700/50 text-white rounded-xl ${theme.inputFocus} transition-all duration-300 placeholder:text-slate-600 outline-none tracking-widest`}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white transition-colors"
                >
                  {showCode ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="animate-in slide-in-from-bottom-2 fade-in duration-300 fill-mode-both bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3.5 rounded-xl flex items-center gap-2 animate-shake">
                <Zap size={16} fill="currentColor" className="shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-2 ${theme.accentBg} ${theme.accentHover} ${theme.buttonText} font-bold py-4 px-4 rounded-xl transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group overflow-hidden relative shadow-lg animate-in slide-in-from-bottom-4 fade-in delay-500 fill-mode-both`}
            >
              <span className="relative z-10 flex items-center gap-2 text-[15px] tracking-wide">
                {loading ? 'Vérification...' : 'Authentification'}
                {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
              </span>
              {/* Shine effect */}
              <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-700/50 text-center animate-in fade-in duration-700 delay-700 fill-mode-both">
            <p className="text-slate-500 text-xs font-medium">
              Système sécurisé par reconnaissance faciale
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
        @keyframes shine {
          100% { left: 200%; }
        }
        .animate-shine {
          animation: shine 1.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
