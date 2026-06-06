# Midscene API 参考

> 写代码时按需查阅。完整文档见 https://midscenejs.com

## 实例化

```typescript
import { PlaywrightAgent } from '@midscene/web/playwright';
const agent = new PlaywrightAgent(page);
```

## 操作类 API

|                     API                     | 用途     | 示例                                                         |
| :-----------------------------------------: | -------- | ------------------------------------------------------------ |
|               `aiTap(prompt)`               | 点击元素 | `await agent.aiTap('登录页底部的「登录」按钮');`             |
|         `aiInput(prompt, {value})`          | 输入文本 | `await agent.aiInput('登录表单的「用户名」输入框', { value: 'admin' });` |
|    `aiKeyboardPress(prompt, {keyName})`     | 按键     | `await agent.aiKeyboardPress('用户名输入框', { keyName: 'Enter' });` |
| `aiScroll(prompt, {direction, scrollType})` | 滚动     | `await agent.aiScroll('用户列表', { direction: 'down', scrollType: 'once' });` |
|              `aiHover(prompt)`              | 悬停     | `await agent.aiHover('用户「admin」所在行');`                |

## 等待类 API

```typescript
await agent.aiWaitFor('用户列表已加载完成', { timeoutMs: 10000 });
```

## 断言类 API

```typescript
await agent.aiAssert('页面已跳转到首页，左侧显示导航菜单');
```

## 数据提取类 API

| API                 | 返回类型 | 示例                                                         |
| ------------------- | -------- | ------------------------------------------------------------ |
| `aiBoolean(prompt)` | boolean  | `const exists = await agent.aiBoolean('列表中是否有用户「张三」');` |
| `aiString(prompt)`  | string   | `const title = await agent.aiString('页面标题');`            |
| `aiNumber(prompt)`  | number   | `const count = await agent.aiNumber('用户列表的总数');`      |
| `aiQuery(schema)`   | object   | 见下方示例                                                   |

``` typescript
const users = await agent.aiQuery({
  list: 'array of {name: string, role: string, status: string}'
});
```

## 复合操作（最后手段）

```typescript
await agent.aiAction('点击「新建」按钮，填写名称「test」，点击「确认」');
```

⚠️ **不要用 aiAction 做单步操作**，单步用 aiTap/aiInput。

## 定位描述四要素（核心规范）

[容器上下文] + [视觉位置] + [文案] + [元素类型]

| ❌ 不好     | ✅ 好                                     |
| ---------- | ---------------------------------------- |
| "登录按钮" | "登录表单底部的「登录」按钮"             |
| "用户名"   | "登录表单顶部的「用户名」输入框"         |
| "确定"     | "「新增用户」弹窗底部右侧的「确定」按钮" |

## 常见踩坑

1. **元素描述太模糊** → AI 找不到 → 加容器上下文
2. **页面没加载完就 aiTap** → 失败 → 前面加 `aiWaitFor`
3. **aiAction 拆得太复杂** → 不稳定 → 拆成多个 aiTap/aiInput
4. **跑得慢/烧 token** → 启用 Midscene 缓存（自动）

