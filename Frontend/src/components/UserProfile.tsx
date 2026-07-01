import React, { useState } from 'react';
import { User } from '../types';
import { Save, User as UserIcon, MapPin, CreditCard, Lock, Trash2, ShoppingBag, Package, Truck, Building, Check } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { api } from '../services/api';
import { showAlert } from '../utils/swal';
import Swal from 'sweetalert2';

export const UserProfile = ({ user, onUpdateUser, onLogout }: { user: User, onUpdateUser: (u: User) => void, onLogout: () => void }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'purchases' | 'password' | 'delete'>('profile');
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  React.useEffect(() => {
    const loadOrders = async () => {
      setLoadingOrders(true);
      try {
        const { data: profileData } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', (await supabase.auth.getUser()).data.user?.id)
          .single();

        let query = supabase.from('work_orders').select('*');
        if (profileData) {
          query = query.or(`user_id.eq.${profileData.id},customer_email.eq.${user.email}`);
        } else {
          query = query.eq('customer_email', user.email);
        }

        const { data, error } = await query;
        if (error) throw error;
        setUserOrders(data || []);
      } catch (err) {
        console.error("Error cargando compras del usuario:", err);
      } finally {
        setLoadingOrders(false);
      }
    };
    loadOrders();
  }, [user.email]);

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

  const [newEmail, setNewEmail] = useState('');

  const obfuscateEmail = (emailStr: string) => {
    const [localPart, domain] = emailStr.split('@');
    if (!localPart || !domain) return emailStr;
    if (localPart.length <= 2) {
      return `${localPart[0]}*@${domain}`;
    }
    return `${localPart.substring(0, 2)}****${localPart.substring(localPart.length - 1)}@${domain}`;
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: formData
      });
      
      if (error) throw new Error(error.message);
      
      onUpdateUser({ ...user, ...formData });
      showAlert('Perfil Actualizado', 'Perfil actualizado correctamente', 'success');
    } catch (err: any) {
      showAlert('Error', 'Hubo un error al actualizar el perfil: ' + err.message, 'error');
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passData.newPassword !== passData.confirmPassword) {
      return showAlert('Error', 'Las contraseñas no coinciden', 'error');
    }

    if (!passData.currentPassword) {
      return showAlert('Error', 'Debes ingresar tu contraseña actual', 'error');
    }
    
    try {
      // Re-autenticar al usuario para verificar la contraseña actual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passData.currentPassword
      });
      
      if (signInError) {
        throw new Error('La contraseña actual es incorrecta.');
      }

      // Actualizar la contraseña
      const { error } = await supabase.auth.updateUser({
        password: passData.newPassword
      });
      
      if (error) throw new Error(error.message);
      
      showAlert('Contraseña Actualizada', 'Contraseña actualizada correctamente', 'success');
      setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      showAlert('Error', err.message, 'error');
    }
  };

  const handleEmailSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) {
      return showAlert('Error', 'Por favor ingresa tu nuevo correo electrónico', 'error');
    }
    
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });
      
      if (error) throw error;
      
      showAlert('Correo de Confirmación', 'Se ha enviado un correo de confirmación al nuevo y al anterior correo electrónico para aplicar el cambio.', 'success');
      setNewEmail('');
    } catch (err: any) {
      showAlert('Error', err.message, 'error');
    }
  };

  const handleForgotPasswordReset = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      showAlert('Correo Enviado', 'Se ha enviado un correo con instrucciones para restablecer tu contraseña.', 'success');
    } catch (err: any) {
      showAlert('Error', err.message, 'error');
    }
  };

  const handleDeleteAccount = async () => {
    const doubleConfirm = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas eliminar tu cuenta permanentemente? Esta acción es irreversible y eliminará todos tus datos personales, incluyendo tu perfil y recetas médicas.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar cuenta',
      cancelButtonText: 'Cancelar',
      customClass: {
        popup: 'rounded-[24px]',
        confirmButton: 'px-6 py-2.5 rounded-full font-bold text-sm text-white mx-1',
        cancelButton: 'px-6 py-2.5 rounded-full font-bold text-sm text-white mx-1',
      }
    });
    if (!doubleConfirm.isConfirmed) return;

    try {
      await api.deleteAccount();
      await showAlert('Cuenta Eliminada', 'Tu cuenta y datos personales han sido eliminados correctamente.', 'success');
      onLogout();
    } catch (err: any) {
      showAlert('Error', 'Error al eliminar la cuenta: ' + err.message, 'error');
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
            onClick={() => setActiveTab('purchases')}
            className={`w-full text-left px-5 py-3 rounded-xl flex items-center gap-3 transition-colors ${activeTab === 'purchases' ? 'bg-ink text-white shadow-md' : 'hover:bg-paper text-ink/70'}`}
          >
            <ShoppingBag className="w-5 h-5" /> Mis Compras
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
            ) : activeTab === 'purchases' ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold font-serif mb-2 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-accent" /> Historial y Seguimiento de Compras
                  </h3>
                  <p className="text-xs text-ink/50 font-medium mb-6">Revisa el estado de entrega y preparación de tus compras en tiempo real.</p>
                </div>

                {loadingOrders ? (
                  <div className="text-center py-12 text-ink/50 font-bold">Cargando tus compras...</div>
                ) : userOrders.length === 0 ? (
                  <div className="text-center py-16 bg-paper/20 border border-dashed border-ink/10 rounded-3xl">
                    <ShoppingBag className="w-12 h-12 text-ink/20 mx-auto mb-4" />
                    <p className="text-sm font-bold text-ink/50">Aún no has realizado ninguna compra.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {userOrders.slice().reverse().map((w) => {
                      const isPickup = w.delivery_address?.toLowerCase().includes('sucursal') || w.delivery_type === 'pickup';
                      const currentStatus = w.status || 'preparing';
                      return (
                        <div key={w.id} className="bg-paper/20 border border-ink/5 rounded-3xl p-6 space-y-6">
                          <div className="flex justify-between items-start flex-wrap gap-4">
                            <div>
                              <h4 className="font-bold text-ink text-base">Orden #{w.id}</h4>
                              <p className="text-xs text-ink/50 mt-1">
                                Comprado el {new Date(w.created_at).toLocaleDateString('es-CL', {
                                  day: '2-digit', month: 'long', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs text-ink/50 block font-medium">Monto Total</span>
                              <span className="font-bold text-accent text-lg">${Number(w.total_amount).toLocaleString('es-CL')}</span>
                            </div>
                          </div>

                          {/* Stepper Visual de Seguimiento */}
                          <div className="pt-4 border-t border-ink/5 relative">
                            <div className="flex justify-between items-center relative">
                              {/* Línea de Fondo */}
                              <div className="absolute left-8 right-8 top-4 h-0.5 bg-ink/10 -translate-y-1/2 z-0" />
                              {/* Línea de Progreso Activa */}
                              <div 
                                className="absolute left-8 top-4 h-0.5 bg-accent -translate-y-1/2 z-0 transition-all duration-500" 
                                style={{
                                  width: currentStatus === 'delivered' || currentStatus === 'completed'
                                    ? 'calc(100% - 64px)'
                                    : currentStatus === 'in_transit' || currentStatus === 'ready_for_pickup'
                                    ? '50%'
                                    : '0%'
                                }}
                              />

                              {/* Paso 1: En Preparación */}
                              <div className="flex flex-col items-center z-10 relative">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                                  currentStatus === 'preparing' || currentStatus === 'pending' || currentStatus === 'in_transit' || currentStatus === 'ready_for_pickup' || currentStatus === 'delivered' || currentStatus === 'completed'
                                    ? 'bg-accent border-accent text-white shadow-lg shadow-accent/20'
                                    : 'bg-white border-ink/20 text-ink/40'
                                }`}>
                                  <Package className="w-4 h-4" />
                                </div>
                                <span className="text-[10px] font-bold text-ink/70 mt-2">En Preparación</span>
                              </div>

                              {/* Paso 2: En Camino / Listo para Retiro */}
                              <div className="flex flex-col items-center z-10 relative">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                                  currentStatus === 'in_transit' || currentStatus === 'ready_for_pickup' || currentStatus === 'delivered' || currentStatus === 'completed'
                                    ? 'bg-accent border-accent text-white shadow-lg shadow-accent/20'
                                    : 'bg-white border-ink/20 text-ink/40'
                                }`}>
                                  {isPickup ? <Building className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                                </div>
                                <span className="text-[10px] font-bold text-ink/70 mt-2">
                                  {isPickup ? 'Listo para Retirar' : 'En Ruta'}
                                </span>
                              </div>

                              {/* Paso 3: Entregado / Recibido */}
                              <div className="flex flex-col items-center z-10 relative">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                                  currentStatus === 'delivered' || currentStatus === 'completed'
                                    ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-600/20'
                                    : 'bg-white border-ink/20 text-ink/40'
                                }`}>
                                  <Check className="w-4 h-4" />
                                </div>
                                <span className="text-[10px] font-bold text-ink/70 mt-2">Recibido</span>
                              </div>
                            </div>
                          </div>

                          {/* Info de Despacho */}
                          <div className="bg-paper p-4 rounded-2xl border border-ink/5 text-xs space-y-1">
                            <p className="font-bold text-ink/80 uppercase tracking-wider text-[9px] text-accent">Detalles de la Entrega</p>
                            <p className="text-ink/70 font-semibold">{w.delivery_address || 'Retiro en Tienda - Casa Central / No especificado'}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : activeTab === 'password' ? (
              <div className="space-y-10">
                {/* Sección Correo Electrónico */}
                <div>
                  <h3 className="text-xl font-bold font-serif mb-6 flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-accent" /> Correo Electrónico
                  </h3>
                  <div className="bg-ink/5 rounded-2xl p-5 border border-ink/5 mb-6">
                    <p className="text-sm font-medium text-ink/70">
                      Correo actual: <span className="font-bold text-ink">{obfuscateEmail(user.email)}</span>
                    </p>
                  </div>
                  <form onSubmit={handleEmailSave} className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold tracking-widest uppercase text-ink/60 mb-2">Nuevo Correo Electrónico</label>
                      <input 
                        type="email"
                        required
                        value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                        className="w-full border-2 border-ink/10 focus:border-accent focus:bg-white bg-ink/5 p-3 rounded-xl transition-all" 
                        placeholder="nuevo-correo@ejemplo.com"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button type="submit" className="bg-accent text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-ink transition-colors flex items-center gap-2">
                        <Save className="w-5 h-5" /> Actualizar Correo
                      </button>
                    </div>
                  </form>
                </div>

                <hr className="border-ink/5" />

                {/* Sección Cambiar Contraseña */}
                <div>
                  <h3 className="text-xl font-bold font-serif mb-6 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-accent" /> Cambiar Contraseña
                  </h3>
                  <form onSubmit={handlePasswordSave} className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold tracking-widest uppercase text-ink/60 mb-2">Contraseña Actual</label>
                      <input 
                        type="password"
                        required
                        value={passData.currentPassword}
                        onChange={e => setPassData({...passData, currentPassword: e.target.value})}
                        className="w-full border-2 border-ink/10 focus:border-accent focus:bg-white bg-ink/5 p-3 rounded-xl transition-all" 
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold tracking-widest uppercase text-ink/60 mb-2">Nueva Contraseña</label>
                      <input 
                        type="password"
                        required
                        value={passData.newPassword} 
                        onChange={e => setPassData({...passData, newPassword: e.target.value})} 
                        className="w-full border-2 border-ink/10 focus:border-accent focus:bg-white bg-ink/5 p-3 rounded-xl transition-all" 
                        placeholder="••••••••"
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
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="flex justify-between items-center pt-4">
                      <button
                        type="button"
                        onClick={handleForgotPasswordReset}
                        className="text-sm text-accent hover:underline font-semibold"
                      >
                        ¿Olvidaste tu contraseña? Restablecer por correo
                      </button>
                      <button type="submit" className="bg-accent text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-ink transition-colors flex items-center gap-2">
                        <Save className="w-5 h-5" /> Actualizar Contraseña
                      </button>
                    </div>
                  </form>
                </div>
              </div>
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
