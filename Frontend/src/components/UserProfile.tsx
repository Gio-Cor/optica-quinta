import React, { useState } from 'react';
import { User } from '../types';
import { Save, User as UserIcon, MapPin, CreditCard, Lock, Trash2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { api } from '../services/api';

export const UserProfile = ({ user, onUpdateUser, onLogout }: { user: User, onUpdateUser: (u: User) => void, onLogout: () => void }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'delete'>('profile');
  const [formData, setFormData] = useState({
    full_name: user.full_name || '',
    address: user.address || '',
    payment_method: user.payment_method || ''
  });
  
  const [passData, setPassData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: formData
      });
      
      if (error) throw new Error(error.message);
      
      onUpdateUser({ ...user, ...formData });
      alert('Perfil actualizado correctamente');
    } catch (err: any) {
      alert('Hubo un error al actualizar el perfil: ' + err.message);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passData.newPassword !== passData.confirmPassword) {
      return alert('Las contraseñas no coinciden');
    }
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: passData.newPassword
      });
      
      if (error) throw new Error(error.message);
      
      alert('Contraseña actualizada correctamente');
      setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteAccount = async () => {
    const doubleConfirm = confirm(
      '¿Estás seguro de que deseas eliminar tu cuenta permanentemente?\n\nEsta acción es irreversible y eliminará todos tus datos personales, incluyendo tu perfil y recetas médicas.'
    );
    if (!doubleConfirm) return;

    const tripleConfirm = confirm(
      'Por favor, confirma una vez más: ¿Realmente deseas eliminar tu cuenta y todos tus datos personales?'
    );
    if (!tripleConfirm) return;

    try {
      await api.deleteAccount();
      alert('Tu cuenta y datos personales han sido eliminados correctamente.');
      onLogout();
    } catch (err: any) {
      alert('Error al eliminar la cuenta: ' + err.message);
    }
  };

  return (
    <div className="pt-32 pb-20 px-6 max-w-5xl mx-auto min-h-screen">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h2 className="text-4xl font-serif">Mi Perfil</h2>
          <p className="text-ink/60 mt-2">Gestiona tu información personal y métodos de pago</p>
        </div>
        <button 
          onClick={onLogout}
          className="flex items-center gap-2 px-6 py-2 rounded-full border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
        >
          Salir
        </button>
      </div>

      <div className="grid md:grid-cols-4 gap-8">
        <div className="md:col-span-1 space-y-2">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full text-left px-5 py-3 rounded-xl flex items-center gap-3 transition-colors ${activeTab === 'profile' ? 'bg-ink text-white shadow-md' : 'hover:bg-paper text-ink/70'}`}
          >
            <UserIcon className="w-5 h-5" /> Datos Personales
          </button>
          <button 
            onClick={() => setActiveTab('password')}
            className={`w-full text-left px-5 py-3 rounded-xl flex items-center gap-3 transition-colors ${activeTab === 'password' ? 'bg-ink text-white shadow-md' : 'hover:bg-paper text-ink/70'}`}
          >
            <Lock className="w-5 h-5" /> Seguridad
          </button>
          <button 
            onClick={() => setActiveTab('delete')}
            className={`w-full text-left px-5 py-3 rounded-xl flex items-center gap-3 transition-colors ${activeTab === 'delete' ? 'bg-red-600 text-white shadow-md' : 'hover:bg-red-50 text-red-600 font-medium'}`}
          >
            <Trash2 className="w-5 h-5" /> Eliminar Cuenta
          </button>
        </div>

        <div className="md:col-span-3">
          <div className="bg-white rounded-[32px] p-8 shadow-xl border border-ink/5">
            {activeTab === 'profile' ? (
              <form onSubmit={handleProfileSave} className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold font-serif mb-6 flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-accent" /> Información Básica
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold tracking-widest uppercase text-ink/60 mb-2">Correo Electrónico</label>
                      <input disabled value={user.email} className="w-full border-2 border-ink/5 bg-ink/5 p-3 rounded-xl text-ink/60 cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold tracking-widest uppercase text-ink/60 mb-2">Nombre Completo</label>
                      <input 
                        value={formData.full_name} 
                        onChange={e => setFormData({...formData, full_name: e.target.value})} 
                        className="w-full border-2 border-ink/10 focus:border-accent focus:bg-white bg-ink/5 p-3 rounded-xl transition-all" 
                        placeholder="Tu nombre y apellido" 
                      />
                    </div>
                  </div>
                </div>

                <hr className="border-ink/5" />

                <div>
                  <h3 className="text-xl font-bold font-serif mb-6 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-accent" /> Dirección de Envío
                  </h3>
                  <div>
                    <label className="block text-xs font-bold tracking-widest uppercase text-ink/60 mb-2">Dirección Completa</label>
                    <textarea 
                      value={formData.address} 
                      onChange={e => setFormData({...formData, address: e.target.value})} 
                      className="w-full border-2 border-ink/10 focus:border-accent focus:bg-white bg-ink/5 p-3 rounded-xl transition-all min-h-[100px]" 
                      placeholder="Calle, Número, Comuna, Ciudad" 
                    />
                  </div>
                </div>

                <hr className="border-ink/5" />

                <div>
                  <h3 className="text-xl font-bold font-serif mb-6 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-accent" /> Método de Pago
                  </h3>
                  <div>
                    <label className="block text-xs font-bold tracking-widest uppercase text-ink/60 mb-2">Tarjeta de Crédito / Débito (Referencia)</label>
                    <input 
                      value={formData.payment_method} 
                      onChange={e => setFormData({...formData, payment_method: e.target.value})} 
                      className="w-full border-2 border-ink/10 focus:border-accent focus:bg-white bg-ink/5 p-3 rounded-xl transition-all" 
                      placeholder="Ej: Visa terminada en 4567" 
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button type="submit" className="bg-accent text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-ink transition-colors flex items-center gap-2">
                    <Save className="w-5 h-5" /> Guardar Cambios
                  </button>
                </div>
              </form>
            ) : activeTab === 'password' ? (
              <form onSubmit={handlePasswordSave} className="space-y-6">
                <h3 className="text-xl font-bold font-serif mb-6 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-accent" /> Cambiar Contraseña
                </h3>
                <div>
                  <label className="block text-xs font-bold tracking-widest uppercase text-ink/60 mb-2">Nueva Contraseña</label>
                  <input 
                    type="password"
                    required
                    value={passData.newPassword} 
                    onChange={e => setPassData({...passData, newPassword: e.target.value})} 
                    className="w-full border-2 border-ink/10 focus:border-accent focus:bg-white bg-ink/5 p-3 rounded-xl transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold tracking-widest uppercase text-ink/60 mb-2">Confirmar Nueva Contraseña</label>
                  <input 
                    type="password"
                    required
                    value={passData.confirmPassword} 
                    onChange={e => setPassData({...passData, confirmPassword: e.target.value})} 
                    className="w-full border-2 border-ink/10 focus:border-accent focus:bg-white bg-ink/5 p-3 rounded-xl transition-all" 
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <button type="submit" className="bg-accent text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-ink transition-colors flex items-center gap-2">
                    <Save className="w-5 h-5" /> Actualizar Contraseña
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <h3 className="text-xl font-bold font-serif mb-6 flex items-center gap-2 text-red-600">
                  <Trash2 className="w-5 h-5" /> Eliminar Cuenta
                </h3>
                
                <div className="bg-red-50 border border-red-200 rounded-[20px] p-6 text-red-800 text-sm leading-relaxed space-y-4">
                  <p className="font-bold text-base flex items-center gap-2">
                    <Trash2 className="w-5 h-5 text-red-600" /> ¡Advertencia Importante!
                  </p>
                  <p>
                    Al eliminar tu cuenta, todos tus datos personales, direcciones y recetas médicas serán eliminados permanentemente de nuestra base de datos. <strong>Esta acción no se puede deshacer.</strong>
                  </p>
                  <p>
                    Tus órdenes de compra previas <strong>no serán eliminadas</strong> para mantener los registros de facturación de la tienda, pero quedarán guardadas de forma histórica y anónima (sin vinculación a tus datos personales).
                  </p>
                  <p className="font-semibold border-t border-red-200 pt-3">
                    Nota: Si tienes alguna orden de compra pendiente de entrega, no podrás eliminar tu cuenta hasta que recibas tu producto.
                  </p>
                </div>

                <div className="flex justify-end pt-6 border-t border-ink/5">
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    className="bg-red-600 text-white px-8 py-4 rounded-full font-bold shadow-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-5 h-5" /> Eliminar mi cuenta permanentemente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
