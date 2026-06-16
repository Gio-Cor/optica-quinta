import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { CartPage } from '../components/CartPage';
// Mock de api para evitar llamadas reales en getProducts dentro del useEffect de CartPage
vi.mock('../services/api', () => {
  return {
    api: {
      getProducts: vi.fn().mockResolvedValue([]),
    },
  };
});
describe('CartPage Component', () => {
  const mockOnRemove = vi.fn();
  const mockOnUpdateQuantity = vi.fn();
  const mockOnCheckout = vi.fn();
  const mockOnContinueShopping = vi.fn();
  const mockOnAddToCart = vi.fn();
  const mockItems = [
    {
      product: {
        id: 1,
        name: 'Lente Elegante',
        brand: 'Rodenstock',
        price: 50000,
        description: 'Lente moderno',
        category: 'lente' as const,
        stock: 5,
        image: 'lente.png',
        model_3d: '',
      },
      quantity: 2,
      lensOption: {
        id: 10,
        name: 'Monofocal estándar',
        price_add: 10000,
        is_active: true,
      },
    },
  ];
  // Test 9: Render del carrito vacío
  it('debe mostrar la pantalla de carrito vacío con botón para volver al catálogo', () => {
    render(
      <CartPage
        items={[]}
        onRemove={mockOnRemove}
        onUpdateQuantity={mockOnUpdateQuantity}
        onCheckout={mockOnCheckout}
        onContinueShopping={mockOnContinueShopping}
        onAddToCart={mockOnAddToCart}
      />
    );
    expect(screen.getByText('Su carrito está vacío')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Volver al catálogo' })).toBeInTheDocument();
  });
  // Test 10: Render de productos en el carrito y cálculo correcto de totales con promociones
  it('debe listar los productos del carrito y calcular correctamente el total con la promoción vigente', () => {
    render(
      <CartPage
        items={mockItems}
        onRemove={mockOnRemove}
        onUpdateQuantity={mockOnUpdateQuantity}
        onCheckout={mockOnCheckout}
        onContinueShopping={mockOnContinueShopping}
        onAddToCart={mockOnAddToCart}
      />
    );
    // Debe mostrar el nombre del producto
    expect(screen.getByText('Lente Elegante')).toBeInTheDocument();
    // Debe mostrar el cristal seleccionado
    expect(screen.getByText(/Monofocal estándar/)).toBeInTheDocument();
    // El precio base es 50k, cristal es 10k → 60k por unidad
    // Promoción: 50% de descuento en la 2da unidad → 60k + 30k = 90k total
    expect(screen.getAllByText(/90\.000/)[0]).toBeInTheDocument();
  });
});