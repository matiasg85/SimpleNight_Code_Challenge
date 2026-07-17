import { type Page } from '@playwright/test';
import { SearchWidget } from './SearchWidget';
import type { DateRange, GuestConfig } from '../data/types';
import { fillAutocompleteField } from '../utils/pageHelpers';

/**
 * FlightSearchWidget
 *
 * Orchestrates the Flights search form on the Simplenight SPA.
 *
 * The Flights form shares the same Mantine date-picker and guest-selector
 * widgets with Hotels, so date and passenger logic is delegated to SearchWidget
 * (scoped to the 'flights' category key).
 *
 * Origin/destination fields use the same Mantine ComboBox trigger-click pattern
 * as the hotel location field.  Observed testid format (from DOM inspection):
 *   category(static_flights)_search-form_flight(1)_start-location_trigger
 *   category(static_flights)_search-form_flight(1)_end-location_trigger
 * Selectors match on the suffix fragment (_trigger / _input) only.
 */
export class FlightSearchWidget {
  /** Reuse date and guest logic scoped to the flights category */
  private readonly sharedWidget: SearchWidget;

  constructor(private readonly page: Page) {
    this.sharedWidget = new SearchWidget(page, 'flights');
  }

  async waitForVisible(): Promise<void> {
    await this.sharedWidget.waitForVisible();
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Fill an origin/destination autocomplete field using the trigger-click pattern.
   * The flight form uses the same Mantine ComboBox pattern as the hotel location
   * field: a readonly trigger opens a popover with a separate editable input.
   *
   * Actual testid observed in DOM:
   *   category(static_flights)_search-form_flight(1)_start-location_trigger
   * so we match on the `_trigger` / `_input` suffix fragments only.
   */
  private async fillLocationField(
    triggerFragment: string,
    inputFragment: string,
    city: string,
  ): Promise<void> {
    await fillAutocompleteField(
      this.page,
      this.page.locator(`[data-testid*="${triggerFragment}"]`),
      this.page.locator(`[data-testid*="${inputFragment}"]`),
      city,
    );
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  async fillOrigin(city: string): Promise<void> {
    await this.fillLocationField('start-location_trigger', 'start-location_input', city);
  }

  async fillDestination(city: string): Promise<void> {
    await this.fillLocationField('end-location_trigger', 'end-location_input', city);
  }

  /** Delegates to SearchWidget — same Mantine DatePicker, same category-scoped selectors */
  async selectDates(dateRange: DateRange): Promise<void> {
    await this.sharedWidget.selectDates(dateRange);
  }

  /**
   * Set the traveler counts in the flights "Travelers" popover.
   *
   * The flights form is different from the hotel GuestSelector in two ways:
   *  1. The +/− buttons have NO aria-label — they are bare icon buttons.
   *  2. There is no per-child age picker; age ranges (e.g. "Ages 2-11") are
   *     predefined by the passenger category itself.
   *
   * Strategy: locate each row's label element by exact text, walk up via XPath
   * to the nearest ancestor that owns buttons (the row container), then click
   * the last button in that container (the + increment button).
   */
  async setGuests(guests: GuestConfig): Promise<void> {
    // Open the Travelers popover — try all known trigger-name variants
    const trigger = this.page
      .locator(
        [
          '[data-testid*="guests_trigger"]',
          '[data-testid*="passengers_trigger"]',
          '[data-testid*="travelers_trigger"]',
        ].join(', '),
      )
      .first();
    await trigger.click();

    const dialog = this.page.locator('[role="dialog"]').last();
    await dialog.waitFor({ state: 'visible', timeout: 10_000 });

    // Increase Adults beyond the default of 1
    for (let i = 1; i < (guests.adults ?? 1); i++) {
      await this.clickPlusInRow(dialog, 'Adults');
    }

    // Add children — no age picker needed, the age band is implicit ("Ages 2-11")
    for (let i = 0; i < (guests.children?.length ?? 0); i++) {
      await this.clickPlusInRow(dialog, 'Children');
    }

    // Close the popover
    await this.page.keyboard.press('Escape');
    await this.page
      .waitForFunction(() => document.getAnimations().every(a => a.playState !== 'running'), { timeout: 2_000 })
      .catch(() => {});
  }

  /**
   * Click the + (increment) button inside the row identified by `sectionLabel`.
   *
   * Uses XPath `ancestor::*[.//button][1]` to find the closest ancestor of the
   * label text element that owns button descendants (i.e. the row container),
   * then clicks its last button (the + button).
   */
  private async clickPlusInRow(dialog: import('@playwright/test').Locator, sectionLabel: string): Promise<void> {
    const labelEl = dialog.getByText(sectionLabel, { exact: true }).first();
    const rowContainer = labelEl.locator('xpath=ancestor::*[.//button][1]');
    await rowContainer.getByRole('button').last().click();
    await this.page
      .waitForFunction(() => document.getAnimations().every(a => a.playState !== 'running'), { timeout: 2_000 })
      .catch(() => {});
  }

  async submit(): Promise<void> {
    await this.page.getByRole('button', { name: /^search$/i }).click();
    await this.page.waitForURL(/\/flights/, { timeout: 30_000 });
  }
}
