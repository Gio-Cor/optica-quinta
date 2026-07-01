import React, { useState } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { showAlert } from '../utils/swal';
import { supabase } from '../supabaseClient';

export const AuthForm = ({ onLogin }: { onLogin: (token: string, user: User) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [view, setView] = useState<'login' | 'register' | 'forgot'>('login');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (view === 'register') {
        await api.registerUser(username, password);
        showAlert('Cuenta Creada', 'Usuario creado exitosamente. Ahora inicia sesión.', 'success');
        setView('login');
        setPassword('');
      } else {
        // Llama a tu api.ts que devuelve { token, user } directamente
        const data = await api.loginUser(username, password);

        // Ejecuta el inicio de sesión mandando los datos limpios
        onLogin(data.token, data.user);
        setError('');
      }
    } catch (err: any) {
      setError(err.message || 'Error de credenciales');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(username, {
        redirectTo: window.location.origin,
      });

      if (resetError) throw resetError;

      showAlert('Correo Enviado', 'Se ha enviado un correo con instrucciones para restablecer tu contraseña.', 'success');
      setView('login');
    } catch (err: any) {
      setError(err.message || 'Error al enviar el correo de recuperación');
    }
  };

  if (view === 'forgot') {
    return (
      <div className="pt-32 pb-20 px-6 max-w-md mx-auto min-h-screen flex flex-col justify-center">
        <div className="bg-white p-10 rounded-[32px] shadow-2xl border border-ink/10">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-sans font-bold text-ink tracking-tight mb-2">
              Recuperar Contraseña
            </h2>
            <p className="text-ink/60 font-medium">
              Ingresa tu correo para recibir instrucciones de restablecimiento
            </p>
          </div>
          <form onSubmit={handleForgotPassword} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-bold text-ink mb-2">Correo Electrónico</label>
              <input
                type="email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-5 py-4 rounded-xl border-2 border-ink/10 bg-ink/5 text-ink font-medium focus:border-accent focus:bg-white focus:outline-none transition-all placeholder-ink/40"
                placeholder="correo@ejemplo.com"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm font-bold">{error}</p>}
            <button
              type="submit"
              className="mt-4 w-full bg-accent text-white py-4 rounded-xl font-bold text-lg hover:bg-accent/90 transform hover:-translate-y-1 transition-all shadow-lg shadow-accent/30"
            >
              Enviar Instrucciones
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => { setView('login'); setError(''); }}
              className="text-sm text-accent hover:underline font-medium"
            >
              Volver a Iniciar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 px-6 max-w-md mx-auto min-h-screen flex flex-col justify-center">
      <div className="bg-white p-10 rounded-[32px] shadow-2xl border border-ink/10">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-sans font-bold text-ink tracking-tight mb-2">
            {view === 'register' ? 'Crear Cuenta' : 'Iniciar Sesión'}
          </h2>
          <p className="text-ink/60 font-medium">
            {view === 'register' ? 'Regístrate para acceder a tu perfil' : 'Accede a tu cuenta para continuar'}
          </p>
        </div>
        <form onSubmit={handleAuth} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-bold text-ink mb-2">Correo Electrónico</label>
            <input
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-5 py-4 rounded-xl border-2 border-ink/10 bg-ink/5 text-ink font-medium focus:border-accent focus:bg-white focus:outline-none transition-all placeholder-ink/40"
              placeholder="correo@ejemplo.com"
              required
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-bold text-ink">Contraseña</label>
              {view === 'login' && (
                <button
                  type="button"
                  onClick={() => { setView('forgot'); setError(''); }}
                  className="text-xs text-accent hover:underline font-semibold"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              )}
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 rounded-xl border-2 border-ink/10 bg-ink/5 text-ink font-medium focus:border-accent focus:bg-white focus:outline-none transition-all placeholder-ink/40"
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm font-bold">{error}</p>}
          <button
            type="submit"
            className="mt-4 w-full bg-accent text-white py-4 rounded-xl font-bold text-lg hover:bg-accent/90 transform hover:-translate-y-1 transition-all shadow-lg shadow-accent/30"
          >
            {view === 'register' ? 'Registrarse' : 'Ingresar'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => { setView(view === 'register' ? 'login' : 'register'); setError(''); }}
            className="text-sm text-accent hover:underline font-medium"
          >
            {view === 'register' ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate'}
          </button>
        </div>
      </div>
    </div>
  );
};