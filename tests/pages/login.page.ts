import type { Page } from '@playwright/test';
import { PlaywrightAgent } from '@midscene/web/playwright';

export class LoginPage {
  private agent: PlaywrightAgent;

  constructor(page: Page) {
    this.agent = new PlaywrightAgent(page);
  }

  async inputUsername(value: string): Promise<this> {
    await this.agent.aiInput('登录表单里的「用户名」输入框', { value });
    return this;
  }

  async inputPassword(value: string): Promise<this> {
    await this.agent.aiInput('登录表单里的「密码」输入框', { value });
    return this;
  }

  async readCaptcha(): Promise<string> {
    const result = await this.agent.aiQuery(
      '登录表单右侧验证码图片上显示的字符是什么？只返回字符本身，不要解释'
    );
    return String(result);
  }

  async inputCaptcha(value: string): Promise<this> {
    await this.agent.aiInput('登录表单里的「验证码」输入框', { value });
    return this;
  }

  async clickLoginButton(): Promise<this> {
    await this.agent.aiTap('登录表单里的「登录」按钮');
    return this;
  }

  async destroy(): Promise<void> {
    await this.agent.destroy();
  }
}
