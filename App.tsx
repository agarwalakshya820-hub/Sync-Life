
import React, { useState } from 'react';
import { NavTab } from './types';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Scanner from './pages/Scanner';
import MealPlanner from './pages/MealPlanner';
import Profile from './pages/Profile';
import Navigation from './components/Navigation';

const App: React.FC = () => {
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>(NavTab.HOME);

  if (!hasOnboarded) {
    return <Landing onStart={() => setHasOnboarded(true)} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case NavTab.HOME:
        return <Dashboard />;
      case NavTab.SCANNER:
        return <Scanner onClose={() => {
          console.log("Scanner: Closing");
          setActiveTab(NavTab.HOME);
        }} />;
      case NavTab.LOG:
        return <MealPlanner />;
      case NavTab.PROFILE:
        return <Profile />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex justify-center min-h-screen bg-slate-950">
      {/* Mobile Shell Container */}
      <div className="w-full max-w-[430px] bg-background-dark shadow-2xl relative flex flex-col h-[100dvh] overflow-hidden">
        
        {/* Fixed Status Bar - Topmost Layer */}
        <div className="h-10 w-full flex items-center justify-between px-8 pt-2 shrink-0 z-50 bg-background-dark/80 backdrop-blur-md pointer-events-none">
          <span className="text-xs font-bold text-white tracking-tighter">9:41</span>
          <div className="flex gap-1.5 items-center text-white">
            <span className="material-icons-round text-[14px]">signal_cellular_alt</span>
            <span className="material-icons-round text-[14px]">wifi</span>
            <span className="material-icons-round text-[14px] rotate-90">battery_full</span>
          </div>
        </div>

        {/* Dynamic Screen Content - Fills available space */}
        <div className="flex-1 relative z-10 overflow-hidden flex flex-col">
          {renderContent()}
        </div>

        {/* Bottom Navigation - Fixed Layer above content but below modals */}
        {activeTab !== NavTab.SCANNER && (
          <div className="shrink-0 z-40 relative">
             <Navigation activeTab={activeTab} onTabChange={(tab) => {
               console.log("Navigation: Tab changed to", tab);
               setActiveTab(tab);
             }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
