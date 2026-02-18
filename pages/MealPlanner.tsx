
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getSmartMealPlan } from '../services/geminiService.ts';

interface Day {
  name: string;
  date: number;
  fullDate: Date;
  id: string;
}

const MEAL_IMAGE_MAPPING: Record<string, string[]> = {
  "yogurt": ["yogurt-bowl", "berries-yogurt", "yogurt-walnuts"],
  "chicken": ["grilled-chicken", "chicken-breast", "chicken-salad"],
  "quinoa": ["quinoa-bowl", "grain-salad"],
  "kale": ["kale-salad", "leafy-greens"],
  "protein shake": ["protein-shake", "vanilla-smoothie", "shake-glass"],
  "smoothie": ["smoothie-glass", "fruit-smoothie"],
  "salmon": ["grilled-salmon", "salmon-fillet"],
  "avocado": ["avocado-toast", "sliced-avocado"],
  "eggs": ["scrambled-eggs", "poached-eggs", "breakfast-eggs"],
  "oatmeal": ["oatmeal-bowl", "porridge-berries"],
  "steak": ["grilled-steak", "beef-fillet"],
  "salad": ["fresh-salad", "garden-salad"],
  "pasta": ["whole-wheat-pasta", "healthy-pasta"],
  "tofu": ["grilled-tofu", "tofu-bowl"]
};

