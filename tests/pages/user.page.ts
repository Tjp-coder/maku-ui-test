import type { Page } from '@playwright/test';
import { PlaywrightAgent } from '@midscene/web/playwright';

export class UserPage {
  private page: Page;
  private agent: PlaywrightAgent;

  constructor(page: Page) {
    this.page = page;
    this.agent = new PlaywrightAgent(page);
  }

  async navigateToUserManagement(): Promise<void> {
    // page.goto 直接导航，不走菜单点击
    await this.page.goto('http://8.138.30.161/#/sys/user/index', { waitUntil: 'networkidle', timeout: 30_000 });
    await this.agent.aiWaitFor('页面主内容区域的用户列表表格已显示数据行', { timeoutMs: 15_000 });
  }

  async openCreateUserDialog(): Promise<void> {
    await this.agent.aiTap('用户管理页面内容区顶部工具栏左侧的「新增」按钮');
  }

  // 用户名/姓名同名标签在搜索栏里也存在，限定在弹窗范围内查找，避免定位歧义
  private createDialogLocator() {
    return this.page.locator('.el-dialog:has(.el-dialog__title:text-is("新增"))');
  }

  async fillUsername(value: string): Promise<void> {
    await this.createDialogLocator().locator('.el-form-item:has(label:text-is("用户名")) input').fill(value);
  }

  async fillName(value: string): Promise<void> {
    await this.createDialogLocator().locator('.el-form-item:has(label:text-is("姓名")) input').fill(value);
  }

  async selectOrganization(): Promise<void> {
    // 树形下拉紧贴触发框、可点区域极小且被 teleport 到 body 上，AI 视觉点击在此场景下反复不稳定
    // （重试多次仍点不中），已用原生 Playwright 定位验证应用本身选中逻辑正常，故此处改用传统定位
    await this.page.locator('.el-form-item:has(label:text-is("所属机构")) .el-select').click();
    await this.page.locator('.el-tree-select__popper .el-tree-node__content').first().click();
    await this.agent.aiWaitFor('所属机构下拉列表已完全收起，「所属机构」输入框中已显示选中的机构名称', {
      timeoutMs: 5_000,
    });
  }

  async fillPhone(value: string): Promise<void> {
    await this.createDialogLocator().locator('.el-form-item:has(label:text-is("手机号")) input').fill(value);
  }

  async submitCreateUserDialog(): Promise<void> {
    await this.agent.aiScroll('新增用户弹窗内的表单区域', { direction: 'down', scrollType: 'untilBottom' });
    await this.agent.aiTap('新增用户弹窗底部操作区右侧的「确定」按钮');
    await this.agent.aiWaitFor('新增用户弹窗已关闭，页面回到用户列表', { timeoutMs: 15_000 });
  }

  async searchUser(username: string): Promise<void> {
    await this.agent.aiInput('用户列表上方搜索栏中「用户名」标签右侧的输入框', { value: username });
    await this.page.keyboard.press('Tab');
    // 「查询」和「新增」按钮紧挨在一起，纯文案定位容易被 AI 认错到旁边的「新增」按钮上，
    // 补充颜色 + 相对位置作为区分特征
    await this.agent.aiTap('用户列表上方工具栏中灰白色的「查询」按钮，它紧挨在蓝色「新增」按钮左边');
    await this.agent.aiWaitFor('用户列表已重新加载显示搜索结果，且「新增用户」弹窗没有被打开', {
      timeoutMs: 15_000,
    });
  }

  async getUsernamesInList(): Promise<string[]> {
    const result = await this.agent.aiQuery({
      usernames: 'array of string, 用户列表表格中所有行的用户名列单元格内容',
    });
    return (result as { usernames: string[] }).usernames ?? [];
  }

  async destroy(): Promise<void> {
    await this.agent.destroy();
  }
}
