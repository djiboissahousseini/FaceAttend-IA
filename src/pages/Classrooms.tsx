import { useState, useEffect } from 'react';
import { 
  MapPin, 
  Users, 
  Plus, 
  Search, 
  X, 
  Building2,
  Trash2
} from 'lucide-react';
import { API_URL } from '../config';

interface Classroom {
  id: string;
  name: string;
  capacity: number;
  building: string;
}

export default function Classrooms() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    capacity: 30,
    building: ''
  });

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    setLoading(true);
    try {
      // Pour l'instant on réutilise l'API classrooms qui renvoie les noms
      // Mais on va bientôt créer un endpoint complet /api/classrooms/details
      const res = await fetch(`${API_URL}/api/classrooms`);
      if (res.ok) {
        const names: string[] = await res.json();
        // Simulation des données détaillées en attendant l'API CRUD complète
        setClassrooms(names.map(name => ({
          id: Math.random().toString(36),
          name,
          capacity: name.includes('Amphi') ? 150 : 35,
          building: name.startsWith('Salle B') ? 'Bâtiment B' : 'Bâtiment Principal'
        })));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = classrooms.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.building.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
            <MapPin size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Gestion des Salles</h1>
            <p className="text-xs text-slate-400 font-medium">Structure et capacité des locaux</p>
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
          >
            <Plus size={16} /> Ajouter
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map(classroom => (
            <div key={classroom.id} className="bg-white p-5 rounded-[2.5rem] border border-slate-100 hover:border-blue-200 hover:shadow-xl transition-all group">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                  <Building2 size={28} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <button className="text-slate-300 hover:text-red-500 p-2 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>

              <h3 className="text-lg font-black text-slate-900 mb-1">{classroom.name}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6">{classroom.building}</p>

              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-blue-500" />
                  <span className="text-xs font-black text-slate-700">{classroom.capacity} Places</span>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-[3rem] p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900">
              <X size={24} />
            </button>
            
            <h2 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight">Nouvelle Salle</h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom de la salle</label>
                <input 
                  type="text"
                  placeholder="Ex: Salle B3"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 transition-all font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Capacité</label>
                  <input 
                    type="number"
                    defaultValue={35}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bâtiment</label>
                  <input 
                    type="text"
                    placeholder="Bâtiment B"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 transition-all font-bold"
                  />
                </div>
              </div>
              
              <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-lg mt-4">
                Enregistrer la Salle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
