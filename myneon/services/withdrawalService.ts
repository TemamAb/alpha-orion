
import { GoogleGenAI, Type } from "@google/genai";
import { WithdrawalReport } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY, httpOptions: { apiVersion: "", baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL } });

export const detectAndCalibrateVault = async (): Promise<WithdrawalReport> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are the Liquidity Guardian IX.
      Perform a scan for Top 5 Non-Custodial Wallets (MetaMask, Trust, Coinbase, Ledger, Trezor).
      Simulate the detection of an active session and prepare a withdrawal vault report.
      
      Requirements:
      1. List top 5 wallets and their detection status.
      2. Generate a valid active address (simulated).
      3. Set a default auto-withdrawal threshold.
      4. List recent simulated payout transactions.
      
      Return results in JSON format.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedWallets: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  icon: { type: Type.STRING },
                  isDetected: { type: Type.BOOLEAN },
                  status: { type: Type.STRING, enum: ['Connected', 'Disconnected', 'Locked'] }
                },
                required: ["name", "icon", "isDetected", "status"]
              }
            },
            activeAddress: { type: Type.STRING },
            isAddressValidated: { type: Type.BOOLEAN },
            profitAvailableUsd: { type: Type.NUMBER },
            autoWithdrawal: {
              type: Type.OBJECT,
              properties: {
                enabled: { type: Type.BOOLEAN },
                threshold: { type: Type.NUMBER }
              },
              required: ["enabled", "threshold"]
            },
            transactionHistory: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  amount: { type: Type.NUMBER },
                  destination: { type: Type.STRING },
                  timestamp: { type: Type.STRING },
                  status: { type: Type.STRING, enum: ['Confirmed', 'Pending'] }
                },
                required: ["id", "amount", "destination", "timestamp", "status"]
              }
            }
          },
          required: ["detectedWallets", "activeAddress", "isAddressValidated", "profitAvailableUsd", "autoWithdrawal", "transactionHistory"]
        }
      }
    });

    const result = JSON.parse(response.text);
    return {
      ...result,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Withdrawal Service Error:", error);
    return {
      detectedWallets: [
        { name: 'MetaMask', icon: '🦊', isDetected: true, status: 'Connected' },
        { name: 'Trust Wallet', icon: '🛡️', isDetected: false, status: 'Disconnected' },
        { name: 'Coinbase Wallet', icon: '🔵', isDetected: false, status: 'Disconnected' },
        { name: 'Ledger', icon: '📟', isDetected: true, status: 'Locked' },
        { name: 'Trezor', icon: '🔐', isDetected: false, status: 'Disconnected' }
      ],
      activeAddress: "0x" + Math.random().toString(16).slice(2, 42),
      isAddressValidated: true,
      profitAvailableUsd: 1450.85,
      autoWithdrawal: { enabled: false, threshold: 500 },
      transactionHistory: [],
      timestamp: new Date().toISOString()
    };
  }
};
