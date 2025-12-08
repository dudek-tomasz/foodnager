# Przewodnik Implementacji Usługi OpenRouter

## 1. Opis Usługi

### Przeznaczenie

`OpenRouterClient` to dedykowany klient HTTP do komunikacji z API OpenRouter.ai, zapewniający dostęp do różnych modeli językowych (LLM) w celu generowania przepisów kulinarnych. Usługa stanowi warstwę abstrakcji między aplikacją Foodnager a zewnętrznym API, zapewniając:

- Spójny interfejs komunikacji z modelami AI
- Strukturalizowane odpowiedzi poprzez JSON Schema
- Zarządzanie konfiguracją i parametrami modelu
- Obsługę błędów i timeout'ów
- Monitoring użycia tokenów

### Kontekst Użycia

Usługa jest wykorzystywana przez:

- `AIRecipeService` - bezpośrednie generowanie przepisów (Tier 3)
- `RecipeDiscoveryService` - hierarchiczne wyszukiwanie przepisów (fallback do AI)

### Stack Technologiczny

- **Runtime**: Astro 5 (Node.js/Server-side)
- **Język**: TypeScript 5
- **HTTP Client**: Native Fetch API
- **Walidacja**: Zod (zintegrowana z response validator)
- **API**: OpenRouter.ai (https://openrouter.ai/api/v1/chat/completions)

---

## 2. Opis Konstruktora

### Sygnatura

```typescript
constructor(config?: Partial<OpenRouterConfig>)
```

### Parametry

#### `config` (opcjonalny): `Partial<OpenRouterConfig>`

Częściowa konfiguracja umożliwiająca nadpisanie wartości domyślnych.

```typescript
interface OpenRouterConfig {
  apiUrl: string; // URL endpointu API
  apiKey: string; // Klucz autoryzacyjny
  model: string; // Nazwa modelu (np. 'anthropic/claude-3-haiku')
  timeout: number; // Timeout w milisekundach
  temperature?: number; // Kreatywność modelu (0.0-2.0)
  maxTokens?: number; // Maksymalna długość odpowiedzi
  topP?: number; // Nucleus sampling (0.0-1.0)
  frequencyPenalty?: number; // Kara za powtórzenia (-2.0 - 2.0)
  presencePenalty?: number; // Kara za obecność tokenów (-2.0 - 2.0)
}
```

### Wartości Domyślne

Konfiguracja wykorzystuje zmienne środowiskowe z fallback'ami:

1. **apiUrl**:
   - Źródło: `import.meta.env.OPENROUTER_API_URL`
   - Domyślnie: `'https://openrouter.ai/api/v1/chat/completions'`

2. **apiKey**:
   - Źródło: `import.meta.env.OPENROUTER_API_KEY`
   - Domyślnie: `''` (puste - wymaga konfiguracji)

3. **model**:
   - Źródło: `import.meta.env.OPENROUTER_MODEL`
   - Domyślnie: `'anthropic/claude-3-haiku'`

4. **timeout**:
   - Źródło: `import.meta.env.TIER3_TIMEOUT_MS`
   - Domyślnie: `30000` (30 sekund)

5. **temperature** (nowe):
   - Źródło: `import.meta.env.OPENROUTER_TEMPERATURE`
   - Domyślnie: `0.7`
   - Zakres: `0.0` (deterministyczny) - `2.0` (bardzo kreatywny)

6. **maxTokens** (nowe):
   - Źródło: `import.meta.env.OPENROUTER_MAX_TOKENS`
   - Domyślnie: `2000`

7. **topP** (nowe):
   - Źródło: `import.meta.env.OPENROUTER_TOP_P`
   - Domyślnie: `1.0`

### Logika Konstrukcji

```typescript
constructor(config?: Partial<OpenRouterConfig>) {
  this.config = {
    apiUrl: import.meta.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions',
    apiKey: import.meta.env.OPENROUTER_API_KEY || '',
    model: import.meta.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku',
    timeout: parseInt(import.meta.env.TIER3_TIMEOUT_MS || '30000', 10),
    temperature: parseFloat(import.meta.env.OPENROUTER_TEMPERATURE || '0.7'),
    maxTokens: parseInt(import.meta.env.OPENROUTER_MAX_TOKENS || '2000', 10),
    topP: parseFloat(import.meta.env.OPENROUTER_TOP_P || '1.0'),
    frequencyPenalty: parseFloat(import.meta.env.OPENROUTER_FREQUENCY_PENALTY || '0'),
    presencePenalty: parseFloat(import.meta.env.OPENROUTER_PRESENCE_PENALTY || '0'),
    ...config, // Nadpisanie przekazaną konfiguracją
  };

  // Ostrzeżenie przy braku klucza API
  if (!this.config.apiKey) {
    console.warn('OpenRouter API key not configured - AI features will not work');
  }
}
```

### Walidacja Konstruktora

Konstruktor NIE rzuca błędów - zamiast tego:

- Loguje ostrzeżenie przy braku `apiKey`
- Błędy walidacji są obsługiwane w metodach publicznych przed wywołaniem API

---

## 3. Publiczne Metody i Pola

### 3.1 Metoda: `generateRecipe`

#### Sygnatura

```typescript
async generateRecipe(prompt: string, options?: GenerateRecipeOptions): Promise<unknown>
```

#### Parametry

1. **prompt**: `string` (wymagany)
   - Strukturalizowany prompt dla modelu AI
   - Przykład: "You are a professional chef. Generate a recipe using..."
   - Budowany przez `RecipePromptBuilder` lub `AIRecipeService`

2. **options**: `GenerateRecipeOptions` (opcjonalny)
   - Umożliwia nadpisanie parametrów modelu dla konkretnego wywołania

```typescript
interface GenerateRecipeOptions {
  temperature?: number;
  maxTokens?: number;
  systemMessage?: string;
  responseSchema?: ResponseSchema;
}
```

#### Zwracana Wartość

- **Typ**: `Promise<unknown>`
- **Zawartość**: Sparsowany JSON z odpowiedzi modelu
- **Format**: Zależy od `response_format` - domyślnie obiekt zgodny z JSON Schema dla przepisu

#### Obsługa Błędów

Metoda rzuca błędy w następujących scenariuszach:

1. **Brak klucza API**:

   ```typescript
   throw new Error("OpenRouter API key not configured");
   ```

2. **Timeout żądania**:

   ```typescript
   throw new Error("OpenRouter API request timed out");
   ```

3. **Błąd HTTP (status !== 2xx)**:

   ```typescript
   throw new Error(`OpenRouter API returned ${response.status}: ${errorText}`);
   ```

4. **Brak choices w odpowiedzi**:

   ```typescript
   throw new Error("OpenRouter API returned no choices");
   ```

5. **Nieprawidłowy JSON w odpowiedzi**:
   ```typescript
   throw new Error("AI response is not valid JSON");
   ```

#### Przykłady Użycia

**Przykład 1: Podstawowe użycie**

```typescript
const client = new OpenRouterClient();
const prompt = promptBuilder.build(products, preferences);

try {
  const aiResponse = await client.generateRecipe(prompt);
  const validatedRecipe = validator.validate(aiResponse);
  // Przetwarzanie przepisu...
} catch (error) {
  console.error("Failed to generate recipe:", error);
}
```

**Przykład 2: Z nadpisaniem parametrów**

```typescript
const client = new OpenRouterClient();
const aiResponse = await client.generateRecipe(prompt, {
  temperature: 0.9, // Więcej kreatywności
  maxTokens: 3000, // Dłuższa odpowiedź
  systemMessage: "You are a Michelin-starred chef specializing in French cuisine.",
});
```

**Przykład 3: Z własnym JSON Schema**

```typescript
const customSchema: ResponseSchema = {
  type: "json_schema",
  json_schema: {
    name: "detailed_recipe",
    strict: true,
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        ingredients: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              quantity: { type: "number" },
              unit: { type: "string" },
            },
            required: ["name", "quantity", "unit"],
            additionalProperties: false,
          },
        },
      },
      required: ["title", "ingredients"],
      additionalProperties: false,
    },
  },
};

const aiResponse = await client.generateRecipe(prompt, {
  responseSchema: customSchema,
});
```

#### Szczegóły Implementacji

**Krok 1: Walidacja konfiguracji**

```typescript
if (!this.config.apiKey) {
  throw new Error("OpenRouter API key not configured");
}
```

**Krok 2: Przygotowanie kontrolera timeout**

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
```

**Krok 3: Budowanie payload'u żądania**

```typescript
const requestBody = {
  model: this.config.model,
  messages: this.buildMessages(prompt, options?.systemMessage),
  temperature: options?.temperature ?? this.config.temperature,
  max_tokens: options?.maxTokens ?? this.config.maxTokens,
  top_p: this.config.topP,
  frequency_penalty: this.config.frequencyPenalty,
  presence_penalty: this.config.presencePenalty,
  response_format: options?.responseSchema ?? this.getDefaultResponseSchema(),
};
```

**Krok 4: Wywołanie API**

```typescript
const response = await fetch(this.config.apiUrl, {
  method: "POST",
  headers: this.buildHeaders(),
  body: JSON.stringify(requestBody),
  signal: controller.signal,
});

clearTimeout(timeoutId);
```

**Krok 5: Obsługa odpowiedzi**

```typescript
if (!response.ok) {
  const errorText = await response.text();
  console.error("OpenRouter API error:", response.status, errorText);
  throw new Error(`OpenRouter API returned ${response.status}: ${errorText}`);
}

const data: OpenRouterResponse = await response.json();

if (!data.choices || data.choices.length === 0) {
  throw new Error("OpenRouter API returned no choices");
}

const content = data.choices[0].message.content;

// Logowanie użycia tokenów
if (data.usage) {
  console.log("OpenRouter token usage:", data.usage);
}
```

**Krok 6: Parsowanie JSON**

```typescript
try {
  return JSON.parse(content);
} catch (parseError) {
  console.error("Failed to parse AI response as JSON:", content);
  throw new Error("AI response is not valid JSON");
}
```

---

### 3.2 Metoda: `isConfigured`

#### Sygnatura

```typescript
isConfigured(): boolean
```

#### Zwracana Wartość

- **Typ**: `boolean`
- `true` - jeśli `apiKey` jest skonfigurowany (niepusty string)
- `false` - jeśli `apiKey` jest pusty

#### Przykład Użycia

```typescript
const client = new OpenRouterClient();

if (!client.isConfigured()) {
  console.warn("OpenRouter is not configured - skipping AI generation");
  return null;
}

// Kontynuuj z generowaniem przepisu...
```

---

### 3.3 Metoda: `healthCheck` (nowa)

#### Sygnatura

```typescript
async healthCheck(): Promise<HealthCheckResult>
```

#### Zwracana Wartość

```typescript
interface HealthCheckResult {
  isHealthy: boolean;
  model: string;
  latency?: number; // w milisekundach
  error?: string;
}
```

#### Opis

Sprawdza połączenie z OpenRouter API poprzez wysłanie testowego żądania.

#### Przykład Użycia

```typescript
const client = new OpenRouterClient();
const health = await client.healthCheck();

if (!health.isHealthy) {
  console.error("OpenRouter is unavailable:", health.error);
}
```

---

## 4. Prywatne Metody i Pola

### 4.1 Pole: `config`

```typescript
private config: OpenRouterConfig;
```

**Opis**: Przechowuje pełną konfigurację klienta (zmergowaną z wartościami domyślnymi i przekazanymi w konstruktorze).

---

### 4.2 Metoda: `buildHeaders`

#### Sygnatura

```typescript
private buildHeaders(): HeadersInit
```

#### Zwracana Wartość

```typescript
{
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${this.config.apiKey}`,
  'HTTP-Referer': 'https://foodnager.app',
  'X-Title': 'Foodnager',
}
```

#### Wymagania OpenRouter API

1. **Authorization**: Bearer token (wymagany)
2. **HTTP-Referer**: Identyfikacja źródła żądania (wymagany przez OpenRouter)
3. **X-Title**: Opcjonalna nazwa aplikacji (zalecane dla analytics)
4. **Content-Type**: `application/json` (standard)

#### Bezpieczeństwo

- `apiKey` NIE jest logowany w konsoli
- Nagłówki są budowane świeżo przy każdym żądaniu (uniemożliwia mutation)

---

### 4.3 Metoda: `buildMessages` (nowa)

#### Sygnatura

```typescript
private buildMessages(userPrompt: string, systemMessage?: string): MessageArray
```

#### Parametry

1. **userPrompt**: `string` - główny prompt użytkownika
2. **systemMessage**: `string` (opcjonalny) - instrukcje systemowe dla modelu

#### Zwracana Wartość

```typescript
type MessageArray = Array<{
  role: "system" | "user";
  content: string;
}>;
```

#### Przykłady

**Bez system message:**

```typescript
[
  {
    role: "user",
    content: "You are a professional chef. Generate a recipe...",
  },
];
```

**Z system message:**

```typescript
[
  {
    role: "system",
    content: "You are a Michelin-starred chef with expertise in molecular gastronomy.",
  },
  {
    role: "user",
    content: "Generate a recipe using tomatoes, basil, and mozzarella.",
  },
];
```

#### Best Practices dla System Messages

1. **Jasna rola**: Określ, kim jest model ("You are a professional chef...")
2. **Kontekst**: Dodaj istotne ograniczenia ("specializing in vegetarian cuisine")
3. **Ton**: Wskaż oczekiwany styl odpowiedzi ("Be concise and practical")
4. **Ograniczenia**: Zdefiniuj zakazy ("Do not suggest recipes with meat")

---

### 4.4 Metoda: `getDefaultResponseSchema` (nowa)

#### Sygnatura

```typescript
private getDefaultResponseSchema(): ResponseSchema
```

#### Zwracana Wartość

```typescript
{
  type: 'json_schema',
  json_schema: {
    name: 'recipe_generation',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Recipe title (concise and appetizing)',
        },
        description: {
          type: 'string',
          description: 'Brief one-sentence description of the dish',
        },
        instructions: {
          type: 'string',
          description: 'Step-by-step cooking instructions (numbered steps, detailed)',
        },
        cooking_time: {
          type: 'number',
          description: 'Cooking time in minutes',
        },
        difficulty: {
          type: 'string',
          enum: ['easy', 'medium', 'hard'],
          description: 'Recipe difficulty level',
        },
        ingredients: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              product_name: {
                type: 'string',
                description: 'Name of the ingredient',
              },
              quantity: {
                type: 'number',
                description: 'Quantity of the ingredient',
              },
              unit: {
                type: 'string',
                description: 'Unit of measurement (e.g., piece, gram, ml)',
              },
            },
            required: ['product_name', 'quantity', 'unit'],
            additionalProperties: false,
          },
          description: 'List of ingredients with quantities',
        },
        tags: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'Tags for categorization (e.g., vegetarian, quick meal)',
        },
      },
      required: ['title', 'instructions', 'ingredients'],
      additionalProperties: false,
    },
  },
}
```

#### Dlaczego JSON Schema?

1. **Gwarancja struktury**: Model MUSI zwrócić dane w określonym formacie
2. **Walidacja na poziomie API**: Błędne struktury są odrzucane przed zwróceniem
3. **Eliminacja parsingu**: Brak potrzeby regex/pattern matching w kodzie
4. **Dokumentacja**: Schema służy jako dokumentacja oczekiwanego formatu
5. **Strict mode**: `strict: true` wymusza ścisłe przestrzeganie schematu

#### Alternatywne Schematy

W zależności od przypadku użycia można definiować różne schematy:

**Przykład: Uproszczony przepis**

```typescript
{
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
}
```

---

### 4.5 Metoda: `handleApiError` (nowa)

#### Sygnatura

```typescript
private async handleApiError(response: Response): Promise<never>
```

#### Parametry

- **response**: `Response` - obiekt Response z nieudanego żądania fetch

#### Logika

```typescript
const errorText = await response.text();
const errorData = this.tryParseErrorJson(errorText);

// Logowanie szczegółów błędu
console.error("OpenRouter API error:", {
  status: response.status,
  statusText: response.statusText,
  error: errorData || errorText,
});

// Specjalne przypadki
switch (response.status) {
  case 401:
    throw new Error("Invalid API key - check OPENROUTER_API_KEY");
  case 429:
    throw new Error("Rate limit exceeded - try again later");
  case 500:
  case 502:
  case 503:
    throw new Error("OpenRouter service is temporarily unavailable");
  default:
    throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
}
```

#### Typowe Kody Błędów OpenRouter

- **400**: Nieprawidłowe żądanie (błędny format payload)
- **401**: Nieautoryzowany (nieprawidłowy API key)
- **402**: Brak kredytów (payment required)
- **429**: Rate limit przekroczony
- **500**: Błąd serwera OpenRouter
- **502/503**: Serwis niedostępny

---

### 4.6 Metoda: `tryParseErrorJson`

#### Sygnatura

```typescript
private tryParseErrorJson(errorText: string): unknown | null
```

#### Opis

Próbuje sparsować tekst błędu jako JSON. Jeśli się powiedzie, zwraca obiekt; w przeciwnym razie `null`.

#### Przykład

```typescript
// OpenRouter zwraca błędy w formacie:
// { "error": { "message": "Invalid API key", "code": "invalid_api_key" } }

const errorObj = this.tryParseErrorJson(errorText);
if (errorObj && errorObj.error?.message) {
  console.error("OpenRouter error:", errorObj.error.message);
}
```

---

## 5. Obsługa Błędów

### 5.1 Kategorie Błędów

#### Błędy Konfiguracji

**Scenariusz**: Brak klucza API  
**Wykrywanie**: W konstruktorze (ostrzeżenie) i w `generateRecipe` (błąd)  
**Komunikat**: `'OpenRouter API key not configured'`  
**Akcja**: Skonfiguruj `OPENROUTER_API_KEY` w zmiennych środowiskowych

#### Błędy Sieciowe

**Scenariusz**: Timeout żądania  
**Wykrywanie**: AbortController timeout  
**Komunikat**: `'OpenRouter API request timed out'`  
**Akcja**: Zwiększ `TIER3_TIMEOUT_MS` lub sprawdź połączenie sieciowe

#### Błędy Autoryzacji

**Scenariusz**: Nieprawidłowy API key (401)  
**Wykrywanie**: Status HTTP 401  
**Komunikat**: `'Invalid API key - check OPENROUTER_API_KEY'`  
**Akcja**: Zweryfikuj poprawność klucza API

#### Błędy Rate Limiting

**Scenariusz**: Przekroczono limit żądań (429)  
**Wykrywanie**: Status HTTP 429  
**Komunikat**: `'Rate limit exceeded - try again later'`  
**Akcja**: Implementuj exponential backoff lub zwiększ limity w planie OpenRouter

#### Błędy Walidacji Odpowiedzi

**Scenariusz**: Model zwrócił nieprawidłowy JSON  
**Wykrywanie**: `JSON.parse()` rzuca błąd  
**Komunikat**: `'AI response is not valid JSON'`  
**Akcja**: Sprawdź prompt i response_format; model może nie wspierać JSON Schema

#### Błędy Serwera OpenRouter

**Scenariusz**: 500/502/503  
**Wykrywanie**: Status HTTP 5xx  
**Komunikat**: `'OpenRouter service is temporarily unavailable'`  
**Akcja**: Retry z backoff; powiadom użytkownika o tymczasowej niedostępności

---

### 5.2 Strategia Retry

#### Implementacja w Wywołującym Kodzie

Klient NIE implementuje retry automatycznie - to odpowiedzialność wywołującego serwisu.

**Przykład: AIRecipeService z retry**

```typescript
async generateRecipeWithRetry(
  userId: string,
  generateDto: GenerateRecipeDTO,
  maxRetries: number = 3
): Promise<GenerateRecipeResponseDTO> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await this.generateRecipe(userId, generateDto);
    } catch (error) {
      lastError = error as Error;

      // Nie retry dla błędów konfiguracji
      if (error.message.includes('not configured') ||
          error.message.includes('Invalid API key')) {
        throw error;
      }

      // Exponential backoff
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.warn(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}
```

---

### 5.3 Logging i Monitoring

#### Poziomy Logowania

**DEBUG**: Szczegółowe informacje o żądaniach

```typescript
console.debug("OpenRouter request:", {
  model: this.config.model,
  promptLength: prompt.length,
  options,
});
```

**INFO**: Użycie tokenów

```typescript
if (data.usage) {
  console.log("OpenRouter token usage:", {
    prompt_tokens: data.usage.prompt_tokens,
    completion_tokens: data.usage.completion_tokens,
    total_tokens: data.usage.total_tokens,
    estimated_cost: this.calculateCost(data.usage),
  });
}
```

**WARN**: Problemy konfiguracji

```typescript
console.warn("OpenRouter API key not configured - AI features will not work");
```

**ERROR**: Błędy API

```typescript
console.error("OpenRouter API error:", {
  status: response.status,
  error: errorText,
  model: this.config.model,
});
```

#### Metryki do Monitorowania

1. **Latencja**: Czas odpowiedzi API (użyj `performance.now()`)
2. **Użycie tokenów**: `prompt_tokens`, `completion_tokens`, `total_tokens`
3. **Częstość błędów**: Liczba nieudanych żądań / całkowita liczba żądań
4. **Typy błędów**: Agregacja po kodach HTTP
5. **Koszty**: Szacunkowy koszt bazujący na użyciu tokenów

---

## 6. Kwestie Bezpieczeństwa

### 6.1 Ochrona Klucza API

#### Zmienne Środowiskowe

**NIGDY** nie hard-koduj klucza API w kodzie źródłowym.

**✅ Poprawnie:**

```typescript
// .env (NIE commituj do repo!)
OPENROUTER_API_KEY=sk-or-v1-abc123...

// openrouter.client.ts
apiKey: import.meta.env.OPENROUTER_API_KEY || ''
```

**❌ Niepoprawnie:**

```typescript
apiKey: "sk-or-v1-abc123..."; // NIGDY TAK NIE RÓB!
```

#### Dostęp do Klucza

Klucz API powinien być dostępny TYLKO:

1. W zmiennych środowiskowych serwera
2. W kodzie server-side (Astro endpoints, middleware)

**❌ Klucz NIE może być:**

- Eksportowany do client-side kodu
- Wysyłany w response HTML
- Logowany w konsoli (w produkcji)

---

### 6.2 Walidacja Inputów

#### User Prompts

Choć OpenRouter API filtruje złośliwe prompty, zawsze:

1. **Limituj długość promptu:**

```typescript
const MAX_PROMPT_LENGTH = 10000;

if (prompt.length > MAX_PROMPT_LENGTH) {
  throw new Error("Prompt exceeds maximum allowed length");
}
```

2. **Sanityzuj dane użytkownika:**

```typescript
// W RecipePromptBuilder
const sanitizedProducts = products.map((p) => ({
  name: p.name.trim().slice(0, 100), // Limit długości
}));
```

3. **Waliduj preferencje:**

```typescript
if (preferences?.max_cooking_time && (preferences.max_cooking_time < 1 || preferences.max_cooking_time > 1440)) {
  throw new Error("Invalid cooking time preference");
}
```

---

### 6.3 Rate Limiting (Application-Level)

Implementuj własny rate limiter dla ochrony przed nadużyciami:

```typescript
// rate-limiter.ts
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  async checkLimit(userId: string, maxRequests: number, windowMs: number): Promise<void> {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];

    // Usuń stare żądania poza oknem
    const recentRequests = userRequests.filter(time => now - time < windowMs);

    if (recentRequests.length >= maxRequests) {
      throw new Error('Rate limit exceeded - please try again later');
    }

    recentRequests.push(now);
    this.requests.set(userId, recentRequests);
  }
}

// Użycie w AIRecipeService
const rateLimiter = new RateLimiter();

async generateRecipe(userId: string, generateDto: GenerateRecipeDTO) {
  // Max 10 żądań na minutę per użytkownik
  await rateLimiter.checkLimit(userId, 10, 60000);

  // ... reszta logiki
}
```

---

### 6.4 Timeout i Resource Management

#### Timeout na poziomie żądania

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

try {
  const response = await fetch(url, { signal: controller.signal });
  clearTimeout(timeoutId);
  // ...
} catch (error) {
  clearTimeout(timeoutId); // ZAWSZE czyść timeout
  throw error;
}
```

#### Limit Max Tokens

Ogranicz `max_tokens` aby uniknąć nieoczekiwanie wysokich kosztów:

```typescript
const ABSOLUTE_MAX_TOKENS = 5000;

const maxTokens = Math.min(options?.maxTokens ?? this.config.maxTokens, ABSOLUTE_MAX_TOKENS);
```

---

### 6.5 Content Safety

OpenRouter automatycznie filtruje nieodpowiednie treści, ale dodatkowo:

1. **Waliduj odpowiedzi AI:**

```typescript
const validatedRecipe = this.aiValidator.validate(aiResponse);

// Dodatkowa walidacja content safety
if (this.containsInappropriateContent(validatedRecipe.title)) {
  throw new Error("Generated content failed safety check");
}
```

2. **Loguj podejrzane przypadki:**

```typescript
if (validatedRecipe.title.match(/inappropriate-pattern/i)) {
  console.warn("Content safety warning:", {
    userId,
    recipeTitle: validatedRecipe.title,
    timestamp: new Date().toISOString(),
  });
}
```

---

## 7. Plan Wdrożenia Krok Po Kroku

### Krok 1: Rozszerzenie Typów i Interfejsów

#### Lokalizacja: `src/lib/services/ai/openrouter.client.ts`

**1.1 Dodaj rozszerzone typy konfiguracji:**

```typescript
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
  type: "json_schema";
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
  type: "object";
  properties: Record<string, JsonSchemaProperty>;
  required?: string[];
  additionalProperties: boolean;
}

/**
 * JSON Schema property definition
 */
type JsonSchemaProperty =
  | { type: "string"; description?: string; enum?: string[] }
  | { type: "number"; description?: string }
  | { type: "boolean"; description?: string }
  | { type: "array"; items: JsonSchemaProperty; description?: string }
  | JsonSchemaObject;

/**
 * Message for chat completions
 */
interface Message {
  role: "system" | "user" | "assistant";
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
```

---

### Krok 2: Aktualizacja Konstruktora

**2.1 Rozszerz parsowanie konfiguracji:**

```typescript
constructor(config?: Partial<OpenRouterConfig>) {
  this.config = {
    apiUrl: import.meta.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions',
    apiKey: import.meta.env.OPENROUTER_API_KEY || '',
    model: import.meta.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku',
    timeout: parseInt(import.meta.env.TIER3_TIMEOUT_MS || '30000', 10),

    // Nowe parametry
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
```

---

### Krok 3: Implementacja Prywatnych Metod

**3.1 Metoda `buildMessages`:**

```typescript
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
```

**3.2 Metoda `getDefaultResponseSchema`:**

```typescript
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
          title: {
            type: 'string',
            description: 'Recipe title (concise and appetizing)',
          },
          description: {
            type: 'string',
            description: 'Brief one-sentence description of the dish',
          },
          instructions: {
            type: 'string',
            description: 'Step-by-step cooking instructions (numbered steps, detailed)',
          },
          cooking_time: {
            type: 'number',
            description: 'Cooking time in minutes',
          },
          difficulty: {
            type: 'string',
            enum: ['easy', 'medium', 'hard'],
            description: 'Recipe difficulty level',
          },
          ingredients: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                product_name: {
                  type: 'string',
                  description: 'Name of the ingredient',
                },
                quantity: {
                  type: 'number',
                  description: 'Quantity of the ingredient',
                },
                unit: {
                  type: 'string',
                  description: 'Unit of measurement (e.g., piece, gram, ml)',
                },
              },
              required: ['product_name', 'quantity', 'unit'],
              additionalProperties: false,
            },
            description: 'List of ingredients with quantities',
          },
          tags: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Tags for categorization (e.g., vegetarian, quick meal)',
          },
        },
        required: ['title', 'instructions', 'ingredients'],
        additionalProperties: false,
      },
    },
  };
}
```

**3.3 Metoda `tryParseErrorJson`:**

```typescript
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
```

**3.4 Metoda `handleApiError`:**

```typescript
/**
 * Handle API error response
 *
 * @param response - Failed response object
 * @throws Error with descriptive message
 */
