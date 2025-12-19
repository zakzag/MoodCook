
import React, { useState, useEffect, useRef } from 'react';
import { storageService } from '../services/storageService';
import { GeminiAIService } from '../services/geminiService';
import { Dish, FavoriteSite } from '../../common/types';

const AdminView: React.FC = () => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [sites, setSites] = useState<FavoriteSite[]>([]);
  const [activeTab, setActiveTab] = useState<'dishes' | 'sites'>('dishes');
  const [isLoading, setIsLoading] = useState(true);
  
  const [newDish, setNewDish] = useState<Partial<Dish>>({ name: '', description: '', preparationTime: 10, cookingTime: 15, imageUrl: '', ingredients: [] });
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
    const [fetchedDishes, fetchedSites] = await Promise.all([storageService.getDishes(), storageService.getSites()]);
    setDishes(fetchedDishes);
    setSites(fetchedSites);
    setIsLoading(false);
  };

  const handleAddDish = async () => {
    if (!newDish.name) return;
    setIsSubmitting(true);
    const finalImageUrl = newDish.imageUrl || `https://picsum.photos/seed/${encodeURIComponent(newDish.name)}/400/300`;
    const added = await storageService.saveDish({ ...newDish, category: 'General', imageUrl: finalImageUrl });
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
    if (await storageService.deleteDish(id)) setDishes(dishes.filter(d => (d.id || (d as any)._id) !== id));
  };

  const removeSite = async (id: string) => {
    if (await storageService.deleteSite(id)) setSites(sites.filter(s => (s.id || (s as any)._id) !== id));
  };

  return (
    <div className="py-6 space-y-8 animate-in fade-in duration-700">
      <header className="flex justify-between items-end px-2">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Admin</h1>
          <p className="text-slate-500 font-medium italic">Manage your kitchen assets</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all active:scale-90 ${showAddForm ? 'bg-slate-900 text-white' : 'bg-orange-500 text-white shadow-orange-500/30'}`}
        >
          <i className={`fa-solid ${showAddForm ? 'fa-xmark' : 'fa-plus'} text-xl`}></i>
        </button>
      </header>

      <div className="flex bg-slate-100 p-1.5 rounded-3xl border border-slate-200">
        <button onClick={() => setActiveTab('dishes')} className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'dishes' ? 'bg-white shadow-lg text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>My Kitchen ({dishes.length})</button>
        <button onClick={() => setActiveTab('sites')} className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'sites' ? 'bg-white shadow-lg text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>Web Sources ({sites.length})</button>
      </div>

      {showAddForm && (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 animate-in zoom-in-95">
          <h2 className="font-black text-2xl mb-8 text-slate-900">New {activeTab === 'dishes' ? 'Dish' : 'Source'}</h2>
          {activeTab === 'dishes' ? (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-48 space-y-3">
                  <div onClick={() => fileInputRef.current?.click()} className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center cursor-pointer overflow-hidden">
                    {newDish.imageUrl ? <img src={newDish.imageUrl} className="w-full h-full object-cover" /> : <i className="fa-solid fa-camera text-2xl text-slate-300"></i>}
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                    const reader = new FileReader();
                    reader.onload = () => setNewDish({...newDish, imageUrl: reader.result as string});
                    if (e.target.files?.[0]) reader.readAsDataURL(e.target.files[0]);
                  }} />
                  <button onClick={async () => {
                    if (!newDish.name) return;
                    setIsGeneratingImage(true);
                    const url = await new GeminiAIService().generateDishImage(newDish.name, newDish.description || '');
                    if (url) setNewDish({...newDish, imageUrl: url});
                    setIsGeneratingImage(false);
                  }} className="w-full py-2 bg-slate-900 text-white text-[10px] font-black uppercase rounded-xl disabled:opacity-50">
                    {isGeneratingImage ? <i className="fa-solid fa-spinner animate-spin"></i> : 'AI Generate'}
                  </button>
                </div>
                <div className="flex-1 space-y-4">
                  <input placeholder="Dish Name" className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 font-bold outline-none focus:border-orange-500" value={newDish.name} onChange={e => setNewDish({...newDish, name: e.target.value})} />
                  <textarea placeholder="Brief description..." className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 min-h-[100px] outline-none focus:border-orange-500 resize-none font-medium" value={newDish.description} onChange={e => setNewDish({...newDish, description: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <input type="number" placeholder="Prep (min)" className="px-5 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 font-bold outline-none" value={newDish.preparationTime} onChange={e => setNewDish({...newDish, preparationTime: parseInt(e.target.value) || 0})} />
                <input type="number" placeholder="Cook (min)" className="px-5 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 font-bold outline-none" value={newDish.cookingTime} onChange={e => setNewDish({...newDish, cookingTime: parseInt(e.target.value) || 0})} />
                <button disabled={isSubmitting || !newDish.name} onClick={handleAddDish} className="col-span-2 md:col-span-1 py-4 bg-orange-500 text-white font-black rounded-2xl active:scale-95 transition-all">Save Dish</button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <input placeholder="Website Name" className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 font-bold outline-none" value={newSite.name} onChange={e => setNewSite({...newSite, name: e.target.value})} />
              <input placeholder="Domain" className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 font-bold outline-none" value={newSite.url} onChange={e => setNewSite({...newSite, url: e.target.value})} />
              <button disabled={isSubmitting || !newSite.name || !newSite.url} onClick={handleAddSite} className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl">Add Source</button>
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="py-20 flex justify-center"><div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div></div>
      ) : (
        <div className="grid gap-4">
          {activeTab === 'dishes' ? dishes.map(d => (
            <div key={d.id || (d as any)._id} className="bg-white p-5 rounded-[2.5rem] flex items-center gap-5 shadow-sm border border-slate-100 group">
              <img src={d.imageUrl || `https://picsum.photos/seed/${d.name}/200/200`} className="w-20 h-20 rounded-2xl object-cover" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 text-lg truncate group-hover:text-orange-500 transition-colors">{d.name}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{d.preparationTime}m prep + {d.cookingTime}m cook</p>
              </div>
              <button onClick={() => removeDish(d.id || (d as any)._id)} className="w-12 h-12 rounded-xl bg-slate-50 text-slate-300 hover:text-red-500 transition-colors"><i className="fa-solid fa-trash-can"></i></button>
            </div>
          )) : sites.map(s => (
            <div key={s.id || (s as any)._id} className="bg-white p-6 rounded-[2.5rem] flex items-center justify-between shadow-sm border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400"><i className="fa-solid fa-link"></i></div>
                <div><h3 className="font-bold text-slate-900">{s.name}</h3><p className="text-slate-400 text-[10px] font-bold">{s.url}</p></div>
              </div>
              <button onClick={() => removeSite(s.id || (s as any)._id)} className="w-12 h-12 rounded-xl bg-slate-50 text-slate-300 hover:text-red-500"><i className="fa-solid fa-trash-can"></i></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminView;
