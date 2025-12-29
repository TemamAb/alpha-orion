
import { GoogleGenAI, Type } from "@google/genai";
import { TotalUpgradeReport } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY, httpOptions: { apiVersion: "", baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL } });

export const performFullEngineUpgrade = async (engineDescription: string): Promise<TotalUpgradeReport> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `You are the AstraElite Engine Rebirth Specialist. 
      Analyze the following existing flash loan engine description/code:
      "${engineDescription}"
      
      Perform the following tasks:
      1. Deep-Dive Analysis: Identify critical gaps in security, arbitrage logic, and latency performance.
      2. Reorganization: Propose a world-class, modular directory structure following elite DeFi patterns.
      3. Logic Upgrade: Define advanced features for each module to reach Platinum certification.
      4. Executive Summary: Deliver a roadmap of what was fixed and improved.
      
      Return a detailed report in JSON format.`,
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            originalName: { type: Type.STRING },
            gapsIdentified: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING, enum: ["Security", "Performance", "Architecture", "Logic"] },
                  description: { type: Type.STRING },
                  impact: { type: Type.STRING, enum: ["Critical", "High", "Medium"] }
                },
                required: ["category", "description", "impact"]
              }
            },
            reorganizationPlan: {
              type: Type.OBJECT,
              properties: {
                projectName: { type: Type.STRING },
                architectureStyle: { type: Type.STRING },
                rationale: { type: Type.STRING },
                root: {
                  type: Type.ARRAY,
                  items: { type: Type.OBJECT } // Nested structure handled by logic
                }
              },
              required: ["projectName", "architectureStyle", "rationale", "root"]
            },
            upgradedModules: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  oldStatus: { type: Type.STRING },
                  newFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
                  improvementScore: { type: Type.NUMBER }
                },
                required: ["name", "oldStatus", "newFeatures", "improvementScore"]
              }
            },
            executiveSummary: { type: Type.STRING },
            deliveryTimestamp: { type: Type.STRING }
          },
          required: ["originalName", "gapsIdentified", "reorganizationPlan", "upgradedModules", "executiveSummary", "deliveryTimestamp"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Upgrade Agent Error:", error);
    throw error;
  }
};
