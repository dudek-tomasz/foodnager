# Recipe Details View - Testing Guide

## Overview
Comprehensive testing guide for Recipe Details view covering all user flows, edge cases, and accessibility requirements.

## Manual Testing Checklist

### 1. Navigation & Routing

#### ✅ Basic Navigation
- [ ] Navigate to `/recipes/:id` with valid recipe ID
- [ ] Recipe loads and displays correctly
- [ ] Back button navigates to previous page
- [ ] Back button shows correct text based on `from` param:
  - `?from=search` → "Wróć do wyników"
  - `?from=list` → "Wróć do przepisów"
  - `?from=history` → "Wróć do historii"
  - No param → "Wróć"

#### ✅ URL Query Parameters
- [ ] `matchScore` param displays MatchScoreBadge
- [ ] Missing `matchScore` hides the badge
- [ ] Invalid recipe ID redirects or shows error
- [ ] Non-numeric ID handles gracefully

### 2. Recipe Display

#### ✅ Header Section
- [ ] Recipe title displays correctly
- [ ] SourceBadge shows correct color:
  - USER → blue "MOJE"
  - API → purple "API"
  - AI → orange "AI"
- [ ] MatchScoreBadge shows correct color:
  - ≥80% → green
  - 50-79% → yellow
  - <50% → red
- [ ] Actions dropdown opens/closes correctly

#### ✅ Meta Section
- [ ] Cooking time displays and formats correctly (min/hours)
- [ ] Difficulty shows with correct color:
  - Easy → green "Łatwy"
  - Medium → yellow "Średni"
  - Hard → red "Trudny"
- [ ] Tags display correctly
- [ ] Section hides when no meta data available

#### ✅ Ingredients Section
- [ ] All ingredients display with correct names and quantities
- [ ] Color coding works correctly:
  - Green background → full availability (✓ checkmark icon)
  - Yellow background → partial availability (⚠ warning icon)
  - Red background → not available (✗ x icon)
- [ ] Partial availability shows "Dostępne: X / Wymagane: Y"
- [ ] Checkboxes are disabled (visual only)
- [ ] Success message shows when all ingredients available
- [ ] "Generuj listę zakupów" button shows only when ingredients missing
- [ ] Button state updates during generation (loading)

#### ✅ Instructions Section
- [ ] Description shows (if available)
- [ ] Instructions parse correctly (numbered or line-separated)
- [ ] Steps display in ordered list with numbers
- [ ] Empty state shows when no instructions

### 3. User Actions - Cook Recipe

#### ✅ Happy Path
- [ ] Click "Ugotuj to" button
- [ ] Validation passes (all ingredients available)
- [ ] Confirmation dialog opens
- [ ] Dialog shows correct recipe title
- [ ] Ingredients deduction preview lists all items
- [ ] Partial availability warning shows (if applicable)
- [ ] Click "Potwierdź"
- [ ] Loading state shows ("Gotowanie...")
- [ ] Success toast appears
- [ ] Redirects to `/history`

#### ✅ Missing Ingredients
- [ ] Click "Ugotuj to" with missing ingredients
- [ ] Error toast appears with message
- [ ] Toast includes "Generuj listę zakupów" action button
- [ ] Dialog does NOT open

#### ✅ Dialog Interactions
- [ ] Click "Anuluj" closes dialog
- [ ] Click outside dialog closes it
- [ ] ESC key closes dialog
- [ ] Focus trapped in dialog
- [ ] Focus returns after close

### 4. User Actions - Delete Recipe

#### ✅ User Recipes Only
- [ ] Dropdown shows "Edytuj przepis" and "Usuń przepis" for user recipes
- [ ] Click "Usuń przepis"
- [ ] Confirmation dialog opens
- [ ] Dialog shows correct recipe title
- [ ] Warning message displays (red box)
- [ ] Click "Potwierdź"
- [ ] Loading state shows ("Usuwanie...")
- [ ] Success toast appears
- [ ] Redirects to `/recipes`

#### ✅ Dialog Interactions
- [ ] Click "Anuluj" closes dialog
- [ ] Click outside dialog closes it
- [ ] ESC key closes dialog

### 5. User Actions - Save Recipe (Copy)