private async handleApiError(response: Response): Promise<never> {
  const errorText = await response.text();
  const errorData = this.tryParseErrorJson(errorText);

  console.error('OpenRouter API error:', {
    status: response.status,
    statusText: response.statusText,
    error: errorData || errorText,
    model: this.config.model,
  });

  switch (response.status) {
    case 401:
      throw new Error('Invalid API key - check OPENROUTER_API_KEY configuration');
    case 402:
      throw new Error('Insufficient credits - please add credits to your OpenRouter account');
    case 429:
      throw new Error('Rate limit exceeded - please try again later');
    case 500:
    case 502:
    case 503:
      throw new Error('OpenRouter service is temporarily unavailable - please try again');
    default:
      const message = errorData?.error?.message || errorText;
      throw new Error(`OpenRouter API error (${response.status}): ${message}`);
  }
}
```

---

### Krok 4: Aktualizacja Metody `generateRecipe`

**4.1 Pełna implementacja z nowymi funkcjonalnościami:**

```typescript
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
    console.debug(`OpenRouter API latency: ${latency.toFixed(0)}ms`);

    // Obsługa błędów HTTP
    if (!response.ok) {
      await this.handleApiError(response);
    }

    // Parsowanie odpowiedzi
    const data: OpenRouterResponse = await response.json();

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
```

---

### Krok 5: Implementacja Metody `healthCheck`

**5.1 Dodaj metodę health check:**

```typescript
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
```

---

### Krok 6: Konfiguracja Zmiennych Środowiskowych

**6.1 Utwórz plik `.env` (local development):**

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

**6.2 Aktualizuj `src/env.d.ts`:**

```typescript
/// <reference types="astro/client" />

