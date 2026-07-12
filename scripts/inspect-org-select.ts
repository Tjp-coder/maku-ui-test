/**
 * 调试脚本：用原生 Playwright 点击"所属机构"树节点，验证应用本身能否选中（排除 AI 点击精度干扰）
 */
import { chromium } from 'playwright';
import { PlaywrightAgent } from '@midscene/web/playwright';
import { config } from 'dotenv';

config({ path: '.env.local' });
const TARGET_URL = 'http://8.138.30.161';

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const agent = new PlaywrightAgent(page);

  await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30000 });
  const captcha = await agent.aiQuery('登录表单右侧验证码图片上显示的字符是什么？只返回字符本身，不要解释');
  await agent.aiInput('登录表单里的「用户名」输入框', { value: 'admin' });
  await agent.aiInput('登录表单里的「密码」输入框', { value: 'admin' });
  await agent.aiInput('登录表单里的「验证码」输入框', { value: String(captcha) });
  await agent.aiTap('登录表单里的「登录」按钮');
  await page.waitForTimeout(2000);

  await page.goto(`${TARGET_URL}/#/sys/user/index`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);

  // 用原生 Playwright 打开新增弹窗
  await page.locator('form button:has-text("新增")').click();
  await page.waitForTimeout(1000);

  // 用原生 Playwright 点击"所属机构"下拉触发框
  const orgFormItem = page.locator('.el-form-item:has(label:text-is("所属机构"))');
  await orgFormItem.locator('.el-select').click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/inspect/6-org-native-open.png' });

  // 原生点击树节点（唯一叶子节点）
  const treeNode = page.locator('.el-tree-select__popper .el-tree-node__content');
  console.log('树节点数量:', await treeNode.count());
  const nodeText = await treeNode.first().textContent();
  console.log('树节点文字:', nodeText);
  await treeNode.first().click();
  await page.waitForTimeout(1000);

  const orgInputValue = await orgFormItem.locator('input').inputValue();
  console.log('原生点击后，所属机构输入框值:', JSON.stringify(orgInputValue));

  await page.screenshot({ path: 'test-results/inspect/7-org-native-after-click.png' });

  await agent.destroy();
  await browser.close();
}
main();
