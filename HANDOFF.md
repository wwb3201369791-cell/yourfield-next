# HANDOFF — 给下一个 agent

日期: 2026-05-17
本次 Step: P1.V1 — P1 整体验收与用户审阅（未完成）
Agent: #19

## 我做了什么(1-3 句话)

- 跑了 P1 本地验收：安装、lint、typecheck、build、24 个公开页三语 200、5 个旧 URL 重定向、Bug 2、html lang、移动端截图、桌面截图、canonical/hreflang/JSON-LD 解析。
- 发现 P1 不能标完成：生产 Lighthouse 首页 Performance 只有 78，未达到 P1 要求的 >= 90。
- 做了小幅性能修正：隐藏的浅色 Logo 不再 priority 预加载，首页 Hero 图显式 `decoding="sync"`，并提前安装 `sharp@0.34.5` 给 Next 生产图片优化使用。

## 我没做完什么 / 为什么停在这里

- P1.V1 未完成，因为 Lighthouse Performance 未过线。
- Google Rich Results Test 没法验证 localhost，本次只做了本地 JSON-LD 解析；外部富结果测试需要公网/staging URL。
- 用户视觉审阅还没完成；已生成截图，但是否接受当前视觉需要用户确认。

## 下一个要注意的坑

- 环境变量: 未新增 env。
- 依赖: 新增 `sharp@0.34.5`；`pnpm install` 仍提示 sharp/unrs-resolver build scripts 被忽略，但 `node -e "require('sharp')"` 可正常输出 `0.34.5`。
- 未解决疑问: `06-操作约束与验收.md` 的 P1 快捷验收包含 `/privacy`，但 Roadmap 与 02 章把合规页放在 P4；当前三语 `/privacy` 都是 404，需要用户拍板是否接受延期到 P4。
- 临时绕过的问题(需要后续清理): Lighthouse CLI 在 Windows/Node 24 下会写出 JSON 后因临时目录清理 EPERM 退出；报告可用，但命令退出码不可靠。
- 注意: 运行 build 前先停掉 dev/start；dev 会覆盖 `.next`，导致 `pnpm start` 找不到 production build。

## 我用了哪些库/命令/工具

- 新装的包: `sharp@0.34.5`
- 关键命令(可复用): `pnpm install --frozen-lockfile`、`pnpm lint`、`pnpm typecheck`、`pnpm build`、`pnpm script:snapshot-mobile -- --base-url http://localhost:3000`
- 验收命令: 自写 PowerShell/curl 路由检查、Playwright 桌面截图脚本、Playwright JSON-LD/canonical/hreflang 检查、`npx --yes lighthouse@12.8.2 http://localhost:3000/zh ...`
- 文档外的工具: Lighthouse 临时 npx 调用（未写入 package scripts）

## 给下一个 agent 的具体建议

- 先不要开始 P2；继续 P1.V1，重点只处理首页移动端 Lighthouse LCP，不要扩大到 CMS。
- 如果用户确认接受 Performance 78 或把性能专项延期，先在 STATE 里明确记录用户拍板，再把 Next 改为 P2.S1。
- 如果继续优化，优先看 `yourfield-next/tests/snapshots/p1-lighthouse-zh-production.json`：主要问题是首页 Hero 图 LCP 约 3.5s。
- 别新增隐私/Cookie/条款页，除非用户明确要求把 P4 合规页提前；否则这会跨 Step。
