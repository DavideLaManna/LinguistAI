import { GoogleGenAI, Type } from "@google/genai";
import { ContextResult, VariationResult } from "../types";

// Initialize Gemini Client
// Note: process.env.API_KEY is guaranteed to be available by the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-3-pro-preview';

export const generateVariations = async (
  sourceLang: string,
  targetLang: string,
  text: string
): Promise<string[]> => {
  try {
    const prompt = `Translate the following text from ${sourceLang} to ${targetLang}. 
    Provide exactly 5 distinct, natural ways to express this in ${targetLang}, ranging from formal to casual if applicable.
    The input text is: "${text}"`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            variations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A list of 5 distinct translation variations."
            }
          },
          required: ["variations"]
        }
      }
    });

    const jsonResponse = JSON.parse(response.text || "{}") as VariationResult;
    return jsonResponse.variations || [];
  } catch (error) {
    console.error("Error generating variations:", error);
    throw error;
  }
};

export const generateContextExamples = async (
  sourceLang: string,
  targetLang: string,
  word: string
): Promise<ContextExample[]> => {
  try {
    // For context mode: Input is in Source Lang (e.g., English 'Silly'). 
    // Output: 5 sentences in Source Lang containing 'word', translated to Target Lang (e.g., Italian).
    const prompt = `Create 5 distinct sentences in ${sourceLang} that correctly use the word or phrase: "${word}".
    Then, translate each complete sentence into ${targetLang}.
    Make the sentences diverse in context (e.g., casual, professional, emotional).`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            examples: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  original: { type: Type.STRING, description: `The sentence in ${sourceLang}` },
                  translated: { type: Type.STRING, description: `The translation in ${targetLang}` }
                },
                required: ["original", "translated"]
              }
            }
          },
          required: ["examples"]
        }
      }
    });

    const jsonResponse = JSON.parse(response.text || "{}") as ContextResult;
    return jsonResponse.examples || [];
  } catch (error) {
    console.error("Error generating context examples:", error);
    throw error;
  }
};

// Type definition needed locally to avoid circular dependency if we put it in types.ts and imported here
interface ContextExample {
  original: string;
  translated: string;
}
