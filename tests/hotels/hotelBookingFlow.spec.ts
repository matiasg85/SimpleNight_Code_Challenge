import { test, expect } from '../fixtures/baseFixture';
import { HOTEL_SEARCH, HOTEL_FILTERS, HOTEL_CATEGORY } from '../../src/data/hotelData';

/**
 * Hotel Booking Flow
 *
 * Covers steps 1–7 of the acceptance criteria:
 *
 *  1. Navigate to the Simplenight staging homepage.
 *  2. Select the Hotels category from the navbar.
 *  3. Search with: Location = Miami, Dates = Aug 1–3, Guests = 1 Adult + 1 Child (age 8).
 *  4. Switch results to Map view.
 *  5. Apply filters: Price Range 100–1000+, Guest Score "Very Good".
 *  6. Zoom in and select a single hotel from the map.
 *  7. Validate that the hotel card's price and guest score satisfy the filters.
 */
test.describe('Hotel search', () => {
  // All tests in this suite hit the live staging site with map interactions
  // (tile loading + cluster-click drill-down) — extend the per-test budget.
  test.describe.configure({ timeout: 120_000 });

  test(
    'given price range and guest score filters are applied on map view, the hotel card should satisfy both filters',
    async ({ page, homePage, hotelCategoryPage, hotelResultsPage }) => {

      // ── Step 1: Go to the staging homepage ─────────────────────────────────
      await homePage.goto();
      await expect(page).toHaveTitle(/.+/, { timeout: 15_000 });

      // ── Step 2: Select the Hotels category ─────────────────────────────────
      await this.page.waitForLoadState('networkidle');
      //await this.page.getByText(category, { exact: true }).first().click();
      await homePage.navBar.selectCategory(HOTEL_CATEGORY);
      await hotelCategoryPage.waitForReady();

      // ── Step 3: Fill the search form and submit ─────────────────────────────
      await hotelCategoryPage.searchWidget.fillLocation(HOTEL_SEARCH.location);
      await hotelCategoryPage.searchWidget.selectDates(HOTEL_SEARCH.dateRange);
      await hotelCategoryPage.searchWidget.setGuests(HOTEL_SEARCH.guests);
      await hotelCategoryPage.submitSearch();

      // ── Step 4: Switch to Map view ──────────────────────────────────────────
      await hotelResultsPage.switchToMapView();

      // ── Step 5: Apply left-panel filters ───────────────────────────────────
      await hotelResultsPage.filterPanel.setPriceRange(
        HOTEL_FILTERS.priceRange.min,
        HOTEL_FILTERS.priceRange.max,
      );
      await hotelResultsPage.filterPanel.selectGuestScore(
        HOTEL_FILTERS.guestScore,
      );

      // ── Step 6: Zoom in and select one hotel ───────────────────────────────
      await hotelResultsPage.mapView.zoomIn(3);
      await hotelResultsPage.mapView.selectFirstHotel();

      // ── Step 7: Validate the hotel card against the filter parameters ───────
      await hotelResultsPage.hotelCard.assertPriceIsAtLeast(
        HOTEL_FILTERS.priceRange.min,
      );
      await hotelResultsPage.hotelCard.assertGuestScoreIsAtLeast(
        HOTEL_FILTERS.guestScore,
      );
    },
  );
});
