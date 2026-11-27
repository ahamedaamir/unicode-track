import { GoogleGenAI } from "@google/genai";

/**
 * Returns the active Gemini API key from environment variables.
 */
export function getGeminiApiKey(): string | null {
  const key =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY;

  if (!key || key.includes("placeholder") || key.includes("your-gemini-api-key")) {
    return null;
  }
  return key.trim();
}

/**
 * Creates an authenticated GoogleGenAI client instance.
 */
export function createGeminiClient(): GoogleGenAI | null {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

/**
 * Supported production Gemini models in order of priority.
 * gemini-2.5-flash: high speed, advanced reasoning, verified active on current keys.
 * gemini-2.0-flash: general purpose high performance.
 * gemini-1.5-flash: universal fallback across all Google AI Studio tiers.
 * gemini-3.5-flash / gemini-3.5-flash-lite: latest generation preview models.
 */
const ACTIVE_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-2.5-pro",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash",
];

export interface GenerateGeminiOptions {
  contents: any;
  config?: any;
}

export interface GenerateGeminiResult {
  text: string;
  model: string;
  response: any;
}

/**
 * Calls live Gemini AI with automatic failover between supported active models.
 */
export async function callLiveGemini(
  options: GenerateGeminiOptions
): Promise<GenerateGeminiResult> {
  const ai = createGeminiClient();
  if (!ai) {
    throw new Error("Gemini API key is not configured in environment variables.");
  }

  let lastError: any = null;

  for (const model of ACTIVE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: options.contents,
        config: options.config,
      });

      if (response && response.text) {
        return {
          text: response.text,
          model,
          response,
        };
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini AI] Model ${model} returned: ${err?.message || err}. Retrying with next active model...`);
    }
  }

  throw lastError || new Error("Failed to generate content with available Gemini models.");
}
