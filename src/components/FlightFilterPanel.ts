import type { Page } from '@playwright/test';

/**
 * FlightFilterPanel
 *
 * Encapsulates the left-panel filters and sort controls on the flight
 * results page, following the same two-layer POM pattern used by the hotel
 * FilterPanel component.
 */
export class FlightFilterPanel {
  constructor(private readonly page: Page) {}

  /**
   * Apply a stops filter.
   *
   * Scopes the click to the Stops filter section (identified by its heading
   * "Stops" + the presence of a "Direct" option), then clicks the option text.
   * Scoping avoids false-matches with "1 Stop" text in the result rows.
   *
   * Labels observed in DOM: "Direct" (0 stops), "1 Stop", "2+ Stops".
   */
  async filterByStops(stops: number): Promise<void> {
    const optionText = stops === 0 ? 'Direct' : `${stops} Stop`;

    // Narrow to the Stops filter section — it has a "Stops" heading AND a "Direct" option
    const stopsSection = this.page
      .locator('div, section, fieldset')
      .filter({ has: this.page.getByText('Stops', { exact: true }) })
      .filter({ has: this.page.getByText('Direct', { exact: true }) })
      .last();

    await stopsSection.getByText(optionText, { exact: true }).first().click();

    // Wait for the filter selection animation to settle before continuing
    await this.page
      .waitForFunction(() => document.getAnimations().every(a => a.playState !== 'running'), { timeout: 2_000 })
      .catch(() => {});
  }

  /**
   * Apply an airline filter.
   * Uses the `<label>` element for the airline checkbox — confirmed to exist and
   * work for Mantine checkboxes.  `scrollIntoViewIfNeeded` handles the Airlines
   * section being below the fold when the filter panel first renders.
   */
  async filterByAirline(airline: string): Promise<void> {
    const pattern = new RegExp(airline, 'i');
    const label = this.page.locator('label').filter({ hasText: pattern }).first();
    await label.scrollIntoViewIfNeeded();
    await label.click();
    // Wait for the results to re-render after the airline filter is applied
    await this.page
      .waitForFunction(() => document.getAnimations().every(a => a.playState !== 'running'), { timeout: 2_000 })
      .catch(() => {});
  }

  /**
   * Sort results by the given criterion (e.g. 'price', 'duration').
   *
   * The results page uses a custom "Sort By: Recommended ▾" trigger — not a
   * native <select> or <button role="button">. We find it by its unique
   * "Sort By:" text prefix, click to open the dropdown, then pick the option.
   */
  async sortBy(criterion: string): Promise<void> {
    const pattern = new RegExp(criterion, 'i');

    // Open the Sort By dropdown — unique on the page; starts with "Sort By:"
    const trigger = this.page.getByText(/^Sort By:/i).first();
    await trigger.waitFor({ state: 'visible', timeout: 10_000 });
    await trigger.click();

    // Pick the matching option from the dropdown
    const option = this.page
      .getByRole('option', { name: pattern })
      .or(this.page.getByRole('menuitem', { name: pattern }))
      .or(this.page.getByText(pattern).filter({ has: this.page.locator('span, div') }).first())
      .first();
    await option.waitFor({ state: 'visible', timeout: 5_000 });
    await option.click();

    // Wait for the sort animation / list re-order to settle
    await this.page
      .waitForFunction(() => document.getAnimations().every(a => a.playState !== 'running'), { timeout: 2_000 })
      .catch(() => {});
  }
}
