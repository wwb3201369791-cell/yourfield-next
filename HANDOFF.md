# HANDOFF — 给下一个 agent

日期: 2026-05-17
本次 Step: P1.V1 — Lighthouse 修复与本地自动验收
Agent: #19

## 我做了什么(1-3 句话)

- 继续修 P1.V1 的性能阻塞，把生产 Lighthouse 首页从 Performance 78 提升到 92，最新结果为 92 / 96 / 96 / 100。
- 关键改动是裁剪 `NextIntlClientProvider` 的客户端 messages、首页下方产品轮播改为接近视口再加载 Embla、Hero 背景图改用预生成 WebP `<picture>`。
- 重新跑了 P1 本地验收：lint、typecheck、build、24 个公开页三语 200、5 个旧 URL 重定向、移动端/桌面截图、SEO 结构检查、生产 Lighthouse。

## 我没做完什么 / 为什么停在这里

- P1.V1 仍需要用户视觉审阅：移动端与桌面截图已重新生成，但是否接受当前视觉需要用户确认。
- Google Rich Results Test 不能验证 localhost；本次只做了本地 canonical / hreflang / JSON-LD 解析检查，外部富结果测试需要公网或 staging 地址。
- `/privacy` 仍是文档冲突点：`06-操作约束与验收.md` 的 P1 快捷验收列了 `/privacy`，但 Roadmap 与 `02-目标与技术栈.md` 把隐私/Cookie/条款页放在 P4；不要在未确认前跨阶段补页。

## 下一个要注意的坑

- 环境变量: 未新增 env。
- 依赖: `sharp@0.34.5` 已在上一轮 P1.V1 提前安装；本轮未新增依赖。
- Lighthouse CLI 在 Windows/Node 24 下仍可能写出 JSON 后因临时目录清理 EPERM 退出；以 `tests/snapshots/p1-lighthouse-zh-production.json` 的有效报告为准。
- `pnpm build` 和 dev/start 不要同时跑；它们会共用并改写 `.next`。
- 不要开始 P2，除非用户确认视觉截图、接受 Rich Results 等公网验证后置，并明确 `/privacy` 延期到 P4。

## 我用了哪些库/命令/工具

- 关键命令: `pnpm lint`、`pnpm typecheck`、`pnpm build`
- 验收命令: `pnpm script:snapshot-mobile -- --base-url http://localhost:3000`、Playwright 桌面截图脚本、Playwright SEO 结构检查、`npx --yes lighthouse@12.8.2 http://localhost:3000/zh ...`
- 最新 Lighthouse: Performance 92、Accessibility 96、Best Practices 96、SEO 100；FCP 1.2s，LCP 3.2s，TBT 30ms，CLS 0

## 给下一个 agent 的具体建议

- 下一步建议停在 **P1.V1-B 用户审阅确认**，不要直接改到 P2.S1。
- 如果用户接受截图、同意 Rich Results 等公网验证后置，并确认 `/privacy` 按 P4 合规阶段处理，再更新 STATE，把 Next 改为 P2.S1。
- 如果用户要求严格执行 06.4.2 的 `/privacy`，先让用户确认是否提前 P4 合规页，再开新的单独 Step。
