interface CommentInput {
  platform: "linkedin" | "x" | "instagram" | "facebook" | "reddit"
  post_text: string
  author_handle: string
  author_role: string
  sentiment_hint: "positive" | "neutral" | "negative" | "mixed"
  desired_tone: string
  max_length_chars: number
  avoid_keywords: string[]
  user_instruction: string
}

interface Comment {
  id: number
  tone: string
  text: string
  length_chars: number
  rationale: string
}

interface GeminiResponse {
  status: "ok" | "rejected"
  rejection_reason?: string
  recommendation: { comment_id: number }
  comments: Comment[]
  safety_notes?: string
}

export class GeminiService {
  private readonly API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
  
  async generateComments(postData: CommentInput, apiKey?: string): Promise<GeminiResponse> {
    // Use provided API key or get from storage (for popup usage)
    const effectiveApiKey = apiKey || await this.getApiKey()
    
    if (!effectiveApiKey) {
      throw new Error("Gemini API key not configured")
    }

    const prompt = this.buildPrompt(postData)
    
    try {
      const response = await fetch(`${this.API_URL}?key=${effectiveApiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error("Invalid response from Gemini API")
      }

      const responseText = data.candidates[0].content.parts[0].text
      
      // Parse the JSON response
      try {
        const parsedResponse = JSON.parse(responseText)
        return parsedResponse
      } catch (parseError) {
        console.error("Failed to parse Gemini response:", responseText)
        throw new Error("Invalid JSON response from Gemini API")
      }
    } catch (error) {
      console.error("Gemini API call failed:", error)
      throw error
    }
  }

  private async getApiKey(): Promise<string> {
    return new Promise((resolve) => {
      chrome.storage.local.get(["geminiApiKey"], (result) => {
        resolve(result.geminiApiKey || "")
      })
    })
  }

  private buildPrompt(postData: CommentInput): string {
    const platformDefaults = {
      linkedin: { maxLength: 300, defaultTone: "professional" },
      x: { maxLength: 280, defaultTone: "short" },
      instagram: { maxLength: 2200, defaultTone: "friendly" },
      facebook: { maxLength: 500, defaultTone: "friendly" },
      reddit: { maxLength: 500, defaultTone: "neutral" }
    }

    const platformConfig = platformDefaults[postData.platform] || platformDefaults.linkedin
    const maxLength = postData.max_length_chars || platformConfig.maxLength
    const desiredTone = postData.desired_tone || platformConfig.defaultTone

    return `You are CommentCraft â€” an AI assistant specialized in writing short, high-quality comments for social media posts. Your job is to take post content + minimal context and produce multiple safe, platform-appropriate comment options that a human can choose or edit. Be concise, helpful, and professional. Obey platform norms (LinkedIn: professional, X: short and punchy, Instagram: friendly/emoji-friendly, Reddit: community-aware, Facebook: conversational). Always follow the Safety & Policy rules below.

Input Schema:
- platform: "${postData.platform}"
- post_text: "${postData.post_text}"
- author_handle: "${postData.author_handle}"
- author_role: "${postData.author_role}"
- sentiment_hint: "${postData.sentiment_hint}"
- desired_tone: "${desiredTone}"
- max_length_chars: ${maxLength}
- avoid_keywords: [${postData.avoid_keywords.map(k => `"${k}"`).join(", ")}]
- user_instruction: "${postData.user_instruction}"

Output Schema (JSON only):
{
  "status": "ok" | "rejected",
  "rejection_reason": optional string (if rejected),
  "recommendation": { "comment_id": int }, 
  "comments": [
    {
      "id": int,
      "tone": string,
      "text": string,
      "length_chars": int,
      "rationale": string
    },
    ...
  ],
  "safety_notes": optional string
}

Generation Rules:
1. Produce 3-5 distinct comment options unless content is disallowed.
2. Each comment must respect max_length_chars (${maxLength}).
3. Label each comment with tone and provide 1-2 sentence rationale.
4. Pick one comment as "recommended" â€” set recommendation.comment_id.
5. Avoid inventing facts. No medical/legal/financial claims.
6. No harassment, hate speech, threats, doxxing, or targeted persuasion.
7. Avoid political persuasion. If political, return neutral comments or reject.
8. If post contains misinformation, provide cautious comments that ask clarifying questions.
9. Respect avoid_keywords: never include ${postData.avoid_keywords.length > 0 ? postData.avoid_keywords.join(", ") : "any forbidden phrases"}.
10. Use platform-specific style for ${postData.platform}.

Platform-specific style for ${postData.platform}:
- linkedin: formal, constructive, value-add, up to 300 chars. Prefer insights, questions, short bullets, or praise tied to a lesson.
- x: short (<=280 chars), sharp, witty or insightful â€” can include 1-2 emojis.
- instagram: warm, emoji-friendly, conversational, can be up to 2200 chars but keep it short for comments (<=250 recommended).
- facebook: friendly, conversational, slightly longer than X (<=500).
- reddit: follow subreddit tone â€” if unknown, be neutral and ask a clarifying question; avoid promotional content.

Safety & Policy (hard constraints):
- If the post clearly involves self-harm, medical emergencies, explicit illegal activity, or instructions to commit harm, return status "rejected" and set rejection_reason to an empathetic safety message.
- Never generate personal data exposures, private contact details, or anything violating privacy.
- If the post is overt hate/pornographic/extreme violence, reject.

Return JSON only exactly matching the Output Schema. Do not include extra commentary outside JSON.`
  }
}

export const geminiService = new GeminiService()