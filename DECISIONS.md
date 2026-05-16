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
