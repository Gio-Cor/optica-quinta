import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { showAlert } from '../utils/swal';

export const ResetPasswordForm = ({ onComplete }: { onComplete: () => void }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Las contraseñas no coinciden');
    }

    if (password.length < 6) {
      return setError('La contraseña debe tener al menos 6 caracteres');
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      showAlert('Contraseña Restablecida', 'Tu contraseña ha sido restablecida con éxito. Ya puedes iniciar sesión.', 'success');
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Error al restablecer contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-20 px-6 max-w-md mx-auto min-h-screen flex flex-col justify-center">
      <div className="bg-white p-10 rounded-[32px] shadow-2xl border border-ink/10">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-sans font-bold text-ink tracking-tight mb-2">
            Nueva Contraseña
          </h2>
          <p className="text-ink/60 font-medium">
            Ingresa tu nueva contraseña para acceder a tu cuenta
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-bold text-ink mb-2">Nueva Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 rounded-xl border-2 border-ink/10 bg-ink/5 text-ink font-medium focus:border-accent focus:bg-white focus:outline-none transition-all placeholder-ink/40"
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-ink mb-2">Confirmar Nueva Contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-5 py-4 rounded-xl border-2 border-ink/10 bg-ink/5 text-ink font-medium focus:border-accent focus:bg-white focus:outline-none transition-all placeholder-ink/40"
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>
          {error && <p className="text-red-500 text-sm font-bold">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full bg-accent text-white py-4 rounded-xl font-bold text-lg hover:bg-accent/90 transform hover:-translate-y-1 transition-all shadow-lg shadow-accent/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Restableciendo...' : 'Restablecer Contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
};
