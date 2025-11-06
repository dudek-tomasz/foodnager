# Test AI Recipe Generation - Przewodnik Testowania OpenRouter

## Przegląd

Ten dokument opisuje jak przetestować generowanie przepisów przez AI (OpenRouter) w aplikacji Foodnager.

## Wymagania Wstępne

### 1. Konfiguracja Zmiennych Środowiskowych

Utwórz/edytuj plik `.env` w głównym katalogu projektu:

```env
# Supabase - wymagane
SUPABASE_URL=twoj_supabase_url
SUPABASE_KEY=twoj_supabase_anon_key

# OpenRouter - wymagane do testowania AI
OPENROUTER_API_URL=https://openrouter.ai/api/v1
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
OPENROUTER_MODEL=anthropic/claude-3-haiku
```

#### Jak uzyskać klucz API OpenRouter?

1. Przejdź do: https://openrouter.ai/
2. Zarejestruj się / zaloguj
3. Przejdź do: https://openrouter.ai/keys
4. Utwórz nowy klucz API
5. Dodaj środki na konto (minimum $5)

#### Dostępne modele AI

- `anthropic/claude-3-haiku` - szybki, tani (zalecany do testów)
- `anthropic/claude-3-sonnet` - lepszy, droższy
- `openai/gpt-4o-mini` - alternatywa od OpenAI
- `openai/gpt-4o` - najlepszy, najdroższy

### 2. Produkty w Wirtualnej Lodówce

Musisz mieć produkty w bazie danych. Dodaj je poprzez:

**Opcja A: Przez UI aplikacji**
1. Uruchom aplikację: `npm run dev`
2. Przejdź do: http://localhost:3000/fridge
3. Dodaj kilka produktów (np. pomidor, cebula, czosnek, makaron)

**Opcja B: Przez API (Postman/curl)**

Użyj endpointu `POST /api/fridge` (sprawdź dokumentację API)

---

## Scenariusze Testowe

### Scenariusz 1: Test przez Frontend UI ✅ ZALECANE

Jest to najprostszy sposób testowania.

#### Kroki:

1. **Uruchom aplikację**
   ```bash
   npm run dev
   ```

2. **Zaloguj się** do aplikacji
   - Przejdź do: http://localhost:3000/login

3. **Dodaj produkty do lodówki** (jeśli nie masz)
   - Przejdź do: http://localhost:3000/fridge
   - Dodaj co najmniej 3-5 produktów

4. **Przejdź do wyszukiwania przepisów**
   - Przejdź do: http://localhost:3000/recipes/search

5. **Wybierz opcję "Wszystkie źródła" lub "Generuj AI"**
   - System automatycznie przejdzie przez hierarchię:
     - **Tier 1**: Twoje własne przepisy (jeśli masz jakieś)
     - **Tier 2**: External API (jeśli skonfigurowane)
     - **Tier 3**: AI Generation (OpenRouter) ⭐

6. **Obserwuj proces**
   - Zobaczysz ekran ładowania z informacją o źródle
   - Po zakończeniu zobaczysz wygenerowany przepis

#### Oczekiwany rezultat:

- Przepis zostanie wygenerowany przez AI na podstawie Twoich produktów
- Przepis będzie zapisany w bazie danych z `source: 'ai'`
- Zobaczysz match score i brakujące składniki
- W `metadata` przepisu będą informacje o modelu AI i użytych produktach

---

### Scenariusz 2: Test przez API (Postman/curl) 🔧

Jeśli chcesz bezpośrednio testować endpoint API.

#### Request:

```bash
POST http://localhost:3000/api/recipes/search-by-fridge
Content-Type: application/json
Cookie: sb-access-token=twoj_token; sb-refresh-token=twoj_token

{
  "use_all_fridge_items": true,
  "max_results": 3,
  "preferences": {
    "max_cooking_time": 45,
    "difficulty": "easy",
    "dietary_restrictions": ["vegetarian"]
  }
}
```

#### Jak uzyskać tokeny auth?

