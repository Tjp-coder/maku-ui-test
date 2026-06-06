# Maku UI 自动化测试 - 工程蓝图

> 本文档是整个项目的"宪法"。每次新会话开头读一遍，保证上下文不丢。
> 创建日期：2026-06-05
> 维护人：唐建鹏

---

## 一、项目目标

**短期（沉淀目标）**：
1. 学懂 Harness 工程化理念，能讲、能写、能演示
2. 落地一个 AI 驱动 UI 自动化的可演示 demo
3. 产出简历项目第三项 + 专业技能 AI 相关条目

**长期（求职目标）**：
- 面试时能拿出 GitHub 项目 + 架构图 + 演示视频
- 能从"AI 概念"讲到"工程化落地"全链路

**非目标**（明确不做）：
- ❌ 不追求覆盖率（demo 级即可）
- ❌ 不追求生产可用（沉淀级即可）
- ❌ 不重构 maku 原项目（一行不删）

---

## 二、已定决策（不要再纠结）

| 项 | 决策 | 备注 |
|---|---|---|
| AI 框架 | Midscene | 字节开源，TS 生态，文章对齐 |
| 视觉模型 | 千问 VL（DashScope） | 便宜稳定，国内访问 |
| 定位策略 | 传统优先 + AI 兜底 | 节省 token |
| AI 驱动工具 | CC + sub-agent 模式 | 不用 Codex |
| 主会话模型 | Sonnet | 总控调度 |
| analyzer 模型 | Sonnet | 质量低下游全烂 |
| generator 模型 | Sonnet | 写代码稳定优先 |
| verifier 模型 | Haiku | 模式匹配够用 |
| 第一个测试模块 | 登录 + 用户管理 CRUD | 范围严格控小 |
| 项目仓库 | 独立仓库 `maku-ui-test` | 不塞到 maku-v3 |
| 本地环境 | Windows + VSCode + Node 18.20.8 | scoop 管理 Node |
| 代理 | http://127.0.0.1:10808 (v2ray) | 装包用 |
| 被测系统 | http://8.138.30.161 | admin/admin |
| 后端 | http://8.138.30.161:8080 | 用户自部署 |

---

## 三、整体路线图（4 阶段 7 步）

```
阶段 1：地基（半天）
  ├─ 步骤 1：5 个决策确认 ✅ 完成
  └─ 步骤 2：环境准备 + 项目初始化

阶段 2：跑通最小 demo（1 天）
  ├─ 步骤 3：hello world 验证全链路
  │           （打开 maku 首页 + 截图）
  └─ 步骤 4：完整登录测试（单文件、不分层、不 harness）

阶段 3：分层架构（2-3 天）
  └─ 步骤 5：重构成四层（component/page/service/case）

阶段 4：上 harness（3-5 天）
  ├─ 步骤 6：SKILL.md + 3 个 agent prompt
  └─ 步骤 7：用 harness 跑新需求（新增用户 CRUD）
```

**总耗时预估**：7-10 天（每天投入 4-6 小时）
**面试中断时**：暂停沉淀，优先面试

---

## 四、每步骤产出物清单

### 步骤 2 产出（环境就绪）
```
maku-ui-test/
├── package.json              ← Midscene + Playwright 依赖
├── tsconfig.json             ← TS 配置
├── playwright.config.ts      ← Playwright 配置
├── .env.local                ← 千问 VL API key（不入 git）
├── .gitignore
├── README.md                 ← 项目说明（雏形）
└── scripts/
    └── hello.ts              ← 验证脚本
```

### 步骤 3 产出（最小 demo）
- `scripts/hello.ts` 能跑通：打开 maku 首页 → 截图保存
- 验证：Node + TS + Playwright + Midscene + 千问 VL 五件套全链路通

### 步骤 4 产出（单文件登录测试）
- `tests/login.spec.ts`（一个文件，不分层）
- 能跑通：访问首页 → 输入账号密码 → 点登录 → 验证进入首页
- Midscene HTML 报告能打开看

### 步骤 5 产出（分层架构）
```
tests/
├── components/        # 通用 UI 控件（如 antd 表单）
├── pages/             # 单页面操作（login.page.ts）
├── services/          # 业务流程（auth.service.ts）
└── cases/             # 测试用例 + 断言（login.spec.ts）
```

