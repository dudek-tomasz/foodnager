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
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

/**
 * Options for generateRecipe method
 */
interface GenerateRecipeOptions {
  temperature?: number;
  maxTokens?: number;
  systemMessage?: string;
  responseSchema?: ResponseSchema;
}

/**
 * Response format schema following OpenRouter spec
 */
interface ResponseSchema {
  type: 'json_schema';
  json_schema: {
    name: string;
    strict: boolean;
    schema: JsonSchemaObject;
  };
}

/**
 * JSON Schema object structure
 */
interface JsonSchemaObject {
  type: 'object';
  properties: Record<string, JsonSchemaProperty>;
  required?: string[];
  additionalProperties: boolean;
}

/**
 * JSON Schema property definition
 */
type JsonSchemaProperty = 
  | { type: 'string'; description?: string; enum?: string[] }
  | { type: 'number'; description?: string }
  | { type: 'boolean'; description?: string }
  | { type: 'array'; items: JsonSchemaProperty; description?: string }
  | JsonSchemaObject;

/**
 * Message for chat completions
 */
interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Health check result
 */
interface HealthCheckResult {
  isHealthy: boolean;
  model: string;
  latency?: number;
  error?: string;
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
      model: import.meta.env.OPENROUTER_MODEL || 'perplexity/sonar-pro',
      timeout: parseInt(import.meta.env.TIER3_TIMEOUT_MS || '45000', 10),
      temperature: parseFloat(import.meta.env.OPENROUTER_TEMPERATURE || '0.7'),
      maxTokens: parseInt(import.meta.env.OPENROUTER_MAX_TOKENS || '2000', 10),
      topP: parseFloat(import.meta.env.OPENROUTER_TOP_P || '1.0'),
      frequencyPenalty: parseFloat(import.meta.env.OPENROUTER_FREQUENCY_PENALTY || '0'),
      presencePenalty: parseFloat(import.meta.env.OPENROUTER_PRESENCE_PENALTY || '0'),
      ...config,
    };

    if (!this.config.apiKey) {
      console.warn('OpenRouter API key not configured - AI features will not work');
    }
  }

  /**
   * Generate text using AI (general purpose)
   * 
   * @param prompt - Text prompt
   * @param options - Optional parameters
   * @returns Generated text
   * @throws Error if API call fails
   */
  async generateText(
    prompt: string,
    options?: { temperature?: number; max_tokens?: number; systemMessage?: string }
  ): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const requestBody = {
        model: this.config.model,
        messages: this.buildMessages(prompt, options?.systemMessage),
        temperature: options?.temperature ?? this.config.temperature,
        max_tokens: options?.max_tokens ?? this.config.maxTokens,
      };

      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
      }

      const data: OpenRouterResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from OpenRouter API');
      }

      return data.choices[0].message.content;
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error(`OpenRouter API request timed out after ${this.config.timeout}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Generate recipe using AI
   * 
   * @param prompt - Structured prompt for recipe generation
   * @param options - Optional parameters to override defaults
   * @returns Parsed AI response (structured JSON)
   * @throws Error if API call fails or response is invalid
   */
  async generateRecipe(prompt: string, options?: GenerateRecipeOptions): Promise<unknown> {
    // Walidacja konfiguracji
    if (!this.config.apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    // Walidacja długości promptu
    const MAX_PROMPT_LENGTH = 10000;
    if (prompt.length > MAX_PROMPT_LENGTH) {
      throw new Error(`Prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters`);
    }

    // Przygotowanie timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    // Pomiar latencji
    const startTime = performance.now();

    try {
      // Budowanie payload'u żądania
      const requestBody = {
        model: this.config.model,
        messages: this.buildMessages(prompt, options?.systemMessage),
        temperature: options?.temperature ?? this.config.temperature,
        max_tokens: Math.min(
          options?.maxTokens ?? this.config.maxTokens,
          5000 // Bezpieczny limit
        ),
        top_p: this.config.topP,
        frequency_penalty: this.config.frequencyPenalty,
        presence_penalty: this.config.presencePenalty,
        response_format: options?.responseSchema ?? this.getDefaultResponseSchema(),
      };

      // Wywołanie API
      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Obliczenie latencji
      const latency = performance.now() - startTime;
      console.log(`🔵 [OpenRouter] API latency: ${latency.toFixed(0)}ms`);
      console.log(`🔵 [OpenRouter] Response status: ${response.status} ${response.statusText}`);
      console.log(`🔵 [OpenRouter] Response OK: ${response.ok}`);
      console.log(`🔵 [OpenRouter] Content-Type: ${response.headers.get('content-type')}`);

      // Najpierw pobierz tekst odpowiedzi
      const responseText = await response.text();
      console.log(`🔵 [OpenRouter] Response body (first 500 chars):`, responseText.substring(0, 500));

      // Obsługa błędów HTTP
      if (!response.ok) {
        console.error('❌ [OpenRouter] HTTP Error detected');
        await this.handleApiError(response, responseText);
      }

      // Parsowanie odpowiedzi jako JSON
      let data: OpenRouterResponse;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ [OpenRouter] Failed to parse response as JSON');
        console.error('Response was:', responseText);
        throw new Error('OpenRouter returned invalid JSON response. Check API URL and key configuration.');
      }

      if (!data.choices || data.choices.length === 0) {
        throw new Error('OpenRouter API returned no choices');
      }

      const content = data.choices[0].message.content;

      // Logowanie użycia tokenów
      if (data.usage) {
        console.log('OpenRouter token usage:', {
          prompt_tokens: data.usage.prompt_tokens,
          completion_tokens: data.usage.completion_tokens,
          total_tokens: data.usage.total_tokens,
          model: this.config.model,
        });
      }

      // Parsowanie JSON z response_format
      try {
        return JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', content);
        throw new Error('AI response is not valid JSON - check response_format configuration');
      }
      
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error(`OpenRouter API request timed out after ${this.config.timeout}ms`);
      }
      
      throw error;
    }
  }

  /**
   * Check OpenRouter API health
   * 
   * @returns Health check result with latency
   */
  async healthCheck(): Promise<HealthCheckResult> {
    if (!this.config.apiKey) {
      return {
        isHealthy: false,
        model: this.config.model,
        error: 'API key not configured',
      };
    }

    const startTime = performance.now();
    
    try {
      const testPrompt = 'Respond with a single word: "OK"';
      
      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify({
          model: this.config.model,
          messages: [{ role: 'user', content: testPrompt }],
          max_tokens: 10,
        }),
        signal: AbortSignal.timeout(5000), // 5s timeout dla health check
      });

      const latency = performance.now() - startTime;

      if (!response.ok) {
        return {
          isHealthy: false,
          model: this.config.model,
          latency,
          error: `HTTP ${response.status}`,
        };
      }

      return {
        isHealthy: true,
        model: this.config.model,
        latency,
      };
    } catch (error: any) {
      const latency = performance.now() - startTime;
      
      return {
        isHealthy: false,
        model: this.config.model,
        latency,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Check if OpenRouter is configured
   */
  isConfigured(): boolean {
    return !!this.config.apiKey;
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
   * Build message array for chat completion
   * 
   * @param userPrompt - User's prompt
   * @param systemMessage - Optional system message
   * @returns Array of messages
   */
  private buildMessages(userPrompt: string, systemMessage?: string): Message[] {
    const messages: Message[] = [];

    if (systemMessage) {
      messages.push({
        role: 'system',
        content: systemMessage,
      });
    }

    messages.push({
      role: 'user',
      content: userPrompt,
    });

    return messages;
  }

  /**
   * Get default JSON schema for recipe generation
   * 
   * @returns Response schema for structured output
   */
  private getDefaultResponseSchema(): ResponseSchema {
    return {
      type: 'json_schema',
      json_schema: {
        name: 'recipe_generation',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            recipes: {
              type: 'array',
              description: 'Tablica 5 przepisów, najlepszy na pierwszym miejscu',
              items: {
                type: 'object',
                properties: {
                  title: {
                    type: 'string',
                    description: 'Nazwa przepisu po polsku (zwięzła i apetyczna)',
                  },
                  description: {
                    type: 'string',
                    description: 'Krótki opis dania w jednym zdaniu po polsku',
                  },
                  instructions: {
                    type: 'string',
                    description: 'Instrukcje gotowania krok po kroku po polsku (numerowane kroki, szczegółowe)',
                  },
                  cooking_time: {
                    type: 'number',
                    description: 'Czas gotowania w minutach',
                  },
                  difficulty: {
                    type: 'string',
                    enum: ['easy', 'medium', 'hard'],
                    description: 'Poziom trudności przepisu',
                  },
                  ingredients: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        product_name: {
                          type: 'string',
                          description: 'Polska nazwa składnika',
                        },
                        quantity: {
                          type: 'number',
                          description: 'Ilość składnika',
                        },
                        unit: {
                          type: 'string',
                          description: 'Jednostka miary po polsku (np. sztuka, gram, ml, łyżka)',
                        },
                      },
                      required: ['product_name', 'quantity', 'unit'],
                      additionalProperties: false,
                    },
                    description: 'Lista składników z ilościami',
                  },
                  tags: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                    description: 'Tagi do kategoryzacji po polsku (np. wegetariańskie, szybkie danie)',
                  },
                  sources: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: {
                          type: 'string',
                          description: 'Nazwa źródła (np. KwestiaSmaku, AniaGotuje, BBC Good Food)',
                        },
                        url: {
                          type: 'string',
                          description: 'Pełny URL do przepisu źródłowego',
                        },
                      },
                      required: ['name', 'url'],
                      additionalProperties: false,
                    },
                    description: 'Źródła inspiracji - linki do oryginalnych przepisów kulinarnych',
                  },
                },
                required: ['title', 'description', 'instructions', 'cooking_time', 'difficulty', 'ingredients', 'tags', 'sources'],
                additionalProperties: false,
              },
            },
          },
          required: ['recipes'],
          additionalProperties: false,
        },
      },
    };
  }

  /**
   * Try to parse error response as JSON
   * 
   * @param errorText - Raw error text
   * @returns Parsed error object or null
   */
  private tryParseErrorJson(errorText: string): unknown | null {
    try {
      return JSON.parse(errorText);
    } catch {
      return null;
    }
  }

  /**
   * Handle API error response
   * 
   * @param response - Failed response object
   * @throws Error with descriptive message
   */
  private async handleApiError(response: Response, errorText: string): Promise<never> {
    const errorData = this.tryParseErrorJson(errorText);

    console.error('OpenRouter API error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorData || errorText,
      model: this.config.model,
    });

    switch (response.status) {
      case 401:
        throw new Error('❌ Invalid API key - check OPENROUTER_API_KEY configuration');
      case 402:
        throw new Error('💳 Insufficient credits - please add credits to your OpenRouter account at https://openrouter.ai/credits');
      case 429:
        throw new Error('⏱️ Rate limit exceeded - please try again later');
      case 500:
      case 502:
      case 503:
        throw new Error('🔧 OpenRouter service is temporarily unavailable - please try again');
      default:
        const message = (errorData as any)?.error?.message || errorText.substring(0, 200);
        throw new Error(`OpenRouter API error (${response.status}): ${message}`);
    }
  }
}

/**
 * Export default instance
 */
export const openRouterClient = new OpenRouterClient();

