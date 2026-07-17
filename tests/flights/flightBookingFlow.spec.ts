import { test, expect } from '../fixtures/baseFixture';
import { FLIGHT_SEARCH, FLIGHT_FILTERS, FLIGHT_CATEGORY } from '../../src/data/flightData';

/**
 * Flight Booking Flow
 *
 *  1. Navigate to the Simplenight staging homepage.
 *  2. Select the Flights category from the navbar.
 *  3. Search: Origin = New York, Destination = Miami, Dates = ~30 days out,
 *     Guests = 1 Adult + 1 Child (age 8), round-trip.
 *  4. Wait for results to load.
 *  5. Apply filters: 1 Stop + American Airlines.
 *  6. Sort by lowest price.
 *  7. Select the first result.
 *  8. Validate the selected flight matches the airline and stop filters.
 */
test.describe('Flight search', () => {
  // Live staging site — no map, but API calls make this flow take >30 s
  test.describe.configure({ timeout: 120_000 });

  test(
    'given 1-stop and airline filters are applied and results sorted by price, the first result should match both filters',
    async ({ page, homePage, flightCategoryPage, flightResultsPage }) => {

      // ── Step 1: Go to the staging homepage ─────────────────────────────────
      await homePage.goto();
      await expect(page).toHaveTitle(/.+/, { timeout: 15_000 });

      // ── Step 2: Select the Flights category ────────────────────────────────
      await homePage.navBar.selectCategory(FLIGHT_CATEGORY);
      await flightCategoryPage.waitForReady();

      // ── Step 3: Fill the search form and submit ─────────────────────────────
      await flightCategoryPage.searchWidget.fillOrigin(FLIGHT_SEARCH.origin);
      await flightCategoryPage.searchWidget.fillDestination(FLIGHT_SEARCH.destination);
      await flightCategoryPage.searchWidget.selectDates(FLIGHT_SEARCH.dateRange);
      await flightCategoryPage.searchWidget.setGuests(FLIGHT_SEARCH.guests);
      await flightCategoryPage.searchWidget.submit();

      // ── Step 4: Wait for results ─────────────────────────────────────────────────────
      await flightResultsPage.waitForResults();

      // ── Step 5: Apply filters ───────────────────────────────────────────────────────
      await flightResultsPage.filterPanel.filterByStops(FLIGHT_FILTERS.stops);
      await flightResultsPage.filterPanel.filterByAirline(FLIGHT_FILTERS.airline);

      // ── Step 6: Sort by lowest price ──────────────────────────────────────────────
      await flightResultsPage.filterPanel.sortBy(FLIGHT_FILTERS.sortBy);

      // ── Step 7: Select first result ────────────────────────────────────────
      await flightResultsPage.selectFirstFlight();

      // ── Step 8: Validate selected flight ──────────────────────────────────
      await flightResultsPage.flightCard.assertAirlineMatches(FLIGHT_FILTERS.airline);
      await flightResultsPage.flightCard.assertStopsMatch(FLIGHT_FILTERS.stops);
    },
  );

  test(
    'given no filters are applied and results are sorted by shortest duration, the first result should display a flight duration',
    async ({ page, homePage, flightCategoryPage, flightResultsPage }) => {

      // ── Step 1: Go to the staging homepage ─────────────────────────────────
      await homePage.goto();
      await expect(page).toHaveTitle(/.+/, { timeout: 15_000 });

      // ── Step 2: Select the Flights category ────────────────────────────────
      await homePage.navBar.selectCategory(FLIGHT_CATEGORY);
      await flightCategoryPage.waitForReady();

      // ── Step 3: Fill the search form and submit ─────────────────────────────
      await flightCategoryPage.searchWidget.fillOrigin(FLIGHT_SEARCH.origin);
      await flightCategoryPage.searchWidget.fillDestination(FLIGHT_SEARCH.destination);
      await flightCategoryPage.searchWidget.selectDates(FLIGHT_SEARCH.dateRange);
      await flightCategoryPage.searchWidget.setGuests(FLIGHT_SEARCH.guests);
      await flightCategoryPage.searchWidget.submit();

      // ── Step 4: Wait for results ─────────────────────────────────────────────────────
      await flightResultsPage.waitForResults();

      // ── Step 5: Sort by shortest duration (no stops/airline filter applied) ───
      await flightResultsPage.filterPanel.sortBy('duration');

      // ── Step 6: Select first result ────────────────────────────────────────
      await flightResultsPage.selectFirstFlight();

      // ── Step 7: Validate the selected flight card shows a duration value ───
      await flightResultsPage.flightCard.assertDurationIsVisible();
    },
  );
});