#### ✅ External Recipes Only (API/AI)
- [ ] Dropdown shows "Zapisz do moich przepisów" for external recipes
- [ ] Click "Zapisz do moich przepisów"
- [ ] Loading state shows ("Zapisywanie...")
- [ ] Success toast appears
- [ ] Toast includes "Zobacz przepis" action button
- [ ] Clicking action navigates to new recipe

### 6. User Actions - Edit Recipe

#### ✅ User Recipes Only
- [ ] Click "Edytuj przepis" in dropdown
- [ ] Redirects to `/recipes/:id/edit` (if edit page exists)

### 7. User Actions - Generate Shopping List

#### ✅ Happy Path
- [ ] Button visible only when ingredients missing
- [ ] Click "Generuj listę zakupów"
- [ ] Loading state shows ("Generowanie...")
- [ ] Success toast appears with count
- [ ] (Future: navigate to shopping list view)

### 8. Sticky Bottom Bar

#### ✅ Scroll Behavior
- [ ] Bar hidden on page load
- [ ] Bar appears after scrolling down 300px
- [ ] Smooth transition (opacity + translate)
- [ ] Bar hides when scrolling back up
- [ ] Buttons match main content buttons
- [ ] "Zapisz przepis" only shows for external recipes

#### ✅ Actions from Sticky Bar
- [ ] "Ugotuj to" works same as main button
- [ ] "Zapisz przepis" works same as main button
- [ ] Loading states update correctly

### 9. Error Handling

#### ✅ Recipe Not Found (404)
- [ ] Error state displays with message
- [ ] "Spróbuj ponownie" button available
- [ ] "Wróć" button available
- [ ] Clicking retry refetches data
- [ ] Clicking back navigates away

#### ✅ Unauthorized (401)
- [ ] Error message about login required
- [ ] Appropriate action buttons

#### ✅ Network Error
- [ ] Generic error message displays
- [ ] Retry button available
- [ ] Retry functionality works

#### ✅ Cooking with Insufficient Ingredients (422)
- [ ] Error toast shows specific message
- [ ] "Generuj listę zakupów" action in toast

### 10. Loading States

#### ✅ Initial Load
- [ ] Loading spinner displays
- [ ] "Ładowanie przepisu..." message shows
- [ ] No content flash before loading

#### ✅ Action Loading States
- [ ] "Ugotuj to" → "Gotowanie..."
- [ ] "Zapisz przepis" → "Zapisywanie..."
- [ ] "Usuń przepis" → "Usuwanie..."
- [ ] "Generuj listę zakupów" → "Generowanie..."
- [ ] Buttons disabled during loading
- [ ] Multiple actions can't be triggered simultaneously

### 11. Responsive Design

#### ✅ Mobile (< 640px)
- [ ] Layout stacks vertically
- [ ] Header compact and readable
- [ ] Meta section wraps properly
- [ ] Ingredients list readable
- [ ] Instructions readable
- [ ] Action buttons full-width
- [ ] Sticky bar buttons full-width
- [ ] Dialogs fit screen
- [ ] Text sizes appropriate

#### ✅ Tablet (640px - 1024px)
- [ ] Layout uses available space
- [ ] Action buttons side-by-side
- [ ] Meta section uses flexbox
- [ ] All content readable

#### ✅ Desktop (> 1024px)
- [ ] Content centered with max-width
- [ ] Action buttons min-width maintained
- [ ] Sticky bar buttons maintain size
- [ ] All interactions smooth

### 12. Accessibility (a11y)

#### ✅ Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Focus visible on all elements
- [ ] Dropdown opens with Enter/Space
- [ ] Dropdown closes with ESC
- [ ] Dialogs trap focus
- [ ] Dialogs close with ESC
- [ ] Skip links work (if implemented)

#### ✅ Screen Reader
- [ ] Page title announces correctly
- [ ] Headings hierarchy (h1 → h2)
- [ ] Landmarks identified (header, main, sections)
- [ ] Lists semantic (`<ul>`, `<ol>`)
- [ ] Buttons have aria-labels
- [ ] Loading states announce
- [ ] Error states announce (aria-live)
- [ ] Dialog title announces
- [ ] Icons have aria-hidden
- [ ] Images have alt text (if added)

