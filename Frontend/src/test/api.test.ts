import { vi, describe, it, expect, beforeEach } from 'vitest';
import { api } from '../services/api';
import { supabase } from '../supabaseClient';

// Definición de mocks de Supabase robustos con soporte de encadenamiento (.select().eq().single())
const selectMock = vi.fn().mockReturnThis();
const insertMock = vi.fn().mockReturnThis();
const deleteMock = vi.fn().mockReturnThis();
const updateMock = vi.fn().mockReturnThis();
const eqMock = vi.fn().mockReturnThis();
const singleMock = vi.fn().mockReturnThis();
const thenMock = vi.fn();

const queryBuilder = {
  select: selectMock,
  insert: insertMock,
  delete: deleteMock,
  update: updateMock,
  eq: eqMock,
  single: singleMock,
  then: thenMock,
};

vi.mock('../supabaseClient', () => {
  const mockFrom = vi.fn().mockImplementation(() => queryBuilder);
  const mockAuth = {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    getSession: vi.fn(),
  };

  return {
    supabase: {
      from: mockFrom,
      auth: mockAuth,
      rpc: vi.fn(),
    },
  };
});

describe('api service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Valor por defecto para cualquier llamada asíncrona a Supabase a través del encadenamiento
    thenMock.mockImplementation((resolve) => resolve({ data: null, error: null }));
  });

  // Pruebas del método loginUser en escenarios exitosos y con fallos de autenticación
  it('loginUser: debe retornar token y perfil de usuario si es exitoso o lanzar error si falla', async () => {
    // Caso Exitoso
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: {
        user: { id: 'auth-123', email: 'test@example.com' },
        session: { access_token: 'jwt-token-123' },
      } as any,
      error: null,
    });

    thenMock.mockImplementation((resolve) => resolve({
      data: {
        id: 1,
        role: 'admin',
        full_name: 'Giovanni Lente',
        address: 'Quinta Normal 123',
        payment_method: 'transbank',
      },
      error: null,
    }));

    const result = await api.loginUser('test@example.com', 'password123');

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(supabase.from).toHaveBeenCalledWith('users');
    expect(result.token).toBe('jwt-token-123');
    expect(result.user.role).toBe('admin');
    expect(result.user.full_name).toBe('Giovanni Lente');

    // Caso Fallido
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Credenciales inválidas' } as any,
    });

    await expect(api.loginUser('test@example.com', 'wrongpassword')).rejects.toThrow('Credenciales inválidas');
  });

  // Verifica el registro correcto de nuevos usuarios en auth y perfil
  it('registerUser: debe registrar en auth y crear perfil en la tabla de users', async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: {
        user: { id: 'new-auth-123', email: 'new@example.com' },
        session: null,
      } as any,
      error: null,
    });

    thenMock.mockImplementation((resolve) => resolve({ error: null }));

    const result = await api.registerUser('new@example.com', 'securepass');

    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'securepass',
      options: {
        emailRedirectTo: 'http://localhost:3000'
      }
    });
    expect(supabase.from).toHaveBeenCalledWith('users');
    expect(result.user.id).toBe('new-auth-123');
  });

  // Valida las operaciones básicas de creación, obtención y eliminación del catálogo
  it('Productos CRUD: debe permitir crear, listar y eliminar productos del catálogo', async () => {
    // 3.1: createProduct
    const newProduct = {
      name: 'Lente Moderno',
      brand: 'Rayban',
      price: 89990,
      description: 'Lente de titanio',
      category: 'lente' as const,
      stock: 10,
      image: 'https://images.com/lente.png',
      model_3d: '',
    };

    thenMock.mockImplementation((resolve) => resolve({
      data: { id: 99, ...newProduct },
      error: null,
    }));

    const createResult = await api.createProduct(newProduct);
    expect(supabase.from).toHaveBeenCalledWith('products');
    expect(insertMock).toHaveBeenCalledWith([newProduct]);
    expect(createResult.id).toBe(99);
    expect(createResult.name).toBe('Lente Moderno');

    // 3.2: getProducts
    const productsMock = [
      { id: 1, name: 'Lente A', brand: 'Oakley', price: 12000 },
      { id: 2, name: 'Lente B', brand: 'Rodenstock', price: 45000 },
    ];

    thenMock.mockImplementation((resolve) => resolve({
      data: productsMock,
      error: null,
    }));

    const getResult = await api.getProducts();
    expect(supabase.from).toHaveBeenCalledWith('products');
    expect(getResult).toHaveLength(2);
    expect(getResult[0].name).toBe('Lente A');

    // 3.3: deleteProduct
    thenMock.mockImplementation((resolve) => resolve({ error: null }));

    await api.deleteProduct(42);
    expect(supabase.from).toHaveBeenCalledWith('products');
    expect(eqMock).toHaveBeenCalledWith('id', 42);
  });

  it('deleteAccount: debe invocar la función RPC delete_own_user en Supabase para eliminar la cuenta', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: null,
    });

    await api.deleteAccount();

    expect(supabase.rpc).toHaveBeenCalledWith('delete_own_user');
  });
});
