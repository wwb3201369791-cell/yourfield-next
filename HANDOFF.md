# HANDOFF — 给下一个 agent

日期: 2026-05-17
本次 Step: P1.S10 — SEO 元数据基础
Agent: #18

## 我做了什么(1-3 句话)

- 新增 `src/lib/seo/buildMetadata.ts`，把 canonical / hreflang / Open Graph / Twitter card / robots 的生成收敛到统一入口，并让 9 个公开页面继续接入该入口。
- 完善 JSON-LD：首页 Organization + WebSite、产品详情 Product + FAQPage + BreadcrumbList、新闻详情 NewsArticle + BreadcrumbList、联系页 ContactPage。
- 给根 layout 补 `theme-color` viewport 元数据，并让 JSON-LD 输出做 `<` 转义，避免脚本内容被意外截断。

## 我没做完什么 / 为什么停在这里

- P1.S10 已完成；没有推进 P2 / Payload，遵守“一次只做一个 Step”。
- P1 整阶段验收还没完成：项目没有 `lighthouse:ci` 脚本，Google Rich Results Test 也不能直接验证本地 localhost，所以我没有把 P1 标成完全结束。

## 下一个要注意的坑

- 环境变量: 本次未新增 env；production 验证跑在 4034 端口，但 canonical / OG URL 来自默认 `NEXT_PUBLIC_SITE_URL=http://localhost:3000`。
- 依赖: 本次没有新增依赖。
- 未解决疑问: P1.V1 是否要求补装 Lighthouse CI，还是由用户看截图 + 外部 SEO 工具手动确认后进入 P2，需要用户拍板。
- 临时绕过的问题(需要后续清理): mock 新闻中只有年月的条目，JSON-LD `datePublished` 暂用当月 1 日；P2 接 Payload 后应改为真实发布时间。
- 注意: WebSite JSON-LD 的 SearchAction 已按实施书指向 `/{locale}/search?q=`，该路由 P3 才实现；P3 不要改回 `/products?q=`。

## 我用了哪些库/命令/工具

- 新装的包: 无
- 关键命令(可复用): `pnpm lint`、`pnpm typecheck`、`pnpm build`、`pnpm start -- -p 4034`
- 验收命令: Playwright 访问 `/zh`、`/zh/products/firefighter-suit-combat`、`/zh/news/may-day-safety-inspection`、`/en/contact`，验证 title / canonical / hreflang / OG / Twitter / JSON-LD；并用 `curl.exe` 烟测 9 个公开页三语 200 与 5 条旧 URL 308。
- 文档外的工具: Playwright headless 浏览器验证；Browser 插件未在本 session 的 skill 列表中出现。

## 给下一个 agent 的具体建议

- 先做 P1.V1：整理 P1 整体验收结果，重点补 Lighthouse / Rich Results / 用户截图确认的结论。
- 如果用户确认 P1 外部验收暂缓，再把 STATE 的 Next 改为 P2.S1（Roadmap: P2.2.1）— Payload 安装与配置。
- 别直接开始 P2 CMS；P2.S1 会触发 Payload 版本选择这一类必须请示项。
