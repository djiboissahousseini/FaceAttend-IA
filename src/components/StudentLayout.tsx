import { ReactNode, useState } from 'react';
import {
  LayoutDashboard,
  Cpu,
  Menu,
  X,
  BookOpen,
  History,
  LogOut,
  User,
  Settings,
} from 'lucide-react';

interface StudentLayoutProps {
  children: ReactNode;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function StudentLayout({
  children,
  onLogout,
  activeTab,
  setActiveTab,
}: StudentLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Accueil', icon: <LayoutDashboard size={22} /> },
    { id: 'modules', label: 'Modules', icon: <BookOpen size={22} /> },
    { id: 'scan', label: 'Scans', icon: <History size={22} /> },
    { id: 'profile', label: 'Profil', icon: <User size={22} /> },
  ];

  return (
    <div className="flex flex-col h-screen bg-[#020617] overflow-hidden font-sans text-white">
      {/* ─── MAIN CONTENT AREA ─── */}
      <main className="flex-1 overflow-y-auto pb-24 pt-4 px-4">
        {/* Header with menu button */}
        <div className="flex items-center justify-between max-w-md mx-auto mb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Cpu size={18} className="text-emerald-400" />
          </div>
          <button
            onClick={() => setMenuOpen(true)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-emerald-500 transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)]"
            aria-label="Ouvrir le menu"
          >
            <Menu size={22} />
          </button>
        </div>
        <div className="max-w-md mx-auto">{children}</div>
      </main>

      {/* ─── BOTTOM NAVIGATION (Mobile Tabs) ─── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#020617] border-t border-slate-800 px-6 py-3 pb-8 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                activeTab === item.id ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              <div
                className={`p-2 rounded-xl transition-all ${
                  activeTab === item.id ? 'bg-emerald-500/10 scale-110' : ''
                }`}
              >
                {item.icon}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ─── SIDE DRAWER (Menu) ─── */}
      {menuOpen && (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="absolute inset-y-0 right-0 w-4/5 max-w-xs bg-[#020617] border-l border-slate-800 p-8 animate-in slide-in-from-right duration-300 shadow-2xl">
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <Cpu size={20} className="text-emerald-400" />
                </div>
                <span className="font-black text-sm tracking-widest uppercase text-white">
                  FaceAttend
                </span>
              </div>
              <button onClick={() => setMenuOpen(false)} className="text-slate-500">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.3em] pl-1">
                  Configuration
                </p>
                <button
                  onClick={() => {
                    setActiveTab('timetable');
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-4 p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all"
                >
                  <BookOpen size={20} />
                  <span className="text-sm font-bold">Emploi du Temps</span>
                </button>
                <button className="w-full flex items-center gap-4 p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all">
                  <Settings size={20} />
                  <span className="text-sm font-bold">Paramètres</span>
                </button>
              </div>

              <div className="pt-6 mt-6 border-t border-white/5">
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
                >
                  <LogOut size={20} />
                  <span className="text-sm font-black uppercase tracking-widest">Déconnexion</span>
                </button>
              </div>
            </div>

            <div className="absolute bottom-8 left-8 right-8 text-center">
              <p className="text-[10px] text-slate-700 font-bold uppercase tracking-[0.2em]">
                FaceAttend Connect v2.4
              </p>
              <p className="text-[8px] text-slate-800 font-bold uppercase mt-1">
                Design Mobile Prototype
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
