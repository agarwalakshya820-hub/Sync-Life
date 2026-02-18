import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getSmartMealPlan } from '../services/geminiService.ts';
import { Meal } from '../types.ts';

interface Day {
  name: string;
  date: number;
  fullDate: Date;
  id: string;
}

const STORAGE_PREFIX = 'nutrisync_meals_';

// Aesthetic and functional constants for image generation
const STOP_WORDS = new Set(['with', 'and', 'served', 'side', 'fresh', 'organic', 'homemade', 'hot', 'cold', 'healthy', 'delicious', 'premium', 'sync', 'protocol', 'intake', 'daily', 'bowl', 'of', 'on', 'a', 'an', 'the']);
const STYLE_LAYER = ['dark', 'moody', 'noir', 'minimalist', 'luxury-food-photography', 'cinematic-lighting', 'high-contrast'];

const FALLBACK_PLAN: Record<string, Meal> = {
  breakfast: {
    name: "Oatmeal with Mixed Berries & Walnuts",
    kcal: 380,
    protein: 12,
    carbs: 52,
    fats: 14,
    imagePromptKeywords: "oatmeal, berries, walnuts",
    preparationSteps: [
      "Prepare 1/2 cup rolled oats with water or milk.",
      "Top with fresh blueberries, raspberries, and crushed walnuts.",
      "Add a drizzle of honey or cinnamon if desired."
    ],
    customizations: [
      "High Protein: Add a scoop of vanilla protein powder.",
      "Low Carb: Swap oats for chia seed pudding."
    ]
  },
  lunch: {
    name: "Grilled Chicken Mediterranean Salad",
    kcal: 520,
    protein: 42,
    carbs: 18,
    fats: 28,
    imagePromptKeywords: "grilled chicken, greek salad",
    preparationSteps: [
      "Grill 150g chicken breast with oregano and lemon.",
      "Toss cucumber, tomatoes, olives, and feta cheese with mixed greens.",
      "Dress with extra virgin olive oil and red wine vinegar."
    ],
    customizations: [
      "Vegan: Replace chicken with crispy chickpeas or tofu.",
      "High Carb: Add 1/2 cup cooked quinoa or farro."
    ]
  },
  dinner: {
    name: "Baked Salmon with Asparagus",
    kcal: 450,
    protein: 38,
    carbs: 12,
    fats: 26,
    imagePromptKeywords: "salmon, asparagus, lemon",
    preparationSteps: [
      "Season salmon fillet with salt, pepper, and lemon slices.",
      "Roast at 400°F (200°C) with asparagus for 12-15 minutes.",
      "Serve with a wedge of lemon."
    ],
    customizations: [
      "Keto: Add a dollop of herb butter on top.",
      "Bulking: Add a side of roasted sweet potato."
    ]
  },
  snack: {
    name: "Greek Yogurt with Almonds",
    kcal: 220,
    protein: 18,
    carbs: 12,
    fats: 10,
    imagePromptKeywords: "yogurt, almonds",
    preparationSteps: [
      "Scoop 1 cup of plain non-fat Greek yogurt into a bowl.",
      "Sprinkle with 15g of sliced raw almonds.",
      "Optionally add a few drops of liquid stevia."
    ],
    customizations: [
      "Nut-Free: Swap almonds for pumpkin seeds.",
      "Fruity: Add 1/2 cup of sliced strawberries."
    ]
  }
};

const MEAL_IMAGE_MAPPING: Record<string, string[]> = {
  "yogurt": ["yogurt-bowl", "greek-yogurt", "berries"],
  "chicken": ["grilled-chicken", "poultry", "roast-chicken"],
  "quinoa": ["grain-bowl", "quinoa", "salad"],
  "kale": ["green-salad", "kale", "leafy-greens"],
  "protein shake": ["smoothie", "protein-shake", "beverage"],
  "smoothie": ["fruit-smoothie", "drink", "blended"],
  "salmon": ["salmon-fillet", "grilled-fish", "seafood"],
  "avocado": ["avocado", "healthy-fats", "green-fruit"],
  "eggs": ["scrambled-eggs", "poached-eggs", "breakfast"],
  "oatmeal": ["porridge", "oats", "breakfast-bowl"],
  "steak": ["beef-fillet", "grilled-meat", "steak"],
  "salad": ["garden-salad", "vegetables", "fresh-greens"],
  "pasta": ["noodles", "wheat-pasta", "italian"],
  "tofu": ["vegan-protein", "tofu-bowl", "asian-fusion"],
  "berry": ["blueberries", "strawberries", "raspberries"],
  "nut": ["almonds", "walnuts", "cashews"],
  "fish": ["seafood", "grilled-fish"],
  "bowl": ["pokebowl", "nourish-bowl"]
};

