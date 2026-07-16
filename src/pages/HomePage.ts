import type { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { NavBar } from '../components/NavBar';

/**
 * HomePage — https://<host>/
 *
 * Entry point of the application. Owns the NavBar component used to switch
 * between booking categories.
 */
export class HomePage extends BasePage {
  readonly navBar: NavBar;

  constructor(page: Page) {
    super(page);
    this.navBar = new NavBar(page);
  }

  async goto(): Promise<void> {
    await super.goto('/');
  }
}
