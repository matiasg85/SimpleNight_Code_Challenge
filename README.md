# SimpleNight_Code_Challenge Test Automation Framework

A **Playwright + TypeScript** end-to-end test framework for the [Simplenight](https://wl.stg.simplenight.com/) booking platform.

This repository, named **SimpleNight_Code_Challenge**, currently implements end-to-end coverage for the Hotels and Flights booking flows. The framework is designed so additional categories can be added through new Page Objects and spec files without changing the shared infrastructure.

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | 18 LTS or later |
| npm | 9 or later (bundled with Node.js) |

Download Node.js from [nodejs.org](https://nodejs.org/).

---

## macOS Setup

> **Skip this section if you are on Windows.** Everything below is macOS-specific.

### 1. Install Homebrew

Homebrew is the standard macOS package manager and is needed to install Node.js and Java.

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

> **Apple Silicon (M1/M2/M3):** After the script finishes, follow the "Next steps" it prints to add `/opt/homebrew/bin` to your PATH before continuing.

---

### 2. Install Node.js

```bash
brew install node
```

Verify:

```bash
node --version   # v18 or later
npm --version    # 9 or later
```

> **Tip:** If you manage multiple Node.js versions, use [nvm](https://github.com/nvm-sh/nvm) instead:
> ```bash
> curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
> nvm install --lts
> nvm use --lts
> ```

---

### 3. Install Java (required for Allure reports)

`allure-commandline` is a Java application. If Java is missing or not on the PATH, Allure will fail silently or with `Error: spawn java ENOENT`.

```bash
# Eclipse Temurin 21 LTS — recommended OpenJDK distribution
brew install --cask temurin@21
```

#### Set `JAVA_HOME` and update `PATH`

macOS Catalina (10.15) and later use **zsh** by default. Add the following to `~/.zshrc`:

```bash
# Java — required for Allure CLI
export JAVA_HOME=$(/usr/libexec/java_home)
export PATH="$JAVA_HOME/bin:$PATH"
```

Reload your shell:

```bash
source ~/.zshrc
```

> If you are on an older macOS still using **bash**, add the same two lines to `~/.bash_profile` and run `source ~/.bash_profile`.

#### Verify Java is on the PATH

```bash
java -version
# Expected output: openjdk version "21.x.x" ...
```

---

### 4. Clone and install the framework

```bash
git clone https://github.com/matiasg85/SimpleNight_Code_Challenge.git
cd SimpleNight_Code_Challenge
npm install
npx playwright install chromium
```

> If you see a shared-library warning, run `npx playwright install --with-deps chromium` to let Playwright install any OS-level browser dependencies automatically.

---

### 5. Run the tests and open the Allure report

```bash
npx playwright test --headed ; npm run allure:generate ; npm run allure:open
```

The report opens automatically at `http://127.0.0.1:<port>` in your default browser.

---

### 6. Environment variables — macOS syntax

On macOS/Linux, environment variables are set inline before the command (no `$env:` prefix):

```bash
# Target the staging environment
TEST_ENV=staging npx playwright test

# Override the base URL (e.g. for a PR preview)
BASE_URL=https://preview.example.com npx playwright test
```

---

### Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `Error: spawn java ENOENT` | Java not installed or not on PATH | Complete step 3 and run `source ~/.zshrc` |
| `java -version` fails after install | Shell config not reloaded | Open a new terminal tab, or run `source ~/.zshrc` |
| Allure report is empty | Tests not run before generating | Run `npx playwright test` first, then `npm run allure:generate` |
| Chromium blocked by Gatekeeper | macOS security policy | Open **System Settings → Privacy & Security** and click **Open Anyway** |
| `brew: command not found` after Apple Silicon install | Homebrew not on PATH | Follow the "Next steps" printed by the Homebrew installer |

---

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/matiasg85/SimpleNight_Code_Challenge.git
cd SimpleNight_Code_Challenge

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
| Hotel search inputs (location, dates, guests) | `src/data/hotelData.ts` |
| Flight search inputs (origin, destination, dates, travelers) | `src/data/flightData.ts` |
| Hotel filters (price, score) | `src/data/hotelData.ts` |
| Flight filters (stops, airline, sort) | `src/data/flightData.ts` |
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
| `npm run test:flights` | Run only the flight tests |
| `npm run test:headed` | Run with a visible browser window |
| `npm run test:debug` | Open Playwright Inspector for step-by-step debugging |
| `npm run test:ui` | Open the Playwright UI (interactive test runner) |
| `npm run test:staging` | Explicitly target the staging environment |
| `npm run test:production` | Target the production environment |
| `npm run report` | Open the last HTML report |

**Run a single spec with a headed browser:**

```bash
npx playwright test tests/hotels/hotelBookingFlow.spec.ts --headed
npx playwright test tests/flights/flightBookingFlow.spec.ts --headed
```

**Run in debug mode and pause at a specific step:**

```bash
npx playwright test --debug tests/hotels/hotelBookingFlow.spec.ts
npx playwright test --debug tests/flights/flightBookingFlow.spec.ts
```

---

## Project Structure

```
SimpleNight_Code_Challenge/
│
├── .env.example                  # Environment variable template
├── package.json                  # Scripts and dev dependencies
├── playwright.config.ts          # Playwright settings, reporters, timeouts, base URL
├── tsconfig.json                 # TypeScript compiler options
├── README.md
├── DESIGN_DECISIONS.md
│
├── config/
│   └── environments.ts           # TEST_ENV → base URL resolution
│
├── scripts/
│   └── inspect-flights.ts        # Small helper for inspecting current flight UI selectors
│
├── src/
│   ├── components/
│   │   ├── FilterPanel.ts        # Hotel filter sidebar (price, score)
│   │   ├── FlightCard.ts         # Selected flight card assertions
│   │   ├── FlightFilterPanel.ts  # Flight filter/sort controls
│   │   ├── FlightSearchWidget.ts # Flight search form (origin, destination, dates, travelers)
│   │   ├── GuestSelector.ts      # Hotel guest picker (adults/children/ages)
│   │   ├── HotelCard.ts          # Hotel popup/card parsing and assertions
│   │   ├── MapView.ts            # Hotel map interactions
│   │   ├── NavBar.ts             # Category navigation
│   │   └── SearchWidget.ts       # Shared hotel search widget
│   │
│   ├── data/
│   │   ├── flightData.ts         # Flight search/filter test data
│   │   ├── hotelData.ts          # Hotel search/filter test data
│   │   └── types.ts              # Shared TypeScript interfaces and constants
│   │
│   ├── pages/
│   │   ├── BasePage.ts           # Base page helpers
│   │   ├── HomePage.ts           # Home page object with navbar
│   │   ├── flights/
│   │   │   ├── FlightCategoryPage.ts
│   │   │   └── FlightResultsPage.ts
│   │   └── hotels/
│   │       ├── HotelCategoryPage.ts
│   │       └── HotelResultsPage.ts
│   │
│   └── utils/
│       ├── dateUtils.ts          # Date helpers and daysFromNow()
│       └── pageHelpers.ts        # Shared autocomplete helper used by both widgets
│
├── tests/
│   ├── fixtures/
│   │   └── baseFixture.ts        # Shared Playwright fixture wiring
│   ├── flights/
│   │   └── flightBookingFlow.spec.ts
│   └── hotels/
│       └── hotelBookingFlow.spec.ts
│
├── allure-report/                # Generated Allure HTML report
├── allure-results/               # Raw Allure output
├── playwright-report/            # Generated Playwright HTML report
└── test-results/                # Screenshots, videos, and traces from failed runs
```

### Implemented categories

| Category | Search widget | Filter component | Spec |
|---|---|---|---|
| Hotels | `SearchWidget` | `FilterPanel` | `tests/hotels/hotelBookingFlow.spec.ts` |
| Flights | `FlightSearchWidget` | `FlightFilterPanel` | `tests/flights/flightBookingFlow.spec.ts` |

### Extending to a new category

1. Add `src/pages/<category>/CategoryPage.ts` and `ResultsPage.ts`.
2. Add any category-specific components under `src/components/`.
3. Add a `src/data/<category>Data.ts` file with the category's search and filter inputs.
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

