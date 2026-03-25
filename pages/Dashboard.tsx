
import React, { useEffect, useState, useCallback } from 'react';
import { getAdaptiveWorkout } from '../services/geminiService.ts';
import { Workout } from '../types.ts';
import { useAuth } from '../components/AuthContext.tsx';

const FALLBACK_WORKOUT: Workout = {
  name: "Maintenance Protocol",
  duration: 20,
  calories: 150,
  intensity: 'moderate',
  reason: "Optimized bodyweight circuit while sync services are intermittent."
};

const CACHE_KEY = 'nutrisync_dashboard_workout';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
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
      setError(err.message || "Sync connection intermittent.");
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
      <header className="px-6 py-4 md:py-8 flex items-center justify-between shrink-0 z-20 bg-background-dark/90 backdrop-blur-md">
        <div className="flex items-center gap-3 md:gap-6">
          <div className="relative">
            <img className="w-11 h-11 md:w-14 md:h-14 rounded-2xl object-cover border-2 border-primary" src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} />
            <div className="absolute bottom-0 right-0 w-3 h-3 md:w-4 md:h-4 bg-primary rounded-full border-2 border-background-dark"></div>
          </div>
          <div>
            <p className="text-[9px] md:text-[10px] text-slate-500 font-black uppercase tracking-widest">Metabolic Status</p>
            <h1 className="text-lg md:text-2xl font-black dark:text-white">{user?.displayName || 'User'}</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="hidden md:flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl border border-slate-700 transition-all">
            <span className="material-icons-round text-primary">calendar_today</span>
            <span className="text-[10px] font-black uppercase tracking-widest">History</span>
          </button>
          <button className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-slate-800 flex items-center justify-center relative active:scale-90 transition-all border border-slate-700">
            <span className="material-icons-round text-slate-300">notifications</span>
            <span className="absolute top-3 right-3 w-2 h-2 bg-coral rounded-full ring-2 ring-slate-800"></span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-36 hide-scrollbar">
        {error && (
          <div className="mt-4 bg-coral/10 border border-coral/20 rounded-2xl p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <p className="text-[10px] font-black text-coral uppercase tracking-widest">{error}</p>
            <button onClick={() => fetchRecommendation(true)} className="bg-coral text-black px-3 py-1 rounded-lg text-[9px] font-black uppercase">Retry</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10 mt-6">
          {/* Main Stats Circle */}
          <section className="lg:col-span-5 flex items-center justify-center py-10 bg-slate-900/40 rounded-[3rem] border border-slate-800/50">
            <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
              {/* Progress Circle */}
              <svg className="absolute inset-0 z-0 transform -rotate-90" width="100%" height="100%">
                {/* background circle */}
                <circle
                  cx="50%"
                  cy="50%"
                  r="110"
                  className="md:r-[140]"
                  stroke="#1f2937"
                  strokeWidth="14"
                  fill="none"
                />
                {/* progress circle */}
                <circle
                  cx="50%"
                  cy="50%"
                  r="110"
                  stroke="#22c55e"
                  strokeWidth="14"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray="691"
                  strokeDashoffset="83"
                  style={{ strokeDasharray: '880', strokeDashoffset: '105' }}
                  className="md:r-[140] transition-all duration-1000"
                />
              </svg>

              {/* Center Content */}
              <div className="absolute flex flex-col items-center justify-center z-10">
                <span className="text-white text-6xl md:text-8xl font-black">
                  88%
                </span>
                <span className="text-slate-500 text-[10px] md:text-[12px] font-black mt-1 tracking-[0.2em] uppercase text-center px-4">
                  Metabolic Efficiency
                </span>
              </div>
            </div>
          </section>

          {/* AI Recommendation & Macros */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <section>
              <div className="bg-primary/10 border border-primary/20 rounded-[2.5rem] p-8 active:scale-[0.99] transition-all cursor-pointer h-full">
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                    <span className="material-icons-round text-black text-3xl">bolt</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black bg-primary text-black px-3 py-1 rounded-full uppercase tracking-widest">AI Recommendation</span>
                    <h3 className="text-2xl md:text-3xl font-black text-white mt-1">{loading ? 'Syncing...' : recommendation?.name}</h3>
                  </div>
                </div>
                <p className="text-sm md:text-base text-slate-400 leading-relaxed italic">{loading ? 'Analyzing biometrics...' : recommendation?.reason}</p>
                
                {!loading && (
                  <div className="mt-8 flex gap-4">
                    <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                      <span className="text-[10px] font-black text-slate-500 uppercase block">Duration</span>
                      <span className="text-white font-black">{recommendation?.duration} min</span>
                    </div>
                    <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                      <span className="text-[10px] font-black text-slate-500 uppercase block">Intensity</span>
                      <span className="text-white font-black uppercase">{recommendation?.intensity}</span>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <div className="grid grid-cols-3 gap-4">
              {[{l:'PRO',v:85,c:'text-blue-400'},{l:'CARB',v:210,c:'text-orange-400'},{l:'FAT',v:42,c:'text-emerald-400'}].map(m => (
                <div key={m.l} className="bg-slate-800/50 p-6 rounded-[2rem] border border-slate-700/50 text-center hover:bg-slate-800 transition-all">
                  <p className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">{m.l}</p>
                  <p className={`text-2xl md:text-3xl font-black ${m.c}`}>{m.v}g</p>
                  <div className="mt-4 h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className={`h-full ${m.c.replace('text', 'bg')}`} style={{ width: '70%' }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop Extra Section */}
        <section className="mt-10 hidden md:grid grid-cols-2 gap-6">
          <div className="bg-slate-800/30 p-8 rounded-[2.5rem] border border-slate-800/50">
            <h4 className="text-lg font-black mb-4 flex items-center gap-2">
              <span className="material-icons-round text-primary">water_drop</span>
              Hydration Sync
            </h4>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black">1.8</span>
              <span className="text-slate-500 font-black mb-1">/ 3.0 L</span>
            </div>
            <div className="mt-6 flex gap-2">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className={`flex-1 h-12 rounded-xl border ${i <= 5 ? 'bg-primary/20 border-primary/30' : 'border-slate-700'}`}></div>
              ))}
            </div>
          </div>
          <div className="bg-slate-800/30 p-8 rounded-[2.5rem] border border-slate-800/50">
            <h4 className="text-lg font-black mb-4 flex items-center gap-2">
              <span className="material-icons-round text-coral">nightlight_round</span>
              Sleep Recovery
            </h4>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black">7h 20m</span>
              <span className="text-slate-500 font-black mb-1">Score: 82</span>
            </div>
            <div className="mt-6 h-12 bg-slate-900 rounded-xl overflow-hidden flex">
              <div className="h-full bg-indigo-500 w-[20%]"></div>
              <div className="h-full bg-indigo-400 w-[40%]"></div>
              <div className="h-full bg-indigo-300 w-[30%]"></div>
              <div className="h-full bg-slate-700 w-[10%]"></div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
