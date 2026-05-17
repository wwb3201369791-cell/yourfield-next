# HANDOFF — 给下一个 agent

日期: 2026-05-17
本次 Step: P1.S5 — Bug 修复（在新站）
Agent: #13

## 我做了什么(1-3 句话)

- 完成 P1.S5 的三个新站 Bug：产品中心下拉验证为竖向单列，联系页三语删除 `page.contact.introTitle`，地图按 locale 切换为 zh 高德外链、en/ru Google iframe。
- 新增 `CompanyMap` 组件，提供静态图降级、地图服务标识、外链按钮和移动端适配；未接入需要密钥的真实地图 SDK。
- 已用 Playwright 验证桌面产品下拉、三语联系页地图切换和中文移动端联系页布局。

## 我没做完什么 / 为什么停在这里

- 未做 P1.S6 的移动端汉堡完整视觉截图脚本，也未做 P1.S7 之后的 Embla、404/error、重定向、SEO 等后续 Step。
- 未补 `/favicon.ico`，这是前序已记录的可选 TODO，属于后续 SEO / manifest 资产阶段。
- 未接入高德 Web SDK / Google Maps API Key；P1.S5 只要求阶段性按 locale 切换与失败退化，真实服务接入留到后续环境变量齐备时处理。

## 下一个要注意的坑

- 环境变量: 地图相关 `AMAP_KEY` / `GOOGLE_MAPS_KEY` 仍允许为空；后续真正接 SDK 时再升级校验。
- 依赖: 本步没有新增 npm 包。
- 未解决疑问: 当前没有 Git remote，远端 CI 仍未验证。
- 临时绕过的问题(需要后续清理): 浏览器访问仍会请求 `/favicon.ico` 并返回 404，不影响本 Step 验收。

## 我用了哪些库/命令/工具

- 新装的包: 无
- 关键命令(可复用): `pnpm lint`、`pnpm typecheck`、`pnpm build`、`pnpm script:check-i18n-coverage`
- 路由验证: `pnpm exec next dev -p 4018` 后验证 `/zh/contact`、`/en/contact`、`/ru/contact`、`/zh/products` 均 200
- 浏览器验证: Playwright MCP，桌面 1440×900 验证产品下拉和三语地图，移动 375×667 验证中文联系页无横向溢出

## 给下一个 agent 的具体建议

- 下一步只做 P1.S6：移动端汉堡 + 视觉验证，重点检查 Header 下拉、移动菜单二级展开、联系页新地图组件在截图里的观感。
- 继续使用 `@/lib/i18n/getTranslations` / `@/lib/i18n/useTranslations` 读取旧站平铺 key，不要直接从 `next-intl` 读。
- 需要构建前先停 dev server，避免 `.next` 被 dev/build 同时读写导致短暂 500。
