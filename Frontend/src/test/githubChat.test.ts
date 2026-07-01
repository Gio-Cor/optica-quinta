import { vi, describe, it, expect, beforeEach } from 'vitest';
import { chatWithGithubModels } from '../lib/githubChat';
// Usar vi.hoisted para declarar el mock antes de que vi.mock sea elevado (hoisted)
const { mockCreate } = vi.hoisted(() => {
  return {
    mockCreate: vi.fn(),
  };
});
vi.mock('openai', () => {
  class MockOpenAI {
    chat = {
      completions: {
        create: mockCreate,
      },
    };
  }
  return {
    default: MockOpenAI,
    OpenAI: MockOpenAI,
  };
});
describe('githubChat service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  // Comprueba que chatWithGithubModels retorne la respuesta correcta o maneje el error 429 con un mensaje amigable
  it('chatWithGithubModels: debe retornar la respuesta del modelo o manejar el error 429 con un mensaje amigable', async () => {
    // Caso Exitoso
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: 'Hola, soy un optometrista. Te sugiero lentes con filtro azul para pantallas.',
          },
        },
      ],
    });
    const history = [{ role: 'assistant', content: '¿En qué te ayudo?' }];
    const currentMessage = 'Me duelen los ojos al ver la pantalla';
    const result = await chatWithGithubModels(currentMessage, history);
    expect(mockCreate).toHaveBeenCalled();
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.model).toBe('gpt-4o-mini');
    expect(callArgs.messages).toHaveLength(3); // Developer instruction + 1 historial + 1 usuario
    expect(callArgs.messages[0].role).toBe('system');
    expect(callArgs.messages[2].content).toBe(currentMessage);
    expect(result).toBe('Hola, soy un optometrista. Te sugiero lentes con filtro azul para pantallas.');
    // Caso Error 429 (Límite de cuota)
    const rateLimitError = new Error('Rate limit exceeded');
    (rateLimitError as any).status = 429;
    (rateLimitError as any).headers = { 'retry-after': '15' };
    mockCreate.mockRejectedValue(rateLimitError);
    const errorResult = await chatWithGithubModels('Hola', []);
    expect(errorResult).toBe('Lo siento, tuve un pequeño problema técnico. ¿Podrías repetir tu consulta?');
  });
});