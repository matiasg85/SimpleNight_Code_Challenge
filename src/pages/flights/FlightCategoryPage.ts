import type { Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { FlightSearchWidget } from '../../components/FlightSearchWidget';

/**
 * FlightCategoryPage
 *
 * Represents the Flights landing page (e.g. /home/flights).
 * Owns the FlightSearchWidget and exposes a waitForReady() guard used
 * by spec files before interacting with the search form.
 */
export class FlightCategoryPage extends BasePage {
  readonly searchWidget: FlightSearchWidget;

  constructor(page: Page) {
    super(page);
    this.searchWidget = new FlightSearchWidget(page);
  }

  async goto(): Promise<void> {
    await super.goto('/home/flights');
  }

  async waitForReady(): Promise<void> {
    await this.searchWidget.waitForVisible();
  }
}
