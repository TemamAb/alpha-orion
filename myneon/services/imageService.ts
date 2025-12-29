import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

export interface ImageEditResult {
  imageUrl: string;
  explanation: string;
}

export const editArchitectureVisual = async (
  base64Image: string,
  mimeType: string,
  prompt: string
): Promise<ImageEditResult> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: `You are the AstraElite Visual Architect. 
            Analyze the provided image and apply the following edit: "${prompt}". 
            Common requests include adding technical overlays, retro filters, removing elements, or enhancing glowing effects.
            Maintain the elite, high-performance DeFi aesthetic (dark mode, glowing elements, precision). 
            Generate the updated image and provide a brief explanation of the modifications.`,
          },
        ],
      },
    });

    let imageUrl = '';
    let explanation = '';

    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        } else if (part.text) {
          explanation = part.text;
        }
      }
    }

    return { imageUrl, explanation };
  } catch (error) {
    console.error("Visual Forge Error:", error);
    throw error;
  }
};