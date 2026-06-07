# TypeScript + Playwright 框架知识点

> 面向有 Python + Playwright 基础的同学，只记"和 Python 不一样的地方"。
> 按用到时追加，不求全面。

---

## 一、类型与语法基础

### 1.1 变量声明

```typescript
// Python: x = 1
const x = 1;       // 不可重新赋值（优先用这个）
let y = 1;         // 可重新赋值
// 没有 var，不用管它
```

### 1.2 类型注解（可选，但推荐写）

```typescript
// Python: def login(username: str, password: str) -> None:
async function login(username: string, password: string): Promise<void> {}

// 参数类型写在冒号后面，返回类型写在括号后面
// Promise<void> 相当于 Python 的 Coroutine[None]（异步函数的返回类型）
```

### 1.3 接口和类型（替代 Python dataclass）

```typescript
// Python: @dataclass / TypedDict
interface UserInfo {
  name: string;
  role: string;
  status: string;
}

// 或者用 type（两者大部分场景等价，interface 更常见于类相关场景）
type UserInfo = { name: string; role: string; status: string };
```

### 1.4 枚举（替代 Python Enum）

```typescript
// Python: class UserStatus(Enum): ACTIVE = "正常"
export enum UserStatus {
  ACTIVE = '正常',
  DISABLED = '禁用',
}

// 用法
expect(status).toBe(UserStatus.ACTIVE);  // 不要直接写 '正常'
```

### 1.5 解构赋值 

这是从对象或数组中快速提取数据的语法，在导入库和处理 API 响应时极常用。

```typescript
// 从 Playwright 导入特定功能
import { test, expect } from '@playwright/test';

// 从 API 响应中提取数据
const response = { code: 200, data: { token: "abc" }, msg: "OK" };
const { code, data: { token } } = response; 
console.log(token); // "abc"
```

### 1.6 空值合并运算符 (`??`) 和 可选链 (`?.`)

处理 UI 元素时，经常遇到“元素可能不存在”的情况，这两个符号是救星。

- **?. (可选链)**：如果左边是 `null` 或 `undefined`，直接返回 `undefined`，不再往后执行，防止报错。

```typescript
const text = await page.locator('#title')?.textContent(); 
// 如果 locator 没找到，不会报错，text 变为 undefined
```

- **?? (空值合并)**：如果左边是 `null` 或 `undefined`，则使用右边的默认值。

```typescript
const timeout = config.timeout ?? 5000; 
// 如果 config.timeout 没配，就用 5000
```

### 1.7 `this` 的陷阱

在 Python 或 Java 中，`this`（或 `self`）永远指向**当前类的实例**。但在 JS 中，`this` 是一个**“动态变量”**，它的值取决于**函数被调用的那一刻，是谁“叫”了它**。

**Python/Java (词法作用域)**：

```python
class Test:
    def run(self):
        print(self) # self 永远是 Test 的实例，不管你在哪调用它
```

**JavaScript (动态作用域)**：

```javascript
const obj = {
  name: "Qwen",
  greet: function() {
    console.log(this.name); 
  }
};

obj.greet(); // ✅ 输出 "Qwen" (因为是通过 obj 调用的)

const func = obj.greet;
func();      // ❌ 输出 undefined (因为是直接调用 func，this 变成了全局对象或 undefined)
```

### 1.8 箭头函数 `() => {}` 

箭头函数理解可以类比为java的匿名内部类。

js中的this需要使用箭头函数绑定类，否则就会发生this为空值，取不到值的情况。

箭头函数之所以强大，是因为它**没有自己的 this**。它会像“照相机”一样，**捕获**它定义时所在环境的 `this` 值。

```typescript
class LoginPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async login() {
    // ✅ 完美解决
    this.page.waitForTimeout(1000).then(() => {
      // 这里的 this 自动继承了外层 login() 方法里的 this
      // 也就是 LoginPage 的实例
      console.log(this.page); // 正常工作！
      this.page.fill('#user', 'admin'); 
    });
  }
}
```

