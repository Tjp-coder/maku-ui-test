# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

AI 驱动的 UI 自动化测试框架，基于 Midscene（字节开源）+ 千问 VL 多模态模型，对 maku-boot 后台管理系统进行自动化测试。详细背景见 [docs/maku-ui-test-蓝图.md](docs/maku-ui-test-蓝图.md)。

- **被测系统**：http://8.138.30.161（admin/admin）
- **Node 版本**：18.20.8（scoop 管理，不要升级）
- **模型**：千问 VL，通过 DashScope OpenAI 兼容接口调用

## **当前阶段**

步骤 3 已完成（hello world 跑通）。当前推进：步骤 4（单文件登录测试）。
完整进度与路线图见[docs/maku-ui-test-蓝图.md](docs/maku-ui-test-蓝图.md)。

## 重要文档（按需阅读）

- 项目蓝图：[docs/maku-ui-test-蓝图.md](docs/maku-ui-test-蓝图.md)
- 架构规范（写代码前必读）：[docs/maku-ui-test架构规范.md](docs/maku-ui-test架构规范.md)
- Midscene API 参考：[docs/midscene-api参考.md](docs/midscene-api参考.md)
- 业务最佳实践：docs/最佳实践/

## Harness 调度规则
当用户说"写测试/写用例/生成 case"等关键词时，
启动 .claude/skills/ui-test-harness/SKILL.md 工作流。
该工作流会依次调度：
- .claude/agents/analyzer.md
- .claude/agents/generator.md
- .claude/agents/verifier.md

## 强制规则
1. 严格遵守四层架构调用规则（见下方"架构"节）
2. 测试数据用 `_qta` 后缀 + 时间戳，避免重复运行冲突
3. AI 定位描述必须含四要素（容器/位置/文案/类型）
4. 状态/文案用枚举，禁止字符串字面量

## 常用命令

```bash
npm run test:hello       # 验证全链路（步骤 3）
npm test                 # 运行所有 Playwright 测试
npx playwright test tests/cases/login.spec.ts  # 运行单个测试文件
npm run report           # 打开 Playwright HTML 报告
```

装包时需要代理：
```bash
$env:HTTP_PROXY="http://127.0.0.1:10808"; $env:HTTPS_PROXY="http://127.0.0.1:10808"; npm install
```
千问 VL 的 API 调用**不走代理**（DashScope 是国内服务）。

## 环境配置

模型配置在 `.env.local`（不入 git）。必须使用 `MIDSCENE_MODEL_*` 前缀格式，`OPENAI_*` 旧格式不支持 `modelFamily`：

```
MIDSCENE_MODEL_NAME=qwen2.5-vl-7b-instruct   # 或 72b-instruct
MIDSCENE_MODEL_FAMILY=qwen2.5-vl              # 必填，告诉 Midscene 用哪个坐标解析器
MIDSCENE_MODEL_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
MIDSCENE_MODEL_API_KEY=<DashScope API Key>
```

## 架构（详见 docs/架构规范.md）

当前处于步骤 2-3，目标架构为四层：

```
tests/
├── components/    # 通用 UI 控件原子操作（不依赖 page/service）
├── pages/         # 单页面操作，文件名 xxx.page.ts，类名 XxxPage
├── services/      # 多页面业务流程编排，文件名 xxx.service.ts
└── cases/         # 测试用例 + expect 断言，文件名 xxx.spec.ts
```

**分层调用规则（铁律，不得违反）：**
- `case` → 只调 `service`，不得直接 new Page 或定位元素
- `service` → 只调 `page`，不得直接操作 DOM
- `page` → 只调 `component`，不得跨页面，不得写 expect
- `component` → 不依赖 page/service

## Midscene API 用法

```typescript
import { PlaywrightAgent } from '@midscene/web/playwright';

const agent = new PlaywrightAgent(page);

// 操作类
await agent.aiTap('登录表单里的「登录」按钮');
await agent.aiInput('登录表单的「用户名」输入框', { value: 'admin' });
await agent.aiKeyboardPress('用户名输入框', { keyName: 'Tab' });

// 等待类
await agent.aiWaitFor('用户列表已加载完成', { timeoutMs: 10000 });

// 断言类
await agent.aiAssert('页面已跳转到首页');

// 提取数据类（按返回类型选）
const title = await agent.aiString('当前页面的标题文字');
const exists = await agent.aiBoolean('用户列表中是否存在用户「admin」');
const count = await agent.aiNumber('用户列表中共有多少条记录');
const data = await agent.aiQuery({ users: 'array of {name: string, status: string}' });
```

**重要**：page 层元素描述要带容器上下文，例如："登录表单里的『用户名』输入框"，而不是"用户名输入框"。

## Midscene 报告

运行后报告生成在 `midscene_run/report/`，直接用浏览器打开 HTML 文件可查看 AI 调用详情和截图。
