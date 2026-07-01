import OpenAI from "openai";

const endpoint = "https://models.github.ai/inference";
const modelName = "gpt-4o-mini";

const openai = new OpenAI({
    baseURL: endpoint,
    apiKey: import.meta.env.VITE_GITHUB_TOKEN || "sin-token-aun", // Esto evita que la app explote al cargar
    dangerouslyAllowBrowser: true
});
export const chatWithGithubModels = async (currentMessage: string, history: any[], productsContext?: string) => {
    try {
        let systemPrompt = "Eres un optometrista experto y asesor de ventas oficial para Óptica Quinta. Responde de forma muy amable, breve y profesional en español. Ayuda con dudas de lentes, accesorios y salud visual.";
        
        if (productsContext) {
            systemPrompt += `\n\nTienes acceso al catálogo completo de la tienda en tiempo real (lentes, armazones y accesorios). Utiliza la siguiente lista de productos e inventario para responder las preguntas de los clientes de forma precisa, recomendando productos adecuados, mencionando disponibilidad (stock), características técnicas (como filtro azul, polarizados, antirreflejo, etc.), marcas y precios:\n${productsContext}\n\nNota: Si el cliente pregunta por un producto que no está en la lista o pregunta si vendes algo que no coincide con las descripciones, responde amablemente indicando qué productos similares tienes disponibles en el catálogo.`;
        }

        const systemMessage = {
            role: "system",
            content: systemPrompt
        };

        // Juntamos las instrucciones del sistema, el historial y el mensaje actual
        const fullMessages = [
            systemMessage,
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