interface ImportMetaEnv {
  // OpenRouter Configuration
  readonly OPENROUTER_API_URL: string;
  readonly OPENROUTER_API_KEY: string;
  readonly OPENROUTER_MODEL: string;
  readonly OPENROUTER_TEMPERATURE: string;
  readonly OPENROUTER_MAX_TOKENS: string;
  readonly OPENROUTER_TOP_P: string;
  readonly OPENROUTER_FREQUENCY_PENALTY: string;
  readonly OPENROUTER_PRESENCE_PENALTY: string;

  // Timeout Configuration
  readonly TIER3_TIMEOUT_MS: string;

  // Supabase Configuration
  readonly SUPABASE_URL: string;
  readonly SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

**6.3 Dodaj do `.gitignore`:**

```
# Environment variables
.env
.env.local
.env.production
```

---

### Krok 7: Aktualizacja AIRecipeService

**7.1 Użyj nowych opcji w `AIRecipeService`:**

```typescript
// src/lib/services/ai-recipe.service.ts

async generateRecipe(
  userId: string,
  generateDto: GenerateRecipeDTO
): Promise<GenerateRecipeResponseDTO> {
  if (!this.openRouterClient.isConfigured()) {
    throw new Error('AI service is not configured');
  }

  // Step 1: Verify and fetch products
  const products = await this.verifyAndFetchProducts(userId, generateDto.product_ids);

  // Step 2: Build user prompt
  const userPrompt = this.buildPromptWithCuisine(products, generateDto.preferences);

  // Step 3: Build system message
  const systemMessage = this.buildSystemMessage(generateDto.preferences);

  // Step 4: Call AI API with enhanced options
  const aiResponse = await this.openRouterClient.generateRecipe(userPrompt, {
    systemMessage,
    temperature: 0.8, // Nieco więcej kreatywności dla przepisów
  });

  // Step 5: Validate response
  const validatedRecipe = this.aiValidator.validate(aiResponse);

  // ... reszta logiki
}

/**
 * Build system message based on preferences
 */
private buildSystemMessage(preferences?: GenerateRecipeDTO['preferences']): string {
  let message = 'You are a professional chef with expertise in creating delicious and practical recipes.';

  if (preferences?.cuisine) {
    message += ` You specialize in ${preferences.cuisine} cuisine.`;
  }

  if (preferences?.dietary_restrictions && preferences.dietary_restrictions.length > 0) {
    const restrictions = preferences.dietary_restrictions.join(', ');
    message += ` All recipes must be ${restrictions}.`;
  }

  message += ' Focus on clear instructions and accurate ingredient measurements.';

  return message;
}

/**
 * Build user prompt without system instructions (moved to system message)
 */
private buildPromptWithCuisine(
  products: ProductReferenceDTO[],
  preferences?: GenerateRecipeDTO['preferences']
): string {
  const productList = products.map(p => `- ${p.name}`).join('\n');

  const preferenceParts: string[] = [];

  if (preferences?.max_cooking_time) {
    preferenceParts.push(`- Maximum cooking time: ${preferences.max_cooking_time} minutes`);
  }

  if (preferences?.difficulty) {
    preferenceParts.push(`- Difficulty: ${preferences.difficulty}`);
  }

  const preferencesText = preferenceParts.length > 0
    ? `Constraints:\n${preferenceParts.join('\n')}\n`
    : '';

  // Uproszczony prompt - instrukcje systemowe przeniesione do system message
  return `Generate a recipe using these ingredients:

${productList}

${preferencesText}

You may add common pantry items (salt, pepper, oil, water) if needed, but prioritize the provided ingredients.`;
}
```

---

### Krok 8: Testy Jednostkowe

**8.1 Utwórz plik testowy: `src/lib/services/ai/openrouter.client.test.ts`:**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { OpenRouterClient } from "./openrouter.client";

describe("OpenRouterClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should use default config when no config provided", () => {
      const client = new OpenRouterClient();
      expect(client.isConfigured()).toBe(false); // No API key in test env
    });

