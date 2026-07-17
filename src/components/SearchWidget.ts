import { expect, type Page } from '@playwright/test';
import { GuestSelector } from './GuestSelector';
import type { DateRange, GuestConfig } from '../data/types';
import { getMonthAndYear, getDayOfMonth } from '../utils/dateUtils';
import { fillAutocompleteField } from '../utils/pageHelpers';

/**
 * Mantine DatePicker 2-column behavior (confirmed via DOM inspection):
 *  - "next" button advances BOTH month panels by 2 months
 *  - "previous" button retreats BOTH month panels by 1 month
 *
 * Strategy to land on month M as the LEFT panel:
 *  - diff = months between current left-panel month and M
 *  - nextsNeeded = Math.ceil(diff / 2)
 *  - needPrevious = diff % 2 === 1
 *
 * Date-range click strategy:
 *  - Calendar opens in "pick checkout" mode with today pre-selected as check-in
 *  - 1st click on check-in date: EXTENDS the checkout to that date
 *  - 2nd click on check-in date: RESETS range, sets that date as new check-in
 *  - 1 click on checkout date: sets checkout
 */

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export class SearchWidget {
  private readonly guestSelector: GuestSelector;

  constructor(
    private readonly page: Page,
    private readonly categoryKey: string,
  ) {
    this.guestSelector = new GuestSelector(page);
  }

  /** Build a selector scoped to this category to avoid matching sibling forms */
  private sel(field: string): string {
    return `[data-testid*="${this.categoryKey}"][data-testid*="${field}"]`;
  }

  async waitForVisible(): Promise<void> {
    await this.page
      .locator(this.sel('dates_trigger'))
      .first()
      .waitFor({ state: 'visible', timeout: 15_000 });
  }

  async fillLocation(location: string): Promise<void> {
    await fillAutocompleteField(
      this.page,
      this.page.locator(this.sel('location_trigger')),
      this.page.locator(this.sel('location_input')),
      location,
    );
  }

  async selectDates(dateRange: DateRange): Promise<void> {
    const { checkIn, checkOut } = dateRange;
    await this.page.locator(this.sel('dates_trigger')).first().click();
    await this.page
      .locator(this.sel('dates_calendar'))
      .first()
      .waitFor({ state: 'visible', timeout: 10_000 });

    const { month: ciMonth, year: ciYear } = getMonthAndYear(checkIn);
    await this.navigateCalendarToMonth(ciMonth, ciYear);

    const ciDay = getDayOfMonth(checkIn);
    const ciLabel = `${ciDay} ${ciMonth} ${ciYear}`;
    const ciBtn = this.page.locator(
      `button[aria-label="${ciLabel}"]:not([data-outside])`,
    );
    await ciBtn.click();
    await this.page.mouse.move(400, 400);
    // Wait for all CSS animations to finish before the second click
    await this.page
      .waitForFunction(() => document.getAnimations().every(a => a.playState !== 'running'), { timeout: 2_000 })
      .catch(() => {});
    await ciBtn.click();
    await this.page.mouse.move(400, 400);
    await this.page
      .waitForFunction(() => document.getAnimations().every(a => a.playState !== 'running'), { timeout: 2_000 })
      .catch(() => {});

    const { month: coMonth, year: coYear } = getMonthAndYear(checkOut);
    const coDay = getDayOfMonth(checkOut);
    const coLabel = `${coDay} ${coMonth} ${coYear}`;
    const coBtn = this.page.locator(
      `button[aria-label="${coLabel}"]:not([data-outside])`,
    );
    if ((await coBtn.count()) === 0) {
      await this.navigateCalendarToMonth(coMonth, coYear);
    }
    await coBtn.first().click();
    await this.page.mouse.move(400, 400);
    await this.page
      .waitForFunction(() => document.getAnimations().every(a => a.playState !== 'running'), { timeout: 2_000 })
      .catch(() => {});

    await this.page.getByRole('button', { name: 'Done' }).click();
    await this.page
      .locator(this.sel('dates_calendar'))
      .first()
      .waitFor({ state: 'hidden', timeout: 10_000 });
  }

  async setGuests(guests: GuestConfig): Promise<void> {
    // Different form types name this trigger differently:
    //   Hotels  → guests_trigger
    //   Flights → passengers_trigger  (or travelers_trigger)
    // Use a CSS selector list so the first match wins regardless of form type.
    const trigger = this.page.locator(
      [
        this.sel('guests_trigger'),
        this.sel('passengers_trigger'),
        this.sel('travelers_trigger'),
      ].join(', '),
    ).first();
    await trigger.click();
    await this.page
      .locator('[role="dialog"]')
      .last()
      .waitFor({ state: 'visible', timeout: 10_000 });
    await this.guestSelector.configure(guests);
  }

  async submit(): Promise<void> {
    // Click the Search button. Navigation waiting is handled by the caller
    // (e.g. HotelCategoryPage.submitSearch) so this widget stays category-agnostic.
    await this.page.getByRole('button', { name: /^search$/i }).click();
  }

  private async navigateCalendarToMonth(
    targetMonth: string,
    targetYear: number,
  ): Promise<void> {
    const heading = this.page
      .locator(`${this.sel('dates_calendar')} button:not([data-direction])`)
      .first();
    const headingText = await heading.textContent();
    const parts = (headingText ?? '').trim().split(' ');
    const currMonthStr = parts[0] ?? '';
    const currYear = parseInt(parts[1] ?? '0', 10);
    const currMonthIdx = MONTHS.indexOf(currMonthStr);
    const targetMonthIdx = MONTHS.indexOf(targetMonth);

    if (currMonthIdx === -1 || targetMonthIdx === -1) return;

    const monthsDiff =
      (targetYear - currYear) * 12 + (targetMonthIdx - currMonthIdx);
    if (monthsDiff === 0) return;

    // Navigate backward if the target is earlier than the current panel
    if (monthsDiff < 0) {
      const backsNeeded = Math.abs(monthsDiff);
      for (let i = 0; i < backsNeeded; i++) {
        const currentText = await heading.textContent();
        await this.page.locator('button[data-direction="previous"]').first().click();
        await expect(heading).not.toHaveText(currentText ?? '', { timeout: 5_000 });
      }
      return;
    }

    const nextsNeeded = Math.ceil(monthsDiff / 2);
    const needPrevious = monthsDiff % 2 === 1;

    for (let i = 0; i < nextsNeeded; i++) {
      const currentText = await heading.textContent();
      await this.page
        .locator('button[data-direction="next"]')
        .first()
        .click();
      // Wait for the calendar heading to change — confirms the month panel advanced
      await expect(heading).not.toHaveText(currentText ?? '', { timeout: 5_000 });
    }
    if (needPrevious) {
      const currentText = await heading.textContent();
      await this.page
        .locator('button[data-direction="previous"]')
        .first()
        .click();
      await expect(heading).not.toHaveText(currentText ?? '', { timeout: 5_000 });
    }
  }
}
