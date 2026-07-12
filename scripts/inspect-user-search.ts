/**
 * 调试脚本：验证用户列表页"查询"按钮是否真正过滤了数据
 * 执行：npx tsx scripts/inspect-user-search.ts
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

  page.on('request', req => {
    if (req.url().includes('/user') && req.method() === 'GET') {
      console.log('[REQUEST]', req.method(), req.url());
    }
  });

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

    // 导出搜索栏 HTML
    const searchBarHtml = await page.evaluate(() => {
      const form = document.querySelector('.el-form.el-form--inline') || document.querySelector('form');
      return form ? form.outerHTML : 'not found';
    });
    fs.writeFileSync(path.join(OUT_DIR, 'search-bar.html'), searchBarHtml);

    await page.screenshot({ path: path.join(OUT_DIR, '3-before-search.png') });

    // 用一个几乎肯定不存在的用户名去搜索，看看列表会不会变化
    const bogusName = 'zzz_definitely_not_exist_qta';
    await agent.aiInput('用户列表上方搜索栏中「用户名」标签右侧的输入框', { value: bogusName });
    await page.keyboard.press('Tab'); // 修复验证：先失焦让工具栏位移稳定，再点查询
    await page.waitForTimeout(300);
    await agent.aiTap('用户列表上方搜索栏右侧的「查询」按钮');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(OUT_DIR, '4-after-search-bogus.png') });

    const rowsAfterBogusSearch = await page.evaluate(() => {
      const rows = document.querySelectorAll('.el-table__row');
      return Array.from(rows).map(r => r.textContent?.trim().slice(0, 50));
    });
    fs.writeFileSync(path.join(OUT_DIR, 'rows-after-bogus-search.json'), JSON.stringify(rowsAfterBogusSearch, null, 2));
    console.log('搜索不存在的用户名后，表格行数：', rowsAfterBogusSearch.length);
    console.log('内容：', rowsAfterBogusSearch);

    // 检查输入框的实际 value 有没有真的写进去
    const inputValue = await page.evaluate(() => {
      const inputs = document.querySelectorAll('.el-form.el-form--inline input, form input');
      return Array.from(inputs).map(i => ({ placeholder: (i as HTMLInputElement).placeholder, value: (i as HTMLInputElement).value }));
    });
    fs.writeFileSync(path.join(OUT_DIR, 'search-input-values.json'), JSON.stringify(inputValue, null, 2));
    console.log('搜索栏输入框实际值：', inputValue);

    console.log('✅ 调试信息已导出到 test-results/inspect/');
  } catch (err) {
    console.error('❌ 出错：', err);
    await page.screenshot({ path: path.join(OUT_DIR, 'error-search.png') });
  } finally {
    await agent.destroy();
    await browser.close();
  }
}

main();