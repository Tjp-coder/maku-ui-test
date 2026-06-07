import type { Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

export class AuthService {
  private loginPage: LoginPage;

  constructor(page: Page) {
    this.loginPage = new LoginPage(page);
  }

  async login(username: string, password: string): Promise<void> {
    const captcha = await this.loginPage.readCaptcha();
    await this.loginPage
      .inputUsername(username)
      .then(p => p.inputPassword(password))
      .then(p => p.inputCaptcha(captcha))
      .then(p => p.clickLoginButton());
  }

  async getErrorMessage(): Promise<string> {
    return this.loginPage.getErrorMessage();
  }

  async destroy(): Promise<void> {
    await this.loginPage.destroy();
  }
}
