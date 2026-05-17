# HANDOFF — 给下一个 agent

日期: 2026-05-17
本次 Step: P1.S4 — 9 个公开页面骨架（mock 数据）
Agent: #12

## 我做了什么(1-3 句话)

- 完成 9 个公开页面骨架：首页、关于我们、产品中心、产品详情、解决方案、新闻中心、新闻详情、招商加盟、联系我们。
- 新增本阶段所需 mock 数据、SEO / JSON-LD helper、页面公共组件、产品卡片和新闻卡片，并复制旧站本步页面需要的静态图片到 `yourfield-next/public/images/`。
- 每个页面都接入 locale 路由、项目封装 i18n、基础 metadata 和结构化数据；数据仍是 mock，后续 P2/P3 替换为 Payload / Media / 真实服务。

## 我没做完什么 / 为什么停在这里

- 未做 P1.S5 的三个 Bug 修复；按 AGENT.md 规则本次只做 P1.S4。
- 未做旧 URL 301、404/error、robots/sitemap、完整 SEO、Embla 轮播、搜索、地图真实接入；这些都属于后续 Step。
- 未删除 `page.contact.introTitle`，因为这是 P1.S5 Bug 2 的范围。

## 下一个要注意的坑

- 后续页面和组件继续用 `@/lib/i18n/getTranslations` / `@/lib/i18n/useTranslations`，不要直接从 `next-intl` 读取旧站平铺 key。
- 浏览器验证仍会看到 `/favicon.ico` 404，这是前序可选 TODO；本步未处理，避免跨到 SEO / manifest 资产阶段。
- 不要在 `pnpm exec next dev` 运行期间执行 `pnpm build`，两者共用 `.next`，会让 dev server 短暂 500；需要构建时先停 dev server。
- 当前仓库仍有大量旧静态包、实施书、截图等 untracked 文件；提交时只 stage 当前 Step 相关文件。

## 我用了哪些库/命令/工具

- 新装的包: 无
- 关键命令(可复用): `pnpm exec prettier --write "src/**/*.{ts,tsx}"`、`pnpm lint`、`pnpm typecheck`、`pnpm build`、`pnpm script:check-i18n-coverage`
- 路由验证: `pnpm exec next dev -p 4014` 后检查 9 个页面在 zh/en/ru 全部 200，并检查 7 个真实产品详情 slug 全部 200
- 浏览器验证: Playwright 截图检查首页桌面、产品页桌面、联系页移动端、产品详情移动端

## 给下一个 agent 的具体建议

- 下一步只做 P1.S5：先修 Header 产品下拉，再处理联系页重复文案 key，最后做地图 locale 切换和失败退化。
- 做 Bug 2 时需要三语同步删除 `page.contact.introTitle`，并复跑 `pnpm script:check-i18n-coverage`。
- 地图组件先保持阶段性占位和可降级体验，不要提前接需要密钥或账号的真实地图服务。
