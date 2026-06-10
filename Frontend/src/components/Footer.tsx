import React from 'react';
import { Instagram, MapPin } from 'lucide-react';
import { Logo } from './Logo';

interface FooterProps {
  setActiveTab?: (tab: string) => void;
}

export const Footer = ({ setActiveTab }: FooterProps) => (
  <footer className="bg-ink text-paper/40 py-20 px-6">
    <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
      <div className="md:col-span-2">
        <div 
          className="flex items-center gap-3 mb-6 text-white group cursor-pointer" 
          onClick={() => {
            if (setActiveTab) setActiveTab('home');
            window.scrollTo({top: 0, behavior: 'smooth'});
          }}
        >
          <Logo className="w-12 h-12 text-accent" />
          <div className="flex flex-col">
            <span className="text-xl font-sans font-bold tracking-tighter leading-none text-white">OPTICAS</span>
            <span className="text-xl font-sans font-bold tracking-tighter leading-none text-white">QUINTA</span>
          </div>
        </div>
        <p className="max-w-md mb-8">
          Pasión por la salud visual. Especialistas Rodenstock en Quilpué, 
          llevando la mejor tecnología alemana a tus ojos.
        </p>
        <div className="flex gap-4">
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-paper/10 flex items-center justify-center hover:border-paper transition-colors">
            <Instagram className="w-5 h-5" />
          </a>
        </div>
      </div>
      <div>
        <h5 className="text-paper font-bold mb-4 uppercase tracking-widest text-xs">Menú</h5>
        <ul className="space-y-2">
          <li><a href="#" onClick={(e) => { e.preventDefault(); if (setActiveTab) { setActiveTab('home'); window.scrollTo({top: 0, behavior: 'smooth'}); } }} className="hover:text-paper transition-colors">Inicio</a></li>
          <li><a href="#" onClick={(e) => { e.preventDefault(); if (setActiveTab) { setActiveTab('catalog'); window.scrollTo({top: 0, behavior: 'smooth'}); } }} className="hover:text-paper transition-colors">Catálogo</a></li>
          <li><a href="#" onClick={(e) => { e.preventDefault(); if (setActiveTab) { setActiveTab('appointments'); window.scrollTo({top: 0, behavior: 'smooth'}); } }} className="hover:text-paper transition-colors">Citas</a></li>
          <li><a href="#" onClick={(e) => { e.preventDefault(); if (setActiveTab) { setActiveTab('admin'); window.scrollTo({top: 0, behavior: 'smooth'}); } }} className="hover:text-paper transition-colors">Mi Cuenta</a></li>
        </ul>
      </div>
      <div>
        <h5 className="text-paper font-bold mb-4 uppercase tracking-widest text-xs">Contacto</h5>
        <ul className="space-y-4 text-sm">
          <li className="flex items-center gap-2 text-paper">
            <MapPin className="w-4 h-4" /> Manuel Bulnes 920, Quilpué
          </li>
          <li>contacto@opticaquinta.cl</li>
        </ul>
      </div>
    </div>
    <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-paper/5 text-center text-xs">
      © 2026 Óptica Quinta. Todos los derechos reservados.
    </div>
  </footer>
);
