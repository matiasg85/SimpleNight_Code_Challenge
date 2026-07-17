import { expect, type Page } from '@playwright/test';

/**
 * FlightCard
 *
 * Reads data from the flight detail panel that opens after a result is clicked.
 * The panel may render as a dialog, a sidebar, or a highlighted article card —
 * the selectors below try the most common patterns with .or() fallbacks.
 */
export class FlightCard {
  constructor(private readonly page: Page) {}

  private get card() {
    // After "Select" is clicked on the outbound leg, a "Selected Flights" panel
    // appears at the top of the page with the chosen flight's details.
    return this.page
      .locator('section, div, article')
      .filter({ has: this.page.getByRole('heading', { name: /selected\s+flights/i }) })
      .first();
  }

  async waitForVisible(): Promise<void> {
    await expect(this.card).toBeVisible({ timeout: 15_000 });
  }

  async getTextContent(): Promise<string> {
    return (await this.card.textContent()) ?? '';
  }

  /** Returns the number of stops parsed from the card text */
  async getStops(): Promise<number> {
    const text = await this.getTextContent();
    if (/nonstop/i.test(text)) return 0;
    const match = text.match(/(\d+)\s+stop/i);
    return match ? parseInt(match[1], 10) : -1;
  }

  /** Assert the card contains the airline name */
  async assertAirlineMatches(airline: string): Promise<void> {
    await expect(this.card).toContainText(new RegExp(airline, 'i'), { timeout: 10_000 });
  }

  /** Assert the card shows the expected number of stops */
  async assertStopsMatch(stops: number): Promise<void> {
    const actual = await this.getStops();
    expect(actual).toBe(stops);
  }

  /**
   * Returns the flight duration string as shown on the card (e.g. "2h 30m").
   * Returns null if no duration pattern is found.
   */
  async getDuration(): Promise<string | null> {
    const text = await this.getTextContent();
    const match = text.match(/(\d+)\s*h\s*(\d+)\s*m|(\d+)\s*hr?s?/i);
    return match ? match[0].trim() : null;
  }

  /** Assert the card displays a recognisable flight duration (e.g. "2h 30m") */
  async assertDurationIsVisible(): Promise<void> {
    await expect(this.card).toContainText(/\d+\s*h(r?s?|\s*\d+\s*m)/i, { timeout: 10_000 });
  }
}
