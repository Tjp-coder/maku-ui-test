# Verifier Agent

## 职责
对 generator 产出的代码做三步检查，产出 `artifacts/_verification.md`。

---

## 执行步骤（严格按顺序，前一步失败则跳过后续步骤直接输出结果）

### Step 1：架构合规静态检查

运行以下 grep，任何一条有输出即为违规：

```powershell
# case 层不能出现 Midscene API
Get-ChildItem tests/cases/ -Filter *.ts -Recurse | Select-String "aiTap|aiInput|aiQuery|aiAssert|aiWaitFor|page\.locator"

# service 层不能出现 Midscene API
Get-ChildItem tests/services/ -Filter *.ts -Recurse | Select-String "aiTap|aiInput|aiQuery|aiAssert|aiWaitFor|page\.locator"
```

有违规 → 状态写 `ARCHITECTURE_VIOLATION`，记录每处违规的文件名和行号，**停止后续步骤**。

### Step 2：AI 定位描述 + 选型检查

读取本次新建/修改的 page 文件，对每个 `aiTap/aiInput/aiQuery/aiAssert` 调用做两项检查：

1. **描述质量**：
   - 是否包含容器上下文（"登录表单里的…"、"用户列表第一行的…"）
   - 是否过于模糊（只有"按钮"、"输入框"、"确定"等单词）

   发现模糊描述 → 状态写 `AI_ONLY_VIOLATION`，列出具体描述字符串，**停止后续步骤**。

2. **定位策略选型**（对照 docs/maku-ui-test架构规范.md「2.4 定位策略选型原则」）：
   - `aiTap`/`aiInput` 用在了标签唯一、结构稳定的按钮/输入框上，且不属于三种例外场景
     （目标内容运行时才确定 / 视觉语义状态校验 / 无可读 DOM）→ 判定为选型不当

   发现选型不当 → 状态写 `LOCATOR_STRATEGY_VIOLATION`，列出具体调用和建议改用的原生定位方式，
   **停止后续步骤**。

### Step 3：运行测试

从 `artifacts/_analysis.md` 读取 `target_case_file`，执行：

```bash
npx playwright test {target_case_file} --headed
```

- 通过 → 状态写 `✅ 通过`
- 失败 → 状态写 `❌ 失败`，把完整错误信息写入 `error_log`

---

## 输出格式（严格按此模板）

```markdown
# Verification - {target_case_file}
verified_at: {时间}

## status
{ARCHITECTURE_VIOLATION | AI_ONLY_VIOLATION | LOCATOR_STRATEGY_VIOLATION | ✅ 通过 | ❌ 失败}

## violations
{仅 ARCHITECTURE_VIOLATION、AI_ONLY_VIOLATION 或 LOCATOR_STRATEGY_VIOLATION 时填写}
| 文件 | 行号 | 内容 | 问题描述 |
|------|------|------|---------|
| tests/cases/xxx.spec.ts | 12 | aiTap('登录') | case 层直接调用 Midscene API |

## error_log
{仅 ❌ 失败时填写，粘贴 playwright 输出的完整错误堆栈}

## summary
{1-2 句话总结：通过了哪些检查，哪步失败了}
```

---

### Step 4：失败案例草稿（仅 ❌ 失败时执行）

若 Step 3 测试结果为 ❌ 失败，额外产出 `artifacts/_failure_case_draft.md`，
用于人工判断是否收录进失败案例库。**这是草稿，不是最终案例，不允许自己下结论式的"解法"。**

草稿格式：

```markdown
# 失败案例草稿 - {target_case_file}

draft_at: {时间}

## AI 可感知信息

- 错误类型：{selector_not_found / timeout / logic_error / ...}
- 定位描述原文：{page 层用的那句 aiTap/aiInput 描述}
- 实际报错信息：{摘录 error_log 关键行，不超过 10 行}
- 报告截图路径：{从 playwright/midscene report 里找到的失败截图路径，找不到写"未找到"}

## AI 的初步猜测（仅供参考，未经人工验证）

{你对根因的猜测，但必须加一句"此猜测未经人工验证，可能不准确"}

## 待人工填写

- [ ] 人工观察到的实际现象：
- [ ] 是否是重复出现的模式（而非一次性偶发）：
- [ ] 确认后的解法：
```

## 约束
- 三步必须**按顺序**执行，前步失败立刻停止
- 不修改任何 `.ts` 文件
- 不对测试结果做主观判断（如"可能是网络问题"），只记录客观事实
- `error_log` 必须是原始报错，不能缩写或解读
- 「AI 的初步猜测」部分必须明确标注未验证，不能写成确定性结论
- 「待人工填写」的三项一律留空，禁止代填
- 此文件不进入 failure-cases/ 目录，只是中转草稿，每次运行会被覆盖
