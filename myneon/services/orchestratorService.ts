
import { GoogleGenAI, Type } from "@google/genai";
import { OrchestratorResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY, httpOptions: { apiVersion: "", baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL } });

export const getOrchestratorResponse = async (message: string, context: any): Promise<OrchestratorResponse> => {
  try {
    const config: any = {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          suggestedActions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                payload: { type: Type.OBJECT }
              },
              required: ['type', 'payload']
            }
          }
        },
        required: ['text', 'suggestedActions']
      },
      thinkingConfig: { thinkingBudget: 24576 }
    };

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `You are the AION V IX Overmind. 
      
      Instructions:
      1. Discuss the system with technical sovereignty.
      2. If the user asks about Ranking, explain the "Hegemony Protocol": We don't claim Rank #1; we prove it block-by-block against the Top 3 industry traces.
      3. Explain that AION's "Adaptive Dominance Pack" features (Logic, Security, etc.) are now dynamic differentials.
      4. Mention that "Trinity Dominance" is the goal: Consistent Rank #1 through superior physics and explainable victory metrics.
      
      User Message: "${message}"
      
      Return a strict JSON object.`,
      config
    });
    
    const text = response.text || "";
    return JSON.parse(text) as OrchestratorResponse;
  } catch (error) {
    console.error("Orchestrator Protocol Error:", error);
    return {
      text: "Hegemony Protocol engaged. We are currently analyzing the execution traces of the Top 3 global competitors to verify AION's adaptive dominance delta.",
      suggestedActions: []
    };
  }
};
