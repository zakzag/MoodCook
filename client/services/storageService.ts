
import { Dish, FavoriteSite } from '../../common/types';
import { apiService } from './apiService';

export const storageService = {
  getDishes: () => apiService.getDishes(),
  saveDish: (dish: Partial<Dish>) => apiService.addDish(dish),
  deleteDish: (id: string) => apiService.deleteDish(id),
  getSites: () => apiService.getSites(),
  saveSite: (site: Partial<FavoriteSite>) => apiService.addSite(site),
  deleteSite: (id: string) => apiService.deleteSite(id)
};
