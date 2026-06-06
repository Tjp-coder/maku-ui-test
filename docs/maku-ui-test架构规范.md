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