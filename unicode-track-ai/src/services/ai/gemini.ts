import { GoogleGenAI } from "@google/genai";
import { 
  buildProjectRequirementsPrompt, 
  generateFallbackRequirements, 
  GenerateRequirementsParams 
} from "./prompts";

/**
 * Server-side Gemini service for generating structured academic requirements.
 * Reads API key strictly from environment variables without client exposure.
 */
export async function generateProjectRequirements(
  params: GenerateRequirementsParams
): Promise<{ text: string; source: "gemini" | "fallback" }> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY;

  if (apiKey && !apiKey.includes("placeholder")) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = buildProjectRequirementsPrompt(params);

      // Using the latest Gemini model
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      if (response && response.text) {
        return { text: response.text, source: "gemini" };
      }
    } catch (err) {
      console.warn("Gemini API call failed, activating academic fallback generator:", err);
    }
  }

  // Provide robust structured fallback for offline demo/development
  return {
    text: generateFallbackRequirements(params),
    source: "fallback",
  };
}

// Re-export Gemini group extraction utilities
export {
  extractGroupsWithGemini,
  GeminiGroupExtractionResponseSchema,
  type GeminiGroupExtractionResponse,
} from "./extract-groups";
