# HANDOFF — 给下一个 agent

日期: 2026-05-17
本次 Step: P1.S6 — 移动端汉堡 + 视觉验证
Agent: #14

## 我做了什么(1-3 句话)

- 给 `yourfield-next` 增加 Playwright 移动端截图脚本 `pnpm script:snapshot-mobile`，覆盖 9 个 P1 公开页面和 2 个移动菜单状态。
- 完善 Header 移动菜单：展开后 aria 文案切换为“关闭导航菜单”，点击主导航或二级菜单链接后会自动收起菜单。
- 已生成 `tests/snapshots/p1-mobile/` 截图基线，并用脚本验证 375×667 下页面非空、无 Next overlay、无横向溢出、移动产品二级菜单可展开。

## 我没做完什么 / 为什么停在这里

- 未做 P1.S7 的 Embla 轮播迁移，也未做 P1.S8 之后的 404/error、重定向、SEO 等后续 Step。
- 未做真机 iPhone / Android 验证；本步使用 Playwright Chromium 375×667 和 Chrome DevTools 抽查。

## 下一个要注意的坑

- 环境变量: 本步没有新增业务 env。
- 依赖: 新增 devDependency `playwright@1.58.0`；新环境首次跑截图脚本前可能需要 `pnpm exec playwright install chromium`。
- 未解决疑问: 当前没有 Git remote，远端 CI 仍未验证。
- 临时绕过的问题(需要后续清理): Playwright MCP 本次因本机 browser lock 未接管成功，改用项目脚本 + Chrome DevTools MCP 抽查；不影响代码验证。

## 我用了哪些库/命令/工具

- 新装的包: `playwright@1.58.0`
- 关键命令(可复用): `pnpm lint`、`pnpm typecheck`、`pnpm build`、`pnpm script:check-i18n-coverage`、`pnpm exec playwright install chromium`、`pnpm script:snapshot-mobile -- --base-url http://localhost:4024`
- 浏览器验证: Chrome DevTools MCP，375×667 抽查 `/zh/products` 汉堡菜单展开、产品二级菜单展开、点击二级链接后菜单收起、控制台无 error/warn

## 给下一个 agent 的具体建议

- 下一步只做 P1.S7：Embla 轮播迁移，先查旧站 `js/carousels.js` 行为，再按 Roadmap 安装 `embla-carousel-react` 和 `embla-carousel-auto-scroll`。
- 继续使用 `@/lib/i18n/getTranslations` / `@/lib/i18n/useTranslations`，不要直接从 `next-intl` 读取旧站平铺 key。
- 需要构建前先停 dev server，避免 `.next` 被 dev/build 同时读写导致短暂 500。
