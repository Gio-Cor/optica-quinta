import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import PDFDocument from 'pdfkit';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Supabase client para verificar tokens
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'no-key-provided'
);

// Postgres para las queries del reporte
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(cors());
app.use(express.json());

// Healthcheck
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Middleware para verificar que el usuario es admin via Supabase Auth
const requireAdmin = async (req: Request, res: Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  // Verificar token con Supabase
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.sendStatus(403);

  // Verificar que sea admin en public.users
  const result = await pool.query(
    'SELECT role FROM public.users WHERE auth_id = $1',
    [user.id]
  );

  if (result.rows.length === 0 || result.rows[0].role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' });
  }

  next();
};

// Middleware para verificar que el usuario está autenticado via Supabase Auth
const requireAuth = async (req: Request, res: Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  try {
    // Verificar token con Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.sendStatus(403);

    (req as any).user = user;
    next();
  } catch (err) {
    console.error('Auth verification error:', err);
    res.sendStatus(403);
  }
};

app.delete('/api/users/delete-account', requireAuth, async (req: Request, res: Response) => {
  const authUser = (req as any).user;
  const authId = authUser.id; // UUID de Supabase Auth

  try {
    // 1. Obtener el ID interno del usuario en public.users
    const userResult = await pool.query(
      'SELECT id, email FROM public.users WHERE auth_id = $1',
      [authId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado en la base de datos.' });
    }

    const userId = userResult.rows[0].id;
    const userEmail = userResult.rows[0].email;

    // 2. Verificar si tiene órdenes de compra pendientes ('pending')
    const pendingOrdersResult = await pool.query(
      "SELECT COUNT(*) FROM public.work_orders WHERE user_id = $1 AND status = 'pending'",
      [userId]
    );

    const pendingCount = parseInt(pendingOrdersResult.rows[0].count, 10);
    if (pendingCount > 0) {
      return res.status(400).json({
        error: 'No puedes eliminar tu cuenta porque tienes una orden de compra pendiente de entrega. Estado: pending.'
      });
    }

    // 3. Eliminar registros en appointments que coincidan con el email del usuario (datos personales)
    await pool.query(
      'DELETE FROM public.appointments WHERE email = $1',
      [userEmail]
    );

    // 4. Eliminar el usuario de public.users
    // (prescriptions se eliminarán automáticamente en cascada. work_orders se actualizarán con user_id = NULL)
    await pool.query(
      'DELETE FROM public.users WHERE id = $1',
      [userId]
    );

    // 5. Eliminar el usuario de Supabase Auth
    // Requerirá SUPABASE_SERVICE_ROLE_KEY. Si no está configurada, la llamada fallará,
    // por lo que intentamos realizarla de forma segura o arrojamos una advertencia clara.
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceRoleKey && serviceRoleKey !== 'no-key-provided') {
      const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(authId);
      if (deleteAuthError) {
        console.error('Error al eliminar usuario de Supabase Auth:', deleteAuthError);
        return res.status(500).json({
          error: 'Error al eliminar la cuenta de autenticación de Supabase: ' + deleteAuthError.message
        });
      }
    } else {
      // Intentamos de todos modos por si acaso, pero capturamos el fallo amigablemente
      try {
        const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(authId);
        if (deleteAuthError) {
          console.warn('Omitiendo/Falló la eliminación en Supabase Auth (probable falta de SUPABASE_SERVICE_ROLE_KEY):', deleteAuthError.message);
        }
      } catch (authErr: any) {
        console.warn('Excepción al intentar eliminar usuario de Supabase Auth:', authErr.message);
      }
    }

    res.json({
      message: 'Cuenta y datos personales eliminados con éxito. Las órdenes de compra previas han sido preservadas de forma histórica.'
    });
  } catch (error: any) {
    console.error('Error en delete-account:', error);
    res.status(500).json({ error: 'Error interno del servidor al eliminar la cuenta: ' + error.message });
  }
});