**原理**：

1. 箭头函数定义在 `login()` 方法内部。
2. `login()` 是被 `LoginPage` 实例调用的，所以 `login()` 里的 `this` 是实例。
3. 箭头函数“记住”了这个 `this`。
4. 无论 `.then()` 怎么调用这个箭头函数，它内部的 `this` 永远指向那个实例。

### 1.9 原型链

JS 本质上是一门**基于原型（Prototype-based）**的语言，它没有真正的“类”。`class` 只是 ES6 引入的一种写法，让你写起来像 Java/Python，但浏览器底层运行的依然是原型逻辑。

在 Python 中，对象是从“类”实例化出来的。
在 JS 中，对象是从“另一个对象”克隆/链接出来的。这个被链接的对象就是 **原型（Prototype）**。

#### 1. 核心规则：查找机制

当你访问一个对象的属性（比如 `obj.name`）时，JS 引擎会按以下顺序寻找：

1. **自己身上找**：`obj` 自己有没有 `name`？
2. **原型上找**：如果没有，去 `obj.__proto__` 指向的对象里找。
3. **原型的原型上找**：如果还没有，继续往上找，直到找到尽头（`null`）。

这条由 `__proto__` 串联起来的链条，就是 **原型链**。

```javascript
// 1. 创建一个基础对象（相当于父类）
const animal = {
  speak: function() { console.log("I can speak"); }
};

// 2. 创建一个新对象，把 animal 设为它的原型
const dog = Object.create(animal);
dog.bark = function() { console.log("Woof!"); };

// 3. 调用
dog.bark();   // ✅ 自己身上有，直接输出
dog.speak();  // ✅ 自己身上没有，顺着原型链去 animal 里找，输出
```

相当于java定义了一个父类，创建实例时创建了一个继承父类的子类实例对象。

#### 2.什么是 Class？（给原型链穿的“西装”）

因为原型链写起来太丑、太难懂，ES6 引入了 `class`。它让代码看起来和 Python/Java 一模一样，但**底层做的事情完全没变**。

#### 对比一下：

**写法 A：原始原型链写法（老派 JS）**

```javascript
function Dog(name) {
  this.name = name;
}
// 手动往原型上加方法
Dog.prototype.bark = function() {
  console.log(this.name + " says Woof!");
};
```

**写法 B：Class 写法（现代 JS/TS）**

```javascript
class Dog {
  constructor(name) {
    this.name = name;
  }
  // 这个方法自动加到 Dog.prototype 上
  bark() {
    console.log(this.name + " says Woof!");
  }
}
```

**结论**：这两种写法在浏览器里跑起来的效果是**完全一样**的。`class` 只是为了让你少写 `prototype`，代码更整洁。

---

## 二、异步（最重要的差异）

Python 转 JS UI 自动化，**最大的思维转变**就是：

1. **忘掉“自动等待”**：在 Python Selenium 里，你不用管元素什么时候出来，库会帮你等。在 JS Playwright 里，虽然它也有自动重试，但你必须通过 `await` 告诉代码：“我要这个操作的结果”。
2. **信任 await**：不要觉得它麻烦。把它当成一个**“安全锁”**。只要加了 `await`，你就保证了上一行代码彻底完成后，才会执行下一行。这在复杂的 UI 交互中（比如点击按钮后弹出一个模态框，再输入文字）是保证测试稳定性的关键。

**在 JS 中，你不需要手动创建“事件循环”或“调度器”，JS 引擎（V8）和 Node.js 已经帮你把这些底层细节全封装好了。**

- **Python**：你得自己写 `asyncio.run()` 来启动协程。
- **JS**：你只需要在函数前加 `async`，在调用前加 `await`。剩下的“挂起”、“恢复”、“调度”，JS 引擎会在后台自动完成。

### 2.1 Python vs TypeScript 对比

```python
# Python
import asyncio

async def main():
    result = await some_coroutine()
```

