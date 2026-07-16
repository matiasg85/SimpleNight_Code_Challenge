import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import type { GuestScore } from '../data/types';
import { GUEST_SCORE_THRESHOLDS } from '../data/types';

/**
 * HotelCard
 *
 * Represents the hotel card / map popup that appears after clicking a
 * map marker.  Provides getters for price and guest score plus assertion
 * helpers used in the final validation step of the test.
 */
export class HotelCard {
  constructor(private readonly page: Page) {}

  /**
   * The card/popup element.
   * In Map view the popup is rendered as an <article> element inside the
   * clicked price-label button.  In list/grid view, article elements also
   * represent individual result cards.
   */
  private get card() {
    return this.page.locator('article').first();
  }

  /** Wait until the hotel card is visible in the DOM */
  async waitForVisible(): Promise<void> {
    await expect(this.card).toBeVisible({ timeout: 15_000 });
  }

  // ---------------------------------------------------------------------------
  // Data accessors
  // ---------------------------------------------------------------------------

  /**
   * Extract the nightly price as a number.
   * Parses "Per night $200" from the card's full text content.
   * Falls back to the first $ amount found if that pattern is absent.
   */
  async getPrice(): Promise<number> {
    await this.waitForVisible();
    const text = (await this.card.textContent()) ?? '';
    // Primary pattern: "Per night $200"
    const perNight = text.match(/per\s+night\s+\$([0-9,]+)/i);
    if (perNight) return HotelCard.parsePrice(perNight[1]);
    // Fallback: "$150 / night" or any leading price
    return HotelCard.parsePrice(text);
  }

  /**
   * Extract the numeric guest score.
   * Parses "10.0 Excellent" / "8.5 Very Good" from the card text.
   */
  async getGuestScore(): Promise<number> {
    await this.waitForVisible();
    const text = (await this.card.textContent()) ?? '';
    // Pattern: "<number> <label>" e.g. "10.0 Excellent"
    const match = text.match(/(\d+(?:\.\d+)?)\s+(?:Excellent|Very Good|Good|Average)/i);
    if (match) return parseFloat(match[1]);
    return HotelCard.parseScore(text);
  }

  // ---------------------------------------------------------------------------
  // Assertions
  // ---------------------------------------------------------------------------

  /**
   * Assert that the displayed price is at least `minPrice`.
   *
   * @param minPrice - Minimum acceptable nightly price (inclusive), e.g. 100
   */
  async assertPriceIsAtLeast(minPrice: number): Promise<void> {
    const price = await this.getPrice();
    expect(
      price,
      `Hotel price $${price} should be ≥ $${minPrice} (applied price filter)`,
    ).toBeGreaterThanOrEqual(minPrice);
  }

  /**
   * Assert that the displayed guest score meets or exceeds the threshold
   * for the given GuestScore label.
   *
   * @param minScore - The minimum acceptable label, e.g. 'Very Good'
   */
  async assertGuestScoreIsAtLeast(minScore: GuestScore): Promise<void> {
    const threshold = GUEST_SCORE_THRESHOLDS[minScore];
    const score = await this.getGuestScore();
    expect(
      score,
      `Guest score ${score} should be ≥ ${threshold} (${minScore}) — applied filter`,
    ).toBeGreaterThanOrEqual(threshold);
  }

  // ---------------------------------------------------------------------------
  // Private parse helpers
  // ---------------------------------------------------------------------------

  /** Strip currency symbols and commas, then return the first numeric value */
  private static parsePrice(text: string): number {
    const match = text.replace(/,/g, '').match(/\$?(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  }

  /** Extract the first decimal number from text (e.g. "8.5 Very Good" → 8.5) */
  private static parseScore(text: string): number {
    const match = text.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  }
}
