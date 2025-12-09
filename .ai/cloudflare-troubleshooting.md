# Cloudflare Deployment Troubleshooting

## Błąd: Project not found [code: 8000007]

### Quick Checklist

#### 1. Sprawdź Git Integration (NAJPRAWDOPODOBNIEJ TO!)

```
Cloudflare Dashboard → Workers & Pages → foodnager → Settings
```

Szukaj sekcji:
- **"Builds & deployments"** LUB
- **"Source"** LUB  
- **"Git"**

**Jeśli widzisz:**
- ❌ "Connected to GitHub"
- ❌ "GitHub repository: [nazwa-repo]"
- ❌ Automatyczne deploymenty przy pushu

**ROZWIĄZANIE:**
1. Kliknij **"Disconnect"** lub **"Remove GitHub integration"**
2. Potwierdź odłączenie
3. Re-run GitHub Actions workflow

**Po odłączeniu Git Integration:**
- ✅ Projekt dalej istnieje
- ✅ Wszystkie poprzednie deploymenty są zachowane
- ✅ GitHub Actions może deployować przez API
- ❌ Cloudflare nie będzie już automatycznie deployować z GitHub

---

#### 2. Sprawdź API Token Permissions

```
Cloudflare Dashboard → My Profile → API Tokens → Edit [twój token]
```

**Wymagane uprawnienia:**

```
Permissions:
  ✅ Account > Cloudflare Pages > Edit
  
Account Resources:
  ✅ Include > Specific account > [Twoje konto]
```

**Jeśli NIE MA `Cloudflare Pages > Edit`:**

1. Utwórz nowy token z template **"Edit Cloudflare Workers"**
2. Skopiuj nowy token
3. Zaktualizuj `CLOUDFLARE_API_TOKEN` w GitHub Secrets

---

#### 3. Sprawdź Account ID

```
Cloudflare Dashboard → Workers & Pages → Account ID (prawy panel)
```

Porównaj z:
```
GitHub → Settings → Secrets → CLOUDFLARE_ACCOUNT_ID
```

Muszą być **identyczne**!

---

#### 4. Sprawdź nazwę projektu

W Cloudflare Dashboard:
```
Workers & Pages → Lista projektów → Znajdź "foodnager"
```

**Dokładna nazwa:** `foodnager` (bez spacji, wielkość liter ma znaczenie)

W workflow:
```yaml
command: pages deploy dist --project-name=foodnager --branch=master
```

Muszą być **identyczne**!

---

## Scenariusze

### Scenariusz A: Git Integration jest włączone

**Problem:**
- Projekt jest zarządzany przez Cloudflare Git Integration
- API deployment jest zablokowane
- Błąd: "Project not found" (mimo że projekt istnieje)

**Rozwiązanie:**
1. Odłącz Git Integration (Settings → Source → Disconnect)
2. Re-run workflow
3. ✅ Powinno zadziałać!

---

### Scenariusz B: API Token nie ma uprawnień

**Problem:**
- Token nie ma `Cloudflare Pages > Edit` permission
- API deployment jest odrzucane

**Rozwiązanie:**
1. Utwórz nowy token z template "Edit Cloudflare Workers"
2. Zaktualizuj `CLOUDFLARE_API_TOKEN` w GitHub Secrets
3. Re-run workflow
4. ✅ Powinno zadziałać!

---

### Scenariusz C: Źle wpisany Account ID

**Problem:**
- Account ID w GitHub Secrets jest błędny
- API nie może znaleźć konta

**Rozwiązanie:**
1. Skopiuj poprawny Account ID z Cloudflare
2. Zaktualizuj `CLOUDFLARE_ACCOUNT_ID` w GitHub Secrets
3. Re-run workflow
4. ✅ Powinno zadziałać!

---

### Scenariusz D: Źle wpisana nazwa projektu

**Problem:**
- Nazwa w workflow (`foodnager`) nie zgadza się z Cloudflare
- Może być: różna wielkość liter, spacje, znaki specjalne

**Rozwiązanie:**
1. Skopiuj DOKŁADNĄ nazwę z Cloudflare Dashboard
2. Zaktualizuj workflow:
   ```yaml
   command: pages deploy dist --project-name=DOKŁADNA_NAZWA --branch=master
   ```
