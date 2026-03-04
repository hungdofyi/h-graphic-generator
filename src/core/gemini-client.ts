import { GoogleGenAI } from '@google/genai';

/**
 * Thin wrapper around Google Generative AI for style extraction
 * Handles rate limiting, JSON extraction, and retries
 */
export class GeminiClient {
  private client: GoogleGenAI;
  private lastCallTime = 0;
  private minDelayMs = 6500; // ~10 RPM = 1 call per 6s + buffer

  /**
   * Create client - API key from env var only (security)
   */
  constructor() {
    const apiKey = process.env['GEMINI_API_KEY'];
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY env var required. Get one free at https://aistudio.google.com/apikey'
      );
    }
    this.client = new GoogleGenAI({ apiKey });
  }

  /**
   * Analyze images with a prompt, returning parsed JSON
   */
  async analyzeImages<T>(
    images: Buffer[],
    prompt: string,
    model = 'gemini-2.0-flash'
  ): Promise<T> {
    await this.rateLimit();

    // Build parts: text prompt + inline image data
    const imageParts = images.map((buffer) => ({
      inlineData: {
        mimeType: 'image/png',
        data: buffer.toString('base64'),
      },
    }));

    const response = await this.client.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }, ...imageParts],
        },
      ],
    });

    const text = response.text || '';

    // Extract JSON from response (may be wrapped in markdown fences)
    return this.extractJson<T>(text);
  }

  /**
   * Text-only prompt (for synthesis pass)
   */
  async textPrompt<T>(prompt: string, model = 'gemini-2.0-flash'): Promise<T> {
    await this.rateLimit();

    const response = await this.client.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
    });

    const text = response.text || '';
    return this.extractJson<T>(text);
  }

  /**
   * Extract JSON from response, handling markdown fences
   */
  private extractJson<T>(text: string): T {
    // Strip markdown fences if present
    let cleaned = text.trim();

    // Remove ```json ... ``` wrapper
    const jsonFenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonFenceMatch) {
      cleaned = jsonFenceMatch[1]?.trim() || cleaned;
    }

    // Try to parse
    try {
      return JSON.parse(cleaned) as T;
    } catch (e) {
      // Try to find JSON object in response
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]) as T;
        } catch {
          throw new Error(`Failed to parse JSON from response: ${cleaned.substring(0, 200)}`);
        }
      }
      throw new Error(`No valid JSON found in response: ${cleaned.substring(0, 200)}`);
    }
  }

  /**
   * Rate limit to stay under 10 RPM
   */
  private async rateLimit(): Promise<void> {
    const elapsed = Date.now() - this.lastCallTime;
    if (elapsed < this.minDelayMs) {
      await new Promise((r) => setTimeout(r, this.minDelayMs - elapsed));
    }
    this.lastCallTime = Date.now();
  }
}
