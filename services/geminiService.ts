import { GoogleGenAI, Type } from "@google/genai";

const getAIInstance = () => {
  const apiKey = process.env.API_KEY || (window as any).process?.env?.API_KEY;
  return new GoogleGenAI({ apiKey: apiKey });
};

/**
 * Extracts a human-readable error message from various error formats returned by the Gemini SDK.
 */
const handleAIError = (error: any): string => {
  console.error("Gemini API Error Detail:", error);
  
  let message = "An unexpected sync error occurred.";
  
  if (typeof error === 'string') {
    message = error;
  } else if (error.message) {
    message = error.message;
  } else {
    try {
      const errorStr = JSON.stringify(error);
      if (errorStr.includes("quota") || errorStr.includes("429") || errorStr.includes("RESOURCE_EXHAUSTED")) {
        message = "AI Quota exceeded. Using local metabolic protocol.";
      } else {
        message = errorStr;
      }
    } catch (e) {
      message = "Critical synchronization failure.";
    }
  }

  // Final check for common keywords in the extracted message
  if (message.toLowerCase().includes("quota") || message.includes("429")) {
    return "QUOTA_EXHAUSTED: AI capacity reached. Falling back to local optimization.";
  }
  
  return message;
};

export const analyzeFoodImage = async (base64Image: string) => {
  const ai = getAIInstance();
  try {
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

    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error) {
    throw new Error(handleAIError(error));
  }
};

export const getAdaptiveWorkout = async (macros: any, goals: string) => {
  const ai = getAIInstance();
  try {
    const prompt = `Based on current intake: ${JSON.stringify(macros)} and user goal: ${goals}, suggest a specific workout. Explain why it's optimal for their current macro state.`;
    
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
    
    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error) {
    throw new Error(handleAIError(error));
  }
};

export const getSmartMealPlan = async (userPreferences: string) => {
  const ai = getAIInstance();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a premium one-day meal plan for a ${userPreferences} user. Include Breakfast, Lunch, Dinner, and a Snack. 
      For each meal, provide:
      1. A "imagePromptKeywords" string (2-3 visually dominant ingredients).
      2. "preparationSteps" (array of short instructions).
      3. "customizations" (array of 2-3 ways to adjust the meal like 'Low carb: swap quinoa for cauliflower rice').
      4. Full nutritional macros (protein, carbs, fats).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            breakfast: {
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
              required: ["name", "kcal", "protein", "carbs", "fats", "imagePromptKeywords", "preparationSteps", "customizations"]
            },
            lunch: {
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
              required: ["name", "kcal", "protein", "carbs", "fats", "imagePromptKeywords", "preparationSteps", "customizations"]
            },
            dinner: {
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
              required: ["name", "kcal", "protein", "carbs", "fats", "imagePromptKeywords", "preparationSteps", "customizations"]
            },
            snack: {
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
              required: ["name", "kcal", "protein", "carbs", "fats", "imagePromptKeywords", "preparationSteps", "customizations"]
            }
          },
          required: ["breakfast", "lunch", "dinner", "snack"]
        }
      }
    });
    
    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error) {
    throw new Error(handleAIError(error));
  }
};