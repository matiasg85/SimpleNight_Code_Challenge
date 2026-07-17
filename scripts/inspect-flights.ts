/**
 * inspect-flights.ts
 * Dumps all data-testid attributes and input placeholders on the /home/flights page
 * so we can identify the correct selectors for origin/destination fields.
 *
 * Run: npx ts-node scripts/inspect-flights.ts
 */
import { chromium } from '@playwright/test';
import * as dotenv from 'dotenv';
dotenv.config();

const BASE_URL = process.env.BASE_URL ?? 'https://staging.simplenight.com';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(`${BASE_URL}/home/flights`);

  // Wait for the search form to appear
  await page.locator('[placeholder="Leaving from"], [placeholder*="origin" i], input').first().waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});

  // 1. Dump all data-testid attributes in the form area
  const testids = await page.$$eval('[data-testid]', els =>
    els.map(el => ({ tag: el.tagName, testid: el.getAttribute('data-testid'), placeholder: (el as HTMLInputElement).placeholder ?? '' }))
  );

  console.log('\n=== data-testid elements ===');
  testids.forEach(t => console.log(`  ${t.tag}  testid="${t.testid}"  placeholder="${t.placeholder}"`));

  // 2. Dump all inputs and their attributes
  const inputs = await page.$$eval('input, [role="combobox"], [role="textbox"]', els =>
    els.map(el => ({
      tag: el.tagName,
      id: el.id,
      name: (el as HTMLInputElement).name,
      placeholder: (el as HTMLInputElement).placeholder,
      'aria-label': el.getAttribute('aria-label') ?? '',
      'data-testid': el.getAttribute('data-testid') ?? '',
      class: el.className.substring(0, 80),
    }))
  );

  console.log('\n=== inputs / comboboxes ===');
  inputs.forEach(i => console.log(JSON.stringify(i)));

  // 3. Dump clickable containers that might be the trigger buttons
  const triggers = await page.$$eval('[class*="trigger" i], [class*="input-wrap" i], [class*="field" i], [class*="combobox" i]', els =>
    els.slice(0, 30).map(el => ({
      tag: el.tagName,
      class: el.className.substring(0, 100),
      testid: el.getAttribute('data-testid') ?? '',
      text: el.textContent?.trim().substring(0, 60) ?? '',
    }))
  );

  console.log('\n=== potential trigger wrappers ===');
  triggers.forEach(t => console.log(JSON.stringify(t)));

  await browser.close();
})();
