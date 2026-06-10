import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import PDFDocument from 'pdfkit';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_optica_key_123!';

// Setup Postgres Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Run migrations on startup
pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS model_3d TEXT;')
  .then(() => console.log('Database migration completed: model_3d column verified.'))
  .catch(err => console.error('Migration error:', err));

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Basic healthcheck endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Backend is running!' });
});

// User Registration
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role',
      [email, passwordHash, 'user']
    );

    res.status(201).json({ message: 'Usuario creado exitosamente', user: result.rows[0] });
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// User Login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    res.json({ message: 'Login exitoso', token, user: { id: user.id, email: user.email, role: user.role, full_name: user.full_name, address: user.address, payment_method: user.payment_method } });
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Middleware to verify JWT and optional role
const authenticateToken = (req: Request, res: Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    (req as any).user = user;
    next();
  });
};

const requireAdmin = (req: Request, res: Response, next: express.NextFunction) => {
  if ((req as any).user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' });
  }
  next();
};

// --- PRODUCTS ENDPOINTS ---

app.get('/api/products', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

app.post('/api/products', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, brand, price, image, description, stock, category, ar_image, model_3d } = req.body;
    const result = await pool.query(
      'INSERT INTO products (name, brand, price, image, description, stock, category, ar_image, model_3d) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [name, brand, price, image, description, stock || 0, category || 'lente', ar_image || null, model_3d || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

app.delete('/api/products/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

app.patch('/api/products/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const { name, brand, price, image, description, stock, category, ar_image, model_3d } = req.body;
    
    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;
    
    if (name !== undefined) { updates.push(`name = $${idx++}`); values.push(name); }
    if (brand !== undefined) { updates.push(`brand = $${idx++}`); values.push(brand); }
    if (price !== undefined) { updates.push(`price = $${idx++}`); values.push(price); }
    if (image !== undefined) { updates.push(`image = $${idx++}`); values.push(image); }
    if (description !== undefined) { updates.push(`description = $${idx++}`); values.push(description); }
    if (stock !== undefined) { updates.push(`stock = $${idx++}`); values.push(stock); }
    if (category !== undefined) { updates.push(`category = $${idx++}`); values.push(category); }
    if (ar_image !== undefined) { updates.push(`ar_image = $${idx++}`); values.push(ar_image); }
    if (model_3d !== undefined) { updates.push(`model_3d = $${idx++}`); values.push(model_3d); }
    
    if (updates.length === 0) return res.json({});
    
    values.push(id);
    const query = `UPDATE products SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`;
    
    const result = await pool.query(query, values);
    if (result.rows.length === 0) return res.status(404).send();
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

// --- APPOINTMENTS ENDPOINTS ---

app.get('/api/appointments', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM appointments ORDER BY date DESC, time DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener citas' });
  }
});

app.post('/api/appointments', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, service, date, time } = req.body;
    const result = await pool.query(
      'INSERT INTO appointments (name, email, phone, service, date, time, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, email, phone, service, date, time, 'pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear cita' });
  }
});

app.patch('/api/appointments/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const { name, email, phone, service, date, time, status } = req.body;
    
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;
    
    if (name !== undefined) { updates.push(`name = $${idx++}`); values.push(name); }
    if (email !== undefined) { updates.push(`email = $${idx++}`); values.push(email); }
    if (phone !== undefined) { updates.push(`phone = $${idx++}`); values.push(phone); }
    if (service !== undefined) { updates.push(`service = $${idx++}`); values.push(service); }
    if (date !== undefined) { updates.push(`date = $${idx++}`); values.push(date); }
    if (time !== undefined) { updates.push(`time = $${idx++}`); values.push(time); }
    if (status !== undefined) { updates.push(`status = $${idx++}`); values.push(status); }
    
    if (updates.length === 0) return res.json({});
    
    values.push(id);
    const query = `UPDATE appointments SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`;
    
    const result = await pool.query(query, values);
    if (result.rows.length === 0) return res.status(404).send();
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar cita' });
  }
});

// --- USER PROFILE ENDPOINTS ---
app.put('/api/users/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { full_name, address, payment_method } = req.body;
    
    const result = await pool.query(
      'UPDATE users SET full_name = $1, address = $2, payment_method = $3 WHERE id = $4 RETURNING id, email, role, full_name, address, payment_method',
      [full_name, address, payment_method, userId]
    );

    res.json({ message: 'Perfil actualizado', user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

// Change Password
app.put('/api/users/password', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { currentPassword, newPassword } = req.body;

    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    const validPassword = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!validPassword) return res.status(401).json({ error: 'La contraseña actual es incorrecta' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, userId]);

    res.json({ message: 'Contraseña actualizada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar contraseña' });
  }
});

// --- PRESCRIPTIONS ENDPOINTS ---
app.get('/api/prescriptions', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT p.*, u.full_name as user_name FROM prescriptions p JOIN users u ON p.user_id = u.id ORDER BY p.date_issued DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener recetas' });
  }
});

app.post('/api/prescriptions', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { user_id, doctor_name, date_issued, od_sphere, od_cylinder, od_axis, od_addition, os_sphere, os_cylinder, os_axis, os_addition, pupillary_distance, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO prescriptions (user_id, doctor_name, date_issued, od_sphere, od_cylinder, od_axis, od_addition, os_sphere, os_cylinder, os_axis, os_addition, pupillary_distance, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *',
      [user_id, doctor_name, date_issued, od_sphere, od_cylinder, od_axis, od_addition, os_sphere, os_cylinder, os_axis, os_addition, pupillary_distance, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear receta' });
  }
});

// --- WORK ORDERS ENDPOINTS ---
app.get('/api/work_orders', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT w.*, u.full_name as user_name FROM work_orders w LEFT JOIN users u ON w.user_id = u.id ORDER BY w.created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener órdenes de trabajo' });
  }
});

