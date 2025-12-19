
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import HomeView from './views/HomeView';
import AdminView from './views/AdminView';

const Navbar: React.FC = () => {
  const location = useLocation();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-around items-center z-50 md:top-0 md:bottom-auto md:bg-white/80 md:backdrop-blur-md">
      <Link 
        to="/" 
        className={`flex flex-col items-center gap-1 transition-colors ${location.pathname === '/' ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'}`}
      >
        <i className="fa-solid fa-utensils text-xl"></i>
        <span className="text-xs font-medium">Kitchen</span>
      </Link>
      <Link 
        to="/admin" 
        className={`flex flex-col items-center gap-1 transition-colors ${location.pathname === '/admin' ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'}`}
      >
        <i className="fa-solid fa-gear text-xl"></i>
        <span className="text-xs font-medium">Manage</span>
      </Link>
    </nav>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="min-h-screen pb-20 md:pb-0 md:pt-16">
        <Navbar />
        <main className="max-w-4xl mx-auto p-4 animate-in fade-in duration-500">
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
