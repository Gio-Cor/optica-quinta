import React from 'react';
import { MapPin, Clock } from 'lucide-react';

export const ContactSection = () => (
  <section className="pt-32 pb-20 px-6 bg-paper">
    <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12">
      <div>
        <h2 className="text-4xl font-serif mb-8 text-ink">Visítanos</h2>
        <div className="space-y-8">
          <div className="flex items-start gap-4">
            <div className="p-4 bg-white rounded-2xl shadow-sm">
              <MapPin className="text-accent" />
            </div>
            <div>
              <h4 className="font-bold mb-3">Nuestras Sucursales</h4>
              <div className="space-y-4">
                <div>
                  <h5 className="font-bold text-[11px] uppercase tracking-wider text-accent">Sucursal Quilpué</h5>
                  <p className="text-ink/60 text-sm">Manuel Bulnes 920, Local 3, Quilpué</p>
                </div>
                <div>
                  <h5 className="font-bold text-[11px] uppercase tracking-wider text-accent">Sucursal Concón</h5>
                  <p className="text-ink/60 text-sm">Av. Manantiales 945, Concón</p>
                </div>
                <div>
                  <h5 className="font-bold text-[11px] uppercase tracking-wider text-accent">Sucursal Quintero</h5>
                  <p className="text-ink/60 text-sm">Cabo Ortiz 149, Quintero</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-4 bg-white rounded-2xl shadow-sm">
              <Clock className="text-accent" />
            </div>
            <div>
              <h4 className="font-bold mb-1">Horario</h4>
              <p className="text-ink/60">Lunes a Viernes: 09:30 - 18:30 <br />Sábados: 10:00 - 14:00</p>
            </div>
          </div>
        </div>
      </div>
      <div className="h-[400px] rounded-[40px] overflow-hidden border-8 border-white shadow-xl">
        {/* Placeholder for Map */}
        <div className="w-full h-full bg-ink/5 flex items-center justify-center relative">
          <div className="text-center p-8">
            <MapPin className="w-12 h-12 text-accent mx-auto mb-4" />
            <p className="font-serif italic text-xl">Mapa Interactivo en Construcción</p>
            <p className="text-sm opacity-50">Localmente mostramos esta vista previa.</p>
          </div>
          <img 
            src="https://picsum.photos/seed/map/800/600" 
            className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </div>
  </section>
);