const MealPlanner: React.FC = () => {
  const [meals, setMeals] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [selectedMeal, setSelectedMeal] = useState<{type: string, data: any} | null>(null);
  const [swappingType, setSwappingType] = useState<string | null>(null);
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

  const getAccurateMealImage = (meal: any) => {
    const mealName = meal.name.toLowerCase();
    let searchTerms = meal.imagePromptKeywords ? meal.imagePromptKeywords.toLowerCase().split(',') : [];
    
    Object.keys(MEAL_IMAGE_MAPPING).forEach(key => {
      if (mealName.includes(key)) {
        searchTerms = [...searchTerms, ...MEAL_IMAGE_MAPPING[key]];
      }
    });

    const styleModifiers = ['dark-background', 'minimalist', 'food-photography', 'topview'];
    const finalKeywords = [...new Set([...searchTerms, ...styleModifiers])].join(',');
    const seed = Array.from(mealName as string).reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    return `https://loremflickr.com/400/400/${finalKeywords}/all?lock=${seed}`;
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchPlan = async (pref = "High Protein", typeToSwap?: string) => {
    // If we're swapping a specific meal, we don't necessarily want to hide the whole UI
    // but we can set specific loading states
    if (typeToSwap) {
      setSwappingType(typeToSwap);
      showToast(`Optimizing ${typeToSwap} protocol...`);
    } else {
      setLoading(true);
    }

    try {
      const plan = await getSmartMealPlan(pref);
      setMeals(plan);
      const newUrls: Record<string, string> = {};
      Object.entries(plan).forEach(([type, meal]: [string, any]) => {
        newUrls[type] = getAccurateMealImage(meal);
      });
      setImageUrls(newUrls);
      if (typeToSwap) showToast(`${typeToSwap} successfully synchronized.`);
    } catch (err) {
      console.error("AI Error:", err);
      showToast("Synchronization failed. Check vitals.");
    } finally {
      setLoading(false);
      setSwappingType(null);
    }
  };

  useEffect(() => {
    fetchPlan();
    if (scrollRef.current && activeItemRef.current) {
      scrollRef.current.scrollTo({
        left: activeItemRef.current.offsetLeft - (scrollRef.current.offsetWidth / 2) + (activeItemRef.current.offsetWidth / 2),
        behavior: 'smooth'
      });
    }
  }, []);

  const handleDateChange = (day: Day) => {
    setSelectedDateId(day.id);
    fetchPlan(`Nutrients optimized for ${day.name}`); 
  };

  const handleMealSwap = (type: string) => {
    fetchPlan("Varied healthy alternative", type);
  };

  const openMealDetail = (type: string, data: any) => {
    if (swappingType === type) return; // Prevent opening while syncing
    setSelectedMeal({ type, data });
  };

  return (
    <main className="h-full flex flex-col overflow-hidden bg-background-dark pointer-events-auto text-white relative">
      
      {/* Dynamic Toast Feedback */}
      {toastMessage && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[110] animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none">
          <div className="bg-primary/90 backdrop-blur-md text-black px-6 py-3 rounded-full font-black text-xs uppercase tracking-[0.1em] shadow-2xl flex items-center gap-2 border border-white/20">
            <span className="material-icons-round text-sm">auto_awesome</span>
            {toastMessage}
          </div>
        </div>
      )}

      {/* Detail View Overlay */}
      {selectedMeal && (
        <div className="absolute inset-0 z-[100] bg-background-dark animate-in fade-in slide-in-from-bottom-10 duration-500 overflow-y-auto hide-scrollbar">
          <div className="relative h-80 w-full shrink-0">
            <img 
              src={imageUrls[selectedMeal.type]} 
              alt={selectedMeal.data.name} 
              className="w-full h-full object-cover brightness-75"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent"></div>
            <button 
              onClick={() => setSelectedMeal(null)}
              className="absolute top-12 left-6 w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/20 active:scale-90 transition-all"
            >
              <span className="material-icons-round">arrow_back</span>
            </button>
          </div>

          <div className="px-8 pb-20 -mt-12 relative z-10">
            <div className="flex justify-between items-end mb-8">
              <div>
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2 block">{selectedMeal.type} Sync</span>
                <h2 className="text-4xl font-black tracking-tighter leading-none">{selectedMeal.data.name}</h2>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-white block leading-none">{selectedMeal.data.kcal}</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Calories</span>
              </div>
            </div>

            {/* Nutrition Grid */}
            <div className="grid grid-cols-3 gap-4 mb-12">
              {[
                { label: 'Protein', val: selectedMeal.data.protein, color: 'text-blue-400' },
                { label: 'Carbs', val: selectedMeal.data.carbs, color: 'text-orange-400' },
                { label: 'Fats', val: selectedMeal.data.fats, color: 'text-emerald-400' }
              ].map(macro => (
                <div key={macro.label} className="bg-slate-800/50 p-5 rounded-[2rem] border border-slate-700/50 text-center">
                  <span className="block text-2xl font-black mb-1">{macro.val}g</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${macro.color}`}>{macro.label}</span>
                </div>
              ))}
            </div>

            {/* Preparation Steps */}
            <div className="mb-12">
              <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                  <span className="material-icons-round text-sm">restaurant</span>
                </span>
                Preparation Protocol
              </h3>
              <div className="space-y-6">
                {selectedMeal.data.preparationSteps?.map((step: string, i: number) => (
                  <div key={i} className="flex gap-5 items-start">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-[10px] font-black flex items-center justify-center shrink-0 border border-slate-700 text-slate-400">{i + 1}</span>
                    <p className="text-slate-300 font-medium leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Customizations */}
            <div className="mb-12">
              <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                  <span className="material-icons-round text-sm">tune</span>
                </span>
                Sync Customization
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {selectedMeal.data.customizations?.map((opt: string, i: number) => (
                  <div key={i} className="bg-slate-800/30 p-5 rounded-3xl border border-dashed border-slate-700/50 flex items-center gap-4">
                    <span className="material-icons-round text-primary text-xl">auto_awesome</span>
                    <p className="text-sm text-slate-400 font-medium italic">{opt}</p>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={() => setSelectedMeal(null)}
              className="w-full bg-primary text-black font-black py-6 rounded-3xl shadow-2xl shadow-primary/20 active:scale-[0.98] transition-all text-lg mb-10"
            >
              Confirm Log
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between shrink-0 bg-background-dark/50 backdrop-blur-sm z-10">
        <button 
          onClick={() => console.log("MealPlanner: Back clicked")}
          className="w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-800 shadow-sm text-slate-400 active:scale-90 transition-all border border-slate-700"
        >
          <span className="material-icons-round">chevron_left</span>
        </button>
        <h1 className="text-xl font-black text-white tracking-tight">Sync Planner</h1>
        <div className="w-11"></div>
      </header>

      {/* Date Selector Strip */}
      <div 
        ref={scrollRef}
        className="px-6 py-6 overflow-x-auto flex gap-4 shrink-0 hide-scrollbar scroll-smooth snap-x snap-mandatory pointer-events-auto"
      >
        {calendarDays.map((day, index) => {
          const isSelected = selectedDateId === day.id;
          return (
            <button 
              key={day.id}
              ref={isSelected ? activeItemRef : null}
              onClick={() => handleDateChange(day)}
              className={`flex-shrink-0 w-16 h-24 flex flex-col items-center justify-center rounded-[2rem] shadow-sm transition-all transform active:scale-95 snap-center ${
                isSelected 
                  ? 'bg-primary text-black shadow-lg shadow-primary/30 scale-105 z-10' 
                  : 'bg-slate-800 text-slate-400 border border-slate-700/50'
              }`}
            >
              <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'opacity-80' : 'text-slate-400'}`}>
                {index === 0 ? 'Today' : day.name}
              </span>
              <span className="text-2xl font-black mt-1">{day.date}</span>
              {isSelected && <div className="w-1.5 h-1.5 bg-black rounded-full mt-2"></div>}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-36 hide-scrollbar scroll-smooth pointer-events-auto">
        {/* Metabolic Target Section */}
        <section className="mt-2 mb-10">
          <div className="bg-slate-800 rounded-[2.5rem] p-8 shadow-sm border border-slate-700/50">
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
            <div className="flex justify-between px-2">
              {[
                { label: 'PRO', val: '120g' },
                { label: 'CARB', val: '180g' },
                { label: 'FAT', val: '55g' }
              ].map(stat => (
                <div key={stat.label} className="text-center">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-lg font-black text-white">{stat.val}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Meal Cards Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="text-xl font-black text-white tracking-tight">Daily Intake</h2>
            <button 
              onClick={() => { console.log("MealPlanner: Regenerating Protocol"); fetchPlan("AI Optimized Selection"); }}
              className="text-[11px] font-black text-primary uppercase tracking-[0.1em] px-4 py-2 bg-primary/10 rounded-full hover:bg-primary/20 active:scale-95 transition-all"
            >
              Regenerate All
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-slate-800/50 rounded-[2.5rem] animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-5">
              {meals && Object.entries(meals).map(([type, meal]: [string, any]) => {
                const isSwapping = swappingType === type;
                return (
                  <div 
                    key={type} 
                    onClick={() => openMealDetail(type, meal)}
                    className={`group relative flex bg-slate-800 p-4 rounded-[2.5rem] shadow-sm border border-slate-700/50 items-center gap-5 transition-all cursor-pointer overflow-hidden ${isSwapping ? 'opacity-60 grayscale-[0.5] scale-[0.98]' : 'active:scale-[0.98]'}`}
                  >
                    <div className="relative w-24 h-24 rounded-[1.5rem] overflow-hidden flex-shrink-0 bg-slate-900 shadow-md">
                      <img 
                        alt={meal.name} 
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 brightness-90 contrast-110" 
                        src={imageUrls[type]}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://loremflickr.com/400/400/healthy,food,dark,minimalist?lock=${meal.name.length}`;
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent pointer-events-none"></div>
                      
                      {/* Loading spinner over image if swapping */}
                      {isSwapping && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 pr-10">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{type}</span>
                        <span className="text-sm font-black text-primary">{meal.kcal} kcal</span>
                      </div>
                      <h3 className="text-base font-black leading-tight text-white line-clamp-2">{meal.name}</h3>
                      <div className="flex gap-3 mt-3">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Protein</span>
                          <span className="text-xs font-bold text-slate-200">{meal.protein || 24}g</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Carbs</span>
                          <span className="text-xs font-bold text-slate-200">{meal.carbs || 32}g</span>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={(e) => { e.stopPropagation(); handleMealSwap(type); }}
                      disabled={isSwapping}
                      className={`absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-slate-700/50 rounded-2xl shadow-sm flex items-center justify-center text-slate-400 hover:text-primary active:scale-90 transition-all border border-slate-600 ${isSwapping ? 'text-primary animate-pulse' : ''}`}
                    >
                      <span className={`material-icons-round text-lg ${isSwapping ? 'animate-spin' : ''}`}>sync</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div className="mt-12 pb-10 px-2">
          <button 
            onClick={() => { console.log("MealPlanner: Syncing Grocery List"); showToast("Smart Grocery List generated."); }}
            className="w-full bg-primary text-black font-black py-5 rounded-[2rem] shadow-2xl flex items-center justify-center gap-4 active:scale-[0.98] transition-transform hover:shadow-primary/20"
          >
            <span className="material-icons-round">shopping_bag</span>
            Sync Smart Grocery List
          </button>
        </div>
      </div>
    </main>
  );
};

export default MealPlanner;
