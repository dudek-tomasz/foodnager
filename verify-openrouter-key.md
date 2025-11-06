# Weryfikacja klucza OpenRouter

## Sprawdź swój plik .env

Otwórz plik `.env` i zweryfikuj:

```env
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxx
```

### ✅ Prawidłowy klucz:
- Zaczyna się od `sk-or-v1-`
- Ma długość ~60-80 znaków
- Składa się z losowych znaków alfanumerycznych

### ❌ Nieprawidłowy klucz:
- `###` (placeholder)
- `your_key_here`
- Pusta wartość
- Klucz bez prefiksu `sk-or-v1-`

## Jak uzyskać klucz:

1. **Przejdź do:** https://openrouter.ai/
2. **Zaloguj się** (możesz użyć Google/GitHub)
3. **Utwórz klucz:** https://openrouter.ai/keys
   - Kliknij "Create Key"
   - Nadaj nazwę (np. "Foodnager Dev")
   - Skopiuj klucz (pojawi się tylko raz!)
4. **Dodaj środki:** https://openrouter.ai/credits
   - Minimum $5 (wystarczy na ~4500 przepisów)
   - Akceptują karty i crypto

## Test klucza przez curl:

Możesz przetestować klucz bezpośrednio:

```bash
curl https://openrouter.ai/api/v1/auth/key \
  -H "Authorization: Bearer sk-or-v1-twoj-klucz"
```

**Odpowiedź jeśli klucz jest prawidłowy:**
```json
{
  "data": {
    "label": "Foodnager Dev",
    "usage": 0.0,
    "limit": null,
    "is_free_tier": false,
    "rate_limit": {
      "requests": 200,
      "interval": "10s"
    }
  }
}
```

**Odpowiedź jeśli klucz jest nieprawidłowy:**
```json
{
  "error": {
    "code": 401,
    "message": "Invalid API key"
  }
}
```

## Sprawdź saldo konta:

```bash
curl https://openrouter.ai/api/v1/credits \
  -H "Authorization: Bearer sk-or-v1-twoj-klucz"
```

**Odpowiedź:**
```json
{
  "credits": 4.87,
  "currency": "USD"
}
```

Jeśli `credits` < 0.01, musisz dodać środki!

---

## Po weryfikacji klucza:

1. Zaktualizuj `.env` z prawidłowym kluczem
2. **Zrestartuj serwer:** `npm run dev`
3. Wywołaj API ponownie
4. Sprawdź logi - powinno działać! 🎉

