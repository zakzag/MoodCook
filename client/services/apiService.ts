
import { Dish, FavoriteSite } from '../../common/types';
import { config } from '../../common/config';

const BASE_URL = config.api.baseUrl;

const getLocal = (key: string) => JSON.parse(localStorage.getItem(key) || '[]');
const setLocal = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));

export const apiService = {
  isBackendAvailable: true,

  async getDishes(): Promise<Dish[]> {
    try {
      const response = await fetch(`${BASE_URL}/dishes`);
      if (!response.ok) throw new Error('Backend error');
      const data = await response.json();
      this.isBackendAvailable = true;
      setLocal('fallback_dishes', data);
      return data;
    } catch (error) {
      console.warn("Backend unreachable, using local storage fallback.");
      this.isBackendAvailable = false;
      return getLocal('fallback_dishes');
    }
  },

  async addDish(dish: Partial<Dish>): Promise<Dish> {
    try {
      const response = await fetch(`${BASE_URL}/dishes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dish),
      });
      this.isBackendAvailable = true;
      return await response.json();
    } catch (error) {
      this.isBackendAvailable = false;
      const local = getLocal('fallback_dishes');
      const newDish = { ...dish, id: Date.now().toString(), _id: Date.now().toString() } as Dish;
      setLocal('fallback_dishes', [...local, newDish]);
      return newDish;
    }
  },

  // Fix: Changed return type to Promise<boolean> to allow truthiness testing in view components
  async deleteDish(id: string): Promise<boolean> {
    try {
      await fetch(`${BASE_URL}/dishes/${id}`, { method: 'DELETE' });
      return true;
    } catch (error) {
      // Even in fallback mode, we perform the deletion locally and return true to indicate intent was handled
      const local = getLocal('fallback_dishes');
      setLocal('fallback_dishes', local.filter((d: any) => (d.id !== id && d._id !== id)));
      return true;
    }
  },

  async getSites(): Promise<FavoriteSite[]> {
    try {
      const response = await fetch(`${BASE_URL}/sites`);
      if (!response.ok) throw new Error('Backend error');
      const data = await response.json();
      setLocal('fallback_sites', data);
      return data;
    } catch (error) {
      return getLocal('fallback_sites');
    }
  },

  async addSite(site: Partial<FavoriteSite>): Promise<FavoriteSite> {
    try {
      const response = await fetch(`${BASE_URL}/sites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(site),
      });
      return await response.json();
    } catch (error) {
      const local = getLocal('fallback_sites');
      const newSite = { ...site, id: Date.now().toString(), _id: Date.now().toString() } as FavoriteSite;
      setLocal('fallback_sites', [...local, newSite]);
      return newSite;
    }
  },

  // Fix: Changed return type to Promise<boolean> to allow truthiness testing in view components
  async deleteSite(id: string): Promise<boolean> {
    try {
      await fetch(`${BASE_URL}/sites/${id}`, { method: 'DELETE' });
      return true;
    } catch (error) {
      // Even in fallback mode, we perform the deletion locally and return true to indicate intent was handled
      const local = getLocal('fallback_sites');
      setLocal('fallback_sites', local.filter((s: any) => (s.id !== id && s._id !== id)));
      return true;
    }
  }
};
