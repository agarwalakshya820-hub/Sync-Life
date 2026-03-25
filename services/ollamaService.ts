/// <reference types="vite/client" />
import { Ollama } from 'ollama/browser';

const OLLAMA_URL = import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434';
const TEXT_MODEL = import.meta.env.VITE_OLLAMA_MODEL || 'llama3';
const VISION_MODEL = import.meta.env.VITE_OLLAMA_VISION_MODEL || 'llava';

const ollama = new Ollama({ host: OLLAMA_URL });

export const analyzeFoodImage = async (base64Image: string) => {
  try {
    const response = await ollama.generate({
      model: VISION_MODEL,
      prompt: "Analyze this food item. Return the name and estimated nutritional breakdown (calories, protein, carbs, fats per typical serving) in JSON format. Structure: { 'name': string, 'calories': number, 'protein': number, 'carbs': number, 'fats': number, 'confidence': number }. Ensure the response is ONLY the JSON object.",
      images: [base64Image.includes(',') ? base64Image.split(',')[1] : base64Image],
      format: 'json',
      stream: false,
    });
    return JSON.parse(response.response);
  } catch (error) {
    console.error('Ollama Image Analysis Error:', error);
    throw new Error(`Ollama Error: ${error instanceof Error ? error.message : 'Failed to connect to Ollama'}`);
  }
};

export const getAdaptiveWorkout = async (macros: any, goals: string) => {
  try {
    const response = await ollama.generate({
      model: TEXT_MODEL,
      prompt: `Based on current intake: ${JSON.stringify(macros)} and user goal: ${goals}, suggest a specific workout. Return a JSON object: { 'name': string, 'duration': number, 'calories': number, 'intensity': string, 'reason': string }. Ensure the response is ONLY the JSON object.`,
      format: 'json',
      stream: false,
    });
    return JSON.parse(response.response);
  } catch (error) {
    console.error('Ollama Workout Error:', error);
    throw new Error(`Ollama Error: ${error instanceof Error ? error.message : 'Failed to connect to Ollama'}`);
  }
};

export const getSmartMealPlan = async (userPreferences: string) => {
  try {
    const response = await ollama.generate({
      model: TEXT_MODEL,
      prompt: `Generate a premium one-day meal plan for a ${userPreferences} user. 
      Structure: { breakfast: Meal, lunch: Meal, dinner: Meal, snack: Meal }. 
      Each Meal: { name, kcal, protein, carbs, fats, imagePromptKeywords, preparationSteps: string[], customizations: string[] }.
      Ensure the response is ONLY the JSON object.`,
      format: 'json',
      stream: false,
    });
    return JSON.parse(response.response);
  } catch (error) {
    console.error('Ollama Meal Plan Error:', error);
    throw new Error(`Ollama Error: ${error instanceof Error ? error.message : 'Failed to connect to Ollama'}`);
  }
};
