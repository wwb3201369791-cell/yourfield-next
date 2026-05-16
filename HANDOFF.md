# HANDOFF — 给下一个 agent

日期: 2026-05-16
本次 Step: P0.S4 — lint / format / typecheck
Agent: #4

## 我做了什么(1-3 句话)
- 安装并配置 ESLint、Prettier、Husky、lint-staged、commitlint，补齐 `package.json` 的 `lint`、`lint:fix`、`format`、`typecheck`、`build`、`dev`、`start` 等脚本。
- 新增 `.eslintrc.cjs`、`.prettierrc`、`.prettierignore`、`commitlint.config.cjs` 和 `.husky/pre-commit` / `.husky/commit-msg`。
- 为通过严格 lint，整理了现有 TSX 导入顺序，并把 `src/i18n.ts` 的三语 JSON 读取改为静态映射，仍保持 `messages/*.json` 原样扁平 key。

## 我没做完什么 / 为什么停在这里
- P0.S4 已完成；按接力协议停在 P0.S5，不继续做 CSS 方案选型、Tailwind 配置、全局样式或 env。

## 下一个要注意的坑
- `yourfield-next/` 是仓库子目录，Husky 必须从 Git 根目录安装；当前 `prepare` 是 `cd .. && husky yourfield-next/.husky`，hooks 内部用 `pnpm --dir=yourfield-next ...` 回到子项目。
- `pnpm install --frozen-lockfile` 会提示 `unrs-resolver@1.11.1` build scripts 被忽略；本次验证未受影响，暂不需要处理。
- PowerShell 管道给 commitlint 输入时可能带 BOM，容易误报；验证 commitlint 请用 `pnpm exec commitlint --from HEAD~1 --to HEAD` 或 `--edit <message-file>`。
- 根目录旧静态包和实施书大多仍是 untracked；不要把它们混进 P0.S5 提交。

## 我用了哪些库/命令/工具
- 新装的包: `eslint@^8`、`prettier@^3`、`@typescript-eslint/eslint-plugin`、`@typescript-eslint/parser`、`eslint-config-next@14.2.35`、`eslint-plugin-import`、`eslint-plugin-jsx-a11y`、`eslint-config-prettier`、`eslint-import-resolver-typescript`、`husky`、`lint-staged`、`commitlint`、`@commitlint/config-conventional`
- 关键命令(可复用): `pnpm install --frozen-lockfile`、`pnpm lint`、`pnpm typecheck`、`pnpm build`、`pnpm exec prettier --check ...`、`pnpm exec commitlint --from HEAD~1 --to HEAD`
- 文档外的工具: 无

## 给下一个 agent 的具体建议
- 先做 P0.S5 / Roadmap P0.2.5：CSS 方案选型，并在 `yourfield-next/docs/DECISIONS.md` 写 D-001 ADR。
- 若选 Tailwind，再安装 Tailwind 相关包与 `prettier-plugin-tailwindcss`；当前 P0.S4 未提前安装 CSS 方案依赖。
- 不要改 `messages/*.json` 的 key 结构；当前 `src/i18n.ts` 静态读取三语 JSON 后仍交给 `expandFlatMessages` 运行时展开。
