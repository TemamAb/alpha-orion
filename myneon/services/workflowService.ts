import { GoogleGenAI, Type } from "@google/genai";
import { WorkflowState, ModuleInfo } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY, httpOptions: { apiVersion: "", baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL } });

export const calculateWorkflowState = async (modules: ModuleInfo[]): Promise<WorkflowState> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are the AstraElite Workflow Navigator IX.
      Analyze the current cluster state for 100% Elite Benchmark Compliance:
      Modules: ${JSON.stringify(modules.map(m => ({ id: m.id, name: m.name, score: m.score, cert: m.certLevel, status: m.status, gaps: m.precisionGaps })))}
      
      Target: 100% Score + Platinum Certification for all units.
      
      Task:
      1. Assign the engine to the correct phase (currentPhaseId): 'scaffolding', 'engineering', 'optimizing', or 'ready'.
      2. Calculate overall % progress (overallProgress) as a number between 0 and 100.
      3. Categorize engine status (engineStatus) as 'scaffolding', 'engineering', 'optimizing', or 'ready'.
      4. Generate 4 phases in the roadmap, including their completion status.
      5. Identify critical alerts for modules with low scores.
      
      Return results in strict JSON format.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            currentPhaseId: { type: Type.STRING, description: "ID of the current phase: scaffolding, engineering, optimizing, or ready" },
            overallProgress: { type: Type.NUMBER, description: "Total completion percentage" },
            engineStatus: { type: Type.STRING, description: "One of: scaffolding, engineering, optimizing, ready" },
            phases: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  status: { type: Type.STRING, description: "One of: pending, active, completed" },
                  description: { type: Type.STRING },
                  tasks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        label: { type: Type.STRING },
                        done: { type: Type.BOOLEAN }
                      },
                      required: ["id", "label", "done"]
                    }
                  }
                },
                required: ["id", "name", "status", "description", "tasks"]
              }
            },
            alerts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  moduleId: { type: Type.STRING },
                  message: { type: Type.STRING },
                  severity: { type: Type.STRING, description: "One of: critical, warning" }
                },
                required: ["moduleId", "message", "severity"]
              }
            }
          },
          required: ["currentPhaseId", "overallProgress", "engineStatus", "phases", "alerts"]
        }
      }
    });

    const text = response.text || "";
    return JSON.parse(text) as WorkflowState;
  } catch (error) {
    console.error("Workflow Service Error:", error);
    return {
      currentPhaseId: 'engineering',
      overallProgress: 45,
      engineStatus: 'engineering',
      phases: [
        { id: 'scaffolding', name: 'Scaffolding', status: 'completed', description: 'Core directory setup', tasks: [] },
        { id: 'engineering', name: 'Engineering', status: 'active', description: 'Tier modules construction', tasks: [] },
        { id: 'optimizing', name: 'Optimizing', status: 'pending', description: 'Elite benchmark tuning', tasks: [] },
        { id: 'ready', name: 'Ready', status: 'pending', description: 'Production handover', tasks: [] }
      ],
      alerts: [{ moduleId: 'global', message: 'Navigator recalibrating. Sync unstable.', severity: 'warning' }]
    };
  }
};

export const getWorkflowGuidance = async (message: string, modules: ModuleInfo[]) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are the Workflow Navigator IX. 
      Cluster State: ${JSON.stringify(modules.map(m => ({ name: m.name, score: m.score, gaps: m.precisionGaps })))}
      User Query: "${message}"
      
      Objective: Guide user to 100% Elite Benchmark. 
      Be authoritative, strategic, and concise. Identify which module needs the most attention right now.`,
    });
    return response.text || "Strategic link unstable. Fix Scanners to proceed.";
  } catch (error) {
    return "Strategic link unstable. Fix Scanners to proceed.";
  }
};