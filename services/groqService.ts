import { Groq } from 'groq-sdk';

const getGroqClient = () => {
  // Check both the correct variable and the one the user accidentally used
  let apiKey = import.meta.env.VITE_GROQ_API_KEY;
  const ollamaUrl = import.meta.env.VITE_OLLAMA_URL;

  // If the Ollama URL looks like a Groq key (starts with gsk_), use it as the key
  if (!apiKey && ollamaUrl && ollamaUrl.startsWith('gsk_')) {
    // The user's error showed 'http://gsk_...:11434', so we need to extract just the key
    // We'll strip 'http://' and ':11434' if they are present
    apiKey = ollamaUrl.replace('http://', '').replace('https://', '').split(':')[0];
  }

  if (!apiKey) return null;
  
  return new Groq({ 
    apiKey, 
    dangerouslyAllowBrowser: true 
  });
};

const TEXT_MODEL = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile';
const VISION_MODEL = import.meta.env.VITE_GROQ_VISION_MODEL || 'llama-3.2-11b-vision-preview';

export const analyzeFoodImage = async (base64Image: string) => {
  const groq = getGroqClient();
  if (!groq) throw new Error("Groq API Key missing");

  const response = await groq.chat.completions.create({
    model: VISION_MODEL,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: "Analyze this food item. Return the name and estimated nutritional breakdown (calories, protein, carbs, fats per typical serving) in JSON format. Structure: { 'name': string, 'calories': number, 'protein': number, 'carbs': number, 'fats': number, 'confidence': number }. Ensure the response is ONLY the JSON object." },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
        ]
      }
    ],
    response_format: { type: 'json_object' }
  });

  return JSON.parse(response.choices[0].message.content || '{}');
};

export const getAdaptiveWorkout = async (macros: any, goals: string) => {
  const groq = getGroqClient();
  if (!groq) throw new Error("Groq API Key missing");

  const response = await groq.chat.completions.create({
    model: TEXT_MODEL,
    messages: [
      {
        role: 'user',
        content: `Based on current intake: ${JSON.stringify(macros)} and user goal: ${goals}, suggest a specific workout. Return a JSON object: { 'name': string, 'duration': number, 'calories': number, 'intensity': string, 'reason': string }. Ensure the response is ONLY the JSON object.`
      }
    ],
    response_format: { type: 'json_object' }
  });

  return JSON.parse(response.choices[0].message.content || '{}');
};

export const getSmartMealPlan = async (userPreferences: string) => {
  const groq = getGroqClient();
  if (!groq) throw new Error("Groq API Key missing");

  const response = await groq.chat.completions.create({
    model: TEXT_MODEL,
    messages: [
      {
        role: 'user',
        content: `Generate a premium one-day meal plan for a ${userPreferences} user. 
        Structure: { breakfast: Meal, lunch: Meal, dinner: Meal, snack: Meal }. 
        Each Meal: { name, kcal, protein, carbs, fats, imagePromptKeywords, preparationSteps: string[], customizations: string[] }.
        Ensure the response is ONLY the JSON object.`
      }
    ],
    response_format: { type: 'json_object' }
  });

  return JSON.parse(response.choices[0].message.content || '{}');
};
