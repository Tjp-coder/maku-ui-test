import { test, expect } from '@playwright/test';
import { AuthService } from '../services/auth.service';
import { config } from 'dotenv';

config({ path: '.env.local' });

test.describe('登录失败 - 错误提示验证', () => {
  test.setTimeout(90_000);

  test('用户名错误时，登录页显示错误提示', async ({ page }) => {
    const wrongUser = `wrong_${Date.now()}_qta`;
    const auth = new AuthService(page);

    await page.goto('http://8.138.30.161', { waitUntil: 'networkidle', timeout: 30_000 });
    await auth.login(wrongUser, 'admin');

    const msg = await auth.getErrorMessage();
    expect(msg).toBeTruthy();

    await auth.destroy();
  });

  test('密码错误时，登录页显示错误提示', async ({ page }) => {
    const auth = new AuthService(page);

    await page.goto('http://8.138.30.161', { waitUntil: 'networkidle', timeout: 30_000 });
    await auth.login('admin', 'wrongpwd_qta');

    const msg = await auth.getErrorMessage();
    expect(msg).toBeTruthy();

    await auth.destroy();
  });
});
