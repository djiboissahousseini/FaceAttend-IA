import React, { useState } from 'react';
import { Lock, User, ShieldCheck, Zap, ArrowRight, Eye, EyeOff, GraduationCap } from 'lucide-react';

interface LoginProps {
  onLogin: (status: boolean) => void;
  forceRole?: 'admin' | 'teacher';
}

export default function Login({ onLogin, forceRole }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'teacher'>(forceRole || 'admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (role === 'admin') {
        // Admin: Identifiants fixes
        if (username === 'usain' && password === 'usain2002') {
          localStorage.setItem('faceattend_auth', 'true');
          localStorage.setItem('faceattend_role', 'admin');
          onLogin(true);
        } else {
          setError('Identifiants administrateur incorrects.');
          setLoading(false);
        }
      } else {
        // Enseignant: Appel API
        const res = await fetch('http://localhost:8000/api/teachers/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: username, password }),
        });

        if (res.ok) {
          const data = await res.json();
          localStorage.setItem('faceattend_auth', 'true');
          localStorage.setItem('faceattend_role', 'teacher');
          localStorage.setItem('faceattend_user', JSON.stringify(data));

          // On arrête le chargement AVANT de notifier le parent
          setLoading(false);
          onLogin(true);

          // Redirection forcée pour ouvrir le dashboard
          window.location.href = '/teacher';
        } else {
          const err = await res.json().catch(() => ({}));
          setError(err.detail || 'Email ou mot de passe incorrect.');
          setLoading(false);
        }
      }
    } catch (err) {
      setError('Erreur de connexion au serveur.');
      setLoading(false);
    }
  };

  const isTeacher = role === 'teacher';

  // ─── THEME DEFINITIONS ──────────────────────────────────────────────────────
  const theme = {
    container: isTeacher ? 'bg-[#0f172a]' : 'bg-[#050a10]',
    card: isTeacher
      ? 'bg-slate-800/60 backdrop-blur-2xl border-slate-700/50 shadow-[0_20px_40px_rgba(0,0,0,0.4)]'
      : 'bg-[#0b1219] border-slate-800 shadow-2xl',
    accentText: isTeacher ? 'text-amber-500' : 'text-[#00f0ff]',
    accentBg: isTeacher ? 'bg-amber-500' : 'bg-[#00f0ff]',
    accentHover: isTeacher ? 'hover:bg-amber-400' : 'hover:bg-[#00d8e6]',
    glowBg: isTeacher ? 'from-amber-500 to-orange-600' : 'from-[#00f0ff] to-purple-600',
    blob1: isTeacher ? 'bg-amber-500/10' : 'bg-[#00f0ff]/5',
    blob2: isTeacher ? 'bg-orange-500/10' : 'bg-purple-500/5',
    inputFocus: isTeacher
      ? 'focus:ring-amber-500/30 focus:border-amber-500'
      : 'focus:ring-[#00f0ff]/30 focus:border-[#00f0ff]',
    iconColor: isTeacher ? 'text-amber-500' : 'text-[#00f0ff]',
    gridLines: isTeacher
      ? 'linear-gradient(rgba(245, 158, 11, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(245, 158, 11, 0.1) 1px, transparent 1px)'
      : 'linear-gradient(rgba(0, 240, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.1) 1px, transparent 1px)',
    buttonText: isTeacher ? 'text-slate-900' : 'text-slate-950',
    title: isTeacher ? 'Portail Académique' : 'Terminal Administrateur',
    subtitle: isTeacher ? 'Espace Enseignant Sécurisé' : 'FaceAttend SysAdmin v2.0',
    iconBg: isTeacher
      ? 'bg-amber-500/10 border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
      : 'bg-[#00f0ff]/10 border-[#00f0ff]/20 shadow-[0_0_20px_rgba(0,240,255,0.15)]',
  };

  return (
    <div
      className={`min-h-screen ${theme.container} flex items-center justify-center p-4 font-sans selection:bg-white/20 transition-colors duration-700 relative overflow-hidden`}
    >
      {/* ─── BACKGROUND EFFECTS ─── */}
      <div className="absolute inset-0 pointer-events-none transition-opacity duration-1000">
        <div
          className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] ${theme.blob1} blur-[140px] rounded-full transition-colors duration-1000`}
        />
        <div
          className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] ${theme.blob2} blur-[140px] rounded-full transition-colors duration-1000`}
        />
        <div
          className="absolute inset-0 transition-all duration-1000"
          style={{ backgroundImage: theme.gridLines, backgroundSize: '40px 40px', opacity: 0.3 }}
        />
      </div>

      <div className="w-full max-w-md relative animate-in fade-in zoom-in-95 duration-700 ease-out z-10">
        {/* Glow behind card */}
        <div
          className={`absolute -inset-1 bg-gradient-to-r ${theme.glowBg} rounded-[2rem] blur-lg opacity-20 group-hover:opacity-40 transition duration-1000`}
        ></div>

        <div
          className={`relative ${theme.card} border rounded-3xl p-8 transition-colors duration-700`}
        >
          {/* ─── HEADER ─── */}
          <div className="flex flex-col items-center mb-8 animate-in slide-in-from-top-4 fade-in duration-700 delay-100 fill-mode-both">
            <div
              className={`w-20 h-20 rounded-2xl flex items-center justify-center border mb-5 transition-all duration-700 ${theme.iconBg}`}
            >
              {isTeacher ? (
                <GraduationCap size={40} className={theme.iconColor} />
              ) : (
                <ShieldCheck size={40} className={theme.iconColor} />
              )}
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight text-center">
              {theme.title}
            </h1>
            <p className="text-slate-400 text-sm mt-1.5 font-medium tracking-wide">
              {theme.subtitle}
            </p>
          </div>

          {/* ─── TOGGLE (if not forced) ─── */}
          {!forceRole && (
            <div className="flex gap-2 mb-8 p-1.5 bg-black/40 border border-white/5 rounded-xl animate-in fade-in duration-700 delay-200 fill-mode-both">
              <button
                type="button"
                onClick={() => {
                  setRole('admin');
                  setError('');
                }}
                className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all duration-300 ${
                  !isTeacher
                    ? 'bg-[#00f0ff] text-slate-900 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ADMINISTRATEUR
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole('teacher');
                  setError('');
                }}
                className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all duration-300 ${
                  isTeacher
                    ? 'bg-amber-500 text-slate-900 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ENSEIGNANT
              </button>
            </div>
          )}

          {/* ─── FORM ─── */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="animate-in slide-in-from-bottom-4 fade-in duration-700 delay-300 fill-mode-both">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 pl-1">
                {isTeacher ? 'Email Professionnel' : 'Identifiant Admin'}
              </label>
              <div className="relative group">
                <div
                  className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:${theme.accentText} transition-colors duration-300`}
                >
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`block w-full pl-11 pr-4 py-3.5 bg-black/40 border border-slate-700/50 text-white rounded-xl ${theme.inputFocus} transition-all duration-300 placeholder:text-slate-600 outline-none`}
                  placeholder={isTeacher ? 'prenom.nom@univ.dz' : 'admin_system'}
                  required
                />
              </div>
            </div>

            <div className="animate-in slide-in-from-bottom-4 fade-in duration-700 delay-400 fill-mode-both">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 pl-1">
                Mot de passe
              </label>
              <div className="relative group">
                <div
                  className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:${theme.accentText} transition-colors duration-300`}
                >
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`block w-full pl-11 pr-12 py-3.5 bg-black/40 border border-slate-700/50 text-white rounded-xl ${theme.inputFocus} transition-all duration-300 placeholder:text-slate-600 outline-none tracking-wide`}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                {loading ? 'Authentification...' : 'Accéder au Système'}
                {!loading && (
                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                )}
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

      {/* Keyframes */}
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
