
import { GoogleGenAI, Type } from "@google/genai";
import { MeshIntelligenceState, AgentHandshake, SpecialistAgent } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY, httpOptions: { apiVersion: "", baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL } });

export const synthesizeMeshIntelligence = async (
  agents: SpecialistAgent[],
  recentHandshakes: AgentHandshake[]
): Promise<MeshIntelligenceState> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `You are the Mesh Hub Broker IX. 
      Analyze the current inter-agent coordination state:
      Agents: ${JSON.stringify(agents.map(a => ({ id: a.id, role: a.role })))}
      Recent Neural Handshakes: ${JSON.stringify(recentHandshakes)}
      
      Generate a global intelligence synthesis:
      1. Cohesion Score (0-100%): How well the agents are working together.
      2. Active Loops: Number of multi-agent feedback cycles currently processing.
      3. Global Directives: High-level architectural pivots to improve engine stability.
      
      Return results in JSON format.`,
      config: {
        thinkingConfig: { thinkingBudget: 15000 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            globalCohesion: { type: Type.NUMBER },
            activeLoops: { type: Type.NUMBER },
            lastBrokerSynthesis: { type: Type.STRING },
            brokerDirectives: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["globalCohesion", "activeLoops", "lastBrokerSynthesis", "brokerDirectives"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Mesh Hub Synthesis Error:", error);
    return {
      globalCohesion: 88,
      activeLoops: 4,
      lastBrokerSynthesis: "Neural handshake frequencies are within optimal range. Minor latency detected in Scanner -> Captain feedback loop.",
      brokerDirectives: ["Increase heartbeat frequency for Scanner clusters", "Pre-emptively shard Executor callback logic"]
    };
  }
};

export const brokerHandshake = (
  sourceId: string, 
  targetId: string, 
  type: string, 
  summary: string
): AgentHandshake => {
  return {
    id: `HANDSHAKE-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    sourceAgentId: sourceId,
    targetAgentId: targetId,
    payloadType: type,
    summary: summary,
    intensity: 0.5 + Math.random() * 0.5,
    timestamp: new Date().toISOString()
  };
};
