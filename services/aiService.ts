import { GoogleGenAI, Type as GeminiType } from "@google/genai";
import Groq from "groq-sdk";
import { Meal, Workout, MealPlan } from "../types.ts";

// Internal state
let geminiInstance: GoogleGenAI | null = null;
let groqInstance: Groq | null = null;

const getGemini = () => {
  // Check multiple possible locations for the API key
  // We use string literals for process.env to ensure Vite's 'define' can replace them
  const apiKey = 
    process.env.GEMINI_API_KEY || 
    process.env.VITE_GEMINI_API_KEY ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    (window as any)._GEMINI_API_KEY;

  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    console.warn("AI Service: Gemini API Key not found in any location.");
    return null;
  }
  
  if (!geminiInstance) {
    console.log("AI Service: Initializing Gemini with key starting with:", apiKey.substring(0, 4));
    geminiInstance = new GoogleGenAI({ apiKey });
  }
  return geminiInstance;
};

const getGroq = () => {
  const apiKey = 
    process.env.GROQ_API_KEY || 
    process.env.VITE_GROQ_API_KEY ||
    import.meta.env.VITE_GROQ_API_KEY ||
    (window as any)._GROQ_API_KEY;

  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    return null;
  }
  
  if (!groqInstance) {
    console.log("AI Service: Initializing Groq with key starting with:", apiKey.substring(0, 4));
    groqInstance = new Groq({ apiKey, dangerouslyAllowBrowser: true });
  }
  return groqInstance;
};

export const analyzeFoodImage = async (base64Image: string) => {
  const gemini = getGemini();
  if (gemini) {
    const response = await gemini.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { inlineData: { mimeType: "image/jpeg", data: base64Image } },
        { text: "Analyze this food item. Return the name and estimated nutritional breakdown (calories, protein, carbs, fats per typical serving) in JSON format." }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: GeminiType.OBJECT,
          properties: {
            name: { type: GeminiType.STRING },
            calories: { type: GeminiType.NUMBER },
            protein: { type: GeminiType.NUMBER },
            carbs: { type: GeminiType.NUMBER },
            fats: { type: GeminiType.NUMBER },
            confidence: { type: GeminiType.NUMBER }
          },
          required: ["name", "calories", "protein", "carbs", "fats"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  }

  const groq = getGroq();
  if (groq) {
    const response = await groq.chat.completions.create({
      model: "llama-3.2-11b-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this food item. Return ONLY a JSON object with: name, calories, protein, carbs, fats, confidence." },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
          ]
        }
      ],
      response_format: { type: "json_object" }
    });
    return JSON.parse(response.choices[0].message.content || '{}');
  }

  throw new Error("AI Service missing. Please set GEMINI_API_KEY or GROQ_API_KEY in your Vercel Environment Variables.");
};

export const getAdaptiveWorkout = async (macros: any, goals: string): Promise<Workout> => {
  const gemini = getGemini();
  if (gemini) {
    const response = await gemini.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on current intake: ${JSON.stringify(macros)} and user goal: ${goals}, suggest a specific workout.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: GeminiType.OBJECT,
          properties: {
            name: { type: GeminiType.STRING },
            duration: { type: GeminiType.NUMBER },
            calories: { type: GeminiType.NUMBER },
            intensity: { type: GeminiType.STRING },
            reason: { type: GeminiType.STRING }
          },
          required: ["name", "duration", "calories", "intensity", "reason"]
        }
      }
    });
    const data = JSON.parse(response.text || '{}');
    return {
      ...data,
      intensity: data.intensity?.toLowerCase() === 'high' ? 'high' : data.intensity?.toLowerCase() === 'low' ? 'low' : 'moderate'
    };
  }

  const groq = getGroq();
  if (groq) {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `Based on current intake: ${JSON.stringify(macros)} and user goal: ${goals}, suggest a specific workout. Return ONLY a JSON object with: name, duration (number), calories (number), intensity (low, moderate, or high), reason.`
        }
      ],
      response_format: { type: "json_object" }
    });
    const data = JSON.parse(response.choices[0].message.content || '{}');
    return {
      ...data,
      intensity: data.intensity?.toLowerCase() === 'high' ? 'high' : data.intensity?.toLowerCase() === 'low' ? 'low' : 'moderate'
    };
  }

  throw new Error("AI Service missing.");
};

export const getSmartMealPlan = async (userPreferences: string): Promise<MealPlan> => {
  const gemini = getGemini();
  if (gemini) {
    const response = await gemini.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a premium one-day meal plan for a ${userPreferences} user.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: GeminiType.OBJECT,
          properties: {
            breakfast: { $ref: "#/definitions/meal" },
            lunch: { $ref: "#/definitions/meal" },
            dinner: { $ref: "#/definitions/meal" },
            snack: { $ref: "#/definitions/meal" }
          },
          definitions: {
            meal: {
              type: GeminiType.OBJECT,
              properties: {
                name: { type: GeminiType.STRING },
                kcal: { type: GeminiType.NUMBER },
                protein: { type: GeminiType.NUMBER },
                carbs: { type: GeminiType.NUMBER },
                fats: { type: GeminiType.NUMBER },
                imagePromptKeywords: { type: GeminiType.STRING },
                preparationSteps: { type: GeminiType.ARRAY, items: { type: GeminiType.STRING } },
                customizations: { type: GeminiType.ARRAY, items: { type: GeminiType.STRING } }
              },
              required: ["name", "kcal", "protein", "carbs", "fats", "preparationSteps"]
            }
          },
          required: ["breakfast", "lunch", "dinner", "snack"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  }

  const groq = getGroq();
  if (groq) {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `Generate a premium one-day meal plan for a ${userPreferences} user. Return ONLY a JSON object with breakfast, lunch, dinner, snack. Each meal must have: name, kcal, protein, carbs, fats, imagePromptKeywords, preparationSteps (array), customizations (array).`
        }
      ],
      response_format: { type: "json_object" }
    });
    return JSON.parse(response.choices[0].message.content || '{}');
  }

  throw new Error("AI Service missing.");
};
