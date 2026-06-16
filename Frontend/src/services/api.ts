import { supabase } from '../supabaseClient';
import { Product, Appointment, User, LensOption, WorkOrder, CartItem } from '../types';

export const api = {
  getProducts: async (): Promise<Product[]> => {
    const { data, error } = await supabase.from('products').select('*');
    if (error) throw new Error(error.message);
    return data || [];
  },

  loginUser: async (email: string, password: string): Promise<{ token: string, user: User }> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);

    // Obtener el role desde public.users usando auth_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, full_name, address, payment_method, id')
      .eq('auth_id', data.user.id)
      .single();

    if (userError || !userData) throw new Error('No se encontró el perfil del usuario');

    const user: User = {
      id: data.user.id,
      email: data.user.email || '',
      role: userData.role,
      full_name: userData.full_name || '',
      address: userData.address || '',
      payment_method: userData.payment_method || ''
    };

    return { token: data.session.access_token, user };
  },

  registerUser: async (email: string, password: string): Promise<any> => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(error.message);
    return data;
  },

  createProduct: async (product: Omit<Product, 'id'>): Promise<Product> => {
    const { data, error } = await supabase.from('products').insert([product]).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  deleteProduct: async (id: number): Promise<void> => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  updateProduct: async (id: number, updates: Partial<Product>): Promise<Product> => {
    const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  getAppointments: async (): Promise<Appointment[]> => {
    const { data, error } = await supabase.from('appointments').select('*');
    if (error) throw new Error(error.message);
    return data || [];
  },

  createAppointment: async (appointment: Omit<Appointment, 'id' | 'status'>): Promise<Appointment> => {
    const { data, error } = await supabase.from('appointments').insert([{ ...appointment, status: 'pending' }]).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  updateAppointment: async (id: number, updates: Partial<Appointment>): Promise<Appointment> => {
    const { data, error } = await supabase.from('appointments').update(updates).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  downloadMonthlyReport: async (): Promise<void> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No hay sesión activa');

    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/reports/monthly-sales/pdf`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    if (!response.ok) throw new Error('Error al generar el reporte');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ventas_mensuales.pdf';
    a.click();
    window.URL.revokeObjectURL(url);
  },

  checkout: async (items: { productId: number; quantity: number; price: number; lensOptionName?: string; lensAddonPrice?: number }[], total_amount: number): Promise<string> => {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;

    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/checkout/create-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items,
        total_amount,
        userId
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al procesar el pago');
    }

    const { url } = await response.json();
    return url;
  },

  getLensOptions: async (): Promise<LensOption[]> => {
    const { data, error } = await supabase.from('lens_options').select('*');
    if (error) throw new Error(error.message);
    return data || [];
  },

  createLensOption: async (option: Omit<LensOption, 'id'>): Promise<LensOption> => {
    const { data, error } = await supabase.from('lens_options').insert([option]).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  updateLensOption: async (id: number, updates: Partial<LensOption>): Promise<LensOption> => {
    const { data, error } = await supabase.from('lens_options').update(updates).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  deleteLensOption: async (id: number): Promise<void> => {
    const { error } = await supabase.from('lens_options').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  getWorkOrders: async (): Promise<WorkOrder[]> => {
    const { data, error } = await supabase.from('work_orders').select('*');
    if (error) throw new Error(error.message);
    return data || [];
  },

  createWorkOrder: async (userId: string | null, items: CartItem[], totalAmount: number): Promise<void> => {
    let integerUserId: number | null = null;
    if (userId) {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', userId)
        .single();
      if (userData) {
        integerUserId = userData.id;
      }
    }

    const { data: order, error: orderError } = await supabase
      .from('work_orders')
      .insert([{
        user_id: integerUserId,
        total_amount: totalAmount,
        deposit_amount: totalAmount,
        balance_due: 0,
        status: 'completed'
      }])
      .select()
      .single();

    if (orderError) throw new Error(orderError.message);

    const orderDetails = items.map(item => ({
      work_order_id: order.id,
      product_id: item.product.id,
      quantity: item.quantity,
      price_at_time: item.product.price,
      lens_option_name: item.lensOption.name,
      lens_addon_price: item.lensOption.price_add
    }));

    const { error: detailsError } = await supabase
      .from('detalles_orden')
      .insert(orderDetails);

    if (detailsError) throw new Error(detailsError.message);
  },
};