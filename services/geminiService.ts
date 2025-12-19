
import { GoogleGenAI, Type } from "@google/genai";
import { Dish, FavoriteSite, IAIService, AIServiceResponse } from '../types';

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
        ? `Prefer these websites if looking externally: ${favoriteSites.map(s => s.name + ' (' + s.url + ')').join(', ')}.`
        : '';
        
      const dishesContext = availableDishes.length > 0
        ? `Available personal dishes: ${availableDishes.map(d => `${d.name} (${d.preparationTime}m prep + ${d.cookingTime}m cook): ${d.description}`).join('; ')}.`
        : 'I currently have no personal dishes saved.';

      const prompt = `
        User Mood/Request: "${mood}"
        Maximum Total Time: ${maxTime ? maxTime + ' minutes' : 'Any'}
        ${dishesContext}
        ${sitesPrompt}

        Logic:
        1. If the user is "tired" or "lazy", prioritize dishes with low "preparationTime" (active effort).
        2. Always respect the Maximum Total Time (preparationTime + cookingTime).
        3. Recommend a personal dish if it fits even remotely well.
        4. If no personal dish fits, perform a Google Search on the favorite sites for a matching recipe.

        Return result in JSON.
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
              estimatedTime: { type: Type.STRING, description: "Total time description e.g. 5m prep + 15m cook" },
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
          dishName: "Error", 
          reasoning: "I encountered an error trying to find a dish.", 
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
          parts: [
            {
              text: `A professional food photography shot of ${name}. ${description}. High quality, appetizing, centered composition, soft lighting.`,
            },
          ],
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
      return null;
    } catch (error) {
      console.error("Image generation failed:", error);
      return null;
    }
  }
}
