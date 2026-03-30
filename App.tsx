
import React, { useState, Component, ErrorInfo, ReactNode } from 'react';
import { NavTab } from './types.ts';
import Dashboard from './pages/Dashboard.tsx';
import Scanner from './pages/Scanner.tsx';
import MealPlanner from './pages/MealPlanner.tsx';
import Profile from './pages/Profile.tsx';
import Navigation from './components/Navigation.tsx';
import Login from './pages/Login.tsx';
import { AuthProvider, useAuth } from './components/AuthContext.tsx';
import { auth } from './firebase.ts';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center p-10 text-center">
          <div className="w-20 h-20 bg-coral/10 rounded-3xl flex items-center justify-center mb-8">
            <span className="material-icons-round text-coral text-4xl">error_outline</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-4 tracking-tight">Something went wrong</h1>
          <p className="text-slate-400 text-sm font-medium mb-8 max-w-md leading-relaxed">
            {this.state.error?.message?.includes("AI Service missing") 
              ? "The AI Service is not configured. Please ensure your GEMINI_API_KEY is set in Vercel and you have redeployed."
              : (this.state.error?.message || "An unexpected error occurred. Please try refreshing the page.")}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-white text-black font-black px-8 py-4 rounded-2xl active:scale-95 transition-all"
          >
            Refresh App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>(NavTab.HOME);

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
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
    <div className="flex min-h-screen bg-background-dark text-white font-display">
      {/* Desktop Sidebar Navigation */}
      {activeTab !== NavTab.SCANNER && (
        <div className="hidden md:flex w-64 lg:w-72 flex-col border-r border-slate-800 bg-background-dark/50 backdrop-blur-xl shrink-0">
          <div className="p-8 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="material-icons-round text-black">bolt</span>
            </div>
            <h1 className="text-xl font-black tracking-tighter">NutriSync <span className="text-primary">AI</span></h1>
          </div>
          
          <div className="flex-1 px-4 py-6 space-y-2">
            {[
              { id: NavTab.HOME, label: 'Dashboard', icon: 'home' },
              { id: NavTab.LOG, label: 'Meal Planner', icon: 'restaurant_menu' },
              { id: NavTab.AI_LAB, label: 'AI Sync', icon: 'insights' },
              { id: NavTab.PROFILE, label: 'Profile', icon: 'person' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all font-black uppercase text-[10px] tracking-widest ${
                  activeTab === item.id 
                    ? 'bg-primary text-black shadow-lg shadow-primary/10' 
                    : 'text-slate-500 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <span className="material-icons-round text-xl">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            <button 
              onClick={() => setActiveTab(NavTab.SCANNER)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all border border-slate-700"
            >
              <span className="material-icons-round">add</span>
              Quick Scan
            </button>
            <button 
              onClick={() => auth.signOut()}
              className="w-full mt-4 text-slate-500 hover:text-coral text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Mobile Status Bar - Only visible on mobile */}
        <div className="md:hidden h-10 w-full flex items-center justify-between px-8 pt-2 shrink-0 z-50 bg-background-dark/80 backdrop-blur-md pointer-events-none">
          <span className="text-xs font-bold text-white tracking-tighter">9:41</span>
          <div className="flex gap-1.5 items-center text-white">
            <span className="material-icons-round text-[14px]">signal_cellular_alt</span>
            <span className="material-icons-round text-[14px]">wifi</span>
            <span className="material-icons-round text-[14px] rotate-90">battery_full</span>
          </div>
        </div>

        {/* Content Wrapper */}
        <div className="flex-1 relative overflow-hidden flex flex-col max-w-7xl mx-auto w-full">
          {renderContent()}
        </div>

        {/* Mobile Navigation - Fixed at bottom for mobile only */}
        {activeTab !== NavTab.SCANNER && (
          <div className="md:hidden shrink-0 z-40 relative">
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

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
