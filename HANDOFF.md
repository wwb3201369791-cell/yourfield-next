# HANDOFF — 给下一个 agent

日期: 2026-05-17
本次 Step: P0.S6 — 环境变量
Agent: #6

## 我做了什么(1-3 句话)
- 新增 `yourfield-next/.env.example`，按附录C完整落地环境变量清单。
- 新增 `src/lib/env.ts`，用 Zod 做统一环境变量校验，并让 root layout / locale 配置通过该入口读取站点 URL 和语言配置。
- 补齐 `.env.*.local` 忽略规则，并把 ESLint 的 `process.env` 直读例外限制在 `src/lib/env.ts`。

## 我没做完什么 / 为什么停在这里
- P0.S6 已完成；按接力协议停在 P0.S7，不继续创建 CI workflow。
- P0.S7 会受“CI 平台未确认”影响；若用户未先确认，下个 agent 应先请示。

## 下一个要注意的坑
- 未来阶段的服务密钥当前允许为空，但一旦提供会校验格式；P2/P3/P4/P5 接入对应服务时，应把相关变量升级为必填。
- `src/lib/env.ts` 是唯一允许直接读 `process.env` 的文件，不要在业务代码里绕过它。
- `zod@4.4.3` 已作为运行依赖安装，用于启动时 env 校验。
- 3000 和 3001 端口此前已被占用，本次开发服务验证继续使用 4000 端口。
- `pnpm install --frozen-lockfile` 仍会提示 `unrs-resolver@1.11.1` build scripts 被忽略；本次验证未受影响。

## 我用了哪些库/命令/工具
- 新装的包: `zod@4.4.3`
- 关键命令(可复用): `pnpm install --frozen-lockfile`、`pnpm lint`、`pnpm typecheck`、`pnpm build`、`pnpm dev -- -p 4000`
- 验证命令: `curl.exe -sI http://localhost:4000/`、`curl.exe -sI http://localhost:4000/zh`、`git check-ignore -v yourfield-next/.env.local yourfield-next/.env.production.local`

## 给下一个 agent 的具体建议
- 先处理 P0.S7 / Roadmap P0.2.7：CI 骨架。
- 若 CI 平台仍未确认，按 AGENT.md 的 BLOCKING 规则先问用户，不要直接默认 GitHub Actions。
- 不要把 `.env.local` 或任何真实密钥加入仓库。
