import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (aiInstance) return aiInstance;
  
  const apiKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("Gemini API key is missing. Please set GEMINI_API_KEY in your environment variables.");
  }
  
  aiInstance = new GoogleGenAI({ apiKey });
  return aiInstance;
};

export const analyzeFoodImage = async (base64Image: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image
        }
      },
      {
        text: "Analyze this food item. Return the name and estimated nutritional breakdown (calories, protein, carbs, fats per typical serving) in JSON format."
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          calories: { type: Type.NUMBER },
          protein: { type: Type.NUMBER },
          carbs: { type: Type.NUMBER },
          fats: { type: Type.NUMBER },
          confidence: { type: Type.NUMBER }
        },
        required: ["name", "calories", "protein", "carbs", "fats"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const getAdaptiveWorkout = async (macros: any, goals: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Based on current intake: ${JSON.stringify(macros)} and user goal: ${goals}, suggest a specific workout.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          duration: { type: Type.NUMBER },
          calories: { type: Type.NUMBER },
          intensity: { type: Type.STRING },
          reason: { type: Type.STRING }
        },
        required: ["name", "duration", "calories", "intensity", "reason"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const getSmartMealPlan = async (userPreferences: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a premium one-day meal plan for a ${userPreferences} user.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          breakfast: { $ref: "#/definitions/meal" },
          lunch: { $ref: "#/definitions/meal" },
          dinner: { $ref: "#/definitions/meal" },
          snack: { $ref: "#/definitions/meal" }
        },
        definitions: {
          meal: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              kcal: { type: Type.NUMBER },
              protein: { type: Type.NUMBER },
              carbs: { type: Type.NUMBER },
              fats: { type: Type.NUMBER },
              imagePromptKeywords: { type: Type.STRING },
              preparationSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
              customizations: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["name", "kcal", "protein", "carbs", "fats", "preparationSteps"]
          }
        },
        required: ["breakfast", "lunch", "dinner", "snack"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};
