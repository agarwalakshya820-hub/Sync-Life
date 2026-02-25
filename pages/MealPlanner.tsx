
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { getSmartMealPlan } from '../services/geminiService.ts';
import { Meal } from '../types.ts';

interface Day {
  name: string;
  date: number;
  fullDate: Date;
  id: string;
}

const STORAGE_PREFIX = 'nutrisync_meals_';
const STOP_WORDS = new Set(['with', 'and', 'served', 'side', 'fresh', 'organic', 'homemade', 'hot', 'cold', 'healthy', 'delicious', 'premium', 'sync', 'protocol', 'intake', 'daily', 'bowl', 'of', 'on', 'a', 'an', 'the']);
const STYLE_LAYER = ['dark', 'moody', 'noir', 'minimalist', 'luxury-food-photography', 'cinematic-lighting', 'high-contrast'];

const FALLBACK_PLAN: Record<string, Meal> = {
  breakfast: {
    name: "Classic Oatmeal with Berries",
    kcal: 350,
    protein: 12,
    carbs: 48,
    fats: 10,
    imagePromptKeywords: "oatmeal, berries",
    preparationSteps: ["Boil oats in water.", "Add fresh berries.", "Enjoy warm."],
    customizations: ["Add nuts for crunch", "Use honey for sweetness"]
  },
  lunch: {
    name: "Grilled Chicken Mediterranean Salad",
    kcal: 480,
    protein: 40,
    carbs: 15,
    fats: 22,
    imagePromptKeywords: "chicken salad",
    preparationSteps: ["Grill chicken breast.", "Toss with mixed greens.", "Add olive oil."],
    customizations: ["Swap for tofu", "Add feta cheese"]
  },
  dinner: {
    name: "Baked Salmon with Asparagus",
    kcal: 520,
    protein: 38,
    carbs: 12,
    fats: 28,
    imagePromptKeywords: "salmon, asparagus",
    preparationSteps: ["Season salmon.", "Bake at 400F for 15m.", "Serve with veggies."],
    customizations: ["Add lemon slices", "Side of quinoa"]
  },
  snack: {
    name: "Greek Yogurt with Almonds",
    kcal: 210,
    protein: 18,
    carbs: 10,
    fats: 12,
    imagePromptKeywords: "yogurt, almonds",
    preparationSteps: ["Scoop yogurt.", "Top with almonds."],
    customizations: ["Add cinnamon", "Use walnuts"]
  }
};

const MEAL_IMAGE_MAPPING: Record<string, string[]> = {
  "yogurt": ["yogurt", "bowl"],
  "chicken": ["grilled-chicken", "salad"],
  "salmon": ["salmon", "seafood"],
  "oatmeal": ["oats", "breakfast"],
  "eggs": ["scrambled-eggs", "breakfast"],
  "salad": ["green-salad", "bowl"]
};

