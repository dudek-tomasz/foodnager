/**
 * OpenRouterClient
 * 
 * Client for OpenRouter API - provides access to various AI models
 * Used for recipe generation in Tier 3
 */

/**
 * OpenRouter API configuration
 */
interface OpenRouterConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
  timeout: number;
}

/**
 * OpenRouter API response
 */
interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * OpenRouterClient class
 */
export class OpenRouterClient {
  private config: OpenRouterConfig;

  constructor(config?: Partial<OpenRouterConfig>) {
    this.config = {
      apiUrl: import.meta.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions',
      apiKey: import.meta.env.OPENROUTER_API_KEY || '',
      model: import.meta.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku',
      timeout: parseInt(import.meta.env.TIER3_TIMEOUT_MS || '30000', 10),
      ...config,
    };

    if (!this.config.apiKey) {
      console.warn('OpenRouter API key not configured - AI features will not work');
    }
  }

  /**
   * Generate recipe using AI
   * 
   * @param prompt - Structured prompt for recipe generation
   * @returns Parsed AI response (should be JSON)
   * @throws Error if API call fails or response is invalid
   */
  async generateRecipe(prompt: string): Promise<unknown> {
    if (!this.config.apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7, // Balance between creativity and consistency
          max_tokens: 2000,
          response_format: { type: 'json_object' }, // Request JSON response
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API error:', response.status, errorText);
        throw new Error(`OpenRouter API returned ${response.status}: ${errorText}`);
      }

      const data: OpenRouterResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error('OpenRouter API returned no choices');
      }

      const content = data.choices[0].message.content;

      // Log token usage for monitoring
      if (data.usage) {
        console.log('OpenRouter token usage:', data.usage);
      }

      // Parse JSON response
      try {
        return JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', content);
        throw new Error('AI response is not valid JSON');
      }
      
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('OpenRouter API request timed out');
      }
      
      throw error;
    }
  }

  /**
   * Build HTTP headers for OpenRouter API
   */
  private buildHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
      'HTTP-Referer': 'https://foodnager.app', // Required by OpenRouter
      'X-Title': 'Foodnager', // Optional but recommended
    };
  }

  /**
   * Check if OpenRouter is configured
   */
  isConfigured(): boolean {
    return !!this.config.apiKey;
  }
}

/**
 * Export default instance
 */
export const openRouterClient = new OpenRouterClient();

