/**
 * 全链路验证脚本 - 步骤 3
 * 验证：Node + TS + Playwright + Midscene + 千问VL 五件套联通
 * 执行：npm run test:hello
 */

import { chromium } from 'playwright';
import { PlaywrightAgent } from '@midscene/web/playwright';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

config({ path: '.env.local' });

const TARGET_URL = 'http://8.138.30.161';
const SCREENSHOT_DIR = 'test-results';

async function main() {
  console.log('=== Maku UI Test - Hello World ===');
  console.log(`目标地址：${TARGET_URL}`);
  console.log(`模型名称：${process.env.MIDSCENE_MODEL_NAME ?? '未配置'}`);
  console.log(`API地址：${process.env.OPENAI_BASE_URL ?? '未配置'}`);

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_dashscope_api_key_here') {
    console.error('❌ 请先在 .env.local 中配置 OPENAI_API_KEY（填入 DashScope API Key）');
    process.exit(1);
  }

  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const agent = new PlaywrightAgent(page);

  try {
    console.log('\n[1/4] 打开 maku 首页...');
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30000 });
    console.log('✅ 页面加载成功');

    console.log('\n[2/4] 截图保存...');
    const screenshotPath = path.join(SCREENSHOT_DIR, 'hello-screenshot.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`✅ 截图已保存：${screenshotPath}`);

    console.log('\n[3/4] 调用 Midscene AI 理解页面...');
    const description = await agent.aiAsk('请描述当前页面上有哪些主要元素（用中文回答）');
    console.log('✅ Midscene AI 返回：', description);

    console.log('\n[4/4] 全链路验证完成！');
    console.log('----------------------------------');
    console.log('Node   :', process.version);
    console.log('浏览器 : Chromium (Playwright)');
    console.log('AI模型 :', process.env.MIDSCENE_MODEL_NAME);
    console.log('----------------------------------');
    console.log('🎉 五件套全部联通，可以继续步骤 4！');
  } catch (err) {
    console.error('\n❌ 验证失败：', err);
    const errorShot = path.join(SCREENSHOT_DIR, 'hello-error.png');
    await page.screenshot({ path: errorShot });
    console.log(`错误截图：${errorShot}`);
    process.exit(1);
  } finally {
    await agent.destroy();
    await browser.close();
  }
}

main();
