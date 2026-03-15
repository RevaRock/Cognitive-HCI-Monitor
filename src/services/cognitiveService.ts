import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface InteractionMetrics {
  mouseVelocity: number; // pixels per second
  clickFrequency: number; // clicks per minute
  typingSpeed: number; // characters per minute
  scrollJitter: number; // variance in scroll speed
  idleTime: number; // seconds
  timestamp: number;
}

export interface CognitiveState {
  state: "Focused" | "Fatigued" | "Frustrated" | "Distracted" | "Flow";
  confidence: number;
  reasoning: string;
  suggestions: string[];
}

export async function inferCognitiveState(metrics: InteractionMetrics[]): Promise<CognitiveState> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Analyze the following human-computer interaction metrics collected over the last few minutes.
    Infer the user's cognitive state (Focused, Fatigued, Frustrated, Distracted, or Flow).
    
    Metrics History:
    ${JSON.stringify(metrics.slice(-10), null, 2)}
    
    Consider these behavioral cues:
    - High mouse velocity + high click frequency + low typing speed might indicate Frustration.
    - Low mouse velocity + long idle times might indicate Fatigue.
    - Consistent typing speed + steady scrolling might indicate Flow/Focus.
    - High scroll jitter + erratic mouse movements might indicate Distraction.
    
    Return a JSON object matching this structure:
    {
      "state": "Focused" | "Fatigued" | "Frustrated" | "Distracted" | "Flow",
      "confidence": 0-1,
      "reasoning": "Short explanation",
      "suggestions": ["suggestion 1", "suggestion 2"]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      }
    });

    const result = JSON.parse(response.text || "{}");
    return result as CognitiveState;
  } catch (error) {
    console.error("Error inferring cognitive state:", error);
    return {
      state: "Focused",
      confidence: 0.5,
      reasoning: "Defaulting due to analysis error.",
      suggestions: ["Take a deep breath."]
    };
  }
}
