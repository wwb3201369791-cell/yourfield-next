# HANDOFF — 给下一个 agent

日期: 2026-05-17
本次 Step: P1.S3 — i18n 引擎接入
Agent: #11

## 我做了什么(1-3 句话)

- 完整接入了 P1.S3 的 i18n 层：locale layout 继续用 `NextIntlClientProvider`，服务端和客户端统一通过项目封装的翻译入口读取旧站平铺 key。
- 新增 `pnpm script:check-i18n-coverage`，会检查 zh/en/ru key 集合一致、旧站 `../locales/*.json` key 未丢失，并避开已批准后续可删除的 `page.contact.introTitle`。
- 处理了旧站平铺 key 的父子同名冲突，以及旧站 `{{name}}` 插值到 next-intl `{name}` 的运行时兼容。

## 我没做完什么 / 为什么停在这里

- P1.S4 的 9 个公开页面骨架尚未开始；按 AGENT.md 规则本次只做 P1.S3。
- P1.S5 的 Bug 2 尚未执行，所以 `page.contact.introTitle` 目前仍在 `messages/*.json` 中，覆盖脚本已为后续删除预留白名单。

## 下一个要注意的坑

- 后续页面/组件不要直接从 `next-intl` 导入 `useTranslations` 或 `getTranslations` 来取旧站 key；必须用 `@/lib/i18n/useTranslations` 和 `@/lib/i18n/getTranslations`。
- 旧站存在 `home.industry.power` 与 `home.industry.power.primary` 这类 key，不能按普通嵌套 JSON 展开。
- 浏览器验证仍有 `/favicon.ico` 404，这是前序已记录的可选 TODO，不影响本步。
- 3000/3001 端口此前已被占用，本次 dev 验证使用 4013 端口。

## 我用了哪些库/命令/工具

- 新装的包: 无
- 关键命令(可复用): `pnpm lint`、`pnpm typecheck`、`pnpm script:check-i18n-coverage`、`pnpm build`
- 路由验证: `pnpm exec next dev -p 4013` 后检查 `/` 为 307，`/zh` `/en` `/ru` 为 200
- 浏览器验证: Playwright 打开 `/zh` 与 `/en`，检查 html lang、翻译文案、skip link、footer aria label、桌面/移动端无横向溢出

## 给下一个 agent 的具体建议

- 下一步做 P1.S4 / Roadmap P1.2.4，先从首页和公共 mock 数据结构开始，不要提前接 Payload。
- P1.S4 写页面时复用已有 Header/Footer/Layout，不要改 `messages/*.json` 的旧 key；确需新增文案时三语一起加并复跑覆盖检查。
- 页面内翻译统一走本步封装好的 i18n helpers，别碰 `升级实施书_v2/` 原文。