    it("should merge provided config with defaults", () => {
      const client = new OpenRouterClient({
        apiKey: "test-key",
        model: "test-model",
      });
      expect(client.isConfigured()).toBe(true);
    });
  });

  describe("isConfigured", () => {
    it("should return false when apiKey is empty", () => {
      const client = new OpenRouterClient({ apiKey: "" });
      expect(client.isConfigured()).toBe(false);
    });

    it("should return true when apiKey is provided", () => {
      const client = new OpenRouterClient({ apiKey: "sk-test" });
      expect(client.isConfigured()).toBe(true);
    });
  });

  describe("generateRecipe", () => {
    it("should throw error when not configured", async () => {
      const client = new OpenRouterClient({ apiKey: "" });
      await expect(client.generateRecipe("test prompt")).rejects.toThrow("OpenRouter API key not configured");
    });

    it("should throw error when prompt exceeds max length", async () => {
      const client = new OpenRouterClient({ apiKey: "sk-test" });
      const longPrompt = "a".repeat(10001);

      await expect(client.generateRecipe(longPrompt)).rejects.toThrow("Prompt exceeds maximum length");
    });

    // Mock fetch dla pozostałych testów
    it("should successfully generate recipe", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  title: "Test Recipe",
                  instructions: "Mix and cook",
                  ingredients: [{ product_name: "Tomato", quantity: 2, unit: "piece" }],
                }),
              },
            },
          ],
          usage: {
            prompt_tokens: 100,
            completion_tokens: 200,
            total_tokens: 300,
          },
        }),
      });

      const client = new OpenRouterClient({ apiKey: "sk-test" });
      const result = await client.generateRecipe("Generate a recipe");

      expect(result).toHaveProperty("title", "Test Recipe");
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer sk-test",
          }),
        })
      );
    });
  });

  describe("healthCheck", () => {
    it("should return unhealthy when not configured", async () => {
      const client = new OpenRouterClient({ apiKey: "" });
      const result = await client.healthCheck();

      expect(result.isHealthy).toBe(false);
      expect(result.error).toContain("not configured");
    });

    it("should return healthy when API responds", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "OK" } }],
        }),
      });

      const client = new OpenRouterClient({ apiKey: "sk-test" });
      const result = await client.healthCheck();

      expect(result.isHealthy).toBe(true);
      expect(result.latency).toBeGreaterThan(0);
    });
  });
});
```

**8.2 Uruchom testy:**

```bash
npm run test
```

---

### Krok 9: Dokumentacja API

**9.1 Utwórz plik dokumentacji: `src/lib/services/ai/README.md`:**

````markdown
# OpenRouter Client Service

## Przegląd

Klient do komunikacji z OpenRouter API dla generowania przepisów AI.

## Użycie

### Podstawowe Użycie

\```typescript
import { openRouterClient } from './openrouter.client';

const prompt = 'Generate a recipe using tomatoes and basil';
const recipe = await openRouterClient.generateRecipe(prompt);
\```

### Z Opcjami

\```typescript
const recipe = await openRouterClient.generateRecipe(prompt, {
temperature: 0.9,
systemMessage: 'You are a Italian chef.',
maxTokens: 3000,
});
\```

### Health Check

\```typescript
const health = await openRouterClient.healthCheck();

if (!health.isHealthy) {
console.error('OpenRouter unavailable:', health.error);
}
\```

## Konfiguracja

### Zmienne Środowiskowe

- `OPENROUTER_API_KEY` (wymagane)
- `OPENROUTER_MODEL` (opcjonalne, domyślnie: claude-3-haiku)
- `OPENROUTER_TEMPERATURE` (opcjonalne, domyślnie: 0.7)
- `OPENROUTER_MAX_TOKENS` (opcjonalne, domyślnie: 2000)

## Obsługa Błędów

Wszystkie błędy API rzucają wyjątki z opisowymi komunikatami.

Zobacz [openrouter-service-implementation-plan.md](../../../.ai/openrouter-service-implementation-plan.md) dla pełnej dokumentacji.
\```

---

### Krok 10: Wdrożenie na Produkcję

**10.1 Konfiguracja DigitalOcean App Platform:**

W panelu DigitalOcean dodaj zmienne środowiskowe:

- `OPENROUTER_API_KEY` - klucz API (encrypted)
- `OPENROUTER_MODEL` - nazwa modelu
- `OPENROUTER_TEMPERATURE` - parametr temperatury

**10.2 Monitoring:**

Zintegruj z narzędziem monitoringu (np. Sentry, LogRocket):

```typescript
// src/lib/monitoring.ts
export function logOpenRouterMetrics(data: { latency: number; tokens: number; model: string; success: boolean }) {
  // Wyślij do systemu monitoringu
  console.log("OpenRouter metrics:", data);
}
```
````

**10.3 Rate Limiting:**

Implementuj redis-based rate limiter dla production:

```typescript
// src/middleware/rate-limit.ts
import { rateLimit } from "express-rate-limit";

