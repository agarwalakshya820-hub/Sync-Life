
export enum NavTab {
  HOME = 'home',
  LOG = 'log',
  AI_LAB = 'ai-lab',
  PROFILE = 'profile',
  SCANNER = 'scanner'
}

export interface MacroData {
  protein: number;
  carbs: number;
  fats: number;
  calories: number;
}

export interface FoodItem {
  id: string;
  name: string;
  macros: MacroData;
  timestamp: number;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export interface MealPlan {
  breakfast: string;
  lunch: string;
  dinner: string;
  snack: string;
}

export interface Workout {
  name: string;
  duration: number;
  calories: number;
  intensity: 'low' | 'moderate' | 'high';
  reason: string;
}
