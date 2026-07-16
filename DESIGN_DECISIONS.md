# Framework Design Decisions

A short walkthrough of the architectural choices made in this project, written
for anyone reviewing the codebase for the first time.

---

## 1. Why Playwright + TypeScript?

**Playwright** was chosen over Selenium or Cypress for three reasons:

- **Web-first waiting.** Playwright's locators automatically re-try until an
  element is ready — no manual `sleep()` calls needed. This is important on a
  React SPA where elements are rendered asynchronously.
- **Reliability.** Playwright's strict action model (it won't click a covered
  element) catches real bugs rather than hiding them with forced clicks.
- **Trace viewer + video.** When a run fails in CI, the built-in trace archive
  captures a full timeline of every action, screenshot, and network request —
  dramatically reducing debug time.

**TypeScript** adds compile-time safety. Every page object, component, and data
model is typed, so renaming a method or mistyping a parameter fails at
`tsc --noEmit` before any browser is launched.

---

## 2. Page Object Model with Component Composition

The project uses a two-layer POM:

```
Page (e.g. HotelResultsPage)
  └── Component (e.g. FilterPanel, MapView, HotelCard)
```

**Why two layers?**

A hotel search results page contains a filter panel, a map, and a hotel card.
Each of those is a self-contained UI widget that could appear on other pages
too (e.g. a filter panel on a flights page). Splitting them into `Component`
classes means:

- Each class has one responsibility (Single Responsibility Principle).
- A component can be reused across pages without copy-pasting locators.
- Tests read like a user story: `filterPanel.setPriceRange(100, Infinity)` not
  a wall of locator code.

---

## 3. Category-Scoped Selectors — the Key Technical Decision

The most important design decision came from a real bug discovered during
debugging.

The Simplenight SPA renders **all category search forms simultaneously** in the
DOM (Hotels, Flights, Things To Do, etc.) and hides the inactive ones with CSS.
A naive selector like `[data-testid*="location_trigger"]` would match the
**first** trigger in the DOM, which was the "Things To Do" form — not Hotels.
This caused the location autocomplete to target the wrong form entirely.

**Fix:** `SearchWidget` accepts a `categoryKey` string at construction time
(e.g. `"hotels"`). Every selector it builds is prefixed with that key:

```typescript
// Before (wrong — grabs Things To Do form)
page.locator('[data-testid*="location_trigger"]').first()

// After (correct — scoped to Hotels form only)
page.locator('[data-testid*="hotels"][data-testid*="location_trigger"]').first()
```

This also makes the widget **extensible by design**: wiring up Flights
automation requires only `new SearchWidget(page, 'flights')` in a
`FlightCategoryPage`.

---

## 4. Test Data and Environment Config are Kept Separate

All inputs that a tester might want to change without touching test logic live
in dedicated files:

| What | File |
|---|---|
| Search parameters (location, dates, guests) | `src/data/searchData.ts` |
| Filter thresholds (price, guest score) | `src/data/searchData.ts` |
| Staging / production base URLs | `config/environments.ts` |
| Browser, timeouts, reporters | `playwright.config.ts` |

Switching the target environment requires only setting `TEST_ENV=production` —
no test file changes.

---

## 5. Resilient Strategies for Tricky UI

Two areas required non-obvious solutions:

### Map zoom and hotel selection

The Google Maps zoom `+`/`−` buttons are rendered inside a canvas element and
are not accessible via the standard ARIA tree. Rather than hardcoding brittle
CSS class selectors, the framework:

1. Clicks the visible **cluster count button** (e.g. `button "24"`) which
   tells Google Maps to zoom into that cluster — the same interaction a real
   user would perform.
2. Repeats until individual hotel **price-label buttons** (e.g. `button "$290"`)
   appear, then clicks one.

This approach does not depend on any internal map class names and will continue
working across Google Maps API version updates.

### Hotel card data extraction

The popup that appears after clicking a hotel marker is a plain `<article>`
element with no special CSS class names. Price and score are embedded in a
single text string: `"10.0 Excellent ... Per night $200 ..."`.

The framework extracts values with targeted regex patterns rather than relying
on class-name-based child element selectors, which would break with any
CSS-in-JS rename:

```typescript
// Price: "Per night $200"
text.match(/per\s+night\s+\$([0-9,]+)/i)

// Score: "10.0 Excellent"
text.match(/(\d+(?:\.\d+)?)\s+(?:Excellent|Very Good|Good|Average)/i)
```

---

## 6. What Was Intentionally Left Simple

Over-engineering a framework is as harmful as under-engineering it. A few
deliberate simplicity choices:

- **Single browser (Chromium only).** The spec asks for one browser. Cross-
  browser coverage can be added by extending the `projects` array in
  `playwright.config.ts` in minutes.
- **Serial execution.** The booking flow is a linear journey; parallel workers
  would only complicate state management with no benefit for a single spec.
- **No custom retry logic.** Playwright's built-in `retries` config handles
  flaky network conditions in CI. Reinventing that in application code adds
  complexity without value.
