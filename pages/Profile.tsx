
import React, { useState, useEffect, useRef } from 'react';

const Profile: React.FC = () => {
  // Load persisted state from localStorage
  const [userName, setUserName] = useState(() => localStorage.getItem('ns_user_name') || 'Elena Vance');
  const [userRole, setUserRole] = useState(() => localStorage.getItem('ns_user_role') || 'Elite Athlete • NutriSync AI Elite');
  const [nameColor, setNameColor] = useState(() => localStorage.getItem('ns_name_color') || '#ffffff');
  
  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [healthScore, setHealthScore] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const targetScore = 88;
  const nameInputRef = useRef<HTMLInputElement>(null);

  const colors = [
    { name: 'Default', value: '#ffffff' },
    { name: 'Sync Green', value: '#13ec5b' },
    { name: 'Coral', value: '#FF7E67' },
    { name: 'Sky', value: '#38bdf8' },
    { name: 'Violet', value: '#a855f7' }
  ];

  // Animate health score on load
  useEffect(() => {
    const timer = setTimeout(() => {
      let current = 0;
      const step = 2;
      const interval = setInterval(() => {
        current += step;
        if (current >= targetScore) {
          setHealthScore(targetScore);
          clearInterval(interval);
        } else {
          setHealthScore(current);
        }
      }, 20);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isEditing && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isEditing]);

  const toggleSync = () => {
    console.log("Profile: Syncing Health Connect");
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      console.log("Profile: Sync Complete");
    }, 1500);
  };

  const handleSave = () => {
    console.log("Profile: Saving changes...");
    localStorage.setItem('ns_user_name', userName);
    localStorage.setItem('ns_user_role', userRole);
    localStorage.setItem('ns_name_color', nameColor);
    setIsEditing(false);
  };

  const handleSignOut = () => {
    console.log("Profile: Sign out clicked");
    alert("Signing out...");
  };

  const toggleEdit = () => {
    if (isEditing) {
      handleSave();
    } else {
      setIsEditing(true);
    }
  };

  // SVG Gauge calculations
  const radius = 60;
  const strokeWidth = 14;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * Math.PI; 
  const strokeDashoffset = circumference - (healthScore / 100) * circumference;

  return (
    <main className="h-full flex flex-col bg-background-dark overflow-hidden relative pointer-events-auto text-white">
      {/* SETTINGS OVERLAY */}
      {showSettings && (
        <div 
          className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-end animate-in fade-in duration-300 pointer-events-auto"
          onClick={() => setShowSettings(false)}
        >
          <div 
            className="w-full bg-slate-900 rounded-t-[3rem] p-10 pb-16 animate-in slide-in-from-bottom-full duration-500 shadow-2xl border-t border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-slate-800 rounded-full mx-auto mb-10"></div>
            <h2 className="text-3xl font-black mb-10 text-white px-2">Settings</h2>
            <div className="space-y-6 mb-12">
              <button 
                onClick={() => console.log("Settings: Privacy")}
                className="w-full flex items-center justify-between p-6 bg-slate-800/50 rounded-3xl active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-5 text-white">
                  <span className="material-icons-round text-slate-400">shield</span>
                  <span className="font-bold text-lg">Privacy</span>
                </div>
                <span className="material-icons-round text-slate-400">chevron_right</span>
              </button>
              <button 
                onClick={() => console.log("Settings: Subscription")}
                className="w-full flex items-center justify-between p-6 bg-slate-800/50 rounded-3xl active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-5 text-white">
                  <span className="material-icons-round text-slate-400">star</span>
                  <span className="font-bold text-lg">Premium Plan</span>
                </div>
                <span className="text-xs font-black text-primary bg-primary/10 px-4 py-2 rounded-full uppercase">Elite</span>
              </button>
            </div>
            <button 
              onClick={() => setShowSettings(false)}
              className="w-full bg-primary text-black font-black py-6 rounded-3xl shadow-xl shadow-primary/20 active:scale-95 transition-transform text-lg"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="pt-6 pb-4 px-6 flex justify-between items-center z-10 shrink-0 bg-background-dark/50 backdrop-blur-sm">
        <button 
          onClick={() => console.log("Profile: Back clicked")}
          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-800 shadow-sm text-slate-400 active:scale-90 transition-all border border-slate-700"
        >
          <span className="material-icons-round">chevron_left</span>
        </button>
        <h1 className="text-xl font-black tracking-tight text-white">Wellness Profile</h1>
        <button 
          onClick={() => setShowSettings(true)}
          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-800 shadow-sm text-slate-400 active:scale-90 transition-all border border-slate-700"
        >
          <span className="material-icons-round">tune</span>
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-40 hide-scrollbar scroll-smooth pointer-events-auto">
        {/* Avatar Hero */}
        <section className="flex flex-col items-center mt-6 mb-12">
          <div className="relative mb-8">
            <div className="w-44 h-44 rounded-full border-[6px] border-primary/20 p-2 shadow-2xl relative flex items-center justify-center overflow-hidden">
              <img 
                alt="Profile" 
                className="w-full h-full rounded-full object-cover brightness-50 contrast-125" 
                src="https://picsum.photos/seed/elena/400/400"
              />
              {/* Score Overlay Centered in Avatar */}
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                <span className="text-5xl font-black text-primary drop-shadow-[0_0_15px_rgba(19,236,91,0.6)]">
                  {healthScore}
                </span>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/70">Score</span>
              </div>
            </div>
            
            <button 
              onClick={toggleEdit}
              className="absolute bottom-1 right-1 bg-primary hover:scale-110 active:scale-90 transition-all w-14 h-14 rounded-3xl border-[6px] border-background-dark flex items-center justify-center shadow-2xl z-20 pointer-events-auto"
            >
              <span className="material-icons-round text-black text-2xl">
                {isEditing ? 'save' : 'edit'}
              </span>
            </button>
          </div>

          <div className="w-full text-center px-4">
            {isEditing ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <input
                  ref={nameInputRef}
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="text-3xl font-black bg-slate-800/80 border-none rounded-2xl text-white text-center focus:ring-4 focus:ring-primary/30 w-full py-4 px-6 shadow-inner"
                  placeholder="Enter name"
                />
                <input
                  type="text"
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  className="text-slate-400 font-bold text-xs bg-transparent border-none text-center focus:ring-0 w-full px-6 opacity-80"
                  placeholder="Enter role"
                />
                <div className="flex flex-wrap justify-center gap-4 pt-4">
                  {colors.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setNameColor(c.value)}
                      className={`w-10 h-10 rounded-full border-[3px] transition-all transform hover:scale-110 active:scale-90 ${nameColor === c.value ? 'border-white scale-110 ring-4 ring-white/20' : 'border-slate-800'}`}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in duration-500">
                <h2 
                  className="text-4xl font-black tracking-tighter transition-all duration-700"
                  style={{ color: nameColor }}
                >
                  {userName}
                </h2>
                <p className="text-slate-500 font-black text-[10px] mt-2 tracking-[0.2em] uppercase opacity-80">
                  {userRole}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Vitality Gauge Section */}
        <section className="mb-12">
          <div className="bg-slate-800/40 rounded-[2.5rem] p-10 border border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
            <span className="text-[9px] uppercase tracking-[0.4em] text-slate-500 font-black mb-8">System Sync Accuracy</span>
            
            <div className="relative w-full flex items-center justify-center h-28">
              <svg className="absolute transform" width="220" height="120" viewBox="0 0 160 90">
                <path d="M 20 80 A 60 60 0 0 1 140 80" fill="none" stroke="currentColor" strokeWidth="12" strokeLinecap="round" className="text-slate-900" />
                <path 
                  d="M 20 80 A 60 60 0 0 1 140 80" fill="none" stroke={nameColor} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${circumference} ${circumference}`}
                  style={{ 
                    strokeDashoffset: isFinite(strokeDashoffset) ? strokeDashoffset : circumference, 
                    transition: 'stroke-dashoffset 2.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
                    filter: `drop-shadow(0 0 8px ${nameColor}44)` 
                  }}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center top-2">
                <span className="text-5xl font-black text-white leading-none tracking-tighter">{healthScore}%</span>
                <span className="text-[10px] text-primary font-black uppercase mt-2 tracking-[0.2em]">Active</span>
              </div>
            </div>

            <p className="text-[13px] text-slate-400 px-6 mt-10 font-medium leading-relaxed italic opacity-70">
              "Your metabolic synchronization is performing within elite operational parameters."
            </p>
          </div>
        </section>

        {/* Action Controls */}
        <section className="space-y-4">
          <button 
            onClick={toggleSync}
            className={`w-full bg-slate-800/80 p-5 rounded-[2rem] flex items-center justify-between shadow-sm border border-slate-700/50 active:scale-[0.98] transition-all relative overflow-hidden ${isSyncing ? 'ring-2 ring-primary/40' : ''}`}
          >
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <span className={`material-icons-round text-2xl ${isSyncing ? 'animate-spin' : ''}`}>sync</span>
              </div>
              <div className="text-left">
                <span className="block text-lg font-black text-white">Health Connect</span>
                <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest block">
                  {isSyncing ? 'Synchronizing...' : 'Live Stream Active'}
                </span>
              </div>
            </div>
            <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-primary animate-pulse' : 'bg-primary shadow-[0_0_8px_rgba(19,236,91,0.5)]'}`}></div>
          </button>

          <button 
            className="w-full bg-slate-800/80 p-5 rounded-[2rem] flex items-center justify-between shadow-sm border border-slate-700/50 active:scale-[0.98] transition-all group"
            onClick={() => console.log("Account Settings clicked")}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-700/50 flex items-center justify-center text-slate-400">
                <span className="material-icons-round text-2xl">manage_accounts</span>
              </div>
              <span className="text-lg font-black text-white">Security Sync</span>
            </div>
            <span className="material-icons-round text-slate-600">chevron_right</span>
          </button>

          <button 
            onClick={handleSignOut}
            className="w-full bg-slate-800/80 p-5 rounded-[2rem] flex items-center justify-between shadow-sm border border-slate-700/50 active:scale-[0.98] transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                <span className="material-icons-round text-2xl">logout</span>
              </div>
              <span className="text-lg font-black text-white">Disconnect</span>
            </div>
            <span className="material-icons-round text-slate-600">chevron_right</span>
          </button>
        </section>
      </div>
    </main>
  );
};

export default Profile;
