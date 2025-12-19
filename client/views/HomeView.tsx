
import React, { useState, useEffect, useMemo } from 'react';
import { GeminiAIService } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { apiService } from '../services/apiService';
import { Recommendation, Dish, FavoriteSite } from '../../common/types';

const HomeView: React.FC = () => {
  const [mood, setMood] = useState('');
  const [maxTime, setMaxTime] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [sites, setSites] = useState<FavoriteSite[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCloud, setIsCloud] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const fetchedDishes = await storageService.getDishes();
        const fetchedSites = await storageService.getSites();
        setDishes(fetchedDishes);
        setSites(fetchedSites);
        setIsCloud(apiService.isBackendAvailable);
      } catch (e) {
        console.error("HomeView load error:", e);
      } finally {
        setInitialLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredDishes = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return dishes.filter(d => 
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5);
  }, [searchQuery, dishes]);

  const handleAsk = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!mood.trim()) return;

    setLoading(true);
    setRecommendation(null);
    
    try {
      const aiService = new GeminiAIService();
      const result = await aiService.getRecommendation(
        mood,
        dishes,
        sites,
        maxTime === '' ? undefined : maxTime
      );
      setRecommendation(result.recommendation);
    } catch (err) {
      console.error("AI Recommendation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectDishManually = (dish: Dish) => {
    setRecommendation({
      dishName: dish.name,
      reasoning: `You chose this signature dish manually from your library.`,
      isExternal: false,
      estimatedTime: `${dish.preparationTime + dish.cookingTime} mins total`,
      ingredientsNeeded: dish.ingredients
    });
    setSearchQuery('');
  };

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <div className="w-16 h-16 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Initializing MoodCook...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="relative text-center space-y-2">
        <div className={`absolute top-0 right-0 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isCloud ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${isCloud ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`}></div>
          {isCloud ? 'Cloud Synced' : 'Offline Mode'}
        </div>
        
        <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4 animate-float">
          <i className="fa-solid fa-utensils text-3xl text-orange-500"></i>
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          Mood<span className="text-orange-500">Cook</span>
        </h1>
        <p className="text-slate-500 font-medium italic">Lunch tailored to your vibe.</p>
      </header>

      <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 border border-slate-100">
        <form onSubmit={handleAsk} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
              What's the mood for lunch?
            </label>
            <textarea
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              placeholder="e.g., Tired but want something healthy and quick..."
              className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all resize-none min-h-[120px] text-slate-900 font-medium placeholder-slate-400"
            />
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:flex-1 space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                Max Time (Mins)
              </label>
              <input
                type="number"
                value={maxTime}
                onChange={(e) => setMaxTime(e.target.value === '' ? '' : parseInt(e.target.value))}
                placeholder="Unlimited"
                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all text-slate-900 font-bold placeholder-slate-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !mood.trim()}
              className="w-full md:w-auto px-10 py-4 bg-orange-500 text-white font-black rounded-2xl hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-orange-500/30 flex items-center justify-center gap-3 uppercase tracking-widest text-sm h-[60px]"
            >
              {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : <><i className="fa-solid fa-wand-magic-sparkles"></i> Chef's Choice</>}
            </button>
          </div>
        </form>
      </div>

      {!loading && !recommendation && (
        <div className="space-y-4">
          <div className="relative group">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500"></i>
            <input 
              type="text"
              placeholder="Or search your personal library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-orange-500 transition-all text-slate-900 font-medium placeholder-slate-400 shadow-sm"
            />
          </div>
          
          {filteredDishes.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in zoom-in-95">
              {filteredDishes.map(dish => (
                <button
                  key={dish.id || dish._id}
                  onClick={() => selectDishManually(dish)}
                  className="w-full px-5 py-4 flex items-center gap-4 hover:bg-orange-50 transition-colors border-b border-slate-50 last:border-0 text-left group"
                >
                  <img src={dish.imageUrl || `https://picsum.photos/seed/${dish.name}/100/100`} className="w-12 h-12 rounded-xl object-cover" alt="" />
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 group-hover:text-orange-600 transition-colors">{dish.name}</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{dish.preparationTime + dish.cookingTime}m total</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center space-y-6 py-20">
          <div className="w-16 h-16 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">AI is planning your meal...</p>
        </div>
      )}

      {recommendation && (
        <div className="animate-in slide-in-from-bottom-12 fade-in duration-700 pb-12">
          <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
            <div className="relative h-64 bg-slate-900 flex items-center justify-center overflow-hidden">
              <img src={`https://picsum.photos/seed/${recommendation.dishName}/800/600`} className="w-full h-full object-cover opacity-60" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
              <div className="absolute top-6 left-6 flex gap-2">
                <span className={`px-4 py-1.5 text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-lg ${recommendation.isExternal ? 'bg-slate-700' : 'bg-orange-500'}`}>
                  {recommendation.isExternal ? 'Web Discovery' : 'Cloud Library'}
                </span>
                <button onClick={() => setRecommendation(null)} className="px-4 py-1.5 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-lg transition-colors">Reset</button>
              </div>
              <div className="absolute bottom-8 left-8 right-8">
                <h2 className="text-4xl font-black text-white leading-tight mb-1">{recommendation.dishName}</h2>
                <p className="text-orange-300 font-bold flex items-center gap-2"><i className="fa-regular fa-clock"></i> {recommendation.estimatedTime}</p>
              </div>
            </div>
            <div className="p-8 space-y-8">
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">The Chef's Advice</h3>
                <p className="text-slate-900 leading-relaxed text-lg font-medium italic bg-orange-50/50 p-6 rounded-3xl">"{recommendation.reasoning}"</p>
              </div>
              {recommendation.isExternal && recommendation.externalUrl && (
                <a href={recommendation.externalUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 w-full py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl active:scale-95">
                  View Full Recipe <i className="fa-solid fa-external-link text-xs opacity-50"></i>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeView;
