import type { Page } from '@playwright/test';

/**
 * BasePage
 *
 * Abstract base class for all Page Objects.
 * Provides the shared `page` reference and a thin `goto()` wrapper that
 * automatically waits for `domcontentloaded`.
 *
 * Every concrete page class extends this and composes the UI components
 * it owns.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /**
   * Navigate to a path relative to the `baseURL` set in playwright.config.ts.
   * Waits for `domcontentloaded` before returning.
   */
  protected async goto(path: string): Promise<void> {
    await this.page.goto(path);
    await this.page.waitForLoadState('domcontentloaded');
  }
}
