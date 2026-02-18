
import React from 'react';
import { NavTab } from '../types';

interface NavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-t border-slate-100 dark:border-slate-800 px-8 py-6 flex items-center justify-between z-40 relative pointer-events-auto shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]">
      <button 
        onClick={() => {
          console.log("Nav: Home clicked");
          onTabChange(NavTab.HOME);
        }}
        className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 ${activeTab === NavTab.HOME ? 'text-primary scale-110' : 'text-slate-400 opacity-60'}`}
      >
        <span className="material-icons-round text-2xl">home</span>
        <span className="text-[9px] font-black uppercase tracking-[0.1em]">Status</span>
      </button>
      
      <button 
        onClick={() => {
          console.log("Nav: Log clicked");
          onTabChange(NavTab.LOG);
        }}
        className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 ${activeTab === NavTab.LOG ? 'text-primary scale-110' : 'text-slate-400 opacity-60'}`}
      >
        <span className="material-icons-round text-2xl">restaurant_menu</span>
        <span className="text-[9px] font-black uppercase tracking-[0.1em]">Planner</span>
      </button>

      <div className="-mt-16 relative">
        <button 
          onClick={() => {
            console.log("Nav: Scanner FAB clicked");
            onTabChange(NavTab.SCANNER);
          }}
          className="w-16 h-16 rounded-[1.75rem] bg-primary shadow-2xl shadow-primary/40 flex items-center justify-center text-black active:scale-90 active:rotate-45 transition-all ring-8 ring-white dark:ring-slate-900 pointer-events-auto"
        >
          <span className="material-icons-round text-4xl">add</span>
        </button>
      </div>

      <button 
        onClick={() => {
          console.log("Nav: AI Lab clicked");
          onTabChange(NavTab.AI_LAB);
        }}
        className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 ${activeTab === NavTab.AI_LAB ? 'text-primary scale-110' : 'text-slate-400 opacity-60'}`}
      >
        <span className="material-icons-round text-2xl">insights</span>
        <span className="text-[9px] font-black uppercase tracking-[0.1em]">Sync</span>
      </button>

      <button 
        onClick={() => {
          console.log("Nav: Profile clicked");
          onTabChange(NavTab.PROFILE);
        }}
        className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 ${activeTab === NavTab.PROFILE ? 'text-primary scale-110' : 'text-slate-400 opacity-60'}`}
      >
        <span className="material-icons-round text-2xl">person</span>
        <span className="text-[9px] font-black uppercase tracking-[0.1em]">Profile</span>
      </button>
    </nav>
  );
};

export default Navigation;
