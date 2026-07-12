##  maku-ui-test 的规范文件

### 目录结构

```
maku-ui-test/
├── tests/
│   ├── components/   # antd 控件
│   ├── pages/        # login.page.ts
│   ├── services/     # auth.service.ts
│   └── cases/        # login.spec.ts
├── .claude/          # 步骤 6 加
└── artifacts/        # 步骤 6 加
```

### 5.2 命名规范（写到 README）

- 文件名：`xxx.page.ts` / `xxx.service.ts` / `xxx.component.ts` / `xxx.spec.ts`
- 类名：`XxxPage` / `XxxService` / `XxxComponent`
- 测试数据：随机后缀（如 `user_${timestamp}_qta`）

### 5.3 写代码时的 5 条死规矩

1. case 里不出现 `aiTap` / `page.locator`，只调 service
2. service 里不出现 `aiTap` / `page.locator`，只调 page
3. page 里的元素描述带容器上下文（"登录页底部的『登录』按钮"）
4. 所有跨页面跳转的方法 return 下一个 page 对象
5. 测试数据名带 `_qta` 后缀 + 时间戳

### 5.4 状态/文案管理（TS 写法）

```typescript
// constants/maku.enum.ts
export enum UserStatus {
  ACTIVE = "正常",
  DISABLED = "禁用",
  PENDING = "待审"
}

// 用法
expect(status).toBe(UserStatus.ACTIVE);
// 而不是 expect(status).toBe("正常");
```

### 8 条铁律（直接抄到 maku-ui-test 的规范文件）

| #    | 铁律                                                | 现代翻译                                  |
| ---- | --------------------------------------------------- | ----------------------------------------- |
| 1    | 一个 page 类只负责自己页面的逻辑                    | 别在 LoginPage 里写 UserPage 的事         |
| 2    | 多页面共用的功能做成接口/组件                       | 导航栏、面包屑这种                        |
| 3    | page 类名以 `Page` 结尾，共用逻辑不能用 `Page` 结尾 | 命名规范                                  |
| 4    | 业务逻辑参数用 JavaBean / 类型对象，不用基本类型    | TS 里用 interface / type，不要一堆 string |
| 5    | 状态码、产品文案、内置类型全部用枚举                | TS 里用 enum                              |
| 6    | 所有页面跳转方法 return 下一个页面对象              | 实现 workflow 式链式调用                  |
| 7    | case 里不出现页面元素信息                           | 元素信息只在 page/component 层            |
| 8    | case 里所有创建的实体（用户名/数据名）必须随机命名  | 避免重复运行冲突                          |

### 2.1 四层架构（在 PO 上加了组件层）

```
用例层 (case)
   ↓ 只调
业务逻辑层 (service)
   ↓ 只调
页面层 (page)
   ↓ 只调
组件层 (component)
```

### 2.2 每层做什么

| 层            | 做什么                | 不能做什么                          |
| ------------- | --------------------- | ----------------------------------- |
| **case**      | 调 service，写 expect | 不能直接 new Page，不能直接定位元素 |
| **service**   | 编排多页面业务流程    | 不能直接操作 DOM                    |
| **page**      | 单页面元素操作        | 不能跨页面，不能写 expect           |
| **component** | 通用 UI 控件原子操作  | 不能依赖 page/service               |

### 2.3 组件层的核心价值（这是 2021 文章最大的贡献）

**真实案例**：前端把 `<button>确定</button>` 改成 `<button><span>确定</span></button>`，传统 PO 模式下**所有 button 定位全挂**。

**解决方案**：抽出组件层，所有 button 的定位逻辑只在一个文件。**前端组件变化时只改一处**。

```typescript
// component/button.component.ts
export class ButtonComponent {
  static byText(text: string) {
    // 集中处理"按钮文字怎么定位"的逻辑
    // 前端改了组件库，只改这里
  }
}
```

### 2.4 定位策略选型原则（AI 定位 vs 传统定位）

**默认规则**：点击、输入、导航类操作，默认用原生 Playwright 定位（`page.locator(...).click()/.fill()`），
不用 AI 视觉定位（`aiTap`/`aiInput`）。原生定位更快（不用等模型往返）、结果确定（成不成功由 DOM 状态决定，
不依赖视觉推理），Midscene 的 `status: finished` 只代表"AI 认为执行完了"，不代表值真的写进了 DOM 或点中了目标元素。

**三种例外，只有以下场景才用 AI 定位：**

1. **目标内容只有运行时才能确定** —— 比如"点击刚读到的那个机构名选项"，点什么取决于 `aiQuery`/`aiString`
   读到的动态文字，DOM 选择器天然做不到。
2. **视觉/语义状态校验，不是点击** —— `aiAssert`/`aiBoolean`/`aiQuery` 用于"判断页面是否符合预期"，
   这是校验而非操作，天然适合 AI。
3. **没有可读 DOM 可用** —— 验证码图片、canvas 绘制内容、不可控的第三方页面，没有结构化信息可以定位。

**反例（本项目踩过的坑，详见 [failure_cases/locator-pitfalls.md](failure_cases/locator-pitfalls.md)）：**

- 紧凑弹层里的选项点击（所属机构树形下拉）—— 可点区域太小，AI 视觉误差容忍空间不够，重试也解决不了。
- 连续两个 AI 动作背靠背执行（填完用户名紧接着填姓名 / 输入后紧接着点查询）—— 前一动作可能引发页面
  轻微变化（失焦位移、校验提示），第二个动作的坐标判断可能命中过渡态而不是稳定态。

**决策速查：**

| 场景 | 用什么 |
|---|---|
| 纯文本输入框，标签唯一、结构稳定 | 原生定位 |
| 按钮点击，DOM 结构稳定 | 原生定位 |
| 点击内容取决于运行时读到的文字 | AI 定位（先 aiQuery/aiString 读，再 aiTap） |
| 判断页面状态/内容是否符合预期 | AI 定位（aiAssert/aiBoolean/aiQuery） |
| 验证码图片、canvas | AI 定位（无 DOM 可读） |
| 展开态浮层、可点区域紧凑 | 优先原生；坚持用 AI 要先验证重试能否达到可接受成功率 |