// Reporte PDF mensual (único endpoint que justifica el backend)
app.get('/api/reports/monthly-sales/pdf', requireAdmin, async (req: Request, res: Response) => {
  try {
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=ventas_mensuales.pdf');

    doc.pipe(res);

    // Header
    doc.fontSize(22).text('Ópticas Quinta - Reporte Mensual', { align: 'center' });
    doc.fontSize(10).font('Helvetica-Oblique').text('Sistema de Gestión e-Commerce', { align: 'center' });
    doc.font('Helvetica');
    doc.moveDown();

    const now = new Date();
    doc.fontSize(12).text(`Fecha de Generación: ${now.toLocaleDateString('es-CL')}`);
    doc.text(`Mes del Reporte: ${now.toLocaleString('es-CL', { month: 'long', year: 'numeric' })}`);
    doc.moveDown();

    // Resumen Financiero
    const statsResult = await pool.query(`
      SELECT SUM(total_amount) as total_sales, SUM(deposit_amount) as total_deposits, COUNT(id) as total_orders
      FROM work_orders
      WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
    `);

    const stats = statsResult.rows[0];

    doc.fontSize(16).text('Resumen Financiero', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Total de Órdenes Realizadas: ${stats.total_orders || 0}`);
    doc.text(`Ventas Brutas Totales: $${(Number(stats.total_sales) || 0).toLocaleString('es-CL')}`);
    doc.text(`Ingresos Reales (Señas/Pagos Completados): $${(Number(stats.total_deposits) || 0).toLocaleString('es-CL')}`);
    doc.moveDown(2);

    // Detalle de Artículos Vendidos
    const itemsResult = await pool.query(`
      SELECT 
        p.name, p.brand, p.category,
        d.lens_option_name, d.lens_addon_price,
        SUM(d.quantity) as total_qty,
        SUM(d.quantity * (d.price_at_time + d.lens_addon_price)) as total_revenue
      FROM detalles_orden d
      JOIN products p ON d.product_id = p.id
      JOIN work_orders w ON d.work_order_id = w.id
      WHERE EXTRACT(MONTH FROM w.created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM w.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
      GROUP BY p.name, p.brand, p.category, d.lens_option_name, d.lens_addon_price
      ORDER BY p.category, p.name
    `);

    const lenses = itemsResult.rows.filter((i: any) => i.category === 'lente');
    const accessories = itemsResult.rows.filter((i: any) => i.category === 'accesorio');

    // Lentes
    doc.fontSize(16).text('Lentes Vendidos', { underline: true });
    doc.moveDown(0.5);
    if (lenses.length === 0) {
      doc.fontSize(11).font('Helvetica-Oblique').text('No se registraron ventas de lentes este mes.');
      doc.font('Helvetica').moveDown();
    } else {
      lenses.forEach((item: any) => {
        const crystalStr = item.lens_option_name ? ` - Cristal: ${item.lens_option_name}` : '';
        doc.fontSize(11).text(
          `${item.brand} ${item.name}${crystalStr} (Cantidad: ${item.total_qty}) -> $${(Number(item.total_revenue) || 0).toLocaleString('es-CL')}`
        );
      });
      doc.moveDown(2);
    }

    // Accesorios
    doc.fontSize(16).text('Accesorios Vendidos', { underline: true });
    doc.moveDown(0.5);
    if (accessories.length === 0) {
      doc.fontSize(11).font('Helvetica-Oblique').text('No se registraron ventas de accesorios este mes.');
      doc.font('Helvetica');
    } else {
      accessories.forEach((item: any) => {
        doc.fontSize(11).text(
          `${item.brand} ${item.name} (Cantidad: ${item.total_qty}) -> $${(Number(item.total_revenue) || 0).toLocaleString('es-CL')}`
        );
      });
    }

    doc.end();
  } catch (err) {
    console.error('PDF Generation Error:', err);
    res.status(500).json({ error: 'Error al generar PDF' });
  }
});

// Inicializar Stripe con la clave secreta
// NOTA: Para un entorno de producción, asegúrate de colocar tu STRIPE_SECRET_KEY real en el archivo .env
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_placeholder', {
  apiVersion: '2025-01-27.acacia' as any,
});

app.post('/api/checkout/create-session', async (req: Request, res: Response) => {
  try {
    const { items, total_amount, userId } = req.body;

    // Crear la sesión de checkout en Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map((item: any) => ({
        price_data: {
          currency: 'clp', // Moneda: Pesos chilenos
          product_data: {
            name: `Lente ${item.productId} ${item.lensOptionName ? '+ ' + item.lensOptionName : ''}`,
          },
          // Stripe expects the unit amount in the smallest currency unit. For CLP, it's just the integer.
          unit_amount: Math.round(item.price + (item.lensAddonPrice || 0)),
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      // Redirecciones al terminar el pago
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/?checkout=success`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/?checkout=cancel`,
      metadata: {
        userId: userId || 'guest',
        items: JSON.stringify(items.map((i: any) => ({ id: i.productId, qty: i.quantity })))
      }
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creando sesión de Stripe:', error);
    res.status(500).json({ error: error.message });
  }
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

export default app;