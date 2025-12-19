
import React from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import HomeView from './views/HomeView';
import AdminView from './views/AdminView';

const Navbar: React.FC = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-100 px-6 py-4 flex justify-around items-center z-50 md:top-0 md:bottom-auto">
      <Link to="/" className={`flex flex-col items-center gap-1 transition-all ${isActive('/') ? 'text-orange-500 scale-110' : 'text-slate-400 hover:text-slate-600'}`}>
        <i className="fa-solid fa-utensils text-xl"></i>
        <span className="text-[10px] font-black uppercase tracking-widest">Kitchen</span>
      </Link>
      <Link to="/admin" className={`flex flex-col items-center gap-1 transition-all ${isActive('/admin') ? 'text-orange-500 scale-110' : 'text-slate-400 hover:text-slate-600'}`}>
        <i className="fa-solid fa-screwdriver-wrench text-xl"></i>
        <span className="text-[10px] font-black uppercase tracking-widest">Admin</span>
      </Link>
    </nav>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="min-h-screen pb-24 md:pb-0 md:pt-20 bg-[#f8fafc]">
        <Navbar />
        <main className="max-w-4xl mx-auto p-4">
          <Routes>
            <Route path="/" element={<HomeView />} />
            <Route path="/admin" element={<AdminView />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
