import type { Page } from '@playwright/test';
import { UserPage } from '../pages/user.page';

export class UserService {
  private userPage: UserPage;

  constructor(page: Page) {
    this.userPage = new UserPage(page);
  }

  async createUser(username: string, name: string, phone: string): Promise<void> {
    await this.userPage.navigateToUserManagement();
    await this.userPage.openCreateUserDialog();
    await this.userPage.fillUsername(username);
    await this.userPage.fillName(name);
    await this.userPage.selectOrganization();
    await this.userPage.fillPhone(phone);
    await this.userPage.submitCreateUserDialog();
  }

  async searchUser(username: string): Promise<string[]> {
    await this.userPage.searchUser(username);
    return this.userPage.getUsernamesInList();
  }

  async destroy(): Promise<void> {
    await this.userPage.destroy();
  }
}
