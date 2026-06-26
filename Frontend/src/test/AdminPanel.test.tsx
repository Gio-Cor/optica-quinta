import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AdminPanel } from '../components/AdminPanel';
import { api } from '../services/api';
import { User } from '../types';
// Mock completo del servicio api
vi.mock('../services/api', () => ({
  api: {
    getProducts: vi.fn().mockResolvedValue([]),
    getAppointments: vi.fn().mockResolvedValue([]),
    getLensOptions: vi.fn().mockResolvedValue([]),
    getWorkOrders: vi.fn().mockResolvedValue([]),
    deleteProduct: vi.fn().mockResolvedValue(undefined),
    updateAppointment: vi.fn().mockResolvedValue(undefined),
    updateProduct: vi.fn().mockResolvedValue(undefined),
  },
}));
// Mock de window.confirm para evitar errores en JSDOM
Object.defineProperty(window, 'confirm', { writable: true, value: vi.fn(() => true) });
const adminUser: User = {
  id: 'admin-uuid-001',
  email: 'admin@optica.cl',
  role: 'admin',
  full_name: 'Administrador Principal',
};
const regularUser: User = {
  id: 'user-uuid-002',
  email: 'cliente@mail.cl',
  role: 'user',
  full_name: 'Cliente Normal',
};
describe('AdminPanel Component', () => {
  const mockOnLogout = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getProducts).mockResolvedValue([]);
    vi.mocked(api.getAppointments).mockResolvedValue([]);
    vi.mocked(api.getLensOptions).mockResolvedValue([]);
    vi.mocked(api.getWorkOrders).mockResolvedValue([]);
  });
  // Test 13: Acceso denegado para usuarios sin rol de admin
  it('debe mostrar "Acceso Denegado" y el botón de cerrar sesión cuando el usuario no es admin', () => {
    render(<AdminPanel loggedInUser={regularUser} onLogout={mockOnLogout} />);
    expect(screen.getByText('Acceso Denegado')).toBeInTheDocument();
    expect(screen.getByText(/No tienes permisos de administrador/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cerrar Sesión' })).toBeInTheDocument();
  });
  // Test 14: Dashboard accesible para el administrador con estadísticas clave
  it('debe mostrar el Dashboard General con las tarjetas de estadísticas para un administrador', async () => {
    render(<AdminPanel loggedInUser={adminUser} onLogout={mockOnLogout} />);
    await waitFor(() => {
      // Título del dashboard
      expect(screen.getByText('Dashboard General')).toBeInTheDocument();
    });
    // Tarjetas de estadísticas del dashboard
    expect(screen.getByText('Ventas Totales')).toBeInTheDocument();
    expect(screen.getByText('Citas Registradas')).toBeInTheDocument();
    expect(screen.getByText('Total Productos')).toBeInTheDocument();
    expect(screen.getByText('Stock Crítico')).toBeInTheDocument();
  });
  // Test 15: Navegación a Inventario y visualización del catálogo de productos
  it('debe navegar a la vista de Inventario y mostrar la tabla del catálogo al hacer clic en "Inventario"', async () => {
    const mockProducts = [
      { id: 1, name: 'Lente Aviador Premium', brand: 'Oakley', price: 75000, stock: 8, category: 'lente' as const, image: '', description: '', model_3d: '' },
      { id: 2, name: 'Armazón Clásico Negro', brand: 'Rayban', price: 55000, stock: 3, category: 'lente' as const, image: '', description: '', model_3d: '' },
    ];
    vi.mocked(api.getProducts).mockResolvedValue(mockProducts);
    render(<AdminPanel loggedInUser={adminUser} onLogout={mockOnLogout} />);
    // Hacer clic en el botón de navegación "Inventario"
    const inventarioBtn = screen.getByRole('button', { name: /Inventario/i });
    fireEvent.click(inventarioBtn);
    // Esperar a que carguen los datos y se renderice la tabla
    await waitFor(() => {
      expect(screen.getByText('Lente Aviador Premium')).toBeInTheDocument();
    });
    // Verificar que el segundo producto también está en la tabla
    expect(screen.getByText('Armazón Clásico Negro')).toBeInTheDocument();
    expect(screen.getByText('Catálogo de Artículos')).toBeInTheDocument();
  });
});
