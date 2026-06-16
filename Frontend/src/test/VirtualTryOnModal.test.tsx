import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { VirtualTryOnModal } from '../components/VirtualTryOnModal';

// Mock de motion/react para evitar errores de animación en JSDOM
vi.mock('motion/react', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: any, ref: any) => (
      <div ref={ref} {...props}>{children}</div>
    )),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock de navigator.mediaDevices para simular la cámara denegada
const mockGetUserMedia = vi.fn().mockRejectedValue(
  Object.assign(new Error('Permiso denegado'), { name: 'NotAllowedError' })
);

Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: { getUserMedia: mockGetUserMedia },
});

const mockProduct = {
  id: 5,
  name: 'Lente Elegance Titanio',
  brand: 'Rodenstock',
  price: 120000,
  image: 'elegance.png',
  description: 'Armazón de titanio premium',
  model_3d: 'https://storage.supabase.co/models/elegance.glb',
  category: 'lente' as const,
};

describe('VirtualTryOnModal Component', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserMedia.mockRejectedValue(
      Object.assign(new Error('Permiso denegado'), { name: 'NotAllowedError' })
    );
  });

  // Test 11: Carga de datos del producto y botón de cierre
  it('debe mostrar la marca y el nombre del producto cargado y permitir cerrarlo con el botón X', async () => {
    render(<VirtualTryOnModal product={mockProduct} onClose={mockOnClose} />);

    // El panel de info siempre es visible
    expect(screen.getByText('Rodenstock')).toBeInTheDocument();
    expect(screen.getByText('Lente Elegance Titanio')).toBeInTheDocument();

    // El modal tiene 3 botones: [0] X mobile, [1] X panel info, [2] Agregar al Carrito
    const closeButtons = screen.getAllByRole('button');
    fireEvent.click(closeButtons[1]);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  // Test 12: Información del modelo 3D en el panel y texto descriptivo correcto
  it('debe mostrar el texto indicando que el modelo 3D está activo cuando el producto tiene model_3d', async () => {
    render(<VirtualTryOnModal product={mockProduct} onClose={mockOnClose} />);

    // Verifica que el panel de info muestre el estado del modelo 3D
    expect(screen.getByText(/Modelo 3D cargado desde Supabase/i)).toBeInTheDocument();

    // Verifica que el panel de info siempre esté visible
    expect(screen.getByText(/Detección MediaPipe activa|Cámara activa/i)).toBeInTheDocument();
  });
});