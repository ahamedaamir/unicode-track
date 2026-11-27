import { callLiveGemini, getGeminiApiKey } from "./gemini-client";
import { 
  buildProjectRequirementsPrompt, 
  GenerateRequirementsParams 
} from "./prompts";

/**
 * Server-side Gemini service for generating structured academic requirements.
 * Reads API key strictly from environment variables without client exposure.
 * Strictly calls live Gemini AI without hardcoded mock fallbacks.
 */
export async function generateProjectRequirements(
  params: GenerateRequirementsParams
): Promise<{ text: string; source: "gemini" }> {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error("Gemini API key is not configured in environment variables.");
  }

  const prompt = buildProjectRequirementsPrompt(params);

  const result = await callLiveGemini({
    contents: prompt,
  });

  if (!result?.text) {
    throw new Error("Gemini AI returned empty content for project requirements.");
  }

  return { text: result.text, source: "gemini" };
}

// Re-export Gemini group extraction utilities
export {
  extractGroupsWithGemini,
  GeminiGroupExtractionResponseSchema,
  type GeminiGroupExtractionResponse,
} from "./extract-groups";
