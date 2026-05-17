# HANDOFF — 给下一个 agent

日期: 2026-05-17
本次 Step: P1.S9 — 重定向
Agent: #17

## 我做了什么(1-3 句话)

- 在 `next.config.js` 中补齐旧静态包 `.html` URL 到新三语路径的永久重定向。
- 对 `product-detail.html?id=...` 和 `news-detail.html?id=...` 这两个旧 query 详情页，在 middleware 中做干净 308 跳转，避免新 URL 尾部残留旧 query。
- 复跑 lint / typecheck / build，并用 production server 验证 17 条旧 URL 跳转全部通过。

## 我没做完什么 / 为什么停在这里

- 未做 P1.S10 SEO 元数据基础；按接力规则本次只做 P1.S9。
- 未做 Lighthouse / JSON-LD 验证；这些属于后续 SEO 阶段或 P1 整阶段验收。

## 下一个要注意的坑

- 环境变量: 本步没有新增 env。
- 依赖: 本步没有新增依赖。
- 未解决疑问: 远端 GitHub Actions 本步提交后需要看一次绿灯；如果 CI 失败，优先检查 `next.config.js` redirects 或 middleware matcher。
- 临时绕过的问题(需要后续清理): 无。
- 注意: Next 配置型 redirect 会保留原始 query，所以带 `id` 的旧详情页不要挪回 `next.config.js`，否则 `/product-detail.html?id=x` 会跳成 `/zh/products/x?id=x`。

## 我用了哪些库/命令/工具

- 新装的包: 无
- 关键命令(可复用): `pnpm exec prettier --write next.config.js src/middleware.ts`、`pnpm lint`、`pnpm typecheck`、`pnpm build`、`pnpm start -- -p 4031`
- 验收命令: 用 `curl.exe -sI` 验证 `index.html/index.htm`、6 个一级页面、7 个产品壳页、2 个 query 详情页均返回 308 且 `Location` 正确。
- 文档外的工具: 无。

## 给下一个 agent 的具体建议

- 下一步只做 P1.S10：`src/lib/seo/buildMetadata.ts`、页面 `generateMetadata`、基础 JSON-LD / hreflang，别提前接 Payload。
- P1.S10 需要回查 `升级实施书_v2/04-路由与SEO.md` §4.4，尤其注意 P3 才做 sitemap / robots / manifest 深化。
- 构建前先停 dev server，避免 `.next` 被 dev/build 同时读写。
