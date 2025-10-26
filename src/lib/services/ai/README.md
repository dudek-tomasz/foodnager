# OpenRouter Client Service

## Przegląd

`OpenRouterClient` to dedykowany klient HTTP do komunikacji z API OpenRouter.ai, zapewniający dostęp do różnych modeli językowych (LLM) w celu generowania przepisów kulinarnych.

## Funkcje

- ✅ **JSON Schema** - gwarancja struktury odpowiedzi poprzez strict mode
- ✅ **System Messages** - lepsza kontrola zachowania modelu
- ✅ **Konfigurowalne Parametry** - elastyczność bez zmian kodu
- ✅ **Lepsza Obsługa Błędów** - szczegółowe komunikaty i retry logic
- ✅ **Health Checks** - monitoring dostępności API
- ✅ **Bezpieczeństwo** - walidacja inputów, rate limiting, timeout
- ✅ **Logging & Monitoring** - tracking użycia tokenów i kosztów

## Podstawowe Użycie

### Prosta generacja przepisu

```typescript
import { OpenRouterClient } from './ai/openrouter.client';

const client = new OpenRouterClient();

// Sprawdź, czy klient jest skonfigurowany
if (!client.isConfigured()) {
  console.error('OpenRouter API key not configured');
  return;
}

const prompt = 'Generate a recipe using tomatoes and basil';
const recipe = await client.generateRecipe(prompt);
console.log(recipe);
```

### Z opcjami nadpisywania parametrów

```typescript
const recipe = await client.generateRecipe(prompt, {
  temperature: 0.9,              // Więcej kreatywności
  maxTokens: 3000,               // Dłuższa odpowiedź
  systemMessage: 'You are an Italian chef specializing in traditional cuisine.',
});
```

### Z własnym JSON Schema

```typescript
const customSchema = {
  type: 'json_schema',
  json_schema: {
    name: 'simple_recipe',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        ingredients: {
          type: 'array',
          items: { type: 'string' },
        },
        steps: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['title', 'ingredients', 'steps'],
      additionalProperties: false,
    },
  },
};

const recipe = await client.generateRecipe(prompt, {
  responseSchema: customSchema,
});
```

## Health Check

Sprawdź dostępność API przed wykonaniem kosztownych operacji:

```typescript
const health = await client.healthCheck();

if (!health.isHealthy) {
  console.error('OpenRouter unavailable:', health.error);
  // Obsłuż błąd (np. fallback do cached recipes)
} else {
  console.log(`OpenRouter available (latency: ${health.latency}ms)`);
  // Kontynuuj z generowaniem
}
```

## Konfiguracja

### Zmienne Środowiskowe

Utwórz plik `.env` w głównym katalogu projektu:

```bash
# OpenRouter API Configuration
OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
OPENROUTER_MODEL=anthropic/claude-3-haiku

# Model Parameters
OPENROUTER_TEMPERATURE=0.7
OPENROUTER_MAX_TOKENS=2000
OPENROUTER_TOP_P=1.0
OPENROUTER_FREQUENCY_PENALTY=0
OPENROUTER_PRESENCE_PENALTY=0

# Timeout Configuration
TIER3_TIMEOUT_MS=30000
```

### Parametry Modelu

| Parametr | Domyślnie | Opis | Zakres |
|----------|-----------|------|--------|
| `temperature` | 0.7 | Kontroluje kreatywność/losowość | 0.0 (deterministyczny) - 2.0 (bardzo kreatywny) |
| `maxTokens` | 2000 | Maksymalna długość odpowiedzi | 1 - 5000 (hard limit w kodzie) |
| `topP` | 1.0 | Nucleus sampling | 0.0 - 1.0 |
| `frequencyPenalty` | 0 | Kara za powtórzenia | -2.0 - 2.0 |
| `presencePenalty` | 0 | Kara za obecność tokenów | -2.0 - 2.0 |

### Dostępne Modele

Rekomendowane dla przepisów:

- `anthropic/claude-3-haiku` ⭐ - Szybki, ekonomiczny (domyślny)
- `anthropic/claude-3-sonnet` - Zbalansowany
- `anthropic/claude-3-opus` - Najbardziej zaawansowany
- `openai/gpt-4-turbo` - Alternatywa OpenAI
- `openai/gpt-3.5-turbo` - Ekonomiczna opcja OpenAI

