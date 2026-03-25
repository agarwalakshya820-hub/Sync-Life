import React, { useState } from 'react';
import { auth, googleProvider, signInWithPopup } from '../firebase.ts';
import { motion } from 'motion/react';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Login failed:", err);
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-dark flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-[3rem] p-10 text-center shadow-2xl"
      >
        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
          <span className="material-icons-round text-primary text-4xl">sync</span>
        </div>
        
        <h1 className="text-4xl font-black text-white mb-4 tracking-tight">NutriSync AI</h1>
        <p className="text-slate-400 text-sm font-medium mb-10 leading-relaxed">
          Your personalized AI nutrition and workout companion. Log in to sync your progress.
        </p>

        {error && (
          <div className="mb-6 bg-coral/10 border border-coral/20 rounded-2xl p-4 text-coral text-xs font-black uppercase tracking-widest">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-white text-black font-black py-5 rounded-2xl flex items-center justify-center gap-4 active:scale-95 transition-all hover:bg-slate-100 disabled:opacity-50"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
          ) : (
            <>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
              <span>Continue with Google</span>
            </>
          )}
        </button>

        <p className="mt-10 text-[10px] text-slate-500 font-black uppercase tracking-widest leading-loose">
          By continuing, you agree to our <br />
          <span className="text-slate-400 underline cursor-pointer">Terms of Service</span> & <span className="text-slate-400 underline cursor-pointer">Privacy Policy</span>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
