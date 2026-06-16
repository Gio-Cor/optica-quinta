import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AuthForm } from '../components/AuthForm';
import { api } from '../services/api';
// Mock del servicio api
vi.mock('../services/api', () => {
  return {
    api: {
      loginUser: vi.fn(),
      registerUser: vi.fn(),
    },
  };
});
describe('AuthForm Component', () => {
  const mockOnLogin = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
  });
  // Test 5: Render inicial en modo Login y alternancia al modo Registro
  it('debe renderizar el formulario en modo login y alternar al modo de registro y viceversa', () => {
    render(<AuthForm onLogin={mockOnLogin} />);
    // Estado inicial: Login
    expect(screen.getByRole('heading', { name: 'Iniciar Sesión' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('correo@ejemplo.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeInTheDocument();
    // Alternar a Registro
    const toggleButton = screen.getByRole('button', { name: '¿No tienes cuenta? Regístrate' });
    fireEvent.click(toggleButton);
    expect(screen.getByRole('heading', { name: 'Crear Cuenta' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Registrarse' })).toBeInTheDocument();
    // Volver a Login
    const toggleBack = screen.getByRole('button', { name: '¿Ya tienes cuenta? Inicia Sesión' });
    fireEvent.click(toggleBack);
    expect(screen.getByRole('heading', { name: 'Iniciar Sesión' })).toBeInTheDocument();
  });
  // Test 6: Envío del formulario de Login con credenciales válidas
  it('debe llamar a api.loginUser y al callback onLogin al enviar credenciales válidas', async () => {
    const mockUserData = {
      id: 'auth-123',
      email: 'user@test.com',
      role: 'user',
      full_name: 'Test User',
      address: '',
      payment_method: '',
    };
    vi.mocked(api.loginUser).mockResolvedValue({
      token: 'mock-jwt-token',
      user: mockUserData,
    });
    render(<AuthForm onLogin={mockOnLogin} />);
    const emailInput = screen.getByPlaceholderText('correo@ejemplo.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: 'Ingresar' });
    fireEvent.change(emailInput, { target: { value: 'user@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(api.loginUser).toHaveBeenCalledWith('user@test.com', 'password123');
      expect(mockOnLogin).toHaveBeenCalledWith('mock-jwt-token', mockUserData);
    });
  });
});