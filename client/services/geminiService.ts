
import { GoogleGenAI, Type } from "@google/genai";
import { Dish, FavoriteSite, IAIService, AIServiceResponse } from '../../common/types';

export class GeminiAIService implements IAIService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async getRecommendation(
    mood: string,
    availableDishes: Dish[],
    favoriteSites: FavoriteSite[],
    maxTime?: number
  ): Promise<AIServiceResponse> {
    try {
      const model = 'gemini-3-flash-preview';
      
      const sitesPrompt = favoriteSites.length > 0 
        ? `Prefer these websites for web search: ${favoriteSites.map(s => s.name + ' (' + s.url + ')').join(', ')}.`
        : '';
        
      const dishesContext = availableDishes.length > 0
        ? `User's Dish Library: ${availableDishes.map(d => `${d.name} (${d.preparationTime}m prep + ${d.cookingTime}m cook): ${d.description}`).join('; ')}.`
        : 'The user has no dishes in their personal library.';

      const prompt = `
        User Mood/Request: "${mood}"
        Maximum Allowable Total Time: ${maxTime ? maxTime + ' minutes' : 'No limit'}
        ${dishesContext}
        ${sitesPrompt}

        Instructions:
        1. Analyze user mood. If "tired", prioritize low prepTime.
        2. Strictly obey the maximum total time (prepTime + cookTime).
        3. Recommend a Library Dish first if it fits well.
        4. If no library dish fits, use Google Search to find a recipe from the preferred sites.
        5. Return JSON format.
      `;

      const response = await this.ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              dishName: { type: Type.STRING },
              reasoning: { type: Type.STRING },
              isExternal: { type: Type.BOOLEAN },
              externalUrl: { type: Type.STRING },
              estimatedTime: { type: Type.STRING },
              ingredientsNeeded: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["dishName", "reasoning", "isExternal", "estimatedTime"]
          }
        },
      });

      const result = JSON.parse(response.text || '{}');
      
      if (result.isExternal && !result.externalUrl && response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
          const chunks = response.candidates[0].groundingMetadata.groundingChunks;
          const searchChunk = chunks.find((c: any) => c.web);
          if (searchChunk) {
              result.externalUrl = searchChunk.web.uri;
          }
      }

      return { recommendation: result };
    } catch (error: any) {
      console.error("Gemini Error:", error);
      return { 
        recommendation: { 
          dishName: "Recommendation Unavailable", 
          reasoning: "Failed to connect to AI brain.", 
          isExternal: false, 
          estimatedTime: "N/A" 
        },
        error: error.message 
      };
    }
  }

  async generateDishImage(name: string, description: string): Promise<string | null> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `High-end food photography of ${name}: ${description}. Appetizing, 4k, soft bokeh.` }],
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  }
}
