import { GoogleGenAI } from "@google/genai";
import { CommentInput, CommentResponse } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateComments = async (input: CommentInput): Promise<CommentResponse> => {
  try {
    const model = "gemini-2.5-flash";
    
    // Clean up input to remove empty optional fields for cleaner JSON payload
    const payload = Object.fromEntries(
      Object.entries(input).filter(([_, v]) => v !== undefined && v !== "" && (Array.isArray(v) ? v.length > 0 : true))
    );

    const response = await ai.models.generateContent({
      model: model,
      contents: JSON.stringify(payload),
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.7, 
      },
    });

    let text = response.text;
    if (!text) {
      throw new Error("No response text received from Gemini.");
    }

    // Clean Markdown code blocks if present
    if (text.startsWith("```json")) {
        text = text.replace(/^```json\n/, "").replace(/\n```$/, "");
    } else if (text.startsWith("```")) {
        text = text.replace(/^```\n/, "").replace(/\n```$/, "");
    }

    try {
      const jsonResponse = JSON.parse(text) as CommentResponse;
      return jsonResponse;
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, text);
      throw new Error("Failed to parse AI response.");
    }

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
