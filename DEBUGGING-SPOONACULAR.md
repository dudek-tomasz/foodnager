# Debugowanie problemu z Spoonacular API

## 🔴 Zgłoszony problem

1. Przepisy nie są tłumaczone (nadal po angielsku)
2. Brak składników w przepisach
3. Ogólnie API nie działa

## ✅ Co sprawdziłem

- [x] Pliki istnieją (`html-to-text.ts`, `recipe-translator.ts`)
- [x] Importy są poprawne w `external-api.service.ts`
- [x] Brak błędów lintera/kompilacji
- [x] Kod tłumaczenia jest w miejscu (linie 371-387)
- [x] Przepływ danych jest prawidłowy

## ❓ Brakujące informacje

**POTRZEBUJĘ LOGÓW Z TERMINALA** gdy wykonujesz wyszukiwanie!

Bez nich nie mogę zdiagnozować problemu. Proszę o przesłanie:

### Krok 1: Zrestartuj serwer

```bash
# W terminalu naciśnij Ctrl+C, potem:
npm run dev
```

### Krok 2: Wykonaj wyszukiwanie

Idź do wyszukiwania przepisów i kliknij "Wyszukaj"

### Krok 3: Skopiuj WSZYSTKIE logi

Skopiuj **wszystko** co pojawi się w terminalu, szczególnie:

```
🔍 [TIER 1] ...
🔍 [TIER 2] ...
🌐 [SPOONACULAR] ...
🌍 [TRANSLATOR] ...
📦 [MAPPER] ...
```

Plus wszelkie błędy (`Error`, `TypeError`, itp.)

## 🧪 Test tłumaczenia

Możesz przetestować czy tłumaczenie w ogóle działa:

```bash
# W terminalu:
npx tsx test-translation.ts
```

Jeśli zobaczysz błąd, prześlij mi go.

## 🔍 Możliwe przyczyny (bez logów to zgadywanie)

### Przyczyna 1: OpenRouter nie skonfigurowany

Sprawdź plik `.env`:

```bash
# Powinna być linia:
OPENROUTER_API_KEY=sk-or-v1-....
```

Jeśli jej brak lub klucz nieprawidłowy:
- Tłumaczenie będzie pominięte
- Zobaczysz log: `🌍 [TRANSLATOR] OpenRouter not configured, skipping translation`

### Przyczyna 2: Serwer nie został zrestartowany

Po zmianach w kodzie **MUSISZ** zrestartować serwer:
- Ctrl+C w terminalu
- `npm run dev` ponownie

### Przyczyna 3: Błąd w runtime

Może być błąd TypeScript/JavaScript który nie jest wykrywany przez linter.

Sprawdź terminal czy są czerwone błędy podczas startu:
- `TypeError`
- `Cannot find module`
- `undefined is not a function`

### Przyczyna 4: Cache przeglądarki

Przepisy mogą być cache'owane w przeglądarce:
- Otwórz DevTools (F12)
- Zakładka Network
- Zaznacz "Disable cache"
- Wykonaj wyszukiwanie ponownie

### Przyczyna 5: Przepisy już zapisane w bazie (bez tłumaczenia)

Jeśli przepisy zostały zapisane **przed** dodaniem kodu tłumaczenia, będą nadal po angielsku.

Rozwiązanie:
1. Usuń przepisy z API z bazy danych
2. Wykonaj wyszukiwanie ponownie
3. Nowe przepisy będą już przetłumaczone

## 📝 Sprawdzenie krok po kroku

### 1. Sprawdź czy OpenRouter działa

```bash
# W terminalu PowerShell:
$env:OPENROUTER_API_KEY = "sk-or-v1-..."  # Twój klucz
npx tsx test-translation.ts
```

Jeśli działa → zobaczysz przetłumaczony przepis.
Jeśli nie działa → zobaczysz błąd.

### 2. Sprawdź czy Spoonacular działa

Logi powinny pokazać:

```
🌐 [SPOONACULAR] Starting search with ingredients: [...]
🌐 [SPOONACULAR] Found 5 recipe summaries
🌐 [SPOONACULAR] Fetching details for recipe 637684...
```

Jeśli tego nie ma → problem z Spoonacular API lub kluczem.

### 3. Sprawdź czy tłumaczenie jest wywoływane

Logi powinny pokazać:

```
🌍 [TRANSLATOR] Translating recipe: "Cheesy Rosemary Meatball Bake"
🌍 [TRANSLATOR] ✅ Translated to: "Pieczone klopsiki z serem..."
```

Jeśli tego nie ma → `isConfigured()` zwraca false (brak klucza API).

### 4. Sprawdź czy składniki są parsowane

Logi powinny pokazać:

```
🌐 [SPOONACULAR] Recipe has 15 ingredients
🌐 [SPOONACULAR] Parsed 15 ingredients
```

Jeśli pokazuje `0 ingredients` → problem z danymi z Spoonacular.

## 🆘 Bez logów nie mogę pomóc

Kod jest poprawny. Problem musi być w:
- Konfiguracji środowiska (.env)
- Runtime errors
- Cache
- Lub coś czego nie widzę bez logów

**Proszę wykonaj wyszukiwanie i prześlij mi WSZYSTKIE logi z terminala.**

Alternatywnie, zrób screenshot terminala po wykonaniu wyszukiwania.

