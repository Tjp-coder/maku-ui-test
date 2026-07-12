import { test, expect } from '@playwright/test';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { config } from 'dotenv';

config({ path: '.env.local' });

test.setTimeout(120_000);

test('新建用户后出现在用户列表中', async ({ page }) => {
  const ts = Date.now();
  const newUsername = `user_${ts}_qta`;
  const newName = `测试用户${ts}`;
  const newPhone = `1${String(Math.floor(Math.random() * 9_000_000_000) + 1_000_000_000)}`;

  await page.goto('http://8.138.30.161', { waitUntil: 'networkidle', timeout: 30_000 });
  const auth = new AuthService(page);
  await auth.login('admin', 'admin');
  await auth.destroy();

  const userService = new UserService(page);
  await userService.createUser(newUsername, newName, newPhone);

  const usernames = await userService.searchUser(newUsername);
  expect(usernames).toContain(newUsername);

  await userService.destroy();
});
