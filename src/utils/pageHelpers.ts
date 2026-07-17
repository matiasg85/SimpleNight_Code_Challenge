import { expect, type Locator, type Page } from '@playwright/test';

/**
 * fillAutocompleteField
 *
 * Shared helper for Mantine ComboBox / autocomplete fields.
 * Used by SearchWidget (hotel location) and FlightSearchWidget (origin, destination)
 * to avoid duplicating the same 6-step interaction sequence.
 *
 * Steps:
 *  1. Click the readonly trigger to open the popover
 *  2. Wait for the real text input to appear
 *  3. Assert the input is enabled (animation settled)
 *  4. Fill the value (fires React onChange → autocomplete API call)
 *  5. Wait for a matching option to appear in the dropdown
 *  6. Click the option
 */
export async function fillAutocompleteField(
  page: Page,
  triggerLocator: Locator,
  inputLocator: Locator,
  value: string,
): Promise<void> {
  await triggerLocator.first().click();
  await inputLocator.first().waitFor({ state: 'visible', timeout: 10_000 });
  await expect(inputLocator.first()).toBeEnabled({ timeout: 5_000 });
  await inputLocator.first().fill(value);
  const option = page
    .getByRole('option')
    .filter({ hasText: new RegExp(value, 'i') })
    .first();
  await option.waitFor({ state: 'visible', timeout: 20_000 });
  await option.click();
}
