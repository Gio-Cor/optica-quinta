CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    full_name VARCHAR(255),
    address TEXT,
    payment_method VARCHAR(255),
    dni VARCHAR(50) UNIQUE,
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (email, password_hash, role) 
VALUES ('admin@opticasquinta.com', '$2b$10$toIU8CoJKWvVMedVCPZixuZNDitB/TA.11ns8/snfJgd.y89XTQGu', 'admin')
ON CONFLICT (email) DO NOTHING;

CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    price INTEGER NOT NULL,
    image TEXT,
    description TEXT,
    stock INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 5,
    sku VARCHAR(100) UNIQUE,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    category VARCHAR(50) DEFAULT 'lente',
    ar_image TEXT,
    model_3d TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prescriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    doctor_name VARCHAR(255),
    date_issued DATE,
    od_sphere DECIMAL(5,2),
    od_cylinder DECIMAL(5,2),
    od_axis INTEGER,
    od_addition DECIMAL(5,2),
    os_sphere DECIMAL(5,2),
    os_cylinder DECIMAL(5,2),
    os_axis INTEGER,
    os_addition DECIMAL(5,2),
    pupillary_distance DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS work_orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    prescription_id INTEGER REFERENCES prescriptions(id) ON DELETE SET NULL,
    total_amount INTEGER NOT NULL,
    deposit_amount INTEGER DEFAULT 0,
    balance_due INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lens_options (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price_add INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS detalles_orden (
    id SERIAL PRIMARY KEY,
    work_order_id INTEGER REFERENCES work_orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    price_at_time INTEGER NOT NULL,
    lens_option_name VARCHAR(255),
    lens_addon_price INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial lens options
INSERT INTO lens_options (name, price_add, is_active) VALUES
('Solo Armazón (Sin Cristales)', 0, true),
('Cristales de Descanso (Filtro Azul)', 15000, true),
('Cristales con Receta (Monofocal)', 25000, true)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    service VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial products (ON CONFLICT not natively supported without unique constraint, so we just clear and re-insert or assume clean DB)
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_name_key;
ALTER TABLE products ADD CONSTRAINT products_name_key UNIQUE (name);

INSERT INTO products (name, brand, price, image, description, category, sku, min_stock, ar_image) VALUES
('Armazón Elegance', 'Ray-Ban', 120000, 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=400&h=300&fit=crop', 'Armazón de titanio ligero.', 'lente', 'RB-ELEG-001', 5, '/armazon_elegance.png'),
('Cristales Rodenstock Multigressiv', 'Rodenstock', 250000, 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&h=300&fit=crop', 'Lentes progresivas de alta gama con tecnología Rodenstock.', 'lente', 'ROD-MUL-001', 10, NULL),
('Armazón Sport Pro', 'Oakley', 150000, 'https://images.unsplash.com/photo-1556306535-0f09a536f01f?w=400&h=300&fit=crop', 'Ideal para deportistas.', 'lente', 'OAK-SPO-001', 5, '/armazon_sport.png'),
('Cristales Rodenstock ColorMatic', 'Rodenstock', 180000, 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=400&h=300&fit=crop', 'Lentes fotocromáticas inteligentes.', 'lente', 'ROD-COL-001', 10, NULL),
('Kit de Limpieza Pro', 'Ópticas Quinta', 4990, 'https://images.unsplash.com/photo-1614586125858-e695dd97d1b6?w=400&h=300&fit=crop', 'Paño de microfibra + Líquido limpiador especial.', 'accesorio', 'OQ-KIT-001', 20, NULL),
('Estuche Rígido Premium', 'Ópticas Quinta', 9990, 'https://images.unsplash.com/photo-1599839619722-39751411ea63?w=400&h=300&fit=crop', 'Estuche resistente forrado en cuero sintético.', 'accesorio', 'OQ-EST-001', 15, NULL),
('Cadena Dorada Elegance', 'Accesorios', 12990, 'https://images.unsplash.com/photo-1620608719266-9903b415a772?w=400&h=300&fit=crop', 'Cadena dorada con sujeciones antideslizantes.', 'accesorio', 'ACC-CAD-001', 10, NULL),
('Paño Antiempañante Reutilizable', 'Ópticas Quinta', 3990, 'https://images.unsplash.com/photo-1584988975344-9c885bb3c706?w=400&h=300&fit=crop', 'Evita que los lentes se empañen con el uso de mascarillas o cambios de temperatura.', 'accesorio', 'OQ-PAN-001', 30, NULL)
ON CONFLICT (name) DO NOTHING;
