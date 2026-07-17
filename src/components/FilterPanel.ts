import type { Page } from '@playwright/test';
import type { GuestScore } from '../data/types';

/**
 * FilterPanel
 *
 * The left-hand sidebar on the hotel search results page.
 * Provides methods for the two filters required by the test:
 *   - Price range (dual-handle range slider)
 *   - Guest score (checkbox group)
 *
 * Slider interaction strategy
 * ───────────────────────────
 * We focus the handle, jump to Home/End, then read aria-valuemin/max/step
 * to calculate the number of ArrowRight/Left keypresses needed.
 * The first two [role="slider"] elements on the page are the price handles;
 * the third is the "Search Area" distance slider.
 */
export class FilterPanel {
  constructor(private readonly page: Page) {}

  async waitForVisible(): Promise<void> {
    // The price-range sliders are the most reliable readiness indicator
    await this.page
      .getByRole('slider')
      .first()
      .waitFor({ state: 'visible', timeout: 15_000 });
  }

  // ---------------------------------------------------------------------------
  // Price range
  // ---------------------------------------------------------------------------

  /**
   * Set the minimum (and optionally maximum) price on the price-range slider.
   *
   * @param min   - The desired minimum nightly price (e.g. 100).
   * @param max   - Optional finite maximum; omit or pass Infinity for "1000+".
   */
  async setPriceRange(min: number, max?: number): Promise<void> {
    await this.waitForVisible();

    const allSliders = this.page.getByRole('slider');
    const minHandle = allSliders.nth(0);
    await minHandle.scrollIntoViewIfNeeded();
    await minHandle.focus();
    await minHandle.press('Home'); // jump to absolute minimum

    const ariaMin = Number((await minHandle.getAttribute('aria-valuemin')) ?? '0');
    const step    = Number((await minHandle.getAttribute('aria-valuestep') ?? await minHandle.getAttribute('step') ?? '1'));

    const stepsNeeded = Math.round((min - ariaMin) / step);
    for (let i = 0; i < stepsNeeded; i++) {
      await minHandle.press('ArrowRight');
    }

    // Move max handle only when a finite cap is requested
    if (max !== undefined && isFinite(max)) {
      const maxHandle = allSliders.nth(1);
      await maxHandle.focus();
      await maxHandle.press('End'); // jump to absolute maximum

      const ariaMax  = Number((await maxHandle.getAttribute('aria-valuemax')) ?? '1000');
      const stepMax  = Number((await maxHandle.getAttribute('aria-valuestep') ?? await maxHandle.getAttribute('step') ?? '1'));
      const stepsBack = Math.round((ariaMax - max) / stepMax);
      for (let i = 0; i < stepsBack; i++) {
        await maxHandle.press('ArrowLeft');
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Guest score
  // ---------------------------------------------------------------------------

  /**
   * Select a guest-score filter option.
   * The label on-screen is e.g. "Very Good (7+)", so we match by the
   * leading score keyword (e.g. "Very Good").
   *
   * @param score - One of the GuestScore labels, e.g. 'Very Good'
   */
  async selectGuestScore(score: GuestScore): Promise<void> {
    await this.waitForVisible();

    const scorePattern = new RegExp(score, 'i');

    const option = this.page
      .getByRole('checkbox', { name: scorePattern })
      .or(this.page.getByRole('radio', { name: scorePattern }))
      .or(this.page.getByRole('button', { name: scorePattern }))
      .first();

    await option.scrollIntoViewIfNeeded();
    await option.click();

    // Wait for the filter selection animation to complete before proceeding
    await this.page
      .waitForFunction(() => document.getAnimations().every(a => a.playState !== 'running'), { timeout: 2_000 })
      .catch(() => {});
  }
}
