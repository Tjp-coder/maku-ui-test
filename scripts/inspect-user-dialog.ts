/**
 * 调试脚本：打开新增用户弹窗，截图 + 导出 DOM，供人工分析下拉框遮挡问题
 * 执行：npx tsx scripts/inspect-user-dialog.ts
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

    // 登录
    const captcha = await agent.aiQuery('登录表单右侧验证码图片上显示的字符是什么？只返回字符本身，不要解释');
    await agent.aiInput('登录表单里的「用户名」输入框', { value: 'admin' });
    await agent.aiInput('登录表单里的「密码」输入框', { value: 'admin' });
    await agent.aiInput('登录表单里的「验证码」输入框', { value: String(captcha) });
    await agent.aiTap('登录表单里的「登录」按钮');
    await page.waitForTimeout(2000);

    // 导航到用户管理
    await page.goto(`${TARGET_URL}/#/sys/user/index`, { waitUntil: 'networkidle', timeout: 30000 });
    await agent.aiWaitFor('页面主内容区域的用户列表表格已显示数据行', { timeoutMs: 15000 });

    // 打开新增弹窗
    await agent.aiTap('用户管理页面内容区顶部工具栏左侧的「新增」按钮');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUT_DIR, '1-dialog-opened.png') });

    // 导出弹窗 HTML（尝试常见的 ant-design modal / el-dialog 选择器）
    const dialogHtml = await page.evaluate(() => {
      const selectors = ['.ant-modal', '.el-dialog', '[role="dialog"]', '.ant-drawer'];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) return { selector: sel, html: el.outerHTML };
      }
      return { selector: 'none', html: document.body.outerHTML };
    });
    fs.writeFileSync(path.join(OUT_DIR, 'dialog.html'), `<!-- selector: ${dialogHtml.selector} -->\n${dialogHtml.html}`);
    console.log('弹窗选择器：', dialogHtml.selector);

    // 点击所属机构下拉
    await agent.aiTap('新增用户弹窗表单中「所属机构」标签右侧的下拉选择框');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUT_DIR, '2-org-dropdown-opened.png') });

    // 导出下拉面板 HTML（同时看看 body 上挂载的浮层）
    const dropdownHtml = await page.evaluate(() => {
      const selectors = [
        '.ant-select-dropdown',
        '.ant-tree-select-dropdown',
        '.el-select-dropdown',
        '.el-popper',
        '[class*="dropdown"]',
      ];
      const found: Record<string, string> = {};
      for (const sel of selectors) {
        document.querySelectorAll(sel).forEach((el, i) => {
          found[`${sel}[${i}]`] = el.outerHTML;
        });
      }
      return found;
    });
    fs.writeFileSync(path.join(OUT_DIR, 'dropdown.html'), JSON.stringify(dropdownHtml, null, 2));

    // 拿到第一个选项的坐标信息（不点击，先看看有没有被遮挡）
    const firstOptionInfo = await page.evaluate(() => {
      const selectors = [
        '.ant-select-dropdown .ant-select-item',
        '.ant-tree-select-dropdown .ant-select-tree-treenode',
        '.el-select-dropdown__item',
        '.el-tree-node',
      ];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) {
          const rect = el.getBoundingClientRect();
          return { selector: sel, text: el.textContent, rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height } };
        }
      }
      return null;
    });
    fs.writeFileSync(path.join(OUT_DIR, 'first-option-info.json'), JSON.stringify(firstOptionInfo, null, 2));
    console.log('第一个选项信息：', firstOptionInfo);

    console.log('✅ 调试信息已导出到 test-results/inspect/');
  } catch (err) {
    console.error('❌ 出错：', err);
    await page.screenshot({ path: path.join(OUT_DIR, 'error.png') });
  } finally {
    await agent.destroy();
    await browser.close();
  }
}

main();