Pełna lista: [OpenRouter Models](https://openrouter.ai/models)

## Obsługa Błędów

### Kategorie Błędów

Klient rzuca szczegółowe błędy dla różnych scenariuszy:

```typescript
try {
  const recipe = await client.generateRecipe(prompt);
} catch (error) {
  if (error.message.includes('not configured')) {
    // Brak API key - błąd konfiguracji
  } else if (error.message.includes('Rate limit exceeded')) {
    // 429 - zbyt wiele żądań, retry później
  } else if (error.message.includes('timed out')) {
    // Timeout - zwiększ TIER3_TIMEOUT_MS
  } else if (error.message.includes('temporarily unavailable')) {
    // 500/502/503 - serwis niedostępny, retry z backoff
  } else if (error.message.includes('Invalid API key')) {
    // 401 - nieprawidłowy klucz API
  } else if (error.message.includes('Insufficient credits')) {
    // 402 - brak kredytów w koncie OpenRouter
  }
}
```

### Strategia Retry

Klient NIE implementuje retry automatycznie. Implementuj w wywołującym kodzie:

```typescript
async function generateWithRetry(prompt: string, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await client.generateRecipe(prompt);
    } catch (error) {
      // Nie retry dla błędów konfiguracji
      if (error.message.includes('not configured') || 
          error.message.includes('Invalid API key')) {
        throw error;
      }

      // Exponential backoff
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw new Error('Max retries exceeded');
}
```

## Bezpieczeństwo

### Ochrona Klucza API

- ✅ **NIGDY** nie commituj pliku `.env` do repozytorium
- ✅ Dodaj `.env` do `.gitignore`
- ✅ Użyj zmiennych środowiskowych w deployment (DigitalOcean App Platform)
- ❌ **NIGDY** nie hard-koduj klucza w kodzie źródłowym

### Walidacja Inputów

Klient automatycznie waliduje:

- ✅ Długość promptu (max 10,000 znaków)
- ✅ Max tokens (hard limit 5,000)
- ✅ Timeout (konfigurowalny)

### Rate Limiting (Application-Level)

Implementuj własny rate limiter dla ochrony kosztów:

```typescript
// rate-limiter.ts
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  async checkLimit(userId: string, maxRequests: number, windowMs: number) {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    const recentRequests = userRequests.filter(time => now - time < windowMs);
    
    if (recentRequests.length >= maxRequests) {
      throw new Error('Rate limit exceeded');
    }
    
    recentRequests.push(now);
    this.requests.set(userId, recentRequests);
  }
}

// Użycie
const rateLimiter = new RateLimiter();
await rateLimiter.checkLimit(userId, 10, 60000); // Max 10/minutę
```

## Monitoring i Logging

### Użycie Tokenów

Klient automatycznie loguje użycie tokenów:

```
OpenRouter token usage: {
  prompt_tokens: 150,
  completion_tokens: 450,
  total_tokens: 600,
  model: 'anthropic/claude-3-haiku'
}
```

### Latencja

```
OpenRouter API latency: 1234ms
```

### Metryki do Śledzenia

1. **Latencja** - czas odpowiedzi API
2. **Użycie tokenów** - prompt, completion, total
3. **Częstość błędów** - % nieudanych żądań
4. **Typy błędów** - agregacja po kodach HTTP
5. **Koszty** - szacunkowy koszt bazujący na tokenach

## Struktura Default JSON Schema

Domyślna schema dla przepisów:

```json
{
  "type": "json_schema",
  "json_schema": {
    "name": "recipe_generation",
    "strict": true,
    "schema": {
      "type": "object",
      "properties": {
        "title": { "type": "string" },
        "description": { "type": "string" },
        "instructions": { "type": "string" },
        "cooking_time": { "type": "number" },
        "difficulty": { 
          "type": "string",
          "enum": ["easy", "medium", "hard"]
        },
        "ingredients": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "product_name": { "type": "string" },
              "quantity": { "type": "number" },
              "unit": { "type": "string" }
            },
            "required": ["product_name", "quantity", "unit"]
          }
        },
        "tags": {
          "type": "array",
          "items": { "type": "string" }
        }
      },
      "required": ["title", "instructions", "ingredients"]
    }
  }
}
```

## Best Practices

### System Messages

Dobre praktyki dla system messages:

```typescript
// ✅ Dobry system message
const systemMessage = `You are a professional chef with expertise in Italian cuisine.
All recipes must be vegetarian.
Focus on clear instructions and accurate measurements.`;

// ❌ Zbyt ogólny
const systemMessage = 'You are a chef';

// ❌ Zbyt szczegółowy (lepiej w user prompt)
const systemMessage = 'Make a recipe with tomatoes...';
```

### Temperature dla Przepisów

- **0.5-0.7** - Konserwatywne, sprawdzone przepisy
- **0.7-0.9** ⭐ - Zbalansowane, kreatywne ale realistyczne (rekomendowane)
- **0.9-1.2** - Bardzo kreatywne, eksperymentalne

### Koszty i Optymalizacja

1. **Użyj Haiku dla standardowych przepisów** - 10x tańszy niż Opus
2. **Limituj max_tokens** - dłuższe odpowiedzi = wyższe koszty
3. **Cache'uj wyniki** - nie generuj tego samego przepisu wielokrotnie
4. **Rate limiting** - chroń przed nadużyciami

## Referencje

- [OpenRouter API Documentation](https://openrouter.ai/docs)
- [JSON Schema Specification](https://json-schema.org/)
- [Plan Implementacji](../../../../.ai/openrouter-service-implementation-plan.md)

## Pomoc

Jeśli napotkasz problemy:

1. Sprawdź konfigurację w `.env`
2. Zweryfikuj klucz API na [OpenRouter Dashboard](https://openrouter.ai/keys)
3. Sprawdź stan kredytów w [OpenRouter Billing](https://openrouter.ai/credits)
4. Użyj `healthCheck()` do diagnostyki

