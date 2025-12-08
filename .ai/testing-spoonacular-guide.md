# Testowanie Integracji Spoonacular API

## Szybka diagnoza problemu

### Krok 1: Sprawdź logi w konsoli przeglądarki i terminalu

Po uruchomieniu `npm run dev` i wykonaniu wyszukiwania, sprawdź logi:

```
🔍 [TIER 1] Found X user recipes
🔍 [TIER 1] Best match score: X.XX
🔍 [TIER 1] Has good matches (>=0.7)? false/true
```

Jeśli Tier 1 nie znalazł dobrych wyników (score < 0.7), powinno się pojawić:

```
🔍 [TIER 2] No good matches in Tier 1, trying external API...
🌐 [SPOONACULAR] Starting search with ingredients: [...]
```

### Krok 2: Sprawdź konfigurację

**Przyczyny braku działania Tier 2:**

#### A. Brak klucza API

```
🌐 [SPOONACULAR] ⚠️ API key not configured, skipping external API search
```

**Rozwiązanie:** Dodaj `EXTERNAL_RECIPE_API_KEY` do `.env`

#### B. Tier 1 zwraca dobre wyniki (score >= 0.7)

```
🔍 [TIER 1] Has good matches (>=0.7)? true
🔍 [TIER 1] ✅ Returning X user recipes (good matches found)
```

**To normalne zachowanie** - system używa najpierw przepisów użytkownika

#### C. Błąd API Spoonacular

```
🌐 [SPOONACULAR] API Error: 402 - Payment Required
```

**Rozwiązanie:** Przekroczono limit requestów - czekaj na reset lub upgrade plan

```
🌐 [SPOONACULAR] API Error: 401 - Unauthorized
```

**Rozwiązanie:** Nieprawidłowy klucz API - sprawdź `EXTERNAL_RECIPE_API_KEY`

### Krok 3: Testuj z produktami angielskimi

**⚠️ WAŻNE:** Spoonacular działa najlepiej z angielskimi nazwami produktów!

**Dobrze:**

- tomato
- pasta
- chicken
- cheese
- onion

**Źle (mogą nie zwrócić wyników):**

- pomidor
- makaron
- kurczak

## Instrukcja testowania krok po kroku

### Test 1: Sprawdź czy klucz API jest skonfigurowany

1. Otwórz plik `.env`
2. Sprawdź czy istnieją linie:

```bash
EXTERNAL_RECIPE_API_URL=https://api.spoonacular.com
EXTERNAL_RECIPE_API_KEY=twój-klucz-tutaj
```

3. Jeśli nie - dodaj je i zrestartuj serwer

### Test 2: Wymuś użycie Tier 2

Aby przetestować Spoonacular, musisz upewnić się, że:

- Tier 1 NIE zwraca dobrych wyników (match_score < 0.7)
- Masz produkty z angielskimi nazwami

**Scenariusz testowy:**

1. **Dodaj produkty do lodówki (angielskie nazwy):**
   - tomato (5 szt)
   - pasta (200 g)
   - olive oil (50 ml)
   - garlic (2 szt)

2. **NIE dodawaj przepisów użytkownika** z tymi składnikami
   - Albo upewnij się, że istniejące przepisy mają match_score < 0.7

3. **Wykonaj wyszukiwanie:**
   - Przejdź do wyszukiwania przepisów
   - Wybierz "wszystkie produkty z lodówki"
   - Kliknij "Wyszukaj"

4. **Sprawdź logi w konsoli:**

```
🔍 [TIER 1] Found 0 user recipes
🔍 [TIER 2] No good matches in Tier 1, trying external API...
🌐 [SPOONACULAR] Starting search with ingredients: ["tomato", "pasta", "olive oil", "garlic"]
🌐 [SPOONACULAR] ✅ API key configured, searching...
🌐 [SPOONACULAR] Request URL: https://api.spoonacular.com/recipes/findByIngredients?...
🌐 [SPOONACULAR] Making request to Spoonacular...
🌐 [SPOONACULAR] Response status: 200
🌐 [SPOONACULAR] Found 5 recipe summaries
🌐 [SPOONACULAR] Fetching details for 5 recipes...
🌐 [SPOONACULAR] ✅ Fetched recipe: Pasta with Tomato and Garlic
...
🔍 [TIER 2] Found 5 API recipes
🔍 [TIER 2] ✅ Returning 5 API recipes
```

### Test 3: Sprawdź Dashboard Spoonacular

