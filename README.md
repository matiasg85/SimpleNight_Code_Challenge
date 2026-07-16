# Simplenight Test-Automation Framework

A **Playwright + TypeScript** end-to-end test framework for the [Simplenight](https://wl.stg.simplenight.com/) booking platform.

The project is structured so that adding automation for any booking category — Hotels, Flights, Car Rental, etc. — requires only new Page Objects and a new spec file. No changes to the shared infrastructure are needed.

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | 18 LTS or later |
| npm | 9 or later (bundled with Node.js) |

Download Node.js from [nodejs.org](https://nodejs.org/).

---

## Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd SimpleNight_FW

# 2. Install npm dependencies (Playwright, TypeScript, dotenv, cross-env)
npm install

# 3. Download the Chromium browser binary used by Playwright
npx playwright install chromium
```

---

## Configuration

Execution parameters are intentionally separated from test logic:

| Concern | Location |
|---|---|
| Target environment URLs | `config/environments.ts` |
| Search inputs (location, dates, guests) | `src/data/searchData.ts` |
| Filter parameters (price, score) | `src/data/searchData.ts` |
| Playwright settings (timeouts, reporter, browser) | `playwright.config.ts` |

### Environment variables

Copy the template and edit as needed:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `TEST_ENV` | `staging` | Which environment to target: `staging` \| `production` |
| `BASE_URL` | _(from environments.ts)_ | Override the resolved base URL (e.g. for a PR preview URL) |

The `.env` file is git-ignored. You can also pass variables directly:

```bash
# PowerShell (Windows)
$env:TEST_ENV="staging"; npx playwright test

# bash / macOS / Linux
TEST_ENV=staging npx playwright test
```

---

## Running the Tests

| Command | Description |
|---|---|
| `npm test` | Run all tests headlessly against staging |
| `npm run test:hotels` | Run only the hotel tests |
| `npm run test:headed` | Run with a visible browser window |
| `npm run test:debug` | Open Playwright Inspector for step-by-step debugging |
| `npm run test:ui` | Open the Playwright UI (interactive test runner) |
| `npm run test:staging` | Explicitly target the staging environment |
| `npm run test:production` | Target the production environment |
| `npm run report` | Open the last HTML report |

**Run a single spec with a headed browser:**

```bash
npx playwright test tests/hotels/hotelBookingFlow.spec.ts --headed
```

**Run in debug mode and pause at a specific step:**

```bash
npx playwright test --debug tests/hotels/hotelBookingFlow.spec.ts
```

---

## Project Structure

```
SimpleNight_FW/
│
├── playwright.config.ts          # Playwright settings (timeout, reporter, baseURL)
├── tsconfig.json                 # TypeScript compiler options
├── package.json
├── .env.example                  # Environment variable template
│
├── config/
│   └── environments.ts           # URL registry; resolves TEST_ENV → baseURL
│
├── src/
│   ├── data/
│   │   ├── types.ts              # Shared TypeScript interfaces & constants
│   │   └── searchData.ts         # Test inputs — edit here to change what is searched/filtered
│   │
│   ├── pages/                    # Page Objects (one class per route)
│   │   ├── BasePage.ts           # Abstract base: shared page reference + goto()
│   │   ├── HomePage.ts           # / — entry point, owns NavBar
│   │   └── hotels/
│   │       ├── HotelCategoryPage.ts   # /home/hotels — search form
│   │       └── HotelResultsPage.ts    # /hotels?… — results + view toggle
│   │
│   ├── components/               # Reusable UI components (composed into pages)
│   │   ├── NavBar.ts             # Top navbar category links
│   │   ├── SearchWidget.ts       # Search form: location, dates, guests, submit
│   │   ├── GuestSelector.ts      # Travellers popup: adults, children, child ages
│   │   ├── FilterPanel.ts        # Left sidebar: price slider, guest score filter
│   │   ├── MapView.ts            # Map canvas: zoom controls, marker selection
│   │   └── HotelCard.ts          # Hotel popup/card: price & score getters + assertions
│   │
│   └── utils/
│       └── dateUtils.ts          # ISO date → month name / day-of-month helpers
│
└── tests/
    ├── fixtures/
    │   └── baseFixture.ts        # Extends Playwright test with page-object fixtures
    └── hotels/
        └── hotelBookingFlow.spec.ts  # 7-step hotel booking acceptance test
```

### Extending to a new category

1. Add `src/pages/<category>/CategoryPage.ts` and `ResultsPage.ts`.
2. Add any category-specific components under `src/components/`.
3. Add test data to `src/data/searchData.ts` (or a new data file).
4. Register the new page fixtures in `tests/fixtures/baseFixture.ts`.
5. Create `tests/<category>/<category>Flow.spec.ts`.

---

## Design Decisions

### Page Object Model
Each full page and each discrete UI widget has its own class. Pages compose components; tests interact only with pages and read test data from `src/data/`. This keeps spec files short, intention-revealing, and easy to maintain.

### No fixed sleeps
All waits use Playwright's web-first APIs:
- `expect(locator).toBeVisible()` — waits until the element appears
- `expect(locator).not.toContainText(prev)` — waits for the calendar to re-render after a month change
- `waitForLoadState('networkidle')` — used as a best-effort wait after map operations (wrapped in `.catch()` so it never blocks)

### Resilient locators
Every locator uses the ARIA role hierarchy first (`getByRole`, `getByLabel`) and chains `.or()` fallbacks for sites that don't expose semantic roles consistently. CSS class-based selectors are the last resort.

### Slider interaction
The price-range slider is driven by keyboard (`Home` then `ArrowRight × n`) rather than pixel-level mouse drag, which means the interaction is independent of the slider's rendered size and works consistently across viewport sizes.

---

## AI Tool Usage

This framework was built with **GitHub Copilot** (Claude Sonnet 4.6) in VS Code.

The AI assisted with:
- Scaffolding the POM hierarchy and fixture pattern
- Generating multi-fallback locator strategies using `.or()`
- Producing TypeScript boilerplate (interfaces, strict-mode types, module exports)
- Drafting the README structure

Quality was controlled by:
- Manually reviewing every generated file before committing
- Inspecting the live staging site to cross-check HTML structure assumptions
- Applying idiomatic Playwright patterns throughout (web-first assertions, no `waitForTimeout` in the main flow)
- Checking TypeScript compilation (`npx tsc --noEmit`) to catch type errors early
