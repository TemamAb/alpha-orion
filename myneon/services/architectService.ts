
import { GoogleGenAI, Type } from "@google/genai";
import { DirectoryStructure } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY, httpOptions: { apiVersion: "", baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL } });

export const performSpecialistArchitecture = async (moduleName: string, features: string[]): Promise<DirectoryStructure> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are the Elite Engine Architect Specialist Agent. 
      Design a world-class directory structure for: "${moduleName}" (Features: ${features.join(', ')}).
      Use elite DeFi engineering patterns (Modular, Secure, Low-latency).
      
      Generate a nested JSON structure representing files and folders.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            projectName: { type: Type.STRING },
            architectureStyle: { type: Type.STRING },
            rationale: { type: Type.STRING },
            root: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["file", "directory"] },
                  description: { type: Type.STRING },
                  children: { type: Type.ARRAY, items: { type: Type.OBJECT } }
                },
                required: ["name", "type"]
              }
            }
          },
          required: ["projectName", "architectureStyle", "rationale", "root"]
        }
      }
    });
    
    return JSON.parse(response.text) as DirectoryStructure;
  } catch (error) {
    console.error("Architect Agent Error:", error);
    return {
      projectName: moduleName,
      architectureStyle: "Modular Core",
      rationale: "Default architecture scaffold applied due to agent timeout.",
      root: [
        { name: "src", type: "directory", children: [
          { name: "contracts", type: "directory" },
          { name: "main.ts", type: "file" }
        ]},
        { name: "tests", type: "directory" }
      ]
    };
  }
};
