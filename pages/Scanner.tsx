
import React, { useRef, useState, useEffect } from 'react';
import { analyzeFoodImage } from '../services/geminiService';

interface ScannerProps {
  onClose: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

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
    
    const context = canvasRef.current.getContext('2d');
    if (context) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      const base64 = canvasRef.current.toDataURL('image/jpeg').split(',')[1];
      
      try {
        const data = await analyzeFoodImage(base64);
        setResult(data);
      } catch (err) {
        console.error("Analysis failed", err);
      } finally {
        setAnalyzing(false);
      }
    }
  };

  return (
    <div className="absolute inset-0 z-[100] bg-black">
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
          <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 z-20">
            <div className="bg-black/40 backdrop-blur-sm text-white px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${analyzing ? 'bg-coral animate-pulse' : 'bg-primary'}`}></span>
              {analyzing ? 'Syncing with AI...' : 'Hold steady for better accuracy'}
            </div>
          </div>
        </>
      )}

      {/* Top Controls */}
      <div className="absolute top-12 left-0 right-0 px-6 flex justify-between items-center z-50">
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
          <span className="material-icons-round">close</span>
        </button>
        <button className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-md text-white text-sm font-semibold">
          Manual Entry
        </button>
      </div>

      {/* Result Card / Capture Button */}
      <div className="absolute bottom-0 left-0 right-0 p-8 pt-4 bg-gradient-to-t from-black via-black/80 to-transparent">
        {result ? (
          <div className="bg-background-light dark:bg-slate-900 rounded-3xl p-6 shadow-2xl animate-slide-up transform translate-y-0 transition-transform duration-500">
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-6"></div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Nutritional Analysis</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">{result.name}</h3>
              </div>
              <div className="bg-primary/10 px-3 py-1 rounded-full">
                <span className="text-primary text-[10px] font-bold uppercase">98% Match</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { l: 'Protein', v: result.protein, u: 'g', c: 'bg-blue-400' },
                { l: 'Carbs', v: result.carbs, u: 'g', c: 'bg-orange-400' },
                { l: 'Fats', v: result.fats, u: 'g', c: 'bg-emerald-400' }
              ].map(item => (
                <div key={item.l} className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{item.l}</p>
                  <p className="text-lg font-black dark:text-white">{item.v}<span className="text-xs font-normal ml-0.5">{item.u}</span></p>
                  <div className="mt-2 h-1 w-full bg-slate-50 dark:bg-slate-900 rounded-full overflow-hidden">
                    <div className={`h-full ${item.c}`} style={{ width: '60%' }}></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button 
                onClick={onClose}
                className="flex-1 bg-primary text-black font-black py-4 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <span className="material-icons-round">check_circle</span>
                Confirm & Log
              </button>
              <button 
                onClick={() => setResult(null)}
                className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400"
              >
                <span className="material-icons-round">refresh</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center pb-8">
            <button 
              onClick={captureAndAnalyze}
              disabled={analyzing}
              className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center ${analyzing ? 'opacity-50' : 'active:scale-90'}`}
            >
              <div className="w-16 h-16 rounded-full bg-white"></div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Scanner;