const MealPlanner: React.FC = () => {
  const [meals, setMeals] = useState<Record<string, Meal> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [selectedMeal, setSelectedMeal] = useState<{type: string, data: Meal} | null>(null);
  const [swappingType, setSwappingType] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLogging, setIsLogging] = useState(false);
  
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
    const nameKeywords = name
      .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
      .split(/\s+/)
      .filter(word => word.length > 2 && !STOP_WORDS.has(word));

    const mappedKeywords: string[] = [];
    Object.keys(MEAL_IMAGE_MAPPING).forEach(key => {
      if (name.includes(key)) {
        mappedKeywords.push(...MEAL_IMAGE_MAPPING[key]);
      }
    });

    const aiKeywords = meal.imagePromptKeywords 
      ? meal.imagePromptKeywords.toLowerCase().split(',').map(k => k.trim()) 
      : [];

    const combined = [...new Set([...nameKeywords, ...mappedKeywords, ...aiKeywords])];
    const specificTerms = combined.slice(0, 4);
    const finalKeywords = [...specificTerms, ...STYLE_LAYER].join(',');
    const entropySource = name + selectedDateId;
    const seed = Array.from(entropySource).reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    
    return `https://loremflickr.com/500/500/${finalKeywords}/all?lock=${seed}`;
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchPlan = async (pref = "High Protein", typeToSwap?: string, forceRefresh = false) => {
    const cacheKey = `${STORAGE_PREFIX}${selectedDateId}`;
    
    // Check cache first if not refreshing/swapping
    if (!typeToSwap && !forceRefresh) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setMeals(parsed);
          updateImages(parsed);
          setLoading(false);
          setError(null);
          return;
        } catch (e) {
          localStorage.removeItem(cacheKey);
        }
      }
    }

    if (typeToSwap) {
      setSwappingType(typeToSwap);
      showToast(`AI Optimizing ${typeToSwap}...`);
    } else {
      setLoading(true);
      setError(null);
    }

    try {
      const plan = await getSmartMealPlan(pref);
      setMeals(plan);
      updateImages(plan);
      localStorage.setItem(cacheKey, JSON.stringify(plan));
      setError(null);
      if (typeToSwap) showToast(`${typeToSwap} synchronized.`);
    } catch (err: any) {
      console.error("MealPlanner Fetch Error:", err);
      const isQuota = err.message?.includes("QUOTA_EXHAUSTED");
      setError(isQuota ? "AI Quota limit reached. Showing optimized fallback plan." : "Sync connection intermittent. Using local fallback.");
      
      // Use fallback plan on error to prevent crash
      setMeals(FALLBACK_PLAN);
      updateImages(FALLBACK_PLAN);
      showToast("Using local metabolic fallback.");
    } finally {
      setLoading(false);
      setSwappingType(null);
    }
  };

  const updateImages = (plan: Record<string, Meal>) => {
    const newUrls: Record<string, string> = {};
    Object.entries(plan).forEach(([type, meal]) => {
      newUrls[type] = getAccurateMealImage(meal);
    });
    setImageUrls(newUrls);
  };

  useEffect(() => {
    fetchPlan();
    if (scrollRef.current && activeItemRef.current) {
      scrollRef.current.scrollTo({
        left: activeItemRef.current.offsetLeft - (scrollRef.current.offsetWidth / 2) + (activeItemRef.current.offsetWidth / 2),
        behavior: 'smooth'
      });
    }
  }, [selectedDateId]);

  const handleDateChange = (day: Day) => {
    setSelectedDateId(day.id);
  };

  const handleMealSwap = (type: string) => {
    fetchPlan("Varied healthy alternative", type, true);
  };

  const openMealDetail = (type: string, data: Meal) => {
    if (swappingType === type) return;
    setSelectedMeal({ type, data });
  };

  const handleConfirmLog = () => {
    setIsLogging(true);
    setTimeout(() => {
      setIsLogging(false);
      setSelectedMeal(null);
      showToast("Logged to metabolic protocol.");
    }, 1200);
  };

  return (
    <main className="h-full flex flex-col overflow-hidden bg-background-dark pointer-events-auto text-white relative">
      {/* Toast Feedback */}
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
          <div className="relative h-96 w-full shrink-0">
            <img src={imageUrls[selectedMeal.type]} alt={selectedMeal.data.name} className="w-full h-full object-cover brightness-[0.6] contrast-125" />
            <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/20 to-transparent"></div>
            <div className="absolute top-12 left-0 right-0 px-6 flex justify-between items-center">
              <button onClick={() => setSelectedMeal(null)} className="w-12 h-12 bg-black/40 backdrop-blur-xl rounded-2xl flex items-center justify-center text-white border border-white/10 active:scale-90 transition-all">
                <span className="material-icons-round">arrow_back</span>
              </button>
            </div>
            <div className="absolute bottom-8 left-8 right-8">
              <span className="inline-block text-[10px] font-black text-primary bg-primary/20 backdrop-blur-md px-3 py-1 rounded-lg uppercase tracking-[0.3em] mb-3">{selectedMeal.type} PROTOCOL</span>
              <h2 className="text-4xl font-black tracking-tighter leading-none mb-2">{selectedMeal.data.name}</h2>
            </div>
          </div>
          <div className="px-8 pb-32 mt-6">
            <div className="bg-slate-800/40 rounded-[2.5rem] p-6 border border-slate-700/50 mb-10">
               {/* Macro detail rendering... */}
               <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Macro Sync</h3>
                <div className="text-right">
                  <span className="text-2xl font-black text-white">{selectedMeal.data.kcal}</span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">kcal</span>
                </div>
              </div>
              <div className="space-y-4">
                {[{ label: 'PRO', val: selectedMeal.data.protein, target: 40, color: 'bg-blue-400' },
                  { label: 'CARB', val: selectedMeal.data.carbs, target: 60, color: 'bg-orange-400' },
                  { label: 'FAT', val: selectedMeal.data.fats, target: 20, color: 'bg-emerald-400' }].map(macro => (
                  <div key={macro.label}>
                    <div className="flex justify-between text-[11px] font-black mb-1.5 px-1">
                      <span className="text-slate-300">{macro.label}</span>
                      <span className="text-slate-500">{macro.val}g</span>
                    </div>
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div className={`h-full ${macro.color} rounded-full`} style={{ width: `${Math.min((macro.val / (macro.target || 1)) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mb-12">
              <h3 className="text-xl font-black mb-6">Preparation</h3>
              <div className="space-y-4">
                {selectedMeal.data.preparationSteps?.map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black shrink-0">{i+1}</div>
                    <p className="text-slate-400 text-sm leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-background-dark via-background-dark/90 to-transparent">
              <button onClick={handleConfirmLog} disabled={isLogging} className="w-full bg-primary text-black font-black py-6 rounded-[2rem] shadow-2xl active:scale-95 transition-all text-lg flex items-center justify-center gap-4">
                {isLogging ? <div className="w-6 h-6 border-4 border-black/20 border-t-black rounded-full animate-spin"></div> : <span>LOG TO PROTOCOL</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Header */}
      <header className="px-6 py-4 flex items-center justify-between shrink-0 bg-background-dark/50 backdrop-blur-sm z-10">
        <button onClick={() => console.log("Back")} className="w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-800 text-slate-400 border border-slate-700">
          <span className="material-icons-round">chevron_left</span>
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-xl font-black text-white tracking-tight">Sync Planner</h1>
          <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mt-1">METABOLIC v4.2</span>
        </div>
        <button onClick={() => fetchPlan("AI Selection", undefined, true)} disabled={loading} className="w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-800 text-primary border border-slate-700">
          <span className={`material-icons-round ${loading ? 'animate-spin' : ''}`}>sync</span>
        </button>
      </header>

      {/* Calendar Strip */}
      <div ref={scrollRef} className="px-6 py-6 overflow-x-auto flex gap-4 shrink-0 hide-scrollbar scroll-smooth snap-x snap-mandatory">
        {calendarDays.map((day, index) => {
          const isSelected = selectedDateId === day.id;
          return (
            <button key={day.id} ref={isSelected ? activeItemRef : null} onClick={() => handleDateChange(day)} className={`flex-shrink-0 w-16 h-24 flex flex-col items-center justify-center rounded-[2rem] transition-all transform snap-center ${isSelected ? 'bg-primary text-black shadow-lg scale-105' : 'bg-slate-800 text-slate-400 border border-slate-700/50'}`}>
              <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'opacity-80' : 'text-slate-400'}`}>{index === 0 ? 'Today' : day.name}</span>
              <span className="text-2xl font-black mt-1">{day.date}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-36 hide-scrollbar scroll-smooth">
        {/* Error/Quota Banner */}
        {error && (
          <div className="mb-6 animate-in fade-in slide-in-from-top-2">
            <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="material-icons-round text-red-500 text-xl">cloud_off</span>
                <p className="text-[11px] font-black text-red-400 uppercase tracking-widest leading-tight flex-1">{error}</p>
              </div>
              <button onClick={() => fetchPlan("AI Sync", undefined, true)} className="bg-red-500/20 text-red-400 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95">Retry Sync</button>
            </div>
          </div>
        )}

        {/* Metabolic Targets */}
        <section className="mt-2 mb-10">
          <div className="bg-slate-800 rounded-[2.5rem] p-8 border border-slate-700/50">
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Target Intensity</p>
                <p className="text-3xl font-black text-white">1,500 <span className="text-base font-bold text-slate-500 ml-1">/ 2,200 kcal</span></p>
              </div>
              <div className="bg-primary/10 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                <span className="text-[10px] font-black text-primary uppercase tracking-tighter">Optimal Sync</span>
              </div>
            </div>
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden mb-6 shadow-inner">
              <div className="h-full bg-primary transition-all duration-1000" style={{ width: '68%' }}></div>
            </div>
          </div>
        </section>

        {/* Meals */}
        <section className="space-y-6">
          <h2 className="text-xl font-black px-1">Daily Intake</h2>
          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-800/50 rounded-[2.5rem] animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-5">
              {meals && (Object.entries(meals) as [string, Meal][]).map(([type, meal]) => {
                const isSwapping = swappingType === type;
                return (
                  <div key={type} onClick={() => openMealDetail(type, meal)} className={`relative flex bg-slate-800 p-4 rounded-[2.5rem] items-center gap-5 transition-all cursor-pointer overflow-hidden border border-slate-700/50 active:scale-[0.98] ${isSwapping ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                    <div className="relative w-24 h-24 rounded-[1.5rem] overflow-hidden shrink-0 bg-slate-900">
                      <img alt={meal.name} className="w-full h-full object-cover" src={imageUrls[type]} onError={(e) => (e.target as HTMLImageElement).src = `https://loremflickr.com/500/500/healthy,food?lock=${meal.name.length}`} />
                      {isSwapping && <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div></div>}
                    </div>
                    <div className="flex-1 pr-10">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{type}</span>
                      <h3 className="text-base font-black leading-tight line-clamp-2">{meal.name}</h3>
                      <p className="text-xs font-bold text-primary mt-2">{meal.kcal} kcal</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleMealSwap(type); }} disabled={isSwapping} className="absolute right-4 w-11 h-11 bg-slate-700/50 rounded-2xl flex items-center justify-center text-slate-400 active:scale-90 border border-slate-600"><span className={`material-icons-round text-lg ${isSwapping ? 'animate-spin' : ''}`}>sync</span></button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default MealPlanner;