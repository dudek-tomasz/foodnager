# Komponenty nawigacji

Ten folder zawiera komponenty nawigacji dla aplikacji Foodnager, zaprojektowane zgodnie z `ui-plan.md`.

## Komponenty

### `Sidebar.astro`

Persistent sidebar nawigacji dla desktop (≥1024px).

**Features:**
- Logo Foodnager na górze
- Główne linki nawigacyjne:
  - 🧊 Lodówka (`/fridge`)
  - 📖 Przepisy (`/recipes`)
  - 📜 Historia (`/history`)
- CTA button "Znajdź przepis" na dole (`/recipes/search`)
- Aktywny stan linku z amber background
- Fixed position, 240px szerokości
- Ukryty na mobile/tablet (<1024px)

**Props:**
- `currentPath: string` - aktualny URL path do określenia aktywnego linku

**Styling:**
- Amber (#f59e0b) dla aktywnego stanu
- Smooth transitions dla hover effects
- Focus rings dla accessibility

### `BottomNavigation.astro`

Bottom navigation bar dla mobile/tablet (<1024px).

**Features:**
- 5 przycisków nawigacyjnych:
  1. 🧊 Lodówka (`/fridge`)
  2. 📖 Przepisy (`/recipes`)
  3. 🔍 **Znajdź** (`/recipes/search`) - centrum, wyeksponowany
  4. 📜 Historia (`/history`)
  5. 👤 Profil (`/login`)
- Środkowy przycisk (Znajdź) jest większy i przesuwa się w górę
- Fixed position na dole ekranu, 64px wysokości
- Ukryty na desktop (≥1024px)

**Props:**
- `currentPath: string` - aktualny URL path do określenia aktywnego linku

**Styling:**
- Amber gradient dla CTA button
- Ikony i labele dla każdego przycisku
- Active state z amber kolorem
- Responsive dla małych ekranów (<400px)

## Layout Integration

Komponenty są zintegrowane w `Layout.astro`:

```astro
<Sidebar currentPath={currentPath} />

<main class="main-content">
  <slot />
</main>

<BottomNavigation currentPath={currentPath} />
```

**Layout Responsive Behavior:**

### Desktop (≥1024px):
- Sidebar widoczny (fixed left, 240px)
- Main content ma `margin-left: 240px`
- Bottom navigation ukryty

### Mobile/Tablet (<1024px):
- Sidebar ukryty
- Main content pełna szerokość z `padding-bottom: 64px`
- Bottom navigation widoczny (fixed bottom)

## Active State Logic

Funkcja `isActive()` określa czy link jest aktywny:

```javascript
const isActive = (path: string) => {
  if (path === '/fridge') {
    // Root "/" również jest aktywne dla /fridge
    return currentPath === '/' || currentPath === '/fridge';
  }
  // Dla innych ścieżek używamy startsWith dla nested routes
  return currentPath.startsWith(path);
};
```

## Accessibility

Wszystkie komponenty nawigacyjne implementują:

- **Semantic HTML:** `<nav>`, `<ul>`, `<li>` tags
- **ARIA labels:** `aria-label="Główna nawigacja"`
- **Current page indicator:** `aria-current="page"` dla aktywnego linku
- **Keyboard navigation:** Focus rings z `outline` na `:focus-visible`
- **Screen reader friendly:** Ikony mają `aria-hidden="true"`, tekst jest zawsze obecny

## Color Palette

Zgodnie z ui-plan.md:

```css
/* Primary (Amber) */
--color-primary: rgb(245 158 11); /* Amber 500 */
--color-primary-dark: rgb(217 119 6); /* Amber 600 */
--color-primary-light: rgb(251 191 36); /* Amber 400 */
```

## Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 767px)

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px)

/* Desktop */
@media (min-width: 1024px)
```

Navigation switch point: **1024px**

## Testing Checklist

- [ ] Sidebar widoczny tylko na desktop (≥1024px)
- [ ] Bottom nav widoczny tylko na mobile/tablet (<1024px)
- [ ] Aktywny stan działa dla wszystkich routes
- [ ] CTA button "Znajdź przepis" jest wyeksponowany
- [ ] Keyboard navigation działa (Tab, Enter)
- [ ] Focus rings są widoczne
- [ ] Hover effects działają smooth
- [ ] Logo linkuje do /fridge
- [ ] Wszystkie linki prowadzą do poprawnych routes

## Future Enhancements (Post-MVP)

- Dark mode support
- User profile z avatarem w sidebar
- Notifications badge
- Search bar w sidebar
- Collapsible sidebar na desktop
- Swipe gestures dla mobile navigation

