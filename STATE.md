# STATE — 当前进度

最后更新: 2026-05-17 by Agent #13

## 当前阶段

P1 — 骨架迁移（页面结构 + i18n + 视觉还原）

## 已完成

- 初始化 STATE.md / HANDOFF.md / DECISIONS.md 三个接力状态文件
- 启动协议已读取 AGENT.md、实施书入口、Roadmap、状态三件套，并扫读 P0 相关约束
- 已确认 Node.js v24.12.0 可用，pnpm 10.28.2 可用
- ✅ P0.S1（Roadmap: P0.2.1）— 初始化
- ✅ P0.S2（Roadmap: P0.2.2）— 目录骨架
- ✅ P0.S3（Roadmap: P0.2.3）— 多语言路由占位
- ✅ P0.S4（Roadmap: P0.2.4）— lint / format / typecheck
- ✅ P0.S5（Roadmap: P0.2.5）— CSS 方案选定
- ✅ P0.S6（Roadmap: P0.2.6）— 环境变量
- ✅ P0.S7（Roadmap: P0.2.7）— CI 骨架
- ✅ P0.S8（Roadmap: P0.2.8）— 文档骨架
- ✅ P1.S1（Roadmap: P1.2.1）— 全局样式系统
- ✅ P1.S2（Roadmap: P1.2.2）— Header / Footer / Layout
- ✅ P1.S3（Roadmap: P1.2.3）— i18n 引擎接入
- ✅ P1.S4（Roadmap: P1.2.4）— 9 个公开页面骨架（mock 数据）
- ✅ P1.S5（Roadmap: P1.2.5）— Bug 修复（在新站）

## Next

**P1.S6（Roadmap: P1.2.6）** — 移动端汉堡 + 视觉验证

## 阻塞

- 待用户提供 Git 远程仓库地址；当前只能完成本地 CI 配置和本地命令验证，GitHub Actions 远端绿灯未验证

## 新发现的 TODO

- 必做: 当前没有 Git remote，P0.S7 只能完成本地 CI 配置和本地命令验证；绑定 GitHub 远程并 push 后，需要确认 GitHub Actions 至少绿灯一次
- 必做: 当前 Git 仓库是在已有静态包目录中初始化的，旧静态包和实施书大多仍是 untracked；后续需由用户决定是否单独做一次仓库基线提交
- 必做: 3000 和 3001 端口已被占用，本次开发服务验证临时使用 4000 端口
- 可选: 本次 P1.S1 验证时 4000 端口被无响应进程占用，最终改用 4002；后续浏览器验证优先先探测空闲端口
- 可选: 后续运行 `pnpm exec tsc --noEmit` 时避免与 `pnpm exec next build` 并行，迁移路由后并行执行可能读到旧 `.next/types`
- 可选: 浏览器验证时 `/favicon.ico` 返回 404；不影响 P0.S3，后续 SEO / manifest 资产阶段可补齐 favicon
- 可选: `pnpm install --frozen-lockfile` 会提示 `unrs-resolver@1.11.1` build scripts 被 pnpm 忽略；本步安装、lint、typecheck、build 均未受影响，若后续 resolver 出现异常再评估是否需要 `pnpm approve-builds`
- 可选: 当前仓库 hooksPath 已由 Husky 设置为 `yourfield-next/.husky/_`；新环境跑 `pnpm install` / `pnpm prepare` 会重新设置
- 可选: P0.S5 已把旧站 7 个 Inter 字体复制到 `yourfield-next/public/fonts/inter/`；P1 字体本地化时复核即可，不必重复复制
- 可选: P1.S1 已补 `.btn` / `.container` / `.section-header` 旧站通用类；后续迁移若出现稳定间距模式，再沉淀语义 spacing token
- 可选: 旧站通用 class 需要放在普通全局 CSS 中，避免 Tailwind purge 清掉当前页面暂未引用的桥接类
- 可选: Header/Footer 已链接到 P1 后续公开页面（about/products/solutions/news/franchise/contact），当前除 `/<locale>` 外仍会 404，等 P1 页面骨架 Step 创建后自然恢复
- 可选: P1.S2 新增 `footer.policePlaceholder` 三语 key，仅作为公安备案号占位；P5 获取正式公安备案号后再替换
- 可选: P1.S2 发现 `prettier-plugin-tailwindcss` 会整理模板字符串里的 class 拼接，后续动态 class 避免依赖前导空格，优先用数组 `.filter(Boolean).join(' ')`
- 可选: 不要在 dev server 运行期间执行 `pnpm build`；两者共用 `.next` 目录，build 会让正在跑的 dev server 缓存失效并短暂 500，重启 dev server 可恢复
- 必做: 后续 P1 页面和组件必须通过 `@/lib/i18n/useTranslations` / `@/lib/i18n/getTranslations` 读取旧站平铺 key，不要直接从 `next-intl` 取 `useTranslations` / `getTranslations`，否则 `home.industry.power` 这类父子同名 key 会取不到
- 可选: `pnpm script:check-i18n-coverage` 已允许 P1.S5 删除已批准的 `page.contact.introTitle`；执行 Bug 2 时仍需三语同步删除并复跑覆盖检查
- 必做: P1.S4 仅完成 9 个公开页面的 mock 页面骨架，P2/P3 仍需把 mock 数据、public 静态图片、地图占位、新闻/产品内容替换为 Payload / Media / 真实服务数据
- 可选: P1.S5 地图仍是阶段性降级实现：zh 使用静态图 + 高德外链，en/ru 使用 Google iframe + 外链；后续接入真实地图 Key / 服务时再把相关 env 从可空升级为必填
- 可选: P1.S4 已把旧站页面所需图片复制到 `yourfield-next/public/images/` 作为阶段性静态资产；后续 Media 迁移时复核哪些需要进入 Payload Media
- 可选: P2/P3/P4/P5 真正接入 Payload、对象存储、搜索、统计、邮件、地图、CAPTCHA、监控时，把对应 env 变量从“允许为空但校验格式”升级为必填校验

## Phase 进度概览

- [x] P0 — 脚手架与配置基线（本地验收通过；远端 CI 因无 Git remote 未验证）
- [ ] P1 — 骨架迁移（P1.S5 已完成；继续移动端汉堡与视觉验证）
- [ ] P2 — CMS 接入与内容迁移
- [ ] P3 — 搜索 + 数据统计 + SEO
- [ ] P4 — 合规 + 安全 + 性能
- [ ] P5 — UAT + 部署 + 交接
