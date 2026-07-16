import type { Page } from '@playwright/test';
import type { GuestConfig } from '../data/types';

/**
 * GuestSelector
 *
 * Handles the travellers popup in the Simplenight search widget.
 *
 * DOM pattern (Mantine UI):
 *   <button aria-label="Remove Adult">  <p>1</p>  <button aria-label="Add Adult">
 *   <button aria-label="Remove Child">  <p>0</p>  <button aria-label="Add Child">
 *
 * After adding a child, a combobox appears:
 *   <label title="Child 1 Age"> <input readonly aria-haspopup="dialog">
 * Clicking it opens a list of role="option" age values (1–17).
 *
 * After the last child's age is selected, BOTH the age dropdown AND the
 * parent guests dialog auto-close — no explicit close needed.
 */
export class GuestSelector {
  constructor(private readonly page: Page) {}

  async configure(guests: GuestConfig): Promise<void> {
    // Default state: 1 adult, 0 children
    const targetAdults = guests.adults;
    const children = guests.children ?? [];

    // Adjust adults (default = 1)
    for (let i = 1; i < targetAdults; i++) {
      await this.page.getByRole('button', { name: 'Add Adult' }).click();
      // Wait for the stepper UI to re-render before the next increment
      await this.page
        .waitForFunction(() => document.getAnimations().every(a => a.playState !== 'running'), { timeout: 2_000 })
        .catch(() => {});
    }

    // Add children one by one, setting each child's age before adding the next
    for (let i = 0; i < children.length; i++) {
      await this.page.getByRole('button', { name: 'Add Child' }).click();
      // No fixed wait needed — setChildAge waits for the age trigger to appear
      await this.setChildAge(i + 1, children[i].age);
      // Wait for the age dropdown to fully close before the next iteration
      await this.page
        .waitForFunction(() => !document.querySelector('[role="option"]'), { timeout: 3_000 })
        .catch(() => {});
    }

    // If no children were added, the dialog is still open — close it
    if (children.length === 0) {
      await this.closDialog();
    }
    // With children: the dialog auto-closes after the last age selection
  }

  private async setChildAge(childIndex: number, age: number): Promise<void> {
    // The label and input are siblings inside the same wrapper div
    const trigger = this.page.locator(
      `label[title="Child ${childIndex} Age"] ~ input[readonly]`,
    );
    await trigger.waitFor({ state: 'visible', timeout: 5_000 });
    await trigger.click();

    const option = this.page.getByRole('option', { name: String(age), exact: true });
    await option.waitFor({ state: 'visible', timeout: 5_000 });
    await option.click();
  }

  /** Close the guests popover when no children were added (no auto-close). */
  private async closDialog(): Promise<void> {
    // Click somewhere outside the dialog to dismiss it
    await this.page.locator('[data-testid*="dates_trigger"]').first().click();
    // Wait for the dates calendar to open so we can close it cleanly
    await this.page
      .locator('[data-testid*="dates_calendar"]')
      .first()
      .waitFor({ state: 'visible', timeout: 5_000 })
      .catch(() => {});
    // Close the dates dialog that may have opened
    const doneBtn = this.page.getByRole('button', { name: 'Done' });
    if (await doneBtn.isVisible()) {
      await doneBtn.click();
    }
  }
}

