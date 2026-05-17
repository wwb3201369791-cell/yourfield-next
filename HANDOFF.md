# HANDOFF — 给下一个 agent

日期: 2026-05-17
本次 Step: P1.S8 — 404 / error
Agent: #16

## 我做了什么(1-3 句话)

- 新增统一错误状态展示组件，并实现 locale 级 `not-found.tsx`、`error.tsx` 与根级 `global-error.tsx`。
- 补齐三语 `error.*` 文案，404 页面包含返回首页 / 浏览产品入口，运行时错误页包含错误 ID、重新尝试和返回首页。
- 额外补了根级 `app/not-found.tsx`，覆盖 `/zh/not-a-real-page` 这类完全未匹配路由的真实访问场景。

## 我没做完什么 / 为什么停在这里

- 未做 P1.S9 重定向，也未做 P1.S10 SEO 元数据基础；按接力规则本次只做 P1.S8。
- 没有专门造临时崩溃路由去点击触发 `error.tsx`，该页面已通过 lint/typecheck/build 校验，真实触发留到后续有可复现异常时验证。

## 下一个要注意的坑

- 环境变量: 本步没有新增 env。
- 依赖: 本步没有新增依赖。
- 未解决疑问: 远端 GitHub Actions 本步提交后需要看一次绿灯；如果 push 后 CI 失败，优先检查 Next build 输出。
- 临时绕过的问题(需要后续清理): `pnpm start` 提示生产图片优化建议安装 `sharp`，Roadmap P2 会引入，当前未提前加依赖。
- 注意: 不要删除 `src/app/not-found.tsx`。Next 对完全未匹配路由会走根级 not-found，仅有 `[locale]/not-found.tsx` 不足以覆盖 `/zh/xxx`。

## 我用了哪些库/命令/工具

- 新装的包: 无
- 关键命令(可复用): `pnpm lint`、`pnpm typecheck`、`pnpm build`、`pnpm script:check-i18n-coverage`
- 浏览器验证: `pnpm start -- -p 4030` + Playwright headless；验证 `/zh/not-a-real-page` 桌面 1440×900 与移动 375×667 均返回 404、自定义内容可见、无框架错误覆盖层；同时用 Node fetch 验证 `/zh` `/en` `/ru` 未匹配路径均返回本地化 404

## 给下一个 agent 的具体建议

- 下一步只做 P1.S9：在 `next.config.js` 配置实施书 §4.3 的旧静态 URL 301 重定向，并用 `curl.exe -sI` 或 Node fetch 验证。
- 继续使用项目封装的 `@/lib/i18n/getTranslations` / `useTranslations`，不要直接绕过旧站平铺 key 适配层。
- 构建前先停 dev server，避免 `.next` 被 dev/build 同时读写。
- P1.S9 不要修改 SEO metadata / JSON-LD，那是 P1.S10。