1. Zaloguj się na [Spoonacular Dashboard](https://spoonacular.com/food-api/console#Dashboard)
2. Sprawdź "Points Used Today"
3. Każde wyszukiwanie kosztuje około 1-2 punkty
4. Limit darmowy: 150 punktów/dzień

## Ręczny test API z cURL

Jeśli chcesz przetestować API bezpośrednio (bez aplikacji):

```bash
# Test 1: Wyszukiwanie przepisów po składnikach
curl "https://api.spoonacular.com/recipes/findByIngredients?ingredients=tomato,pasta&number=5&apiKey=TWOJ_KLUCZ"

# Test 2: Szczegóły przepisu (użyj ID z poprzedniego wyniku)
curl "https://api.spoonacular.com/recipes/654959/information?apiKey=TWOJ_KLUCZ"
```

**Oczekiwany wynik testu 1:**

```json
[
  {
    "id": 654959,
    "title": "Pasta With Tuna",
    "image": "https://spoonacular.com/recipeImages/654959-312x231.jpg",
    "usedIngredientCount": 2,
    "missedIngredientCount": 1,
    ...
  }
]
```

## Rozwiązywanie typowych problemów

### Problem: "Spoonacular API key not configured"

**Powód:** Brak klucza w `.env`

**Rozwiązanie:**

```bash
# 1. Dodaj do .env
EXTERNAL_RECIPE_API_KEY=twoj-klucz-tutaj

# 2. Zrestartuj serwer
# Ctrl+C w terminalu, potem ponownie:
npm run dev
```

### Problem: "External API returned 401"

**Powód:** Nieprawidłowy klucz API

**Rozwiązanie:**

1. Sprawdź klucz na [Spoonacular Dashboard](https://spoonacular.com/food-api/console#Dashboard)
2. Upewnij się, że skopiowałeś cały klucz (bez spacji)
3. Sprawdź czy w `.env` nie ma cudzysłowów wokół klucza

### Problem: "External API returned 402"

**Powód:** Przekroczono dzienny limit (150 punktów)

**Rozwiązanie:**

- Poczekaj do następnego dnia (reset o północy UTC)
- Lub upgrade na płatny plan
- Sprawdź zużycie na Dashboard

### Problem: "No recipes found" mimo klucza API

**Powody:**

1. **Produkty po polsku** - Spoonacular wymaga angielskich nazw
   - ❌ pomidor → ✅ tomato
   - ❌ makaron → ✅ pasta

2. **Zbyt egzotyczna kombinacja** - API może nie mieć przepisów
   - Spróbuj popularniejszych składników (tomato, chicken, pasta)

3. **Błędne nazwy produktów**
   - Sprawdź czy nazwy są prawidłowe (bez literówek)

### Problem: Tier 2 się nie uruchamia (zawsze Tier 1 lub Tier 3)

**Powód:** Tier 1 zwraca dobre wyniki (score >= 0.7)

**Rozwiązanie:**

- To jest **normalne zachowanie**
- System używa hierarchii: najpierw Tier 1, potem Tier 2, na końcu Tier 3
- Aby przetestować Tier 2:
  - Usuń przepisy użytkownika z tymi składnikami
  - Lub użyj składników, których nie masz w swoich przepisach

## Dane testowe

### Przykładowe produkty do dodania (angielskie):

**Włoskie dania:**

- tomato (pomidor)
- pasta (makaron)
- olive oil (oliwa)
- garlic (czosnek)
- basil (bazylia)
- mozzarella (mozzarella)

**Amerykańskie:**

- chicken breast (pierś z kurczaka)
- potato (ziemniak)
- butter (masło)
- onion (cebula)

**Azjatyckie:**

- rice (ryż)
- soy sauce (sos sojowy)
- ginger (imbiir)
- garlic (czosnek)

## Monitorowanie kosztów

### Zużycie punktów Spoonacular:

**Jedno wyszukiwanie (Tier 2):**

- 1 punkt: `findByIngredients` (wyszukanie)
- 5 x 1 punkt: `recipes/{id}/information` (szczegóły dla 5 przepisów)
- **Razem: ~6 punktów**

**Dzienny limit darmowy:** 150 punktów = ~25 wyszukiwań

### Optymalizacja zużycia:

1. **Dodawaj własne przepisy** - Tier 1 jest darmowy
2. **Cachowanie** - Identyczne wyszukiwania są cache'owane (1h)
3. **Dobre nazwy produktów** - Używaj angielskich nazw dla lepszych wyników

## Debugowanie

### Włącz szczegółowe logi

Wszystkie logi są już włączone w kodzie. Sprawdź:

- **Konsolę przeglądarki** (F12 → Console)
- **Terminal** gdzie działa `npm run dev`

### Co powinieneś zobaczyć:

**Prawidłowe działanie:**

```
🔍 [TIER 1] Found 0 user recipes
🔍 [TIER 2] No good matches in Tier 1, trying external API...
🌐 [SPOONACULAR] Starting search with ingredients: ["tomato", "pasta"]
🌐 [SPOONACULAR] ✅ API key configured, searching...
🌐 [SPOONACULAR] Response status: 200
🌐 [SPOONACULAR] Found 5 recipe summaries
🔍 [TIER 2] Found 5 API recipes
🔍 [TIER 2] ✅ Returning 5 API recipes
```

## Pomoc

Jeśli problem nadal występuje:

1. **Sprawdź pełne logi** - skopiuj wszystkie logi z 🌐 [SPOONACULAR]
2. **Sprawdź Dashboard Spoonacular** - czy punkty się odejmują
3. **Przetestuj API ręcznie** - użyj cURL z powyższych przykładów
4. **Sprawdź status Spoonacular** - [status.spoonacular.com](https://status.spoonacular.com)
