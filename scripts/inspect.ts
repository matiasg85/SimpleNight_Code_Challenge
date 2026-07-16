import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Capture network requests related to location autocomplete
  const requests: string[] = [];
  page.on('request', req => {
    const url = req.url();
    if (url.includes('location') || url.includes('autocomplete') || url.includes('places') || url.includes('geocod')) {
      requests.push(`[${req.method()}] ${url.substring(0, 100)}`);
    }
  });

  await page.goto('https://wl.stg.simplenight.com/');
  await page.waitForLoadState('domcontentloaded');
  await page.getByRole('link', { name: 'Hotels', exact: true }).click();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);

  // ── 1. LOCATION ──────────────────────────────────────────────────────────
  console.log('\n=== CLICK location_trigger ===');
  await page.locator('[data-testid*="location_trigger"]').first().click();
  // Simulate SearchWidget behavior: waitFor visible, then short wait, then fill
  const locInput = page.locator('[data-testid*="location_input"]').first();
  await locInput.waitFor({ state: 'visible', timeout: 10_000 });
  console.log('Input visible. Waiting 300ms (like SearchWidget)...');
  await page.waitForTimeout(300);  // same as SearchWidget (not 800ms)

  requests.length = 0; // clear any prior requests
  await locInput.fill('Miami');
  const valueAfterFill = await locInput.inputValue();
  console.log('Input value after fill:', JSON.stringify(valueAfterFill));
  await page.waitForTimeout(2000);
  console.log('Network requests made during fill:', requests.length);
  requests.forEach(r => console.log(' ', r));

  const opts = await page.getByRole('option').all();
  console.log('Options found:', opts.length);
  // Select the Miami option (not "Near you" or section headers)
  await page.getByRole('option').filter({ hasText: /miami/i }).first().click();
  await page.waitForTimeout(600);

  // ── 2. DATES ─────────────────────────────────────────────────────────────
  console.log('\n=== CLICK dates_trigger ===');
  await page.locator('[data-testid*="dates_trigger"]').first().click();
  await page.waitForTimeout(1000);

  // Strategy: next→Sep/Oct, then previous→Aug/Sep (Aug is now left panel)
  await page.locator('button[data-direction="next"]').first().click({ timeout: 5_000 });
  await page.waitForTimeout(400);
  await page.locator('button[data-direction="previous"]').first().click({ timeout: 5_000 });
  await page.waitForTimeout(400);

  const aug1CountNow = await page.locator('button[aria-label="1 August 2026"]').count();
  console.log(`Aug 1 count after next+previous: ${aug1CountNow}`);

  // Check visible headings
  const headings2 = await page.locator('[role="dialog"] button').filter({ hasNotText: /^\d+$/ }).all();
  for (const b of headings2) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const info = await b.evaluate((el: any) => ({
      text: el.textContent?.trim(), visible: el.offsetParent !== null
    }));
    if (info.text) console.log(' heading:', info);
  }

  // Click Aug 1 first time → sets check-out = Aug 1 (calendar opened in "pick checkout" mode)
  await page.locator('button[aria-label="1 August 2026"]:not([data-outside])').click({ timeout: 5_000 });
  console.log('Clicked Aug 1 (1st) ✓');
  await page.mouse.move(400, 400);
  await page.waitForTimeout(400);
  const headingAfter1a = await page.locator('[role="dialog"] h4').first().textContent().catch(() => '');
  console.log('Heading after Aug 1 1st click:', headingAfter1a);

  // Click Aug 1 second time → resets range, sets check-in = Aug 1 (now in "pick checkout" mode)
  await page.locator('button[aria-label="1 August 2026"]:not([data-outside])').click({ timeout: 5_000 });
  console.log('Clicked Aug 1 (2nd) ✓');
  await page.mouse.move(400, 400);
  await page.waitForTimeout(400);
  const headingAfter1b = await page.locator('[role="dialog"] h4').first().textContent().catch(() => '');
  console.log('Heading after Aug 1 2nd click:', headingAfter1b);

  // Click Aug 3 → sets check-out = Aug 3
  await page.locator('button[aria-label="3 August 2026"]:not([data-outside])').click({ timeout: 5_000 });
  console.log('Clicked Aug 3 ✓');
  await page.mouse.move(400, 400);
  await page.waitForTimeout(400);
  const headingAfter3 = await page.locator('[role="dialog"] h4').first().textContent().catch(() => '');
  console.log('Heading after Aug 3 click:', headingAfter3);

  const heading = await page.locator('[role="dialog"] h4').first().textContent().catch(() => '');
  console.log('Heading after selection:', heading);

  await page.getByRole('button', { name: 'Done' }).click();
  await page.waitForTimeout(500);
  const dialogsAfterDates = (await page.locator('[role="dialog"]').all()).length;
  console.log(`Dialogs after Done: ${dialogsAfterDates}`);

  // ── 3. GUESTS ────────────────────────────────────────────────────────────
  console.log('\n=== CLICK guests_trigger ===');
  await page.locator('[data-testid*="guests_trigger"]').first().click();
  await page.waitForTimeout(1000);

  const guestDialog = page.locator('[role="dialog"]').last();
  if (await guestDialog.isVisible()) {
    // Add 1 child
    await page.getByRole('button', { name: 'Add Child' }).click();
    await page.waitForTimeout(600);

    // Click child 1 age trigger (label "Child 1 Age" ~ sibling input)
    await page.locator('label[title="Child 1 Age"] ~ input[readonly]').click();
    await page.waitForTimeout(600);
    console.log('Dialogs after clicking age trigger:', (await page.locator('[role="dialog"]').all()).length);

    // Select age 8
    await page.getByRole('option', { name: '8', exact: true }).click();
    await page.waitForTimeout(600);
    console.log('Selected age 8 ✓');

    // Check if guests dialog auto-closed after age selection
    const dialogsAfterAge = (await page.locator('[role="dialog"]').all()).length;
    console.log('Dialogs after age selection:', dialogsAfterAge);

    // Check the trigger input values to see what the form currently shows
    const triggers = await page.locator('[data-testid*="_trigger"]').all();
    console.log('Trigger values after guests:');
    for (const t of triggers) {
      const testid = await t.getAttribute('data-testid');
      const val = await t.inputValue().catch(() => t.textContent());
      console.log(' -', testid, '=', val?.trim());
    }

    // Check for visible errors on page
    const errors = await page.locator('[role="alert"], .error, [data-error]').all();
    console.log('Visible errors:', errors.length);
    for (const e of errors) {
      const txt = await e.textContent();
      console.log(' - Error:', txt?.trim().substring(0, 200));
    }

    // Also check the guests trigger for any error indicator
    const guestTrigger = page.locator('[data-testid*="guests_trigger"]').first();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const guestTriggerHTML = await guestTrigger.evaluate((el: any) => el.parentElement?.outerHTML?.slice(0, 1000));
    console.log('Guest trigger parent HTML:', guestTriggerHTML);

    // Find all visible buttons on page (outside dialogs)
    const allBtns = await page.getByRole('button').all();
    console.log('All visible buttons on page:');
    for (const btn of allBtns) {
      const isVis = await btn.isVisible().catch(() => false);
      if (!isVis) continue;
      const txt = (await btn.textContent())?.trim();
      const aria = await btn.getAttribute('aria-label');
      const type = await btn.getAttribute('type');
      console.log(' -', JSON.stringify({ text: txt?.substring(0, 30), aria, type }));
    }

    // Click the search button to submit - try different locators
    const submitBtn = page.getByRole('button', { name: /search/i }).first();
    const submitText = await submitBtn.textContent();
    console.log('Submit button text:', submitText?.trim());
    await submitBtn.click();
    console.log('Clicked search ✓');
    await page.waitForTimeout(4000);
    console.log('URL 4s after search:', page.url());

    // Look for validation hint text related to age/child
    const hintTexts = await page.locator('p, [class*="hint"], [class*="error"]')
      .filter({ hasText: /age|child|provide|required/i }).allTextContents();
    console.log('Hint texts after search:', hintTexts.slice(0, 5));

    // Check the guests trigger value again (might have changed)
    const guestVal = await page.locator('[data-testid*="guests_trigger"]').first().inputValue();
    console.log('Guests trigger value after search click:', guestVal);
  }

  await browser.close();
})();
