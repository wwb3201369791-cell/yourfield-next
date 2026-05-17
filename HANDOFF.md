# HANDOFF — 给下一个 agent

日期: 2026-05-17
本次 Step: P1.S7 — Embla 轮播迁移
Agent: #15

## 我做了什么(1-3 句话)

- 按 Roadmap 安装 `embla-carousel-react` / `embla-carousel-auto-scroll`，新增通用 `Carousel` 客户端组件。
- 首页产品预览改为 Embla 横向轮播，支持自动滚动、上一组/下一组控制，并在 `prefers-reduced-motion: reduce` 时禁用自动滚动。
- 产品详情首屏图集改为 Embla 主图轮播，保留旧站接近的上一张/下一张、计数和缩略图切换体验。

## 我没做完什么 / 为什么停在这里

- 未做 P1.S8 的 404 / error 页面，也未做 P1.S9 重定向、P1.S10 SEO 元数据后续 Step。
- 未把旧站 `createRail` / `bindNativeScrollDrag` 单独抽成 rail 组件；当前 P1 新站页面没有需要它们的横向 rail 场景。

## 下一个要注意的坑

- 环境变量: 本步没有新增 env。
- 依赖: 新增 `embla-carousel-react@8.6.0`、`embla-carousel-auto-scroll@8.6.0`；未直接 import `embla-carousel` 类型，避免 pnpm 下嵌套依赖类型不可见。
- 未解决疑问: 远端 GitHub Actions 本步提交后需要看一次绿灯；如果 push 后 CI 失败，优先检查 lockfile / build 输出。
- 临时绕过的问题(需要后续清理): `/favicon.ico` 404 仍存在，是既有可选 TODO，不影响本步。

## 我用了哪些库/命令/工具

- 新装的包: `embla-carousel-react@8.6.0`、`embla-carousel-auto-scroll@8.6.0`
- 关键命令(可复用): `pnpm install --frozen-lockfile`、`pnpm lint`、`pnpm typecheck`、`pnpm build`、`pnpm script:check-i18n-coverage`
- 浏览器验证: Playwright MCP + 本地 `http://localhost:4028`，验证首页产品轮播、产品详情图集、移动端 375×667 无横向溢出；另用 Playwright headless 验证 reduced-motion 下自动滚动不启动

## 给下一个 agent 的具体建议

- 下一步只做 P1.S8：先实现 `src/app/[locale]/not-found.tsx`、`error.tsx` 和全局 `global-error.tsx`，再跑三语页面和 build。
- 继续使用项目封装的 `@/lib/i18n/getTranslations` / `useTranslations`，不要直接绕过旧站平铺 key 适配层。
- 构建前先停 dev server，避免 `.next` 被 dev/build 同时读写。
