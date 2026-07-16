import type { Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { SearchWidget } from '../../components/SearchWidget';

/**
 * HotelCategoryPage — https://<host>/home/hotels
 *
 * The "Hotels" landing page that contains the search form.
 * Navigating here (directly or via the NavBar) presents the SearchWidget
 * so the user can specify destination, dates, and guests before searching.
 */
export class HotelCategoryPage extends BasePage {
  readonly searchWidget: SearchWidget;

  constructor(page: Page) {
    super(page);
    this.searchWidget = new SearchWidget(page, 'hotels');
  }

  async goto(): Promise<void> {
    await super.goto('/home/hotels');
  }

  /** Wait until the search form is ready to accept input */
  async waitForReady(): Promise<void> {
    await this.searchWidget.waitForVisible();
  }
}
