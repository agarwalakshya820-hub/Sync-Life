
import React, { useEffect, useState } from 'react';
import { getAdaptiveWorkout } from '../services/geminiService';
import { Workout } from '../types';

const Dashboard: React.FC = () => {
  const [recommendation, setRecommendation] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendation = async () => {
      try {
        const workout = await getAdaptiveWorkout({ protein: 85, carbs: 210, fats: 42, calories: 1850 }, "Lean muscle growth");
        setRecommendation(workout);
      } catch (error) {
        console.error("AI Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendation();
  }, []);

  const handleNotificationClick = () => {
    console.log("Dashboard: Notification bell clicked");
    alert("Notifications: Your metabolic sync is optimal!");
  };

  const handleStartWorkout = () => {
    console.log("Dashboard: Start Workout clicked - ", recommendation?.name);
    alert(`Protocol Initialized: ${recommendation?.name || 'Standard HIIT'}`);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background-light dark:bg-background-dark">
      {/* Header - Fixed Height Header inside the view */}
      <header className="px-6 py-4 flex items-center justify-between shrink-0 z-20 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-transparent">
        <div className="flex items-center gap-3">
          <div className="relative cursor-pointer active:scale-95 transition-transform" onClick={() => console.log("Dashboard: Avatar clicked")}>
            <img 
              alt="Profile" 
              className="w-12 h-12 rounded-2xl object-cover border-2 border-primary shadow-lg" 
              src="https://picsum.photos/seed/profile/200"
            />
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-primary rounded-full border-2 border-white dark:border-background-dark"></div>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">Metabolic Status</p>
            <h1 className="text-xl font-black leading-tight dark:text-white">Alex Rivera</h1>
          </div>
        </div>
        <button 
          onClick={handleNotificationClick}
          className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center relative active:scale-90 transition-all border border-slate-50 dark:border-slate-700 pointer-events-auto"
        >
          <span className="material-icons-round text-slate-600 dark:text-slate-300">notifications</span>
          <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-coral rounded-full ring-2 ring-white dark:ring-slate-800 animate-pulse"></span>
        </button>
      </header>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto hide-scrollbar scroll-smooth">
        <div className="flex flex-col px-6 pb-36">
          
          {/* Calorie Ring Section - Dynamic Hero Area */}
          <section className="py-12 flex flex-col items-center justify-center relative min-h-[360px]">
            <div className="relative w-64 h-64 md:w-72 md:h-72 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none drop-shadow-2xl">
                <circle className="text-slate-100 dark:text-slate-800/50" cx="50%" cy="50%" r="44%" fill="transparent" stroke="currentColor" strokeWidth="16"></circle>
                <circle 
                  className="text-primary transition-all duration-1000 ease-out" 
                  cx="50%" cy="50%" r="44%" 
                  fill="transparent" 
                  stroke="currentColor" strokeWidth="16" 
                  strokeDasharray="565" strokeDashoffset="180" 
                  strokeLinecap="round"
                ></circle>
              </svg>
              <div className="z-10 flex flex-col items-center justify-center text-center animate-in zoom-in-75 duration-700">
                <span className="text-7xl font-black tracking-tighter dark:text-white mb-1">1,240</span>
                <span className="text-[13px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">kcal left</span>
                
                <div className="mt-8 flex gap-10 text-[10px] font-black uppercase tracking-[0.1em] border-t border-slate-100 dark:border-slate-700/50 pt-6">
                  <div className="flex flex-col items-center">
                    <span className="text-slate-400 mb-1">In</span>
                    <span className="text-slate-900 dark:text-white text-base">850</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-slate-400 mb-1">Out</span>
                    <span className="text-primary text-base">420</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* AI Recommendation Card - FIXED CLICKING */}
          <section className="mb-10">
            <div 
              onClick={handleStartWorkout}
              className="bg-primary/10 dark:bg-primary/5 border border-primary/20 rounded-[2.5rem] p-7 relative overflow-hidden active:scale-[0.98] transition-all cursor-pointer group shadow-sm"
            >
              <div className="flex items-start gap-6 relative z-10">
                <div className="w-16 h-16 rounded-3xl bg-primary flex items-center justify-center shadow-xl shadow-primary/30 group-hover:scale-110 transition-transform">
                  <span className="material-icons-round text-black text-4xl">bolt</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-black bg-primary text-black px-3 py-1.5 rounded-full uppercase tracking-tighter shadow-sm">AI Adaptive Plan</span>
                  </div>
                  <h3 className="text-2xl font-black mb-1 dark:text-white tracking-tight">
                    {loading ? 'Analyzing Vitals...' : (recommendation?.name || 'HIIT Dynamic Protocol')}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium line-clamp-2">
                    {loading ? 'Synchronizing performance markers...' : (recommendation?.reason || "Ideal metabolic window for training.")}
                  </p>
                </div>
              </div>
              
              {!loading && (
                <div className="mt-8 flex items-center justify-center gap-2 bg-primary text-black font-black py-4 rounded-2xl shadow-lg shadow-primary/20 pointer-events-none">
                  <span>Start Protocol</span>
                  <span className="material-icons-round">play_arrow</span>
                </div>
              )}
            </div>
          </section>

          {/* Vitals Grid */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-6 px-1">
              <h2 className="text-2xl font-black dark:text-white tracking-tight">Vitals</h2>
              <button onClick={() => console.log("Dashboard: Full stats clicked")} className="text-[11px] font-black text-primary uppercase tracking-widest bg-primary/10 px-4 py-2 rounded-full active:scale-95 transition-transform">Details</button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'PRO', val: 85, target: 150, color: 'bg-blue-400', icon: 'egg' },
                { label: 'CARB', val: 210, target: 250, color: 'bg-orange-400', icon: 'bakery_dining' },
                { label: 'FAT', val: 42, target: 70, color: 'bg-emerald-400', icon: 'opacity' }
              ].map(macro => (
                <div key={macro.label} className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] border border-slate-50 dark:border-slate-800 shadow-sm active:scale-95 transition-all cursor-pointer pointer-events-auto" onClick={() => console.log(`Dashboard: Macro ${macro.label} clicked`)}>
                  <div className="flex items-center justify-between mb-4">
                     <span className="material-icons-round text-[20px] text-slate-300">{macro.icon}</span>
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{macro.label}</span>
                  </div>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-2xl font-black dark:text-white">{macro.val}</span>
                    <span className="text-xs font-bold text-slate-400">g</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-50 dark:bg-slate-900 rounded-full overflow-hidden">
                    <div className={`h-full ${macro.color} rounded-full transition-all duration-1000`} style={{ width: `${(macro.val/macro.target)*100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Timeline */}
          <section className="space-y-4">
            <h2 className="text-xl font-black dark:text-white tracking-tight px-1 mb-2">Today</h2>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl flex items-center gap-5 border border-slate-50 dark:border-slate-800 cursor-pointer active:scale-95 transition-transform" onClick={() => console.log("Dashboard: Log item clicked")}>
              <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center text-orange-500">
                <span className="material-icons-round text-3xl">restaurant</span>
              </div>
              <div className="flex-1">
                <h4 className="text-base font-black dark:text-white">Avocado & Egg Sync</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">08:30 AM • Breakfast</p>
              </div>
              <div className="text-right">
                <span className="text-xl font-black dark:text-white block">340</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">kcal</span>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
