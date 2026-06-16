-- Agrega estas columnas en Supabase SQL Editor
ALTER TABLE products
ADD COLUMN is_featured BOOLEAN DEFAULT false,
ADD COLUMN discount_percent INTEGER DEFAULT 0;
