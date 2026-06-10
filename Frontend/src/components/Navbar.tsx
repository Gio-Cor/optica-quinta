import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, User, ShoppingCart } from 'lucide-react';
import { Logo } from './Logo';
import { User as UserType } from '../types';

export const Navbar = ({ activeTab, setActiveTab, cartCount, onOpenCart, loggedInUser, onLogout }: { activeTab: string, setActiveTab: (t: string) => void, cartCount: number, onOpenCart: () => void, loggedInUser?: UserType | null, onLogout?: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const tabs = [
    { id: 'home', label: 'Inicio' },
    { id: 'catalog', label: 'Catálogo' },
    { id: 'appointments', label: 'Citas' },
    { id: 'contact', label: 'Contacto' },
  ];

  return (
    <nav className="fixed w-full z-50 bg-accent text-white shadow-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => setActiveTab('home')}
        >
          <Logo className="w-12 h-12 text-white group-hover:rotate-12 transition-transform duration-500" />
          <div className="flex flex-col">
            <span className="text-xl font-sans font-bold tracking-tighter leading-none text-white">OPTICAS</span>
            <span className="text-xl font-sans font-bold tracking-tighter leading-none text-white">QUINTA</span>
            <span className="text-[10px] font-serif italic text-white/80 border-t border-white/30 mt-1">Su óptica</span>
          </div>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex gap-8 items-center">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-sm uppercase tracking-widest transition-colors ${
                activeTab === tab.id ? 'text-white font-semibold border-b border-white' : 'text-white/70 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <div className="h-6 w-px bg-white/30 mx-2 hidden lg:block"></div>
          <button 
            onClick={onOpenCart}
            className="relative p-2 text-white hover:bg-white/10 rounded-full transition-colors focus:outline-none"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-white text-accent w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded-full shadow-md">
                {cartCount}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full border transition-all ${
              activeTab === 'admin'
                ? 'bg-white text-accent border-white font-semibold shadow-md'
                : 'border-white/50 text-white hover:bg-white/10 hover:border-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span className="text-sm uppercase tracking-widest hidden lg:block">
              {loggedInUser ? `Hola, ${loggedInUser.email.split('@')[0]}` : 'Iniciar Sesión'}
            </span>
          </button>
          
          {loggedInUser && (
            <button
               onClick={(e) => {
                 e.stopPropagation();
                 if (onLogout) onLogout();
                 setActiveTab('home');
               }}
               className="text-xs text-white/50 hover:text-white underline underline-offset-4 hidden lg:block"
            >
              Salir
            </button>
          )}
        </div>

        {/* Mobile Toggle & Cart */}
        <div className="md:hidden flex items-center gap-4">
          <button onClick={onOpenCart} className="relative text-white">
            <ShoppingCart className="w-6 h-6" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-white text-accent w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded-full shadow-md">
                {cartCount}
              </span>
            )}
          </button>
          <button className="text-white" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-accent border-b border-white/10 overflow-hidden"
          >
            <div className="flex flex-col p-6 gap-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsOpen(false);
                  }}
                  className={`text-left text-lg font-serif ${
                    activeTab === tab.id ? 'text-white font-semibold' : 'text-white/80 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              <div className="h-px w-full bg-white/20 my-2"></div>
              <button
                onClick={() => {
                  setActiveTab('admin');
                  setIsOpen(false);
                }}
                className={`flex items-center gap-3 text-left text-lg font-serif ${
                  activeTab === 'admin' ? 'text-white font-semibold' : 'text-white/80 hover:text-white'
                }`}
              >
                <User className="w-5 h-5" />
                {loggedInUser ? `Hola, ${loggedInUser.email.split('@')[0]}` : 'Iniciar Sesión'}
              </button>
              {loggedInUser && (
                <button
                  onClick={() => {
                    if (onLogout) onLogout();
                    setActiveTab('home');
                    setIsOpen(false);
                  }}
                  className="text-left text-sm text-white/50 hover:text-white pt-2"
                >
                  Cerrar Sesión
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
