/**
 * 调试脚本：复现"填用户名->填姓名"这两步真实流程，填完姓名后立刻检查
 * document.activeElement 是否真的落在姓名输入框上，以及输入框实际 DOM value 是什么。
 * 执行：npx tsx scripts/inspect-fillname.ts
 */

import { chromium } from 'playwright';
import { PlaywrightAgent } from '@midscene/web/playwright';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

config({ path: '.env.local' });

const TARGET_URL = 'http://8.138.30.161';
const OUT_DIR = 'test-results/inspect';

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const agent = new PlaywrightAgent(page);

  try {
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30000 });

    const captcha = await agent.aiQuery('登录表单右侧验证码图片上显示的字符是什么？只返回字符本身，不要解释');
    await agent.aiInput('登录表单里的「用户名」输入框', { value: 'admin' });
    await agent.aiInput('登录表单里的「密码」输入框', { value: 'admin' });
    await agent.aiInput('登录表单里的「验证码」输入框', { value: String(captcha) });
    await agent.aiTap('登录表单里的「登录」按钮');
    await page.waitForTimeout(2000);

    await page.goto(`${TARGET_URL}/#/sys/user/index`, { waitUntil: 'networkidle', timeout: 30000 });
    await agent.aiWaitFor('页面主内容区域的用户列表表格已显示数据行', { timeoutMs: 15000 });

    await agent.aiTap('用户管理页面内容区顶部工具栏左侧的「新增」按钮');

    const ts = Date.now();
    const username = `user_${ts}_qta`;
    const name = `测试用户${ts}`;

    await agent.aiInput('新增用户弹窗表单中「用户名」标签右侧的输入框', { value: username });

    // 填用户名之后，立刻看一眼当前 DOM 状态（对照组）
    const afterUsername = await page.evaluate(() => {
      const active = document.activeElement;
      return {
        activeTag: active?.tagName,
        activeValue: (active as HTMLInputElement)?.value,
      };
    });
    console.log('填完用户名后:', afterUsername);

    await agent.aiInput('新增用户弹窗表单中「姓名」标签右侧的输入框', { value: name });

    // 填姓名之后，立刻检查 activeElement 和「姓名」输入框的真实 value
    const afterName = await page.evaluate(() => {
      const active = document.activeElement;
      const formItems = Array.from(document.querySelectorAll('.el-form-item'));
      const nameItem = formItems.find((el) => el.querySelector('label')?.textContent?.includes('姓名'));
      const nameInput = nameItem?.querySelector('input') as HTMLInputElement | null;
      return {
        activeTag: active?.tagName,
        activeClass: active?.className,
        activeValue: (active as HTMLInputElement)?.value,
        activePlaceholder: (active as HTMLInputElement)?.placeholder,
        nameInputValue: nameInput?.value,
        nameInputPlaceholder: nameInput?.placeholder,
      };
    });
    console.log('填完姓名后:', afterName);
    console.log('期望姓名值:', name);

    fs.writeFileSync(
      path.join(OUT_DIR, 'fillname-check.json'),
      JSON.stringify({ username, name, afterUsername, afterName }, null, 2),
    );

    await page.screenshot({ path: path.join(OUT_DIR, 'fillname-after.png') });
    console.log('✅ 调试信息已导出到 test-results/inspect/fillname-check.json');
  } catch (err) {
    console.error('❌ 出错：', err);
    await page.screenshot({ path: path.join(OUT_DIR, 'error-fillname.png') });
  } finally {
    await agent.destroy();
    await browser.close();
  }
}

main();