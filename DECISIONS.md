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
