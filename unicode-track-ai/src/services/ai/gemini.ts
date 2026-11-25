import { callLiveGemini, getGeminiApiKey } from "./gemini-client";
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
  const apiKey = getGeminiApiKey();

  if (apiKey) {
    try {
      const prompt = buildProjectRequirementsPrompt(params);

      const result = await callLiveGemini({
        contents: prompt,
      });

      if (result.text) {
        return { text: result.text, source: "gemini" };
      }
    } catch (err: any) {
      console.warn("Live Gemini API call failed, activating academic fallback generator:", err?.message || err);
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