#### ✅ Color & Contrast
- [ ] Color coding has sufficient contrast
- [ ] Text readable in light mode
- [ ] Text readable in dark mode (if implemented)
- [ ] Status not conveyed by color alone (icons + text)
- [ ] Focus indicators visible

#### ✅ ARIA Attributes
- [ ] `role="status"` on loading spinner
- [ ] `role="alert"` on error state
- [ ] `role="list"` on ingredient list
- [ ] `role="listitem"` on ingredient items
- [ ] `aria-live="polite"` for loading
- [ ] `aria-live="assertive"` for errors
- [ ] `aria-hidden="true"` on decorative icons
- [ ] `aria-label` on icon-only buttons
- [ ] `aria-expanded` on dropdown
- [ ] `aria-describedby` where appropriate

### 13. Edge Cases

#### ✅ Data Edge Cases
- [ ] Recipe with no ingredients
- [ ] Recipe with no instructions
- [ ] Recipe with no tags
- [ ] Recipe with null cooking time
- [ ] Recipe with null difficulty
- [ ] Recipe with no description
- [ ] Very long recipe title (truncation)
- [ ] Very long ingredient names
- [ ] Very long instruction steps
- [ ] Recipe with 1 ingredient
- [ ] Recipe with 50+ ingredients

#### ✅ User Interactions
- [ ] Rapid clicking on buttons (debouncing)
- [ ] Opening multiple dialogs (only one opens)
- [ ] Switching tabs during API call
- [ ] Browser back button during loading
- [ ] Refreshing page during action

### 14. Performance

#### ✅ Load Times
- [ ] Initial page load < 2s (good network)
- [ ] Images lazy load (if added)
- [ ] No layout shift during load
- [ ] Smooth scroll behavior

#### ✅ Interactions
- [ ] Button clicks responsive (< 100ms feedback)
- [ ] Scroll smooth (60fps)
- [ ] Dialog animations smooth
- [ ] No jank during interactions

### 15. Browser Compatibility

#### ✅ Modern Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

#### ✅ Features
- [ ] Fetch API works
- [ ] Promises work
- [ ] Async/await works
- [ ] CSS Grid/Flexbox works
- [ ] Transitions/animations work

## Test Data Scenarios

### Scenario 1: User Recipe with All Ingredients
- User owns recipe
- All ingredients in fridge (full availability)
- Can cook immediately
- Can edit/delete

### Scenario 2: External Recipe (API) with Missing Ingredients
- Recipe from API
- Some ingredients missing
- Should show shopping list button
- Can save to own recipes
- Cannot edit/delete

### Scenario 3: AI Recipe with Partial Ingredients
- Recipe from AI
- Some ingredients partially available
- Warning in cook dialog
- Can save to own recipes

### Scenario 4: Recipe with Minimal Data
- No cooking time
- No difficulty
- No tags
- No description
- Should still display correctly

### Scenario 5: Recipe with Match Score
- Came from search results
- Has matchScore query param
- Badge displays with correct color

## Automation Opportunities

While this is a manual testing guide, consider automating:
- API call mocking for consistent test data
- Snapshot tests for component rendering
- Unit tests for utility functions
- E2E tests for critical user flows (cook, delete)

## Testing Tools Recommendations

- **Manual Testing:** Chrome DevTools, React DevTools
- **Accessibility:** aXe DevTools, NVDA/JAWS, VoiceOver
- **Responsive:** Chrome Device Toolbar, BrowserStack
- **Performance:** Lighthouse, Chrome DevTools Performance tab
- **Network:** Chrome DevTools Network tab (throttling)

## Issue Reporting Template

```
**Issue:** [Brief description]
**Severity:** [Critical/High/Medium/Low]
**Steps to Reproduce:**
1. 
2. 
3. 

**Expected:** [What should happen]
**Actual:** [What actually happens]
**Environment:** [Browser, OS, device]
**Screenshot:** [If applicable]
```

## Sign-off Checklist

Before considering Recipe Details View complete:
- [ ] All critical paths tested
- [ ] All accessibility requirements met
- [ ] All responsive breakpoints verified
- [ ] All error states verified
- [ ] All loading states verified
- [ ] Cross-browser testing complete
- [ ] Performance acceptable
- [ ] No console errors/warnings
- [ ] Documentation complete

