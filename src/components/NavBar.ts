import type { Page } from '@playwright/test';

/**
 * NavBar
 *
 * The top navigation bar present on every page of the site.
 * Exposes a single action: selecting a booking category.
 *
 * To add a new category, simply call selectCategory() with the link text
 * (e.g. 'Flights', 'Car Rental') — no code changes are needed here.
 */
export class NavBar {
  constructor(private readonly page: Page) {}

  /**
   * Click the category link that matches `category` and wait for the page
   * to finish its initial load.
   *
   * @param category - The exact link label, e.g. 'Hotels', 'Flights'
   */
  async selectCategory(category: string): Promise<void> {
    // Try a few strategies so CI (and different site variants) don't
    // fail when the element role/structure changes between deployments.
    const link = this.page.getByRole('link', { name: category, exact: true });
    if (await link.count()) {
      await link.first().click();
    } else {
      const button = this.page.getByRole('button', { name: category, exact: true });
      if (await button.count()) {
        await button.first().click();
      } else {
        // Fallback: match any visible text node with the exact label.
        await this.page.getByText(category, { exact: true }).first().click();
      }
    }

    await this.page.waitForLoadState('domcontentloaded');
  }
}
