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
    await this.page
      .getByRole('link', { name: category, exact: true })
      .click();

    await this.page.waitForLoadState('domcontentloaded');
  }
}
