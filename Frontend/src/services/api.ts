import { supabase } from '../supabaseClient';
import { Product, Appointment, User, LensOption, WorkOrder } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const api = {
  getProducts: async (): Promise<Product[]> => {
    const { data, error } = await supabase.from('products').select('*');
    if (error) throw new Error(error.message);
    return data || [];
  },

  loginUser: async (email: string, password: string): Promise<{ token: string, user: User }> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    
    // Construir el usuario desde los metadatos de Supabase
    const user: User = {
      id: data.user.id,
      email: data.user.email || '',
      role: data.user.user_metadata?.role || 'user',
      full_name: data.user.user_metadata?.full_name || '',
      address: data.user.user_metadata?.address || '',
      payment_method: data.user.user_metadata?.payment_method || ''
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
    // Generar PDF en el cliente usando jspdf
    const { data: orders, error } = await supabase.from('work_orders').select('*');
    if (error) throw new Error('Error al obtener datos para el reporte: ' + error.message);
    
    const doc = new jsPDF();
    doc.text('Reporte Mensual de Ventas', 14, 15);
    
    const tableData = (orders || []).map((o: any) => [
      o.id,
      new Date(o.created_at).toLocaleDateString(),
      `$${o.total_amount}`,
      o.status
    ]);
    
    autoTable(doc, {
      startY: 25,
      head: [['ID', 'Fecha', 'Monto Total', 'Estado']],
      body: tableData,
    });
    
    doc.save('ventas_mensuales.pdf');
  },

  checkout: async (items: { productId: number; quantity: number; price: number; lensOptionName?: string; lensAddonPrice?: number }[], total_amount: number): Promise<void> => {
    // 1. Insertar la orden
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;
    
    const { data: order, error: orderError } = await supabase.from('work_orders').insert([{
      total_amount,
      balance_due: total_amount,
      deposit_amount: 0,
      user_id: userId || null,
      status: 'pending'
    }]).select().single();
    
    if (orderError) throw new Error(orderError.message);
    
    // 2. Insertar los detalles
    const details = items.map(item => ({
      work_order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      price_at_time: item.price,
      lens_option_name: item.lensOptionName,
      lens_addon_price: item.lensAddonPrice || 0
    }));
    
    const { error: detailsError } = await supabase.from('detalles_orden').insert(details);
    if (detailsError) throw new Error(detailsError.message);
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
};
