import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import PDFDocument from 'pdfkit';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Supabase client para verificar tokens
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role key, NO la anon key
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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});