
import React, { useRef, useState, useEffect } from 'react';
import { analyzeFoodImage } from '../services/geminiService.ts';
import { useAuth } from '../components/AuthContext.tsx';
import { db } from '../firebase.ts';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface ScannerProps {
  onClose: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ onClose }) => {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [logging, setLogging] = useState(false);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      } catch (err) {
        console.error("Camera error:", err);
        setError("Camera permission denied or unavailable.");
      }
    };
    startCamera();
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setAnalyzing(true);
    setError(null);
    
    const context = canvasRef.current.getContext('2d');
    if (context) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      const base64 = canvasRef.current.toDataURL('image/jpeg').split(',')[1];
      
      try {
        const data = await analyzeFoodImage(base64);
        setResult(data);
      } catch (err: any) {
        console.error("Scanner Analysis failed", err);
        setError(err.message || "Analysis synchronization failed. Try again.");
      } finally {
        setAnalyzing(false);
      }
    }
  };

  const handleConfirmAndLog = async () => {
    if (!user || !result) return;
    setLogging(true);
    try {
      await addDoc(collection(db, 'scannedFood'), {
        uid: user.uid,
        name: result.name,
        calories: result.calories || result.kcal || 0,
        protein: result.protein || 0,
        carbs: result.carbs || 0,
        fats: result.fats || 0,
        confidence: result.confidence || 1,
        createdAt: serverTimestamp()
      });
      onClose();
    } catch (err) {
      console.error("Error logging food:", err);
      setError("Failed to log food. Please try again.");
    } finally {
      setLogging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-0 md:p-10">
      <div className="relative w-full h-full md:max-w-4xl md:max-h-[80vh] md:rounded-[3rem] overflow-hidden bg-black shadow-2xl border border-white/10">
        {/* Live Camera */}
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover brightness-75"
        />
        
        {/* Hidden Canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* AR Overlays */}
        {!result && (
          <>
            <div className="scanner-line"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 pointer-events-none">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl"></div>
            </div>
            <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 z-20 w-full px-10 text-center">
              {error ? (
                <div className="bg-coral/20 backdrop-blur-md border border-coral/30 text-coral px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest inline-block">
                  {error}
                </div>
              ) : (
                <div className="bg-black/40 backdrop-blur-sm text-white px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 justify-center mx-auto w-fit">
                  <span className={`w-1.5 h-1.5 rounded-full ${analyzing ? 'bg-coral animate-pulse' : 'bg-primary'}`}></span>
                  {analyzing ? 'Syncing with AI...' : 'Hold steady for better accuracy'}
                </div>
              )}
            </div>
          </>
        )}

        {/* Top Controls */}
        <div className="absolute top-8 md:top-10 left-0 right-0 px-6 md:px-10 flex justify-between items-center z-50">
          <button onClick={onClose} className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-all hover:bg-white/30">
            <span className="material-icons-round">close</span>
          </button>
          <button 
            onClick={() => alert("Manual Entry Initialized...")}
            className="px-6 py-3 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-black uppercase tracking-widest active:scale-90 transition-all hover:bg-white/30"
          >
            Manual Entry
          </button>
        </div>

        {/* Result Card / Capture Button */}
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 pt-4 bg-gradient-to-t from-black via-black/80 to-transparent">
          {result ? (
            <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl animate-slide-up transform translate-y-0 transition-transform duration-500 border border-slate-800 max-w-2xl mx-auto">
              <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-8"></div>
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Nutritional Analysis</p>
                  <h3 className="text-3xl font-black text-white">{result.name}</h3>
                </div>
                <div className="bg-primary/10 px-4 py-2 rounded-xl border border-primary/20">
                  <span className="text-primary text-[10px] font-black uppercase tracking-widest">98% Match</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-10">
                {[
                  { l: 'Protein', v: result.protein, u: 'g', c: 'bg-blue-400' },
                  { l: 'Carbs', v: result.carbs, u: 'g', c: 'bg-orange-400' },
                  { l: 'Fats', v: result.fats, u: 'g', c: 'bg-emerald-400' }
                ].map(item => (
                  <div key={item.l} className="bg-slate-800/50 p-4 rounded-3xl border border-slate-800 text-center">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">{item.l}</p>
                    <p className="text-xl font-black text-white">{item.v}<span className="text-xs font-normal ml-0.5 text-slate-400">{item.u}</span></p>
                    <div className="mt-3 h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div className={`h-full ${item.c}`} style={{ width: '60%' }}></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={handleConfirmAndLog}
                  disabled={logging}
                  className="flex-1 bg-primary text-black font-black py-5 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 transition-all hover:brightness-110 disabled:opacity-50"
                >
                  {logging ? (
                    <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span className="material-icons-round">check_circle</span>
                      Confirm & Log
                    </>
                  )}
                </button>
                <button 
                  onClick={() => { setResult(null); setError(null); }}
                  className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 active:scale-90 transition-all hover:bg-slate-700"
                >
                  <span className="material-icons-round">refresh</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center pb-10">
              <button 
                onClick={captureAndAnalyze}
                disabled={analyzing}
                className={`w-24 h-24 rounded-full border-4 border-white flex items-center justify-center transition-all ${analyzing ? 'opacity-50 scale-90' : 'active:scale-90 hover:scale-110'}`}
              >
                <div className={`rounded-full bg-white transition-all ${analyzing ? 'w-10 h-10 rounded-xl animate-pulse' : 'w-20 h-20'}`}></div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Scanner;
