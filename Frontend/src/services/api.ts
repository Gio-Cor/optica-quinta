import { supabase } from '../supabaseClient';
import { Product, Appointment, User, LensOption, WorkOrder, CartItem } from '../types';
import { jsPDF } from 'jspdf';
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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin
      }
    });
    if (error) throw new Error(error.message);

    if (data.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert([{
          auth_id: data.user.id,
          email: email,
          password_hash: 'supabase_auth',
          role: 'user'
        }]);
      if (profileError) {
        console.error("Error al crear perfil en public.users:", profileError);
      }
    }
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
    // 1. Obtener la sesión activa
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No hay sesión activa');

    // 2. Obtener datos de ventas y citas desde Supabase
    const { data: workOrders, error: wError } = await supabase
      .from('work_orders')
      .select('*');
    if (wError) throw new Error(wError.message);

    const { data: appointments, error: aError } = await supabase
      .from('appointments')
      .select('*');
    if (aError) throw new Error(aError.message);

    // 3. Crear documento PDF con jsPDF
    const doc = new jsPDF();

    // Fondo y cabecera
    doc.setFillColor(95, 59, 143); // Morado Optica Quinta
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('ÓPTICAS QUINTA', 15, 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('REPORTE FINANCIERO Y DE VENTAS MENSUALES', 15, 30);

    // Metadata del Reporte (Lado Derecho)
    const todayStr = new Date().toLocaleString('es-CL', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    doc.setFontSize(8);
    doc.text(`Generado: ${todayStr}`, 130, 20);
    doc.text(`Administrador: ${session.user.email}`, 130, 26);

    // Resumen Ejecutivo
    doc.setTextColor(14, 11, 22);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Resumen Ejecutivo', 15, 55);

    const totalIncome = (workOrders || []).reduce((sum, o) => sum + Number(o.total_amount), 0);
    const totalOrders = (workOrders || []).length;
    const totalAppointments = (appointments || []).length;

    // Tarjeta del Resumen Financiero
    doc.setFillColor(248, 246, 250);
    doc.rect(15, 60, 180, 25, 'F');
    doc.setDrawColor(95, 59, 143);
    doc.setLineWidth(0.5);
    doc.rect(15, 60, 180, 25, 'S');

    doc.setFontSize(9);
    doc.setTextColor(95, 59, 143);
    doc.setFont('helvetica', 'bold');
    doc.text('INGRESOS TOTALES', 25, 70);
    doc.text('ÓRDENES COMPLETADAS', 85, 70);
    doc.text('CITAS AGENDADAS', 145, 70);

    doc.setTextColor(14, 11, 22);
    doc.setFontSize(11);
    doc.text(`$${totalIncome.toLocaleString('es-CL')}`, 25, 78);
    doc.text(`${totalOrders} ventas`, 85, 78);
    doc.text(`${totalAppointments} citas`, 145, 78);

    // Tabla de Ventas
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Detalle de Ventas Registradas', 15, 100);

    const salesHeaders = [['ID', 'Fecha', 'Cliente / Correo', 'Método Pago', 'Total']];
    const salesRows = (workOrders || []).slice().reverse().map(w => [
      `#${w.id}`,
      new Date(w.created_at).toLocaleString('es-CL', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }),
      w.customer_email || w.user_name || (w.user_id ? `Cliente ID: ${w.user_id}` : 'Cliente Web Anónimo'),
      w.payment_method === 'card' ? 'Tarjeta' : w.payment_method === 'qr' ? 'Pago QR' : w.payment_method === 'transfer' ? 'Transferencia' : 'Pago Integrado',
      `$${Number(w.total_amount).toLocaleString('es-CL')}`
    ]);

    autoTable(doc, {
      startY: 105,
      head: salesHeaders,
      body: salesRows,
      theme: 'striped',
      headStyles: { fillColor: [95, 59, 143], fontStyle: 'bold' },
      styles: { fontSize: 8, font: 'helvetica' },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 35 },
        2: { cellWidth: 70 },
        3: { cellWidth: 30 },
        4: { cellWidth: 30, halign: 'right' }
      }
    });

    // Guardar PDF en el navegador del cliente
    doc.save(`Reporte_Ventas_${new Date().toISOString().slice(0, 7)}.pdf`);
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

  createWorkOrder: async (
    userId: string | null,
    items: CartItem[],
    totalAmount: number,
    email?: string,
    paymentMethod?: string,
    deliveryType?: string,
    deliveryAddress?: string
  ): Promise<void> => {
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
        status: 'preparing',
        customer_email: email || null,
        payment_method: paymentMethod || null,
        delivery_type: deliveryType || null,
        delivery_address: deliveryAddress || null
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

    // Decrementar el stock de cada producto comprado en la base de datos de Supabase
    for (const item of items) {
      const { data: currentProduct } = await supabase
        .from('products')
        .select('stock')
        .eq('id', item.product.id)
        .single();
      
      if (currentProduct && currentProduct.stock !== null && currentProduct.stock !== undefined) {
        const newStock = Math.max(0, currentProduct.stock - item.quantity);
        const { error: stockError } = await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', item.product.id);
        
        if (stockError) {
          console.error(`Error al actualizar el stock del producto ${item.product.id}:`, stockError.message);
        }
      }
    }
  },

  uploadFile: async (bucket: string, path: string, file: File): Promise<string> => {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: true
    });
    if (error) throw new Error(error.message);
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
    return publicUrl;
  },

  deleteAccount: async (): Promise<void> => {
    const { error } = await supabase.rpc('delete_own_user');
    if (error) {
      throw new Error(error.message);
    }
  },

  updateWorkOrderStatus: async (id: number, status: string): Promise<void> => {
    const { error } = await supabase
      .from('work_orders')
      .update({ status })
      .eq('id', id);
    if (error) throw new Error(error.message);
  },
};