/// <reference types="vite/client" />
import { Ollama } from 'ollama/browser';
import * as groqService from './groqService.ts';

const getOllamaUrl = () => {
  let url = import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434';
  
  // Security/Configuration Check:
  // If the user accidentally put an API key (like Groq's gsk_...) in the URL field
  if (url.startsWith('gsk_')) {
    return null; // Signal that this is actually a Groq key
  }

  // Mixed Content Fix:
  // If the app is running on HTTPS (like Vercel), the Ollama URL MUST be HTTPS.
  // We automatically upgrade http to https for remote URLs.
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && url.startsWith('http://') && !url.includes('localhost')) {
    url = url.replace('http://', 'https://');
  }
  
  return url;
};

const TEXT_MODEL = import.meta.env.VITE_OLLAMA_MODEL || 'llama3';
const VISION_MODEL = import.meta.env.VITE_OLLAMA_VISION_MODEL || 'llava';

const getOllamaClient = () => {
  const host = getOllamaUrl();
  if (!host) return null;
  return new Ollama({ host });
};

// Smart AI Selector
const useGroq = () => {
  const groqKey = import.meta.env.VITE_GROQ_API_KEY;
  const ollamaUrl = import.meta.env.VITE_OLLAMA_URL;
  // Use Groq if key is provided OR if the Ollama URL looks like a Groq key
  return !!groqKey || (ollamaUrl && ollamaUrl.startsWith('gsk_'));
};

export const analyzeFoodImage = async (base64Image: string) => {
  if (useGroq()) return groqService.analyzeFoodImage(base64Image);

  try {
    const ollama = getOllamaClient();
    if (!ollama) throw new Error("Ollama configuration missing. Please provide a valid VITE_OLLAMA_URL.");
    
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
    throw new Error(error instanceof Error ? error.message : 'Failed to connect to Ollama');
  }
};

export const getAdaptiveWorkout = async (macros: any, goals: string) => {
  if (useGroq()) return groqService.getAdaptiveWorkout(macros, goals);

  try {
    const ollama = getOllamaClient();
    if (!ollama) throw new Error("Ollama configuration missing. Please provide a valid VITE_OLLAMA_URL.");

    const response = await ollama.generate({
      model: TEXT_MODEL,
      prompt: `Based on current intake: ${JSON.stringify(macros)} and user goal: ${goals}, suggest a specific workout. Return a JSON object: { 'name': string, 'duration': number, 'calories': number, 'intensity': string, 'reason': string }. Ensure the response is ONLY the JSON object.`,
      format: 'json',
      stream: false,
    });
    return JSON.parse(response.response);
  } catch (error) {
    console.error('Ollama Workout Error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to connect to Ollama');
  }
};

export const getSmartMealPlan = async (userPreferences: string) => {
  if (useGroq()) return groqService.getSmartMealPlan(userPreferences);

  try {
    const ollama = getOllamaClient();
    if (!ollama) throw new Error("Ollama configuration missing. Please provide a valid VITE_OLLAMA_URL.");

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
    throw new Error(error instanceof Error ? error.message : 'Failed to connect to Ollama');
  }
};
