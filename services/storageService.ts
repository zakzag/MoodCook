
import { Dish, FavoriteSite } from '../types';
import { apiService } from './apiService';

// This service now acts as a high-level wrapper for the API
export const storageService = {
  getDishes: async (): Promise<Dish[]> => {
    try {
      return await apiService.getDishes();
    } catch (error) {
      console.error("Failed to fetch dishes:", error);
      return [];
    }
  },
  
  saveDish: async (dish: Partial<Dish>): Promise<Dish | null> => {
    try {
      return await apiService.addDish(dish);
    } catch (error) {
      console.error("Failed to save dish:", error);
      return null;
    }
  },

  deleteDish: async (id: string): Promise<boolean> => {
    try {
      await apiService.deleteDish(id);
      return true;
    } catch (error) {
      return false;
    }
  },

  getSites: async (): Promise<FavoriteSite[]> => {
    try {
      return await apiService.getSites();
    } catch (error) {
      return [];
    }
  },

  saveSite: async (site: Partial<FavoriteSite>): Promise<FavoriteSite | null> => {
    try {
      return await apiService.addSite(site);
    } catch (error) {
      return null;
    }
  },

  deleteSite: async (id: string): Promise<boolean> => {
    try {
      await apiService.deleteSite(id);
      return true;
    } catch (error) {
      return false;
    }
  }
};
