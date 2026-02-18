
import React from 'react';

interface LandingProps {
  onStart: () => void;
}

const Landing: React.FC<LandingProps> = ({ onStart }) => {
  return (
    <div className="flex justify-center min-h-screen bg-black">
      <div className="relative h-screen w-full max-w-[430px] overflow-hidden bg-background-dark shadow-2xl flex flex-col">
        {/* Background Layer */}
        <div className="absolute inset-0 z-0">
          <img 
            alt="Healthy lifestyle" 
            className="w-full h-full object-cover brightness-50 contrast-125" 
            src="https://picsum.photos/seed/nutrisync-dark/800/1600"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background-dark/60 to-background-dark"></div>
        </div>

        {/* Content Layer */}
        <div className="relative z-10 flex-1 flex flex-col px-10 pt-24">
          <div className="flex items-center space-x-2 mb-4 opacity-90">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-primary shadow-[0_0_10px_rgba(19,236,91,0.5)]"></div>
            </div>
            <span className="text-xs font-black tracking-[0.2em] uppercase text-primary">NutriSync AI</span>
          </div>

          <div className="mt-8">
            <h1 className="text-[52px] leading-[1.1] font-serif font-light text-white mb-6">
              Sync Your <br/>
              <span className="italic font-normal text-primary">Life.</span>
            </h1>
            <p className="text-lg leading-relaxed text-slate-300 font-serif max-w-[240px]">
              The premium journey to peak health, powered by intuitive AI synchronization.
            </p>
          </div>
        </div>

        {/* Controls Layer */}
        <div className="relative z-10 px-8 pb-16">
          <div className="flex space-x-2 mb-10">
            <div className="h-1.5 w-8 rounded-full bg-primary shadow-[0_0_10px_rgba(19,236,91,0.5)]"></div>
            <div className="h-1.5 w-1.5 rounded-full bg-slate-700"></div>
            <div className="h-1.5 w-1.5 rounded-full bg-slate-700"></div>
          </div>

          <button 
            onClick={onStart}
            className="w-full bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all text-black py-5 rounded-full font-serif text-xl font-black shadow-2xl shadow-primary/30 flex items-center justify-center space-x-2"
          >
            <span>Get Started</span>
            <span className="material-icons-round text-sm">arrow_forward</span>
          </button>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 font-serif">
              Already a member? 
              <a className="text-primary font-semibold underline decoration-primary/30 underline-offset-4 ml-1" href="#">Log In</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