const MealPlanner: React.FC = () => {
  const [meals, setMeals] = useState<Record<string, Meal> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [selectedMeal, setSelectedMeal] = useState<{type: string, data: Meal} | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const calendarDays = useMemo(() => {
    const days: Day[] = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      days.push({
        name: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
        date: d.getDate(),
        fullDate: d,
        id: d.toISOString().split('T')[0]
      });
    }
    return days;
  }, []);

  const [selectedDateId, setSelectedDateId] = useState(calendarDays[0].id);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);

  const getAccurateMealImage = (meal: Meal) => {
    const name = meal.name.toLowerCase();
    const nameWords = name.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
    const mapped = [];
    Object.keys(MEAL_IMAGE_MAPPING).forEach(k => { if (name.includes(k)) mapped.push(...MEAL_IMAGE_MAPPING[k]); });
    const aiKeywords = meal.imagePromptKeywords ? meal.imagePromptKeywords.toLowerCase().split(',').map(k => k.trim()) : [];
    const combined = [...new Set([...nameWords, ...mapped, ...aiKeywords])];
    const terms = combined.slice(0, 4).concat(STYLE_LAYER).join(',');
    const seed = Array.from(name + selectedDateId).reduce((a, c) => a + c.charCodeAt(0), 0);
    return `https://loremflickr.com/500/500/${terms}/all?lock=${seed}`;
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const generateMeals = useCallback(async (force = false) => {
    const cacheKey = `${STORAGE_PREFIX}${selectedDateId}`;
    setLoading(true);
    setError(null);

    // 1. Try Cache First
    if (!force) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setMeals(parsed);
          updateImages(parsed);
          setLoading(false);
          return;
        } catch (e) { localStorage.removeItem(cacheKey); }
      }
    }

    // 2. Try Gemini API with Try/Catch
    try {
      const plan = await getSmartMealPlan("High Protein Wellness");
      setMeals(plan);
      updateImages(plan);
      localStorage.setItem(cacheKey, JSON.stringify(plan));
    } catch (err: any) {
      console.error("Gemini API error:", err);
      
      // 3. Graceful Fallback
      if (err.message === "QUOTA_EXHAUSTED") {
        setError("AI Quota exceeded. Showing optimized default protocol.");
      } else {
        setError("Synchronization intermittent. Using fallback plan.");
      }
      
      setMeals(FALLBACK_PLAN);
      updateImages(FALLBACK_PLAN);
      showToast("Using fallback nutritional protocol.");
    } finally {
      setLoading(false);
    }
  }, [selectedDateId]);

  const updateImages = (plan: Record<string, Meal>) => {
    const newUrls: Record<string, string> = {};
    Object.entries(plan).forEach(([type, meal]) => {
      newUrls[type] = getAccurateMealImage(meal);
    });
    setImageUrls(newUrls);
  };

  useEffect(() => {
    generateMeals();
    if (scrollRef.current && activeItemRef.current) {
      scrollRef.current.scrollTo({
        left: activeItemRef.current.offsetLeft - (scrollRef.current.offsetWidth / 2) + (activeItemRef.current.offsetWidth / 2),
        behavior: 'smooth'
      });
    }
  }, [selectedDateId, generateMeals]);

  return (
    <main className="h-full flex flex-col overflow-hidden bg-background-dark pointer-events-auto text-white relative">
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[150] animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none">
          <div className="bg-primary/90 backdrop-blur-md text-black px-6 py-3 rounded-full font-black text-xs uppercase tracking-[0.1em] shadow-2xl flex items-center gap-2 border border-white/20">
            <span className="material-icons-round text-sm">auto_awesome</span>
            {toastMessage}
          </div>
        </div>
      )}

      {/* Detail Overlay */}
      {selectedMeal && (
        <div className="absolute inset-0 z-[100] bg-background-dark animate-in fade-in slide-in-from-bottom-10 duration-500 overflow-y-auto hide-scrollbar">
          <div className="relative h-80 w-full shrink-0">
            <img src={imageUrls[selectedMeal.type]} className="w-full h-full object-cover brightness-50" />
            <div className="absolute top-12 left-6">
              <button onClick={() => setSelectedMeal(null)} className="w-12 h-12 bg-black/40 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10"><span className="material-icons-round">arrow_back</span></button>
            </div>
            <div className="absolute bottom-6 left-6 right-6">
              <h2 className="text-3xl font-black mb-1">{selectedMeal.data.name}</h2>
              <p className="text-primary font-black uppercase text-[10px] tracking-widest">{selectedMeal.type} SYNC</p>
            </div>
          </div>
          <div className="p-8 pb-32">
             <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 mb-8">
               <p className="text-xs font-black text-slate-500 uppercase mb-4 tracking-widest">Macro Overview</p>
               <div className="flex justify-between items-center">
                 <div className="text-center"><p className="text-xl font-black">{selectedMeal.data.protein}g</p><p className="text-[10px] font-bold text-slate-400">Protein</p></div>
                 <div className="text-center"><p className="text-xl font-black">{selectedMeal.data.carbs}g</p><p className="text-[10px] font-bold text-slate-400">Carbs</p></div>
                 <div className="text-center"><p className="text-xl font-black">{selectedMeal.data.fats}g</p><p className="text-[10px] font-bold text-slate-400">Fats</p></div>
                 <div className="text-center"><p className="text-xl font-black text-primary">{selectedMeal.data.kcal}</p><p className="text-[10px] font-bold text-slate-400 uppercase">Kcal</p></div>
               </div>
             </div>
             <h3 className="text-xl font-black mb-4">Instructions</h3>
             <div className="space-y-4">
               {selectedMeal.data.preparationSteps?.map((s, i) => (
                 <div key={i} className="flex gap-4 text-slate-400 text-sm"><span className="text-primary font-black">{i+1}</span><p>{s}</p></div>
               ))}
             </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between bg-background-dark/50 backdrop-blur-sm z-10 border-b border-slate-800/50">
        <h1 className="text-xl font-black text-white">Meal Sync</h1>
        <button onClick={() => generateMeals(true)} className={`w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-800 text-primary border border-slate-700 active:scale-90 ${loading ? 'animate-spin' : ''}`}>
          <span className="material-icons-round">sync</span>
        </button>
      </header>

      {/* Calendar */}
      <div ref={scrollRef} className="px-6 py-6 overflow-x-auto flex gap-4 shrink-0 hide-scrollbar scroll-smooth snap-x snap-mandatory">
        {calendarDays.map((day, index) => (
          <button key={day.id} ref={selectedDateId === day.id ? activeItemRef : null} onClick={() => setSelectedDateId(day.id)} className={`flex-shrink-0 w-16 h-24 flex flex-col items-center justify-center rounded-3xl transition-all transform snap-center ${selectedDateId === day.id ? 'bg-primary text-black shadow-lg scale-105' : 'bg-slate-800 text-slate-400 border border-slate-700/50'}`}>
            <span className="text-[9px] font-black uppercase mb-1">{index === 0 ? 'Now' : day.name}</span>
            <span className="text-2xl font-black">{day.date}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-36 hide-scrollbar scroll-smooth">
        {/* Error UI Banner */}
        {error && (
          <div className="mb-6 animate-in fade-in slide-in-from-top-2">
            <div className="bg-coral/10 border border-coral/20 rounded-3xl p-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="material-icons-round text-coral">cloud_off</span>
                <p className="text-[11px] font-black text-coral uppercase tracking-widest flex-1">{error}</p>
              </div>
              <button onClick={() => generateMeals(true)} className="bg-coral text-black py-2 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 shadow-lg shadow-coral/20">Retry Sync</button>
            </div>
          </div>
        )}

        {/* List Section */}
        <section className="space-y-6">
          <h2 className="text-xl font-black px-1">Daily Protocol</h2>
          {loading ? (
            <div className="space-y-6">{[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-slate-800/50 rounded-3xl animate-pulse" />)}</div>
          ) : (
            <div className="space-y-5">
              {meals && (Object.entries(meals) as [string, Meal][]).map(([type, meal]) => (
                <div key={type} onClick={() => setSelectedMeal({type, data: meal})} className="relative flex bg-slate-800 p-4 rounded-3xl items-center gap-5 border border-slate-700/50 active:scale-[0.98] transition-all">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-slate-900 shadow-md">
                    <img className="w-full h-full object-cover" src={imageUrls[type]} onError={(e) => (e.target as HTMLImageElement).src = `https://loremflickr.com/500/500/healthy,food?lock=${meal.name.length}`} />
                  </div>
                  <div className="flex-1">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{type}</span>
                    <h3 className="text-base font-black leading-tight line-clamp-1">{meal.name}</h3>
                    <p className="text-xs font-bold text-primary mt-1">{meal.kcal} kcal</p>
                  </div>
                  <span className="material-icons-round text-slate-600">chevron_right</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default MealPlanner;
