import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import { showAlert } from '../utils/swal';

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

  const getTomorrowStr = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getAvailableTimes = (dateStr: string) => {
    if (!dateStr) return [];
    const selectedDate = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = selectedDate.getDay(); // 0 = Domingo, 6 = Sábado, 1-5 = Lunes-Viernes

    if (dayOfWeek === 0) return []; // Cerrado los domingos

    const slots: string[] = [];

    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      // Lunes a Viernes: 09:30 - 18:30 con exclusión de 14:00 a 15:00
      let currentHour = 9;
      let currentMinute = 30;
      
      while (currentHour < 18 || (currentHour === 18 && currentMinute <= 30)) {
        const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
        
        // Bloquear entre 14:00 y 15:00 (las 14:00 y 14:30)
        if (currentHour !== 14) {
          slots.push(timeStr);
        }

        currentMinute += 30;
        if (currentMinute >= 60) {
          currentHour += 1;
          currentMinute = 0;
        }
      }
    } else if (dayOfWeek === 6) {
      // Sábados: 10:00 - 14:00
      let currentHour = 10;
      let currentMinute = 0;

      while (currentHour < 14 || (currentHour === 14 && currentMinute === 0)) {
        const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
        slots.push(timeStr);

        currentMinute += 30;
        if (currentMinute >= 60) {
          currentHour += 1;
          currentMinute = 0;
        }
      }
    }

    return slots;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validar que la fecha sea desde mañana en adelante
    const selectedDate = new Date(formData.date + 'T00:00:00');
    const tomorrowDate = new Date();
    tomorrowDate.setHours(0, 0, 0, 0);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);

    if (selectedDate < tomorrowDate) {
      showAlert('Fecha no válida', 'Las citas solo se pueden agendar a partir del día de mañana.', 'warning');
      return;
    }

    // 2. Validar que no sea día domingo (cerrado)
    const dayOfWeek = selectedDate.getDay(); // 0 = Domingo, 6 = Sábado, 1-5 = Lunes-Viernes
    if (dayOfWeek === 0) {
      showAlert('Tienda Cerrada', 'Los domingos la tienda está cerrada. Por favor elige otro día de lunes a sábado.', 'warning');
      return;
    }

    // 3. Validar horario correspondiente al día
    const [hoursStr, minutesStr] = formData.time.split(':');
    const selectedTimeInMinutes = parseInt(hoursStr) * 60 + parseInt(minutesStr);

    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      // Lunes a Viernes: 09:30 - 18:30
      const openMinutes = 9 * 60 + 30; // 09:30
      const closeMinutes = 18 * 60 + 30; // 18:30
      if (selectedTimeInMinutes < openMinutes || selectedTimeInMinutes > closeMinutes) {
        showAlert('Horario no disponible', 'De lunes a viernes, el horario de citas es de 09:30 a 18:30.', 'warning');
        return;
      }
    } else if (dayOfWeek === 6) {
      // Sábados: 10:00 - 14:00
      const openMinutes = 10 * 60; // 10:00
      const closeMinutes = 14 * 60; // 14:00
      if (selectedTimeInMinutes < openMinutes || selectedTimeInMinutes > closeMinutes) {
        showAlert('Horario no disponible', 'Los días sábados, el horario de citas es de 10:00 a 14:00.', 'warning');
        return;
      }
    }

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
                    min={getTomorrowStr()}
                    className="w-full bg-paper border border-ink/20 rounded-xl px-4 py-3 outline-none focus:border-accent focus:ring-1 ring-accent transition-all text-xs font-bold text-ink"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value, time: '' })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest font-bold opacity-50">Hora</label>
                  <select
                    required
                    className="w-full bg-paper border border-ink/20 rounded-xl px-4 py-3 outline-none focus:border-accent focus:ring-1 ring-accent transition-all text-xs font-bold text-ink"
                    value={formData.time}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                    disabled={!formData.date}
                  >
                    <option value="">
                      {!formData.date 
                        ? 'Elige fecha' 
                        : getAvailableTimes(formData.date).length === 0 
                        ? 'Cerrado (Dom)' 
                        : 'Selecciona hora'}
                    </option>
                    {getAvailableTimes(formData.date).map(time => (
                      <option key={time} value={time}>
                        {time} hrs
                      </option>
                    ))}
                  </select>
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