```typescript
// TypeScript —— 几乎一样，就是语法不同
async function main(): Promise<string> {
  const result = await someAsyncFunction();
  return result;
}
```

### 2.2 测试里的 async

```typescript
// Playwright 测试函数必须是 async，因为所有浏览器操作都是异步的
test('登录测试', async ({ page }) => {
  await page.goto('http://...');
  // 每个浏览器操作前面都要加 await
});
```

### 2.3 Promise 链式调用（本项目用到）

在 Python 中，代码是同步的：`result = get_data()`，程序会停在这里等数据回来。
但在 JS 中，为了不卡死浏览器，它是异步的

**Promise：是一张“取餐小票”**

```
// ❌ 错误：拿了小票就走，没等到奶茶
const pageContent = page.content(); 
console.log(pageContent); // 输出的是 Promise 对象，不是网页内容

// ✅ 正确：等着奶茶做好再喝
const pageContent = await page.content(); 
console.log(pageContent); // 输出真实的 HTML 字符串
```

**`then` 的本质：接力棒**

想象你在跑接力赛：

1. **Promise** 是第一棒选手，他正在跑步（执行异步任务，比如网络请求）。
2. **.then()** 是第二棒选手，他站在终点线等着。
3. 当第一棒跑完（Promise 状态变为 `resolved`），他会把接力棒（结果数据）交给 `.then()` 里的函数。
4. `.then()` 拿到数据后，开始执行自己的逻辑。

```typescript
// 等价于 Python 里连续 await 多个协程
// 这是因为 LoginPage 的方法都 return this（返回自身）
await this.loginPage
  .inputUsername(username)           // 处理完就返回 Promise<this>，否则Promise<void>
  .then(p => p.inputPassword(password))   // p 就是 this（LoginPage 实例）
  .then(p => p.inputCaptcha(captcha))
  .then(p => p.clickLoginButton());

// 等价写法（更直观）：
const p = this.loginPage;
await p.inputUsername(username);
await p.inputPassword(password);
await p.inputCaptcha(captcha);
await p.clickLoginButton();
```

**`async/await` (现代推荐)**

>**输入成功或输入失败promise的处理:**
>
>**情况一：输入成功**
>
>如果 `inputUsername` 顺利执行完毕（无论它里面有没有实际逻辑，只要没抛出异常），它会返回一个 **Resolved（已解决）** 状态的 Promise
>
>**情况二：输入失败（抛出异常或 Promise Rejected）**
>
>如果 `inputUsername` 在执行过程中出错了（比如元素找不到、网络断了、或者代码里手动 `throw new Error()`），它会返回一个 **Rejected（已拒绝）** 状态的 Promise。
>
>1. `inputUsername` 失败：
>   - 状态：**Rejected**。
>   - 错误信息：具体的报错内容。
>2. 第一个 `.then()` 会发生什么？
>   - **关键点来了**：`.then(successCallback, failCallback)`。
>   - 如果你只写了一个参数 `.then(p => ...)`，那么当上一步失败时，**这个回调函数会被直接跳过！**
>   - 程序不会执行 `p.inputPassword`。
>3. 链条的“短路”效应：
>   - 由于第一步失败了，整个 Promise 链的状态会立刻变成 **Rejected**。
>   - 后面所有的 `.then()` 都会被跳过。
>   - 错误信息会一直向后传递，直到遇到第一个 **.catch()** 或者外层的 **try...catch**。



## 三、类（Class）

### 3.1 基本结构

```typescript
// Python:
// class LoginPage:
//     def __init__(self, page):
//         self.page = page

// TypeScript:
class LoginPage {
  private agent: PlaywrightAgent;   // 声明属性（Python 不需要单独声明）

  constructor(page: Page) {         // __init__ 对应 constructor
    this.agent = new PlaywrightAgent(page);
  }

  async inputUsername(value: string): Promise<this> {
    await this.agent.aiInput('...', { value });
    return this;    // 返回 this 支持链式调用
  }
}
```