### 步骤 6 产出（Harness 基础设施）
```
.claude/
├── skills/
│   └── ui-test-harness/
│       └── SKILL.md           ← 总控状态机
└── agents/
    ├── analyzer.md            ← 分析 Agent
    ├── generator.md           ← 实现 Agent
    └── verifier.md            ← 验证 Agent

artifacts/                     ← 产物契约
├── _analysis.md
└── _verification.md
```

### 步骤 7 产出（Harness 端到端跑通）
- 给 CC 一句话："帮我写个测试：新增一个用户，验证用户出现在列表里"
- CC 自动调度三个 agent，端到端完成
- 录屏 / gif 作为简历演示素材

---

## 五、关键风险 + 对策

| # | 风险 | 对策 |
|---|---|---|
| 1 | Midscene 视觉模型调用失败 | 步骤 3 单独验证，错了别往下走 |
| 2 | 千问 VL 定位不准 | 步骤 5 引入混合策略，稳定元素用 CSS |
| 3 | harness 第一版跑不通 | 接受第一版烂，跑一次再改 |
| 4 | TypeScript 不熟悉 | 边学边用，CC 帮你补，不专门学 |
| 5 | 求职面试被叫去 | 暂停沉淀，优先面试 |
| 6 | 完美主义阻碍动手 | 每步只验证一件事，跑通再下一步 |
| 7 | 代理 / 网络问题卡住 | npm 装包失败先确认代理 + 千问 VL 不走代理 |
| 8 | maku 服务器挂掉 | 服务器自己的，挂了重启 |

---

## 六、最终简历产出物（明确终点）

完成全部 7 步后，简历可以加：

### 项目经历（第三项）
```
maku-boot AI驱动UI自动化探索 | 个人技术沉淀  2026-06 ~ 至今

项目背景：基于 Midscene + 千问 VL 多模态模型，
探索 AI Agent 驱动的 UI 自动化测试工程化落地方案。

- 引入 Harness 设计模式，将单 Agent 拆分为 Analyzer/Generator/Verifier 
  三个职责分离的 Agent，通过状态机调度与 artifact 文件契约实现工作流
- 设计四层分层架构（Component/Page/Service/Case），落地代码合规
  静态审查机制，防止 AI 生成代码越权修改已有方法
- 实现错误分类驱动的修复模式（架构违规/定位违规/运行失败），
  非简单重试
- 已覆盖 maku-boot 登录、用户管理 CRUD 等核心场景

GitHub：github.com/Tjp-coder/maku-ui-test
```

### 专业技能加一段
```
- 了解 AI Agent 测试基本概念（Prompt / Skill / Tool Use / Harness 工程化模式）
- 熟悉 Midscene 等视觉理解类 UI 自动化框架，了解多模态大模型在 UI 定位中的应用
- 了解 MCP 协议、RAG 检索增强等 LLM 应用模式
```

---

## 七、新会话接续提示词

把这份 md 发到新会话时，用这段开头：

```
我是唐建鹏，正在沉淀 maku UI 自动化测试项目，
当前进展：[ 写一下做到第几步 ]
请你先读这份蓝图.md，再帮我推进下一步。
```

---

## 八、当前进度（动态更新）

> 完成一步就来更新这里

- [x] 步骤 1：决策确认
- [x] 步骤 2：环境准备 + 项目初始化
- [x] 步骤 3：hello world
- [ ] 步骤 4：单文件登录测试
- [ ] 步骤 5：分层重构
- [ ] 步骤 6：harness 基础设施
- [ ] 步骤 7：端到端跑通

---

## 九、参考资料

- 高飞 harness 文章：https://testerhome.com/articles/44066
- Midscene 官方：https://midscenejs.com
- 千问 VL DashScope：https://dashscope.console.aliyun.com
- maku-boot 项目：https://maku.net
- CC 官方文档：https://docs.claude.com/claude-code

---

**最后提醒**：这份蓝图是工具，不是教条。每完成一步发现需要调整，就回来改这份文档。但**不要在没动手前就反复修改蓝图**——那是拖延的伪装。