**Opcja A: Z przeglądarki**
1. Zaloguj się w aplikacji (http://localhost:3000/login)
2. Otwórz DevTools (F12) → Application/Storage → Cookies
3. Skopiuj wartości `sb-access-token` i `sb-refresh-token`

**Opcja B: Przez API logowania**
```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "twoj@email.com",
  "password": "twoje_haslo"
}
```

#### Alternatywny request (wybrane produkty):

```json
{
  "use_all_fridge_items": false,
  "custom_product_ids": [1, 2, 3],
  "max_results": 1,
  "preferences": {
    "difficulty": "easy"
  }
}
```

#### Response (sukces):

```json
{
  "results": [
    {
      "recipe": {
        "id": 123,
        "title": "Spaghetti Aglio e Olio",
        "description": "Prosty włoski makaron z czosnkiem i oliwą",
        "instructions": "1. Ugotuj makaron...\n2. Podsmaż czosnek...",
        "cooking_time": 20,
        "difficulty": "easy",
        "source": "ai",
        "ingredients": [
          {
            "product": { "id": 1, "name": "Makaron spaghetti" },
            "quantity": 200,
            "unit": { "id": 1, "name": "gram", "abbreviation": "g" }
          },
          {
            "product": { "id": 2, "name": "Czosnek" },
            "quantity": 3,
            "unit": { "id": 5, "name": "sztuka", "abbreviation": "szt" }
          }
        ],
        "tags": [
          { "id": 1, "name": "Włoska", "created_at": "..." }
        ],
        "created_at": "2025-10-26T12:00:00Z",
        "updated_at": "2025-10-26T12:00:00Z"
      },
      "match_score": 0.85,
      "available_ingredients": [
        {
          "product": { "id": 1, "name": "Makaron spaghetti" },
          "required_quantity": 200,
          "available_quantity": 500,
          "unit": { "id": 1, "name": "gram", "abbreviation": "g" }
        }
      ],
      "missing_ingredients": []
    }
  ],
  "search_metadata": {
    "source": "ai_generated",
    "total_results": 1,
    "search_duration_ms": 5432
  }
}
```

---

## Debugowanie

### Problem 1: "No products available in fridge"

**Rozwiązanie:**
- Dodaj produkty do lodówki poprzez UI lub API
- Sprawdź czy jesteś zalogowany jako właściwy użytkownik
- Sprawdź w bazie danych czy produkty istnieją: `SELECT * FROM user_products WHERE user_id = '...'`

### Problem 2: AI generation nie działa / wraca do Tier 1

**Możliwe przyczyny:**
1. Brak klucza API: Sprawdź `OPENROUTER_API_KEY` w `.env`
2. Brak środków na koncie OpenRouter
3. Tier 1 zwrócił "dobre" wyniki (match_score >= 0.7)

**Rozwiązanie:**
- Sprawdź logi w konsoli serwera
- Sprawdź `openRouterClient.isConfigured()` zwraca `true`
- Usuń przepisy z Tier 1 lub użyj produktów, które nie pasują do żadnego przepisu

### Problem 3: OpenRouter błąd 401 / 402

**401 Unauthorized:**
- Klucz API jest nieprawidłowy
- Sprawdź czy skopiowałeś pełny klucz (zaczyna się od `sk-or-v1-`)

**402 Payment Required:**
- Brak środków na koncie OpenRouter
- Dodaj środki: https://openrouter.ai/credits

### Problem 4: Timeout / długie czekanie

**Oczekiwany czas:**
- Tier 1 (własne przepisy): < 1s
- Tier 2 (External API): 2-5s
- Tier 3 (AI): 5-15s

**Jeśli dłużej:**
- Sprawdź połączenie internetowe
- Sprawdź logi OpenRouter w konsoli
- Sprawdź status OpenRouter: https://status.openrouter.ai/

---

## Weryfikacja w Bazie Danych

Po wygenerowaniu przepisu, sprawdź w bazie:

```sql
-- Sprawdź ostatnio wygenerowane przepisy przez AI
SELECT 
  id, 
  title, 
  source, 
  created_at,
  metadata
FROM recipes
WHERE source = 'ai'
ORDER BY created_at DESC
LIMIT 5;
```

Metadata powinno zawierać:

```json
{
  "ai_model": "anthropic/claude-3-haiku",
  "generation_timestamp": "2025-10-26T12:00:00.000Z",
  "input_products": [1, 2, 3],
  "preferences": {
    "max_cooking_time": 45,
    "difficulty": "easy",
    "dietary_restrictions": ["vegetarian"]
  }
}
```

---

## Monitorowanie Kosztów OpenRouter

1. Przejdź do: https://openrouter.ai/activity
2. Sprawdź użycie tokenów i koszt
3. Claude-3-Haiku kosztuje ~$0.25 / 1M input tokens, ~$1.25 / 1M output tokens

**Szacowany koszt jednego przepisu:**
- Input: ~500 tokens ($0.000125)
- Output: ~800 tokens ($0.001)
- **Razem: ~$0.0011 (około 1 grosz)**

---

## Kolejne Kroki

Po pomyślnym teście, możesz:

1. **Przetestować różne preferencje** (czas gotowania, trudność, diety)
2. **Przetestować różne modele AI** (zmień `OPENROUTER_MODEL`)
3. **Sprawdzić rate limiting** (wiele zapytań pod rząd)
4. **Zintegrować z historią gotowania** (zapisz kiedy użytkownik ugotował przepis)
5. **Dodać system ocen przepisów** (thumbs up/down dla AI)

---

## Kontakt i Pomoc

Jeśli masz problemy:
1. Sprawdź logi w konsoli: `npm run dev` (backend logs)
2. Sprawdź DevTools w przeglądarce (network tab)
3. Sprawdź dokumentację OpenRouter: https://openrouter.ai/docs

---

**Status:** ✅ Implementacja kompletna, gotowa do testowania
**Ostatnia aktualizacja:** 26.10.2025

