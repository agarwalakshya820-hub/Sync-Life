
import React, { useEffect, useState, useCallback } from 'react';
import { getAdaptiveWorkout } from '../services/geminiService.ts';
import { Workout } from '../types.ts';

const FALLBACK_WORKOUT: Workout = {
  name: "Maintenance Protocol",
  duration: 20,
  calories: 150,
  intensity: 'moderate',
  reason: "Optimized bodyweight circuit while sync services are intermittent."
};

const CACHE_KEY = 'nutrisync_dashboard_workout';

const Dashboard: React.FC = () => {
  const [recommendation, setRecommendation] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendation = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);

    if (!force) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          setRecommendation(JSON.parse(cached));
          setLoading(false);
          return;
        } catch (e) { localStorage.removeItem(CACHE_KEY); }
      }
    }

    try {
      const workout = await getAdaptiveWorkout({ protein: 85, carbs: 210, fats: 42, calories: 1850 }, "Maintenance");
      setRecommendation(workout);
      localStorage.setItem(CACHE_KEY, JSON.stringify(workout));
    } catch (err: any) {
      console.error("Dashboard AI Error:", err);
      if (err.message === "QUOTA_EXHAUSTED") {
        setError("AI Sync limit reached. Using local protocol.");
      } else {
        setError("Sync connection intermittent.");
      }
      setRecommendation(FALLBACK_WORKOUT);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendation();
  }, [fetchRecommendation]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background-dark">
      <header className="px-6 py-4 flex items-center justify-between shrink-0 z-20 bg-background-dark/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img className="w-11 h-11 rounded-2xl object-cover border-2 border-primary" src="https://picsum.photos/seed/profile/200" />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-background-dark"></div>
          </div>
          <div>
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Metabolic Status</p>
            <h1 className="text-lg font-black dark:text-white">Alex Rivera</h1>
          </div>
        </div>
        <button className="w-11 h-11 rounded-2xl bg-slate-800 flex items-center justify-center relative active:scale-90 transition-all border border-slate-700">
          <span className="material-icons-round text-slate-300">notifications</span>
          <span className="absolute top-3 right-3 w-2 h-2 bg-coral rounded-full ring-2 ring-slate-800"></span>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-36 hide-scrollbar">
        {error && (
          <div className="mt-4 bg-coral/10 border border-coral/20 rounded-2xl p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <p className="text-[10px] font-black text-coral uppercase tracking-widest">{error}</p>
            <button onClick={() => fetchRecommendation(true)} className="bg-coral text-black px-3 py-1 rounded-lg text-[9px] font-black uppercase">Retry</button>
          </div>
        )}

        <section className="py-10 flex flex-col items-center justify-center min-h-[300px]">
          <div className="relative w-60 h-60 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
              <circle className="text-slate-800/50" cx="50%" cy="50%" r="44%" fill="transparent" stroke="currentColor" strokeWidth="12"></circle>
              <circle className="text-primary transition-all duration-1000" cx="50%" cy="50%" r="44%" fill="transparent" stroke="currentColor" strokeWidth="12" strokeDasharray="450" strokeDashoffset="120" strokeLinecap="round"></circle>
            </svg>
            <div className="z-10 text-center">
              <span className="text-6xl font-black text-white block">1,240</span>
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">kcal left</span>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <div className="bg-primary/10 border border-primary/20 rounded-[2rem] p-6 active:scale-[0.98] transition-all cursor-pointer">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="material-icons-round text-black">bolt</span>
              </div>
              <div>
                <span className="text-[9px] font-black bg-primary text-black px-2 py-1 rounded-full uppercase tracking-widest">AI Rec</span>
                <h3 className="text-xl font-black text-white">{loading ? 'Syncing...' : recommendation?.name}</h3>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed italic">{loading ? 'Analyzing biometrics...' : recommendation?.reason}</p>
          </div>
        </section>

        <div className="grid grid-cols-3 gap-3 mb-10">
          {[{l:'PRO',v:85},{l:'CARB',v:210},{l:'FAT',v:42}].map(m => (
            <div key={m.l} className="bg-slate-800 p-4 rounded-3xl border border-slate-700 text-center">
              <p className="text-[9px] font-black text-slate-500 uppercase mb-1">{m.l}</p>
              <p className="text-lg font-black text-white">{m.v}g</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
