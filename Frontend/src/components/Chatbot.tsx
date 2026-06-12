import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageCircle, ChevronRight } from 'lucide-react';
import { Logo } from './Logo';
import { chatWithGithubModels } from '../lib/githubChat';

export const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    { role: 'model', text: '¡Hola! Bienvenido a Óptica Quinta. ¿En qué puedo asesorarte hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');

    // 1. Guardamos el mensaje del usuario inmediatamente en la UI
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      // 2. Adaptamos el historial para cumplir las reglas del SDK oficial de GitHub
      // Traducimos 'model' (formato viejo) a 'assistant' (OpenAI SDK)
      const history = messages.map(m => ({
        role: m.role === 'model' ? 'assistant' : 'user',
        content: m.text
      }));

      // 3. Invocamos el conector que creamos con el nuevo endpoint y modelo 'gpt-4o-mini'
      const response = await chatWithGithubModels(userMsg, history);

      // 4. Agregamos la respuesta del asistente virtual al estado de la interfaz
      setMessages(prev => [...prev, { role: 'model', text: response || 'Lo siento, tuve un problema. ¿Podrías repetir?' }]);
    } catch (error) {
      console.error("Error en la interfaz del Chatbot:", error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-4 w-[350px] sm:w-[400px] h-[500px] bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-ink/5"
          >
            {/* Header del Chatbot */}
            <div className="p-6 bg-accent text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Logo className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-sans font-bold leading-tight uppercase tracking-tighter">Opticas Quinta</h4>
                  <p className="text-[10px] uppercase tracking-widest opacity-70">Asistente Virtual</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:rotate-90 transition-transform">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Caja de mensajes en pantalla */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${m.role === 'user' ? 'bg-ink text-paper rounded-br-none' : 'bg-paper text-ink rounded-bl-none'
                    }`}>
                    {m.text}
                  </div>
                </div>
              ))}

              {/* Animación de carga cuando el modelo gpt-4o-mini procesa */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="p-4 rounded-2xl bg-paper text-ink rounded-bl-none">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-ink/20 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-ink/20 rounded-full animate-bounce delay-75" />
                      <div className="w-2 h-2 bg-ink/20 rounded-full animate-bounce delay-150" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Barra inferior de entrada de texto */}
            <div className="p-4 bg-paper/50 flex gap-2">
              <input
                type="text"
                placeholder="Escribe tu consulta..."
                className="flex-1 bg-white rounded-full px-4 py-2 outline-none focus:ring-1 ring-accent"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
              />
              <button
                onClick={handleSend}
                className="bg-accent text-white p-2 rounded-full hover:bg-ink transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón flotante para abrir/cerrar el Chat */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-accent text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="x" initial={{ rotate: -90 }} animate={{ rotate: 0 }} exit={{ rotate: 90 }}>
              <X className="w-8 h-8" />
            </motion.div>
          ) : (
            <motion.div key="msg" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
              <MessageCircle className="w-8 h-8" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
};