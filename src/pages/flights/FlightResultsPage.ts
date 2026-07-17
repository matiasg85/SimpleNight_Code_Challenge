import type { Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { FlightCard } from '../../components/FlightCard';
import { FlightFilterPanel } from '../../components/FlightFilterPanel';

/**
 * FlightResultsPage
 *
 * Represents the flight search results page (/search/flights or similar).
 * Exposes methods to filter, sort, and select flight results.
 */
export class FlightResultsPage extends BasePage {
  readonly flightCard: FlightCard;
  /** Filter and sort controls on the left panel */
  readonly filterPanel: FlightFilterPanel;

  constructor(page: Page) {
    super(page);
    this.flightCard = new FlightCard(page);
    this.filterPanel = new FlightFilterPanel(page);
  }

  /** Wait for at least one flight result card to appear.
   *  Uses the "Select" button as the signal — it only renders in real results,
   *  never in the loading-skeleton UI. */
  async waitForResults(): Promise<void> {
    await this.page
      .getByRole('button', { name: 'Select' })
      .first()
      .waitFor({ state: 'visible', timeout: 30_000 });
  }

  /**
   * Click the first flight result's "Select" button and wait for the
   * "Selected Flights" panel to appear.  After clicking Select on the outbound
   * leg, the page re-renders with a "Selected Flights" summary section at the
   * top — that heading is the reliable confirmation signal.
   */
  async selectFirstFlight(): Promise<void> {
    const selectBtn = this.page.getByRole('button', { name: 'Select' }).first();
    await selectBtn.waitFor({ state: 'visible', timeout: 20_000 });
    await selectBtn.click();
    // Confirm selection by waiting for the "Selected Flights" heading
    await this.page
      .getByRole('heading', { name: /selected\s+flights/i })
      .waitFor({ state: 'visible', timeout: 15_000 });
  }
}
