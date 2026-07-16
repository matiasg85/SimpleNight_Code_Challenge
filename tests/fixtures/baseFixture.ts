import { test as base } from '@playwright/test';
import { HomePage } from '../../src/pages/HomePage';
import { HotelCategoryPage } from '../../src/pages/hotels/HotelCategoryPage';
import { HotelResultsPage } from '../../src/pages/hotels/HotelResultsPage';

/**
 * Custom fixture types.
 *
 * Each fixture instantiates the relevant Page Object and injects it into
 * the test via Playwright's built-in dependency-injection mechanism.
 *
 * To add a new category, declare its page objects here and export the
 * extended `test` — no changes to the individual spec files are needed.
 */
type PageObjectFixtures = {
  homePage: HomePage;
  hotelCategoryPage: HotelCategoryPage;
  hotelResultsPage: HotelResultsPage;
};

export const test = base.extend<PageObjectFixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },

  hotelCategoryPage: async ({ page }, use) => {
    await use(new HotelCategoryPage(page));
  },

  hotelResultsPage: async ({ page }, use) => {
    await use(new HotelResultsPage(page));
  },
});

// Re-export expect so specs can import both from the same module
export { expect } from '@playwright/test';
