# maku-ui-test

基于 **Midscene + 千问 VL** 的 AI 驱动 UI 自动化测试框架。

## 技术栈

- 自动化框架：Playwright + TypeScript
- AI 视觉定位：Midscene（字节开源）
- 视觉模型：阿里云千问 VL（DashScope）
- AI 调度：Claude Code Harness 模式（Analyzer / Generator / Verifier）

## 快速开始

```bash
# 安装依赖
npm install

# 安装 Playwright 浏览器
npx playwright install chromium

# 配置 API Key（复制并填入真实 key）
cp .env.local .env.local
# 编辑 .env.local，填入 DASHSCOPE_API_KEY

# 验证全链路（Hello World）
npm run test:hello

# 跑测试
npm test
```

## 项目结构

```
maku-ui-test/
├── scripts/hello.ts          # 全链路验证脚本
├── tests/
│   ├── components/           # 通用 UI 控件封装
│   ├── pages/                # 单页面操作对象
│   ├── services/             # 业务流程
│   └── cases/                # 测试用例（*.spec.ts）
├── .claude/
│   ├── skills/               # CC Skill（Harness 状态机）
│   └── agents/               # Analyzer / Generator / Verifier
└── artifacts/                # Agent 产物契约文件
```

## 被测系统

- 前端：http://8.138.30.161
- 后端：http://8.138.30.161:8080
- 账号：admin / admin
