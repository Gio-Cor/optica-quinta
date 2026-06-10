import OpenAI from "openai";

const endpoint = "https://models.github.ai/inference";
const modelName = "openai/o4-mini";

const openai = new OpenAI({
    baseURL: endpoint,
    apiKey: import.meta.env.VITE_GITHUB_TOKEN || "sin-token-aun", // Esto evita que la app explote al cargar
    dangerouslyAllowBrowser: true
});
export const chatWithGithubModels = async (currentMessage: string, history: any[]) => {
    try {
        // 2. Usamos el rol 'developer' como muestra tu código guía para Óptica Quinta
        const developerMessage = {
            role: "developer",
            content: "Eres un optometrista experto para Óptica Quinta. Responde de forma muy amable, breve y profesional en español. Ayuda con dudas de lentes y salud visual."
        };

        // Juntamos las instrucciones del desarrollador, el historial y el mensaje actual
        const fullMessages = [
            developerMessage,
            ...history,
            { role: "user", content: currentMessage }
        ];

        // 3. Hacemos la llamada exacta tal cual viene en tu documentación
        const response = await openai.chat.completions.create({
            messages: fullMessages as any,
            model: modelName
        });

        return response.choices[0].message.content;
    } catch (error: any) {
        // Esto nos dirá en la consola exactamente qué opina GitHub sobre tu petición
        console.error("Error detallado del chatbot:", error);
        if (error.status === 429) {
            console.warn("¡Límite excedido! GitHub pide esperar: ", error.headers?.['retry-after'], "segundos.");
        }
        return "Lo siento, tuve un pequeño problema técnico. ¿Podrías repetir tu consulta?";
    }
};