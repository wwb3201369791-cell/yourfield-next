# DECISIONS — 关键决策日志

> 仅记录与“升级实施书_v2”原文不同的、或文档没明说但需要定下来的决策。
> 完全照搬实施书的决定不用记。
> 格式见 AGENT.md 第 5.3 节。

---

## 2026-05-16 — P0.S1 补充 TypeScript 类型声明依赖
**背景**: Roadmap P0.2.1 只列出 `next` / `react` / `react-dom` / `typescript`，但最小 TSX 页面运行 `pnpm exec tsc --noEmit` 时缺少 React JSX 类型声明。
**选择**: 增加 `@types/react`、`@types/react-dom`、`@types/node` 作为 devDependencies，并锁定精确版本。
**理由**: 这是 Next.js + React + TypeScript 项目的必要类型声明，不属于业务依赖，也不改变技术栈。
**影响范围**: `yourfield-next/package.json`、`yourfield-next/pnpm-lock.yaml`。
**回滚成本**: 低；删除这三个 devDependencies 即可，但 TypeScript 检查会重新失败。

## 2026-05-16 — P0.S3 保持旧站 i18n 扁平 key 文件
**背景**: 旧站三语 JSON 使用 `common.home` 这类扁平 key，而 `next-intl` 运行时按嵌套对象读取；实施书要求复制旧站 key 且禁止改名。
**选择**: 保持 `messages/*.json` 原样扁平存储，在 `src/lib/i18n/messages.ts` 中运行时展开后交给 `next-intl`。
**理由**: 既不改旧 key / 文件结构，又能在代码中继续用 `t('common.home')` 这类旧站 key 验证翻译拉通。
**影响范围**: `yourfield-next/src/i18n.ts`、`yourfield-next/src/lib/i18n/messages.ts`，以及后续 i18n 覆盖检查脚本。
**回滚成本**: 中低；若未来决定改为嵌套 JSON，需要一次性转换三语 messages、更新覆盖检查脚本并全站回归 i18n。

## 2026-05-16 — P0.S4 在子项目中安装 Husky hooks
**背景**: `yourfield-next/` 是仓库子目录，直接在该目录执行 `husky` 会报 `.git can't be found`，但 P0.S4 要求启用 Husky、lint-staged 与 commitlint。
**选择**: `package.json` 的 `prepare` 使用 `cd .. && husky yourfield-next/.husky` 从 Git 根目录安装 hooks，hook 脚本内部使用 `pnpm --dir=yourfield-next ...` 回到子项目执行检查。
**理由**: 保持 P0 工程仍在 `yourfield-next/` 内独立管理，同时让 Git hooks 对当前仓库真实生效，不需要把前端项目移动到仓库根。
**影响范围**: `yourfield-next/package.json`、`yourfield-next/.husky/pre-commit`、`yourfield-next/.husky/commit-msg`，以及本地 Git `core.hooksPath`。
**回滚成本**: 低；若未来仓库根改成 `yourfield-next/` 或拆仓，只需把 `prepare` 改回 `husky` 并调整 hook 命令路径。

## 2026-05-16 — P0.S5 选择 Tailwind CSS v3.4
**背景**: Roadmap P0.2.5 要求在 Tailwind / CSS Modules / vanilla-extract 中自决 CSS 方案，并把旧站 `:root` CSS 变量桥接到新工程。
**选择**: 采用 `tailwindcss@3.4.19`，配合 PostCSS / Autoprefixer / `prettier-plugin-tailwindcss`；旧站色板、圆角、阴影、字体等继续保留为 CSS 变量，再映射进 `tailwind.config.js`。
**理由**: Tailwind v3.4 在实施书允许范围内，能保持旧站视觉 token，不引入运行时 CSS-in-JS，也比 CSS Modules 更适合 P1 大量页面迁移时快速复用布局和状态样式。
**影响范围**: `yourfield-next/package.json`、`pnpm-lock.yaml`、`tailwind.config.js`、`postcss.config.js`、`.prettierrc`、`src/styles/*`、`src/app/layout.tsx`、`docs/DECISIONS.md`。
**回滚成本**: 中低；删除 Tailwind/PostCSS 配置和依赖、恢复普通 CSS 即可，但 P1 页面迁移中已写的 utility class 需要同步改写。

## 2026-05-17 — P0.S6 对未来阶段密钥采用阶段性校验
**背景**: 附录C要求 `src/lib/env.ts` 用 Zod 校验环境变量，但 P0 当前尚未接入 Payload / S3 / Meili / Umami / SMTP 等服务，也不能把真实密钥写入仓库；若在 P0 强制要求所有未来阶段密钥，`pnpm build` 会在无凭证环境下失败。
**选择**: P0 阶段强校验站点基础、locale、数据库本地默认值等当前可用变量；未来阶段的密钥和第三方配置允许为空，但一旦提供就校验格式。
**理由**: 既让应用启动时走统一 env 入口，又不要求在 P0 提前伪造或提交敏感凭证。
**影响范围**: `yourfield-next/src/lib/env.ts`、`yourfield-next/src/lib/i18n/locale.ts`、`yourfield-next/.env.example`。
**回滚成本**: 低；P2/P3/P4/P5 接入对应服务时，把相关变量从 optional 改为 required 并补充验收即可。

## 2026-05-17 — P0.S7 将 GitHub Actions workflow 放在仓库根目录
**背景**: 实施书目录骨架中包含 `yourfield-next/.github/workflows/`，但当前 Git 仓库根目录是静态包根目录，不是 `yourfield-next/`；GitHub Actions 只会读取仓库根目录 `.github/workflows/`。
**选择**: 将真正生效的 CI workflow 放在仓库根目录 `.github/workflows/ci.yml`，并通过 `defaults.run.working-directory: yourfield-next` 执行子项目命令。
**理由**: 这样 push / PR 到当前仓库时 CI 才会实际运行，同时不需要移动 `yourfield-next/` 或拆仓。
**影响范围**: `.github/workflows/ci.yml`；后续 GitHub 远程仓库、分支保护和 PR 检查都应指向这个 workflow。
**回滚成本**: 低；若未来把 `yourfield-next/` 拆成独立仓库，可把 workflow 移入新仓库根目录，并删除 `working-directory: yourfield-next`。
