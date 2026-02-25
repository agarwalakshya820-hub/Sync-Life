import { GoogleGenAI, Type } from "@google/genai";

/**
 * Extracts a human-readable error message from Gemini API responses.
 * Specifically detects "RESOURCE_EXHAUSTED" or "quota" errors to trigger fallback UI.
 */
const parseAIError = (error: any): string => {
  console.error("Gemini API Error Detail:", error);
  
  const errorString = typeof error === 'string' ? error : (error.message || JSON.stringify(error));
  
  if (
    errorString.includes("quota") || 
    errorString.includes("429") || 
    errorString.includes("RESOURCE_EXHAUSTED") ||
    errorString.includes("limit")
  ) {
    return "QUOTA_EXHAUSTED";
  }

  if (errorString.includes("API key")) {
    return "API_KEY_INVALID: Please ensure your Gemini API key is configured correctly.";
  }
  
  return errorString || "An unexpected sync error occurred.";
};

/**
 * Initializes the AI instance.
 * Throws a clear error if the API key is missing.
 */
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY_MISSING: Environment variable process.env.API_KEY is not defined.");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeFoodImage = async (base64Image: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
            { text: "Analyze this food item. Return the name and estimated nutritional breakdown (calories, protein, carbs, fats per typical serving) in JSON format." }
          ]
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

    return JSON.parse(response.text || "{}");
  } catch (error) {
    throw new Error(parseAIError(error));
  }
};

export const getAdaptiveWorkout = async (macros: any, goals: string) => {
  try {
    const ai = getAI();
    const prompt = `Based on current intake: ${JSON.stringify(macros)} and user goal: ${goals}, suggest a specific workout. Return JSON.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
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
    
    return JSON.parse(response.text || "{}");
  } catch (error) {
    throw new Error(parseAIError(error));
  }
};

export const getSmartMealPlan = async (userPreferences: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a premium one-day meal plan for a ${userPreferences} user. 
      Structure: { breakfast: Meal, lunch: Meal, dinner: Meal, snack: Meal }. 
      Each Meal: { name, kcal, protein, carbs, fats, imagePromptKeywords, preparationSteps: string[], customizations: string[] }.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            breakfast: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, kcal: { type: Type.NUMBER }, protein: { type: Type.NUMBER }, carbs: { type: Type.NUMBER }, fats: { type: Type.NUMBER }, imagePromptKeywords: { type: Type.STRING }, preparationSteps: { type: Type.ARRAY, items: { type: Type.STRING } }, customizations: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["name", "kcal", "protein", "carbs", "fats"] },
            lunch: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, kcal: { type: Type.NUMBER }, protein: { type: Type.NUMBER }, carbs: { type: Type.NUMBER }, fats: { type: Type.NUMBER }, imagePromptKeywords: { type: Type.STRING }, preparationSteps: { type: Type.ARRAY, items: { type: Type.STRING } }, customizations: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["name", "kcal", "protein", "carbs", "fats"] },
            dinner: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, kcal: { type: Type.NUMBER }, protein: { type: Type.NUMBER }, carbs: { type: Type.NUMBER }, fats: { type: Type.NUMBER }, imagePromptKeywords: { type: Type.STRING }, preparationSteps: { type: Type.ARRAY, items: { type: Type.STRING } }, customizations: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["name", "kcal", "protein", "carbs", "fats"] },
            snack: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, kcal: { type: Type.NUMBER }, protein: { type: Type.NUMBER }, carbs: { type: Type.NUMBER }, fats: { type: Type.NUMBER }, imagePromptKeywords: { type: Type.STRING }, preparationSteps: { type: Type.ARRAY, items: { type: Type.STRING } }, customizations: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["name", "kcal", "protein", "carbs", "fats"] }
          },
          required: ["breakfast", "lunch", "dinner", "snack"]
        }
      }
    });
    
    return JSON.parse(response.text || "{}");
  } catch (error) {
    throw new Error(parseAIError(error));
  }
};