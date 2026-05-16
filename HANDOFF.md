# HANDOFF — 给下一个 agent

日期: 2026-05-16
本次 Step: P0.S3 — 多语言路由占位
Agent: #3

## 我做了什么(1-3 句话)
- 安装 `next-intl@^3`，把旧站 `locales/zh.json`、`en.json`、`ru.json` 原样复制到 `yourfield-next/messages/`。
- 新增 `src/i18n.ts`、`src/middleware.ts` 和 i18n routing/locale 工具，根路径会按 cookie / Accept-Language 跳转到 `/zh`、`/en`、`/ru`。
- 首页占位页现在通过 `next-intl` 读取旧站翻译 key，并输出当前 locale。

## 我没做完什么 / 为什么停在这里
- P0.S3 已完成；按接力协议停在 P0.S4，不继续做 eslint、prettier、husky、commitlint 或 package scripts。

## 下一个要注意的坑
- 旧站 messages JSON 仍保持扁平 key（如 `common.home`）；`src/lib/i18n/messages.ts` 会在运行时展开给 `next-intl` 用，不要把三语 JSON 改成嵌套结构。
- `package.json` 目前仍没有 `lint` / `typecheck` / `build` / `dev` scripts；这是 P0.S4 要补的内容。
- 3000 和 3001 端口仍可能被占用；本次开发服务验证使用 4000 端口。
- 浏览器验证时 `/favicon.ico` 返回 404；这是当前骨架缺 favicon，不影响本 Step。
- 根目录旧静态包和实施书大多仍是 untracked；不要把它们混进 P0.S4 提交。

## 我用了哪些库/命令/工具
- 新装的包: `next-intl@3.26.5`
- 关键命令(可复用): `pnpm add next-intl@^3`、`pnpm install --frozen-lockfile`、`pnpm exec tsc --noEmit`、`pnpm exec next build`、`pnpm exec next dev -p 4000`
- 文档外的工具: Context7 查询 `next-intl` App Router / middleware 用法；Playwright 打开 `http://localhost:4000/zh` 做浏览器验证

## 给下一个 agent 的具体建议
- 先做 P0.S4 / Roadmap P0.2.4：安装 lint / format / hook 相关依赖，并补齐 package scripts。
- P0.S4 验证脚本时优先使用新增的 `typecheck` / `build` scripts；不要继续推进 CSS 方案或 CI。
- 若写 i18n 覆盖检查脚本，要按文件里的扁平 key 比对，而不是按运行时展开后的嵌套对象比对。
