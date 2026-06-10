import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';

export const Hero = ({ onShopNow }: { onShopNow: () => void }) => (
  <section className="pt-32 pb-20 px-6">
    <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        <span className="text-accent uppercase tracking-[0.3em] text-sm font-semibold mb-4 block">Excelencia Alemana</span>
        <h1 className="text-6xl md:text-8xl font-serif leading-none mb-6">
          Visión sin <br />
          <span className="italic">Límites_</span>
        </h1>
        <p className="text-lg text-ink/70 mb-8 max-w-md leading-relaxed">
          Especialistas en cristales <span className="text-ink font-semibold">Rodenstock</span>. 
          Tecnología de precisión para una experiencia visual inigualable en nuestras 3 sucursales.
        </p>
        <div className="flex gap-4">
          <button 
            onClick={onShopNow}
            className="bg-accent text-white px-8 py-4 rounded-full hover:bg-accent/90 transition-all flex items-center gap-2 group shadow-lg shadow-accent/30 transform hover:-translate-y-1"
          >
            Ver Catálogo <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <a 
            href="https://www.rodenstock.cl/"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-ink/20 px-8 py-4 rounded-full hover:border-ink transition-colors inline-block text-center"
          >
            Sobre Rodenstock
          </a>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
        className="relative"
      >
        <div className="aspect-[4/5] rounded-[40px] overflow-hidden rotate-2 hover:rotate-0 transition-transform duration-700 shadow-2xl">
          <img 
            src="/man_glasses_hud.png" 
            alt="Hombre con lentes y tecnología óptica HUD" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute -bottom-6 -left-6 bg-paper p-8 rounded-2xl shadow-xl border border-ink/5 max-w-xs">
          <p className="font-serif italic text-xl">"La visión es el arte de ver lo invisible."</p>
        </div>
      </motion.div>
    </div>
  </section>
);
