import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle } from 'lucide-react';
import { api } from '../services/api';

export const AppointmentSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    service: 'Asesoría y Compra'
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createAppointment(formData as any);
    setSubmitted(true);
  };

  return (
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        <div>
          <h2 className="text-5xl font-serif mb-6">Agenda tu <br /><span className="italic">Cita_</span></h2>
          <p className="text-ink/70 mb-8">
            Nuestros especialistas te esperan para brindarte la mejor asesoría técnica y estética.
            Trae tu receta médica oftalmológica para diseñar tus cristales a medida.
          </p>
          <ul className="space-y-4">
            {[
              "Asesoría y cotización de recetas",
              "Prueba y ajuste del armazón",
              "Asesoría en cristales Rodenstock",
              "Ajuste personalizado de lentes"
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                </div>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-2xl border border-ink/5">
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-10"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-serif mb-2">¡Cita Solicitada!</h3>
              <p className="text-ink/60">Te contactaremos a la brevedad para confirmar.</p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-8 text-accent font-semibold"
              >
                Agendar otra cita
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest font-bold opacity-50">Nombre</label>
                  <input
                    required
                    type="text"
                    className="w-full bg-paper border border-ink/20 rounded-xl px-4 py-3 outline-none focus:border-accent focus:ring-1 ring-accent transition-all"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest font-bold opacity-50">Teléfono</label>
                  <input
                    required
                    type="tel"
                    className="w-full bg-paper border border-ink/20 rounded-xl px-4 py-3 outline-none focus:border-accent focus:ring-1 ring-accent transition-all"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest font-bold opacity-50">Email</label>
                <input
                  required
                  type="email"
                  className="w-full bg-paper border border-ink/20 rounded-xl px-4 py-3 outline-none focus:border-accent focus:ring-1 ring-accent transition-all"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest font-bold opacity-50">Fecha</label>
                  <input
                    required
                    type="date"
                    className="w-full bg-paper border border-ink/20 rounded-xl px-4 py-3 outline-none focus:border-accent focus:ring-1 ring-accent transition-all"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest font-bold opacity-50">Hora</label>
                  <input
                    required
                    type="time"
                    className="w-full bg-paper border border-ink/20 rounded-xl px-4 py-3 outline-none focus:border-accent focus:ring-1 ring-accent transition-all"
                    value={formData.time}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-accent text-white py-4 rounded-xl hover:bg-ink transition-colors font-semibold"
              >
                Confirmar Solicitud
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