app.post('/api/work_orders', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { user_id, prescription_id, total_amount, deposit_amount } = req.body;
    const balance_due = total_amount - (deposit_amount || 0);
    const result = await pool.query(
      'INSERT INTO work_orders (user_id, prescription_id, total_amount, deposit_amount, balance_due, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [user_id, prescription_id, total_amount, deposit_amount || 0, balance_due, 'pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear orden de trabajo' });
  }
});

// --- LENS OPTIONS ENDPOINTS ---
app.get('/api/lens_options', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM lens_options ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener opciones de cristales' });
  }
});

app.post('/api/lens_options', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, price_add, is_active } = req.body;
    const result = await pool.query(
      'INSERT INTO lens_options (name, price_add, is_active) VALUES ($1, $2, $3) RETURNING *',
      [name, price_add, is_active ?? true]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear opción de cristal' });
  }
});

app.patch('/api/lens_options/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const { name, price_add, is_active } = req.body;
    
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;
    
    if (name !== undefined) { updates.push(`name = $${idx++}`); values.push(name); }
    if (price_add !== undefined) { updates.push(`price_add = $${idx++}`); values.push(price_add); }
    if (is_active !== undefined) { updates.push(`is_active = $${idx++}`); values.push(is_active); }
    
    if (updates.length === 0) return res.json({});
    
    values.push(id);
    const result = await pool.query(`UPDATE lens_options SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`, values);
    
    if (result.rows.length === 0) return res.status(404).send();
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar opción de cristal' });
  }
});

app.delete('/api/lens_options/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    await pool.query('DELETE FROM lens_options WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar opción de cristal' });
  }
});

// --- CHECKOUT ENDPOINT (CART) ---
app.post('/api/checkout', async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { items, total_amount } = req.body;
    
    // 1. Create work order (anonymous user for now)
    const woResult = await client.query(
      "INSERT INTO work_orders (total_amount, deposit_amount, balance_due, status) VALUES ($1, $2, $3, 'completed') RETURNING id",
      [total_amount, total_amount, 0]
    );
    const workOrderId = woResult.rows[0].id;

    // 2. Insert items and deduct stock
    for (const item of items) {
      await client.query(
        'INSERT INTO detalles_orden (work_order_id, product_id, quantity, price_at_time, lens_option_name, lens_addon_price) VALUES ($1, $2, $3, $4, $5, $6)',
        [workOrderId, item.productId, item.quantity, item.price, item.lensOptionName || 'Solo Armazón', item.lensAddonPrice || 0]
      );
      await client.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.productId]
      );
    }
    
    await client.query('COMMIT');
    res.status(201).json({ message: 'Compra exitosa', orderId: workOrderId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Checkout Error:', err);
    res.status(500).json({ error: 'Error procesando la compra' });
  } finally {
    client.release();
  }
});

app.patch('/api/work_orders/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const { status, deposit_amount, balance_due } = req.body;
    
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;
    
    if (status !== undefined) { updates.push(`status = $${idx++}`); values.push(status); }
    if (deposit_amount !== undefined) { updates.push(`deposit_amount = $${idx++}`); values.push(deposit_amount); }
    if (balance_due !== undefined) { updates.push(`balance_due = $${idx++}`); values.push(balance_due); }
    
    if (updates.length === 0) return res.json({});
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    const query = `UPDATE work_orders SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`;
    
    const result = await pool.query(query, values);
    if (result.rows.length === 0) return res.status(404).send();
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar orden' });
  }
});

// --- REPORTS ENDPOINTS ---
app.get('/api/reports/monthly-sales/pdf', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
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
    
    // 1. Resumen Financiero
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
    
    // 2. Detalle de Artículos Vendidos
    const itemsResult = await pool.query(`
      SELECT 
        p.sku, 
        p.name, 
        p.brand, 
        p.category,
        d.lens_option_name,
        d.lens_addon_price,
        SUM(d.quantity) as total_qty,
        SUM(d.quantity * (d.price_at_time + d.lens_addon_price)) as total_revenue
      FROM detalles_orden d
      JOIN products p ON d.product_id = p.id
      JOIN work_orders w ON d.work_order_id = w.id
      WHERE EXTRACT(MONTH FROM w.created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM w.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
      GROUP BY p.sku, p.name, p.brand, p.category, d.lens_option_name, d.lens_addon_price
      ORDER BY p.category, p.name
    `);
    
    const items = itemsResult.rows;
    
    const lenses = items.filter(i => i.category === 'lente');
    const accessories = items.filter(i => i.category === 'accesorio');
    
    // Lentes
    doc.fontSize(16).text('Lentes Vendidos', { underline: true });
    doc.moveDown(0.5);
    if (lenses.length === 0) {
      doc.fontSize(11).font('Helvetica-Oblique').text('No se registraron ventas de lentes este mes.');
      doc.font('Helvetica');
      doc.moveDown();
    } else {
      lenses.forEach(item => {
        const skuStr = item.sku ? `[${item.sku}]` : '[Sin Código]';
        const crystalStr = item.lens_option_name ? ` - Cristal: ${item.lens_option_name}` : '';
        doc.fontSize(11).text(
          `${skuStr} ${item.brand} ${item.name}${crystalStr} (Cantidad: ${item.total_qty}) -> $${(Number(item.total_revenue) || 0).toLocaleString('es-CL')}`
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
      accessories.forEach(item => {
        const skuStr = item.sku ? `[${item.sku}]` : '[Sin Código]';
        doc.fontSize(11).text(
          `${skuStr} ${item.brand} ${item.name} (Cantidad: ${item.total_qty}) -> $${(Number(item.total_revenue) || 0).toLocaleString('es-CL')}`
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
