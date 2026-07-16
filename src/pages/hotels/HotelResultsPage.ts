import type { Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { FilterPanel } from '../../components/FilterPanel';
import { MapView } from '../../components/MapView';
import { HotelCard } from '../../components/HotelCard';

/**
 * HotelResultsPage — rendered after submitting a hotel search.
 *
 * Owns:
 *  - FilterPanel  (left sidebar filters)
 *  - MapView      (map rendering + zoom + marker selection)
 *  - HotelCard    (the card/popup that appears when a map marker is clicked)
 */
export class HotelResultsPage extends BasePage {
  readonly filterPanel: FilterPanel;
  readonly mapView: MapView;
  readonly hotelCard: HotelCard;

  constructor(page: Page) {
    super(page);
    this.filterPanel = new FilterPanel(page);
    this.mapView = new MapView(page);
    this.hotelCard = new HotelCard(page);
  }

  /**
   * Wait for the initial async results load to complete.
   * The view-toggle radiogroup (Grid / List / Map) appears once results have loaded.
   */
  async waitForResults(): Promise<void> {
    await this.page
      .getByRole('radio', { name: 'Map' })
      .waitFor({ state: 'visible', timeout: 30_000 });
  }

  /**
   * Click the "Map" radio in the results toolbar to switch to map view,
   * then wait for the map to render.
   */
  async switchToMapView(): Promise<void> {
    await this.waitForResults();
    await this.page.getByRole('radio', { name: 'Map' }).click();
    await this.mapView.waitForVisible();
  }
}
