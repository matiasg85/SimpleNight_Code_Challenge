import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * MapView
 *
 * Encapsulates interactions with the map rendered on the hotel results page.
 *
 * The site may use Mapbox GL, Leaflet, or Google Maps — all three expose
 * a zoom-in button and clickable markers, so selectors below try several
 * known class/aria patterns with Playwright's `.or()` combinator.
 */
export class MapView {
  constructor(private readonly page: Page) {}

  /**
   * Selector for the root map container.
   * The map is rendered as a landmark region with aria-label "Map".
   * Falls back to Mapbox/Leaflet class patterns for other implementations.
   */
  private get mapContainer() {
    return this.page
      .getByRole('region', { name: /^map$/i })
      .or(this.page.locator('.mapboxgl-map, .leaflet-container, [class*="map-view" i], [data-testid*="map"]'))
      .first();
  }

  /** Assert that the map canvas is visible */
  async waitForVisible(): Promise<void> {
    await expect(this.mapContainer).toBeVisible({ timeout: 15_000 });
    // Wait for map tiles / initial render to settle
    await this.page
      .waitForLoadState('networkidle')
      .catch(() => {
        /* best-effort */
      });
  }

  /**
   * Click the zoom-in control the specified number of times.
   * Uses mouse-wheel events over the map centre — Google Maps JS API
   * responds to wheel events for zooming regardless of whether the
   * zoom +/- buttons are in the ARIA tree.
   *
   * @param times - Number of zoom-in steps (default: 3)
   */
  async zoomIn(times = 3): Promise<void> {
    await this.waitForVisible();

    // Click map to focus, then use wheel scroll (negative deltaY = zoom in)
    const mapBox = await this.mapContainer.boundingBox();
    if (mapBox) {
      const cx = mapBox.x + mapBox.width / 2;
      const cy = mapBox.y + mapBox.height / 2;
      await this.page.mouse.click(cx, cy);
      await this.page.mouse.move(cx, cy);
      for (let i = 0; i < times; i++) {
        await this.page.mouse.wheel(0, -300);
        // Wait for tile network activity to settle rather than a fixed pause
        await this.page
          .waitForLoadState('networkidle', { timeout: 3_000 })
          .catch(() => { /* tiles may keep loading — proceed anyway */ });
      }
    }
  }

  /**
   * Select the first visible individual hotel marker and wait for the card to appear.
   *
   * Strategy:
   *  1. Zoom in (with wheel) until individual price-label buttons appear on the map.
   *  2. Click the first price button.
   *  3. Wait for any hotel-card element to become visible.
   */
  async selectFirstHotel(): Promise<void> {
    // Individual hotel markers show a price like "$150"
    const priceMarker = this.page
      .getByRole('button')
      .filter({ hasText: /\$[\d,]+/ })
      .first();

    // Cluster markers are pure-number buttons (e.g. "24", "4")
    // Clicking a cluster zooms into it — repeat until individual markers appear.
    // After each click we wait for a DOM change (price marker appears OR cluster
    // button text changes) rather than a fixed timeout, making this step resilient
    // to network/render speed variance.
    for (let attempt = 0; attempt < 8; attempt++) {
      if ((await priceMarker.count()) > 0) break;

      const cluster = this.page
        .getByRole('button')
        .filter({ hasText: /^\d+$/ })
        .first();
      if ((await cluster.count()) === 0) break;

      const clusterTextBefore = await cluster.textContent().catch(() => null);
      await cluster.click();

      // Wait up to 5 s for either: a price marker to appear, or the cluster
      // marker to change (indicating the map re-rendered after the click).
      await this.page
        .waitForFunction(
          ({ before }: { before: string | null }) => {
            // price marker visible?
            const priceBtn = Array.from(document.querySelectorAll('[role="button"], button')).find(
              (el) => /\$[\d,]+/.test(el.textContent ?? ''),
            );
            if (priceBtn) return true;
            // cluster changed?
            const clusterBtn = Array.from(document.querySelectorAll('[role="button"], button')).find(
              (el) => /^\d+$/.test((el.textContent ?? '').trim()),
            );
            return clusterBtn ? (clusterBtn.textContent ?? '').trim() !== before : true;
          },
          { before: clusterTextBefore },
          { timeout: 5_000 },
        )
        .catch(() => {
          /* map may not re-render — continue to next attempt */
        });
    }

    await priceMarker.waitFor({ state: 'visible', timeout: 15_000 });
    await priceMarker.click();

    // The hotel card may render as a popup, a drawer, a dialog, or an article
    await this.page
      .locator(
        [
          '[role="dialog"]',
          'article',
          '[class*="popup" i]',
          '[class*="drawer" i]',
          '[class*="panel" i]',
          '[class*="card" i]',
          '[class*="hotel" i]',
        ].join(', '),
      )
      .first()
      .waitFor({ state: 'visible', timeout: 15_000 });
  }
}
