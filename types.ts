
export interface Dish {
  id: string;
  _id?: string;
  name: string;
  description: string;
  preparationTime: number; // Active prep (chopping, etc.)
  cookingTime: number; // Passive/Active cooking (boiling, baking, etc.)
  category: string;
  imageUrl?: string;
  ingredients: string[];
}

export interface FavoriteSite {
  id: string;
  _id?: string;
  name: string;
  url: string;
}

export interface Recommendation {
  dishName: string;
  reasoning: string;
  isExternal: boolean;
  externalUrl?: string;
  estimatedTime: string;
  ingredientsNeeded?: string[];
}

export interface AIServiceResponse {
  recommendation: Recommendation;
  error?: string;
}

export interface IAIService {
  getRecommendation(
    mood: string,
    availableDishes: Dish[],
    favoriteSites: FavoriteSite[],
    maxTime?: number
  ): Promise<AIServiceResponse>;
  
  generateDishImage(name: string, description: string): Promise<string | null>;
}
