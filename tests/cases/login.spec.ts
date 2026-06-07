import { test } from '@playwright/test';
import { PlaywrightAgent } from '@midscene/web/playwright';
import { AuthService } from '../services/auth.service';
import { config } from 'dotenv';

config({ path: '.env.local' });

test.setTimeout(90_000);

test('maku 登录', async ({ page }) => {
  await page.goto('http://8.138.30.161', { waitUntil: 'networkidle', timeout: 30_000 });

  const auth = new AuthService(page);
  await auth.login('admin', 'admin');

  const agent = new PlaywrightAgent(page);
  await agent.aiWaitFor('左侧出现导航菜单', { timeoutMs: 30_000 });
  await agent.aiAssert('页面左侧有导航菜单，说明已成功登录并进入首页');
  await agent.destroy();
});
