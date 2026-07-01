import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { VirtualTryOnModal } from '../components/VirtualTryOnModal';

// Evita errores de animación en JSDOM mockeando la librería motion
vi.mock('motion/react', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: any, ref: any) => (
      <div ref={ref} {...props}>{children}</div>
    )),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mockea el SDK de MediaPipe Tasks Vision para evitar descargas de WASM en los tests
vi.mock('@mediapipe/tasks-vision', () => {
  return {
    FilesetResolver: {
      forVisionTasks: vi.fn().mockResolvedValue({}),
    },
    FaceLandmarker: {
      createFromOptions: vi.fn().mockResolvedValue({
        detectForVideo: vi.fn().mockReturnValue({ facialTransformationMatrixes: [] }),
        close: vi.fn(),
      }),
    },
  };
});

// Mockea Three.js y sus dependencias WebGL/Loaders
vi.mock('three', () => {
  const dummyGroup = {
    add: vi.fn(),
    position: { set: vi.fn() },
    rotation: { set: vi.fn() },
    scale: { set: vi.fn() },
    visible: true,
    matrixAutoUpdate: true,
    matrix: { copy: vi.fn() },
  };
  return {
    Scene: class {
      add = vi.fn();
      traverse = vi.fn();
    },
    PerspectiveCamera: class {
      position = { set: vi.fn() };
      lookAt = vi.fn();
    },
    WebGLRenderer: class {
      setSize = vi.fn();
      setPixelRatio = vi.fn();
      render = vi.fn();
      dispose = vi.fn();
    },
    AmbientLight: class {},
    DirectionalLight: class {
      position = { set: vi.fn() };
    },
    Group: vi.fn().mockImplementation(() => dummyGroup),
    Box3: class {
      setFromObject = vi.fn();
      getCenter = vi.fn();
      getSize = vi.fn();
    },
    Vector3: class {
      copy = vi.fn().mockReturnThis();
      multiplyScalar = vi.fn().mockReturnThis();
      set = vi.fn();
    },
    Matrix4: class {
      fromArray = vi.fn();
      copy = vi.fn();
    },
  };
});

vi.mock('three/examples/jsm/loaders/GLTFLoader.js', () => {
  return {
    GLTFLoader: class {
      load = vi.fn();
      parse = vi.fn();
      setDRACOLoader = vi.fn();
    },
  };
});

vi.mock('three/examples/jsm/loaders/DRACOLoader.js', () => {
  return {
    DRACOLoader: class {
      setDecoderPath = vi.fn();
    },
  };
});

// Mockea HTMLVideoElement.prototype.play en JSDOM ya que no retorna una Promesa por defecto en este entorno
Object.defineProperty(HTMLVideoElement.prototype, 'play', {
  writable: true,
  value: vi.fn().mockResolvedValue(undefined),
});

// Mock de la cámara de usuario por defecto
const mockGetUserMedia = vi.fn();
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: { getUserMedia: mockGetUserMedia },
});

const mockProduct = {
  id: 10,
  name: 'Lente Elegance Titanio',
  brand: 'Rodenstock',
  price: 120000,
  image: 'elegance.png',
  description: 'Armazón de titanio premium',
  model_3d: '',
  category: 'lente' as const,
};

describe('VirtualTryOnModal Component', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Por defecto la cámara falla para simular el caso de fallback automático
    mockGetUserMedia.mockRejectedValue(
      Object.assign(new Error('Permiso denegado'), { name: 'NotAllowedError' })
    );
  });

  // Helper para simular un estado en que la cámara y el modelo cargaron correctamente
  const renderInSuccessState = async (product = mockProduct) => {
    const mockStream = {
      getTracks: () => [{ stop: vi.fn() }],
    };
    mockGetUserMedia.mockResolvedValue(mockStream);
    const view = render(<VirtualTryOnModal product={product} onClose={mockOnClose} />);
    
    // Esperamos a que termine el estado de carga inicial
    await waitFor(() => {
      expect(screen.queryByText(/Iniciando Probador/i)).not.toBeInTheDocument();
    });
    
    // Verificamos que no se muestre el error de cámara
    expect(screen.queryByText(/Error Probador/i)).not.toBeInTheDocument();
    return view;
  };

  // Valida que el nombre y marca del producto se muestren y que los botones de cerrar invoquen onClose
  it('debe mostrar la marca y el nombre del producto cargado y permitir cerrarlo con el botón X', async () => {
    render(<VirtualTryOnModal product={mockProduct} onClose={mockOnClose} />);

    expect(screen.getByText('Rodenstock')).toBeInTheDocument();
    expect(screen.getByText('Lente Elegance Titanio')).toBeInTheDocument();

    // Simula clic en el botón de cerrar del panel derecho
    const closeButtons = screen.getAllByRole('button');
    fireEvent.click(closeButtons[1]);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  // Asegura que los controles básicos del probador se renderizan tras la carga
  it('debe renderizar los controles del probador tras superar el estado de carga inicial', async () => {
    await renderInSuccessState();

    expect(screen.getByText('Lente Elegance Titanio')).toBeInTheDocument();
    expect(screen.getByText(/Detección facial activa/i)).toBeInTheDocument();
    expect(screen.getByText('En vivo')).toBeInTheDocument();
  });





  // Valida que el cambio en el control deslizante actualice el porcentaje de escala en la interfaz
  it('debe actualizar la escala del lente al deslizar la barra de tamaño', async () => {
    await renderInSuccessState();

    const slider = screen.getByRole('slider');
    // Por defecto la escala inicial es 1.95 (representada como 98%)
    expect(screen.getByText('98%')).toBeInTheDocument();

    // Simula cambio del slider a un valor menor (1.50 -> 75%)
    fireEvent.change(slider, { target: { value: '1.50' } });
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  // Comprueba la transición al flujo de subida de imagen cuando se simula una subida de archivo
  it('debe cambiar de fuente de captura cuando se simula una subida de archivo', async () => {
    await renderInSuccessState();

    // Buscamos el input de tipo archivo
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();

    // Crea un archivo simulado para subir
    const file = new File(['dummy content'], 'test-face.png', { type: 'image/png' });
    
    fireEvent.change(fileInput!, { target: { files: [file] } });

    // La subida gatilla el cambio a modo foto con el botón 'Subir' activo (estilo blanco)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Subir/i })).toHaveClass('bg-white');
    });
  });
});