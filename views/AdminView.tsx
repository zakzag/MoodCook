
import React, { useState, useEffect, useRef } from 'react';
import { storageService } from '../services/storageService';
import { GeminiAIService } from '../services/geminiService';
import { Dish, FavoriteSite } from '../types';

const AdminView: React.FC = () => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [sites, setSites] = useState<FavoriteSite[]>([]);
  const [activeTab, setActiveTab] = useState<'dishes' | 'sites'>('dishes');
  const [isLoading, setIsLoading] = useState(true);
  
  const [newDish, setNewDish] = useState<Partial<Dish>>({ 
    name: '', 
    description: '', 
    preparationTime: 10, 
    cookingTime: 15,
    imageUrl: '',
    ingredients: [] 
  });
  const [newSite, setNewSite] = useState<Partial<FavoriteSite>>({ name: '', url: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [fetchedDishes, fetchedSites] = await Promise.all([
      storageService.getDishes(),
      storageService.getSites()
    ]);
    setDishes(fetchedDishes);
    setSites(fetchedSites);
    setIsLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewDish(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const generateAIImage = async () => {
    if (!newDish.name) return;
    setIsGeneratingImage(true);
    const aiService = new GeminiAIService();
    const generatedUrl = await aiService.generateDishImage(newDish.name, newDish.description || '');
    if (generatedUrl) {
      setNewDish(prev => ({ ...prev, imageUrl: generatedUrl }));
    }
    setIsGeneratingImage(false);
  };

  const handleAddDish = async () => {
    if (!newDish.name) return;
    setIsSubmitting(true);
    
    // Final check for image: if none, use a placeholder
    const finalImageUrl = newDish.imageUrl || `https://picsum.photos/seed/${encodeURIComponent(newDish.name)}/400/300`;

    const added = await storageService.saveDish({
      ...newDish,
      category: 'General',
      imageUrl: finalImageUrl
    });
    
    if (added) {
      setDishes([...dishes, added]);
      setNewDish({ name: '', description: '', preparationTime: 10, cookingTime: 15, imageUrl: '', ingredients: [] });
      setShowAddForm(false);
    }
    setIsSubmitting(false);
  };

  const handleAddSite = async () => {
    if (!newSite.name || !newSite.url) return;
    setIsSubmitting(true);
    const added = await storageService.saveSite(newSite);
    if (added) {
      setSites([...sites, added]);
      setNewSite({ name: '', url: '' });
      setShowAddForm(false);
    }
    setIsSubmitting(false);
  };

  const removeDish = async (id: string) => {
    const success = await storageService.deleteDish(id);
    if (success) setDishes(dishes.filter(d => (d.id || (d as any)._id) !== id));
  };

  const removeSite = async (id: string) => {
    const success = await storageService.deleteSite(id);
    if (success) setSites(sites.filter(s => (s.id || (s as any)._id) !== id));
  };

  return (
    <div className="py-6 space-y-8 animate-in fade-in duration-700">
      <header className="flex justify-between items-end px-2">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Admin Panel</h1>
          <p className="text-slate-500 font-medium italic">Synced with your culinary cloud</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all active:scale-90 ${showAddForm ? 'bg-slate-900 text-white' : 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-500/30'}`}
        >
          <i className={`fa-solid ${showAddForm ? 'fa-xmark' : 'fa-plus'} text-xl`}></i>
        </button>
      </header>

      <div className="flex bg-slate-100 p-1.5 rounded-3xl border border-slate-200">
        <button 
          onClick={() => setActiveTab('dishes')}
          className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'dishes' ? 'bg-white shadow-lg text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
        >
          My Kitchen ({dishes.length})
        </button>
        <button 
          onClick={() => setActiveTab('sites')}
          className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'sites' ? 'bg-white shadow-lg text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Search Sources ({sites.length})
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300 overflow-hidden">
          <h2 className="font-black text-2xl mb-8 text-slate-900 flex items-center gap-2">
            <i className={`fa-solid ${activeTab === 'dishes' ? 'fa-mortar-pestle' : 'fa-globe'} text-orange-500`}></i>
            Add New {activeTab === 'dishes' ? 'Dish' : 'Source'}
          </h2>
          
          {activeTab === 'dishes' ? (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Image Section */}
                <div className="w-full md:w-48 space-y-3">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 transition-colors overflow-hidden relative group"
                  >
                    {newDish.imageUrl ? (
                      <img src={newDish.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <>
                        <i className="fa-solid fa-camera text-2xl text-slate-300 mb-2"></i>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Upload</span>
                      </>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <i className="fa-solid fa-pen text-white"></i>
                    </div>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                  />
                  <button 
                    onClick={generateAIImage}
                    disabled={!newDish.name || isGeneratingImage}
                    className="w-full py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {isGeneratingImage ? (
                      <i className="fa-solid fa-spinner animate-spin"></i>
                    ) : (
                      <i className="fa-solid fa-wand-magic-sparkles text-orange-400"></i>
                    )}
                    AI Generate
                  </button>
                </div>

                {/* Info Section */}
                <div className="flex-1 space-y-4">
                  <input 
                    placeholder="Dish Name (e.g., Quick Pesto Pasta)"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold outline-none focus:border-orange-500 transition-colors"
                    value={newDish.name}
                    onChange={e => setNewDish({...newDish, name: e.target.value})}
                  />
                  <textarea 
                    placeholder="Brief description of the flavors or vibe..."
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 min-h-[100px] outline-none focus:border-orange-500 transition-colors resize-none"
                    value={newDish.description}
                    onChange={e => setNewDish({...newDish, description: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Prep Time (Min)</label>
                  <div className="relative">
                    <i className="fa-solid fa-knife absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
                    <input 
                      type="number"
                      className="w-full pl-10 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold outline-none focus:border-orange-500 transition-colors"
                      value={newDish.preparationTime}
                      onChange={e => setNewDish({...newDish, preparationTime: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cooking Time (Min)</label>
                  <div className="relative">
                    <i className="fa-solid fa-fire absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
                    <input 
                      type="number"
                      className="w-full pl-10 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold outline-none focus:border-orange-500 transition-colors"
                      value={newDish.cookingTime}
                      onChange={e => setNewDish({...newDish, cookingTime: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <button 
                    disabled={isSubmitting || !newDish.name}
                    onClick={handleAddDish}
                    className="w-full h-[60px] bg-orange-500 text-white font-black rounded-2xl hover:bg-orange-600 disabled:opacity-50 shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <i className="fa-solid fa-spinner animate-spin"></i>
                    ) : (
                      <>
                        <i className="fa-solid fa-cloud-arrow-up"></i>
                        Save to Kitchen
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className="text-center">
                <span className="text-xs font-bold text-slate-400">Total estimated time: <span className="text-orange-500">{(newDish.preparationTime || 0) + (newDish.cookingTime || 0)} minutes</span></span>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <input 
                placeholder="Website Name (e.g., Serious Eats)"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold outline-none focus:border-orange-500"
                value={newSite.name}
                onChange={e => setNewSite({...newSite, name: e.target.value})}
              />
              <input 
                placeholder="Domain (e.g., seriouseats.com)"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold outline-none focus:border-orange-500"
                value={newSite.url}
                onChange={e => setNewSite({...newSite, url: e.target.value})}
              />
              <button 
                disabled={isSubmitting || !newSite.name || !newSite.url}
                onClick={handleAddSite}
                className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl disabled:opacity-50 hover:bg-black transition-all shadow-xl"
              >
                {isSubmitting ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Add Site'}
              </button>
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="py-20 flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin"></div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Loading Kitchen Data...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {activeTab === 'dishes' ? (
            dishes.map(dish => (
              <div key={dish.id || (dish as any)._id} className="bg-white p-5 rounded-[2rem] flex items-center gap-5 shadow-sm border border-slate-100 group hover:shadow-xl transition-all animate-in slide-in-from-left-4">
                <div className="relative w-20 h-20 shrink-0">
                  <img src={dish.imageUrl || `https://picsum.photos/seed/${dish.name}/200/200`} className="w-full h-full rounded-2xl object-cover" alt="" />
                  <div className="absolute -top-2 -right-2 bg-white text-orange-500 text-[10px] font-black px-2 py-1 rounded-full shadow-md border border-slate-100">
                    {dish.preparationTime + dish.cookingTime}'
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 text-lg truncate group-hover:text-orange-500 transition-colors">{dish.name}</h3>
                  <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-tighter mt-1">
                    <span className="flex items-center gap-1"><i className="fa-solid fa-knife"></i> {dish.preparationTime}m prep</span>
                    <span className="text-slate-200">|</span>
                    <span className="flex items-center gap-1"><i className="fa-solid fa-fire"></i> {dish.cookingTime}m cook</span>
                  </div>
                </div>
                <button 
                  onClick={() => removeDish(dish.id || (dish as any)._id)}
                  className="w-12 h-12 rounded-xl bg-slate-50 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                >
                  <i className="fa-solid fa-trash-can"></i>
                </button>
              </div>
            ))
          ) : (
            sites.map(site => (
              <div key={site.id || (site as any)._id} className="bg-white p-5 rounded-[2rem] flex items-center justify-between shadow-sm border border-slate-100 animate-in slide-in-from-left-4">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                    <i className="fa-solid fa-earth-americas text-2xl"></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{site.name}</h3>
                    <p className="text-slate-400 text-xs font-bold">{site.url}</p>
                  </div>
                </div>
                <button 
                  onClick={() => removeSite(site.id || (site as any)._id)}
                  className="w-12 h-12 rounded-xl bg-slate-50 text-slate-300 hover:text-red-500"
                >
                  <i className="fa-solid fa-trash-can"></i>
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AdminView;
