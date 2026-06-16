import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Chatbot } from '../components/Chatbot';
import { chatWithGithubModels } from '../lib/githubChat';
// Mock de la librería de animación motion/react para evitar problemas en JSDOM
vi.mock('motion/react', () => {
  return {
    motion: {
      div: React.forwardRef(({ children, ...props }: any, ref: any) => (
        <div ref={ref} {...props}>{children}</div>
      )),
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});
// Mock del servicio de chat
vi.mock('../lib/githubChat', () => {
  return {
    chatWithGithubModels: vi.fn(),
  };
});
describe('Chatbot Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  // Test 7: Abre y cierra la ventana de conversación del chatbot
  it('debe abrir y cerrar la ventana del chat al presionar el botón flotante', async () => {
    render(<Chatbot />);
    // Al inicio, no debe mostrarse el mensaje de bienvenida
    expect(screen.queryByText('¡Hola! Bienvenido a Óptica Quinta. ¿En qué puedo asesorarte hoy?')).not.toBeInTheDocument();
    // Hacer clic en el botón flotante para abrir
    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);
    // Ahora debe mostrarse el mensaje de bienvenida
    expect(screen.getByText('¡Hola! Bienvenido a Óptica Quinta. ¿En qué puedo asesorarte hoy?')).toBeInTheDocument();
    // Hacer clic en el botón de cerrar (el primero disponible en el header)
    const closeButtons = screen.getAllByRole('button');
    fireEvent.click(closeButtons[0]);
    // El panel debe cerrarse
    expect(screen.queryByText('¡Hola! Bienvenido a Óptica Quinta. ¿En qué puedo asesorarte hoy?')).not.toBeInTheDocument();
  });
  // Test 8: Envío de mensaje y renderizado de respuesta del bot
  it('debe mostrar el mensaje del usuario y la respuesta del bot al enviar una consulta', async () => {
    vi.mocked(chatWithGithubModels).mockResolvedValue('Respuesta del optometrista virtual mockeado.');
    render(<Chatbot />);
    // Abrir chat
    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);
    // Escribir y enviar mensaje
    const input = screen.getByPlaceholderText('Escribe tu consulta...');
    fireEvent.change(input, { target: { value: '¿Tiene lentes de sol?' } });
    const sendButton = screen.getAllByRole('button')[1];
    fireEvent.click(sendButton);
    // Debe mostrar el mensaje del usuario inmediatamente
    expect(screen.getByText('¿Tiene lentes de sol?')).toBeInTheDocument();
    // Esperar respuesta de la IA
    await waitFor(() => {
      expect(chatWithGithubModels).toHaveBeenCalledWith('¿Tiene lentes de sol?', [
        { role: 'assistant', content: '¡Hola! Bienvenido a Óptica Quinta. ¿En qué puedo asesorarte hoy?' }
      ]);
      expect(screen.getByText('Respuesta del optometrista virtual mockeado.')).toBeInTheDocument();
    });
  });
});