3. Commit i push
4. ✅ Powinno zadziałać!

---

## Krok po kroku - Diagnoza

### Krok 1: Git Integration (90% przypadków!)

```bash
# 1. Otwórz Cloudflare Dashboard
# 2. Workers & Pages → foodnager
# 3. Settings → Source / Builds & deployments
# 4. Czy widzisz "Connected to GitHub"?
#    TAK → ODŁĄCZ (Disconnect)
#    NIE → Przejdź do kroku 2
```

### Krok 2: API Token

```bash
# 1. My Profile → API Tokens
# 2. Znajdź swój token → Edit
# 3. Czy widzisz "Account > Cloudflare Pages > Edit"?
#    TAK → Token OK, przejdź do kroku 3
#    NIE → Utwórz nowy token z template "Edit Cloudflare Workers"
```

### Krok 3: Account ID

```bash
# 1. Workers & Pages → Account ID (prawy panel)
# 2. Skopiuj ID
# 3. GitHub → Settings → Secrets → CLOUDFLARE_ACCOUNT_ID
# 4. Czy są identyczne?
#    TAK → Przejdź do kroku 4
#    NIE → Zaktualizuj secret w GitHub
```

### Krok 4: Nazwa projektu

```bash
# 1. Workers & Pages → Lista projektów
# 2. Jaka jest DOKŁADNA nazwa? (wielkość liter, spacje)
# 3. Workflow używa: "foodnager"
# 4. Czy są identyczne?
#    TAK → Problem gdzie indziej (otwórz issue)
#    NIE → Zaktualizuj workflow
```

---

## Testowanie po naprawie

### Test 1: Ręczny deployment (lokalnie)

Jeśli masz `wrangler` zainstalowany lokalnie:

```bash
# Ustaw zmienne środowiskowe
export CLOUDFLARE_API_TOKEN="twój-token"
export CLOUDFLARE_ACCOUNT_ID="twój-account-id"

# Spróbuj deploy
npx wrangler pages deploy dist --project-name=foodnager --branch=master

# Jeśli działa → Problem rozwiązany!
# Jeśli nie → Sprawdź błąd
```

### Test 2: GitHub Actions

```bash
# 1. Re-run failed workflow
# 2. Sprawdź logi
# 3. Jeśli sukces → ✅ Problem rozwiązany!
```

---

## FAQ

### Q: Czy stracę poprzednie deploymenty po odłączeniu Git?
**A:** NIE! Wszystkie poprzednie deploymenty są zachowane. Zmieniasz tylko sposób zarządzania (Git → API).

### Q: Czy mogę później wrócić do Git Integration?
**A:** TAK, ale nie zalecam. GitHub Actions daje pełną kontrolę (testy przed deploymentem, approval, etc.).

### Q: Co jeśli API Token wygaśnie?
**A:** Ustaw długi TTL (np. 1 rok) lub bez TTL. Możesz później rotować token.

### Q: Czy mogę mieć Git Integration I GitHub Actions?
**A:** NIE zalecane - będzie podwójny deployment. Wybierz jedno.

### Q: Co jeśli chcę preview deployments dla PR?
**A:** Możesz to zrobić przez GitHub Actions. Utwórz osobny workflow dla PR z `--branch=${{ github.head_ref }}`.

---

## Dalsze kroki po naprawie

1. ✅ Odłącz Git Integration (jeśli było włączone)
2. ✅ Sprawdź API Token permissions
3. ✅ Re-run GitHub Actions workflow
4. ✅ Verify deployment URL w logach
5. ✅ Dodaj Environment `production` w GitHub Settings
6. ✅ (Opcjonalnie) Dodaj protection rules

---

## Kontakt

Jeśli problem dalej występuje:
1. Sprawdź czy wykonałeś WSZYSTKIE kroki z checklisty
2. Skopiuj PEŁNE logi z GitHub Actions
3. Screenshot z Cloudflare Settings → Source
4. Otwórz issue na GitHub

---

## Podsumowanie

**Najczęstszy problem:** Git Integration jest włączone  
**Rozwiązanie:** Odłącz w Settings → Source → Disconnect  
**Czas naprawy:** < 2 minuty  
**Ryzyko:** Brak - wszystko jest zachowane  

