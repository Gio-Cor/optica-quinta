# Ópticas Quinta - Sistema e-Commerce y Probador Virtual

## Descripción
Sistema web completo para Ópticas Quinta que incluye un catálogo de productos, carrito de compras, agendamiento de citas, y un **Probador Virtual de Realidad Aumentada (AR)** impulsado por Inteligencia Artificial para que los clientes puedan probarse los lentes en tiempo real. Además, cuenta con un panel administrativo para gestión de ventas y reportes.

---

## Tecnologías Utilizadas

### Frontend
- **Framework:** React 18 (Vite) + TypeScript
- **Estilos:** Tailwind CSS + Framer Motion
- **Inteligencia Artificial:** Google MediaPipe (Face Mesh)
- **Renderizado 3D:** Three.js (@react-three/fiber)

### Backend
- **Microservicio:** Node.js + Express
- **Pagos:** SDK de Stripe
- **Generación de PDFs:** PDFKit

### Base de Datos & Autenticación
- **Plataforma:** Supabase (PostgreSQL)

---

## Requisitos

Para ejecutar este proyecto localmente, necesitas tener instalado:
- [Node.js](https://nodejs.org/) (v18 o superior)
- Git

## Instalación Rápida

### 1. Configurar y correr el Frontend
```bash
cd Frontend
npm install
npm run dev
```
*(Requiere configurar un archivo `.env` con las credenciales `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`)*

### 2. Configurar y correr el Backend
```bash
cd Backend
npm install
npm run dev
```
*(Requiere configurar un archivo `.env` con las credenciales de Supabase y `STRIPE_SECRET_KEY`)*
