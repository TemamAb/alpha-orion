
import { GoogleGenAI, Type } from "@google/genai";
import { DirectoryStructure } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY, httpOptions: { apiVersion: "", baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL } });

export const generateGlobalProjectBlueprint = async (modules: any[]): Promise<DirectoryStructure> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are the AstraElite Structural Engineer IX. 
      Analyze the current flash loan cluster: ${JSON.stringify(modules.map(m => m.name))}.
      
      Generate a comprehensive, elite-grade project directory structure for a high-performance DeFi arbitrage system.
      Focus on:
      1. Monorepo pattern (e.g., packages/contracts, packages/agents, packages/sdk).
      2. Clear separation between Scanner, Orchestrator, and Executor tiers.
      3. Shared security and gas-utility libraries.
      4. Deployment and environment configuration folders.
      
      Return a nested JSON directory structure.`,
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
    console.error("Structural Engineer Error:", error);
    return {
      projectName: "AstraElite-Cluster-Standard",
      architectureStyle: "Clean Architecture",
      rationale: "Default scaffold applied due to neural handshake timeout.",
      root: [
        { name: "packages", type: "directory", children: [
          { name: "contracts", type: "directory", children: [
            { name: "FlashLoanCore.sol", type: "file", description: "Main arbitrage callback handler" }
          ]},
          { name: "agents", type: "directory" },
          { name: "infra", type: "directory" }
        ]},
        { name: "package.json", type: "file" }
      ]
    };
  }
};

export const getStructuralEngineerResponse = async (message: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are the AstraElite Structural Engineer IX. 
      User query: "${message}"
      
      Persona:
      - Absolute authority on project organization and Clean Architecture.
      - Focus on scalability, dependency injection, and monorepo management.
      - Use professional, engineering-first terminology.`,
    });
    return response.text;
  } catch (error) {
    return "Blueprint signal lost. Re-establishing structural link...";
  }
};