export const openRouterRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuta
  max: 10, // 10 żądań per użytkownik
  keyGenerator: (req) => req.user?.id || req.ip,
});
```

---

## Podsumowanie

### Kluczowe Zalety Nowej Implementacji

1. ✅ **JSON Schema** - gwarancja struktury odpowiedzi
2. ✅ **System Messages** - lepsza kontrola zachowania modelu
3. ✅ **Konfigurowalne Parametry** - elastyczność bez zmian kodu
4. ✅ **Lepsza Obsługa Błędów** - szczegółowe komunikaty i retry logic
5. ✅ **Health Checks** - monitoring dostępności API
6. ✅ **Bezpieczeństwo** - walidacja inputów, rate limiting, timeout
7. ✅ **Logging & Monitoring** - tracking użycia tokenów i kosztów

### Następne Kroki

1. Implementuj wszystkie kroki 1-10 po kolei
2. Testuj ręcznie z rzeczywistym API (używaj modeli z darmowym tierem)
3. Wdróż na staging i zweryfikuj działanie

### Referencje

- [OpenRouter API Documentation](https://openrouter.ai/docs)
- [JSON Schema Specification](https://json-schema.org/)
- [OpenAI Chat Completions API](https://platform.openai.com/docs/api-reference/chat) (kompatybilny format)