### 3.2 private / public

```typescript
private agent: PlaywrightAgent;   // 只能类内部访问（Python 惯例用 _agent）
public login(): Promise<void> {}  // 外部可访问（默认就是 public，可以不写）
```

### 3.3 实例化

```typescript
// Python: page = LoginPage(playwright_page)
const page = new LoginPage(playwrightPage);  // 多一个 new
```

---

## 四、Playwright 测试结构

### 4.1 测试文件约定

```typescript
import { test, expect } from '@playwright/test';

// 一个 test() 是一个用例，相当于 pytest 里的一个 def test_xxx()
test('用例描述', async ({ page }) => {
  // page 由 Playwright 注入，不需要自己创建浏览器
  // 相当于 pytest-playwright 里的 page fixture
});
```

### 4.2 pytest 对比

| Python pytest | TypeScript Playwright |
|---|---|
| `def test_login(page):` | `test('login', async ({ page }) => {})` |
| `assert x == y` | `expect(x).toBe(y)` |
| `assert 'text' in title` | `expect(title).toContain('text')` |
| `@pytest.mark.timeout(90)` | `test.setTimeout(90_000)` （毫秒） |
| `conftest.py` fixture | `playwright.config.ts` 里的 `use` 配置 |

### 4.3 expect 断言

```typescript
expect(value).toBe('exact string');       // == 精确相等
expect(value).toContain('substring');     // in 包含
expect(value).toBeTruthy();               // bool(x) == True
expect(value).toBeGreaterThan(0);         // > 0
expect(list).toHaveLength(3);             // len(list) == 3
```

---

## 五、模块系统

### 5.1 导入导出

```typescript
// 导出（相当于 Python 里的公开名称）
export class LoginPage {}
export interface UserInfo {}

// 导入（相当于 Python 的 from xxx import yyy）
import { LoginPage } from '../pages/login.page';
import type { Page } from '@playwright/test';  // type 只导入类型，不打包进运行时
```

### 5.2 相对路径规则

```
tests/cases/login.spec.ts  导入  tests/services/auth.service.ts
→ import { AuthService } from '../services/auth.service';
   （不需要写 .ts 后缀）
```

---

## 六、配置文件

### 6.1 playwright.config.ts 关键配置

```typescript
export default defineConfig({
  testDir: './tests',       // 测试文件根目录
  timeout: 60_000,          // 单个 test() 超时（毫秒），可被 test.setTimeout() 覆盖
  use: {
    baseURL: 'http://...',  // page.goto('/path') 会自动拼上这个前缀
    headless: false,        // false = 有界面，true = 无头模式
  },
});
```

### 6.2 .env.local 加载

```typescript
// 项目里在每个入口文件顶部手动加载
import { config } from 'dotenv';
config({ path: '.env.local' });


// 之后用 process.env.SOME_KEY 读取（相当于 Python 的 os.environ['SOME_KEY']）
```

---

## 七、本项目特有模式

### 7.1 四层架构调用链

```
login.spec.ts
  └─ new AuthService(page)
       └─ auth.login('admin','admin')
            └─ loginPage.readCaptcha()      ← aiQuery
            └─ loginPage.inputUsername()    ← aiInput
            └─ loginPage.inputPassword()    ← aiInput
            └─ loginPage.inputCaptcha()     ← aiInput
            └─ loginPage.clickLoginButton() ← aiTap
```

### 7.2 return this 链式调用原理

```typescript
// inputUsername 返回 this（LoginPage 实例自身）
// 所以可以这样写：
await page.inputUsername('admin')
          .then(p => p.inputPassword('admin'));

// 等价于：
await page.inputUsername('admin');
await page.inputPassword('admin');
```

### 7.3 agent.destroy() 必须调用

```typescript
// 类似 Python 里的 browser.close()
// 不调用会导致 Midscene 报告不完整
await agent.destroy();
// 在 LoginPage 里封装成 destroy()，由 service 或 case 层调用
```
