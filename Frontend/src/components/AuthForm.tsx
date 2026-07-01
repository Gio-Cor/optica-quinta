import React, { useState } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { showAlert } from '../utils/swal';

export const AuthForm = ({ onLogin }: { onLogin: (token: string, user: User) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isRegistering) {
        await api.registerUser(username, password);
        showAlert('Cuenta Creada', 'Usuario creado exitosamente. Ahora inicia sesión.', 'success');
        setIsRegistering(false);
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

  return (
    <div className="pt-32 pb-20 px-6 max-w-md mx-auto min-h-screen flex flex-col justify-center">
      <div className="bg-white p-10 rounded-[32px] shadow-2xl border border-ink/10">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-sans font-bold text-ink tracking-tight mb-2">
            {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
          </h2>
          <p className="text-ink/60 font-medium">
            {isRegistering ? 'Regístrate para acceder a tu perfil' : 'Accede a tu cuenta para continuar'}
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
            <label className="block text-sm font-bold text-ink mb-2">Contraseña</label>
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
            {isRegistering ? 'Registrarse' : 'Ingresar'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
            className="text-sm text-accent hover:underline font-medium"
          >
            {isRegistering ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate'}
          </button>
        </div>
      </div>
    </div>
  );
};