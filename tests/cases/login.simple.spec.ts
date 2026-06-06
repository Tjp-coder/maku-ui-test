import { test } from '@playwright/test';
import { PlaywrightAgent } from '@midscene/web/playwright';
import { config } from 'dotenv';

config({ path: '.env.local' });

test.setTimeout(90_000);

test('maku 登录', async ({ page }) => {
  await page.goto('http://8.138.30.161', { waitUntil: 'networkidle', timeout: 30_000 });

  const agent = new PlaywrightAgent(page);

  await agent.aiInput('登录表单里的「用户名」输入框', { value: 'admin' });
  await agent.aiInput('登录表单里的「密码」输入框', { value: 'admin' });

  const captcha = await agent.aiQuery('登录表单右侧验证码图片上显示的字符是什么？只返回字符本身，不要解释');
  await agent.aiInput('登录表单里的「验证码」输入框', { value: String(captcha) });

  await agent.aiTap('登录表单里的「登录」按钮');

  await agent.aiWaitFor('左侧出现导航菜单', { timeoutMs: 30_000 });
  await agent.aiAssert('页面左侧有导航菜单，说明已成功登录并进入首页');

  await agent.destroy();
});
