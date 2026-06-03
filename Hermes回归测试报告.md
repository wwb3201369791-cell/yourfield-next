# Hermes 本地回归测试报告

生成时间：2026-06-03
项目路径：`D:\code\永霏网站项目\site-demo-背景视频\yourfield-next`
测试基准分支：`deploy/payload-admin-host-hardening-20260601-181051`（本地 ahead 1）

## 1. 总体结论

本轮已完成本地自动化质量门、生产构建、Payload 迁移状态、公开站/API/Admin 本地 smoke、桌面与移动端浏览器回归、表单真实提交与清理。

结论：本地主要质量门通过；追加的 production-mode 端口 3100 smoke 也已通过。当前同步服务器前仍需用户确认的主要风险收敛为静态资产体积：

1. `pnpm script:perf-check` 在本地 dev 模式默认 5s timeout / 2.5s threshold 下失败；但追加 production-mode `http://localhost:3100` 复测已通过默认阈值，6 个路径均 200，耗时约 2115ms - 2199ms，未再复现 dev 模式 23s 并发慢请求。
2. 静态资产审计显示 `873.39MB / 667 files`，超过脚本预算。考虑到项目约定要求保留媒体原图/高质量素材，本项不建议通过压缩牺牲画质解决，但上线前应确认服务器磁盘、传输、CDN/缓存策略。

除上述风险外，本轮修复了 3 个真实问题：

- 开发依赖 audit 出现 Vitest critical 漏洞，已升级到 Vitest 4.1.0 并补齐兼容测试。
- `/payload-api` 裸路径从 500 修复为 404 Route not found，具体 Payload REST 端点仍 200。
- 首页/产品页产品卡引用的 `/media/file/1-28.png` 缺失，已补齐对应 Payload upload 派生文件，浏览器回归中 404 消失。

当前不建议无确认直接同步服务器；如果用户接受静态资产 over budget 作为部署/缓存策略风险，并确认当前工作树改动纳入同步范围，可以进入服务器同步。同步后仍必须复核服务器 health、migrations、PM2/current、公开页、表单、Admin。

## 2. 阻塞问题与风险分级

### Critical

无。

已修复的 Critical：

- 标题：开发依赖 `vitest < 4.1.0` audit critical 漏洞。
- 证据：`pnpm audit --audit-level high` 初始失败，GHSA-5xrq-8626-4rwp。
- 修复：`vitest` 升级到 `4.1.0`，补齐直接依赖 `vite 7.3.5`，修复 Vitest 4 兼容测试。
- 验证：`pnpm audit --audit-level high` 通过，仅剩 2 个 moderate。
- 涉及文件：`package.json`、`pnpm-lock.yaml`、相关测试文件。

### High

无未修复 High。

已修复的 High：

1. 标题：公开产品卡引用缺失媒体 `/media/file/1-28.png`。
   - 复现路径：`/zh`、`/zh/products`。
   - 初始证据：Playwright 浏览器回归捕获 404：`http://localhost:3000/media/file/1-28.png`。
   - 影响：核心产品卡主图破图，违反“产品卡必须使用真实主图，不用文字/图标兜底”的交付要求。
   - 修复：基于现有官方产品原图 `public/images/products/official/arc-flash-suit-level-1-shirt-01.png` 生成并补齐 Payload media 期望的 `src/uploads/1-28*.png` 文件。
   - 验证：`/media/file/1-28.png`、`/media/file/1-28-200x200.png`、`/payload-api/media/file/1-28.png` 均返回 200；重跑浏览器 smoke 后公开站 404 消失。

2. 标题：Payload REST 裸 API `/payload-api` 返回 500。
   - 复现路径：`GET /payload-api`。
   - 初始证据：dev server 日志报 `TypeError: Cannot read properties of undefined (reading 'map')`。
   - 影响：API 健康巡检或安全审查访问裸路径会看到 500，容易误判 Payload API 整体异常。
   - 根因：Payload Next REST handler 在 optional catch-all root 下收到 `{ slug: undefined }` 后直接调用 `slug.map(...)`。
   - 修复：在 `src/app/(payload)/payload-api/[[...slug]]/route.ts` 包一层 `normalizeRootSlug`，将空 slug 归一为 `[]` 后再交给 Payload handler。
   - 验证：新增 `tests/unit/payload-api-root-route.test.ts`；`GET /payload-api` 当前返回 404 `Route not found "/payload-api/"`，不再 500；`/payload-api/products?limit=1` 仍 200。

### Medium

1. 标题：默认本地 dev 性能脚本失败；production-mode 复测通过。
   - 复现命令：`pnpm script:perf-check`。
   - dev 模式结果：默认 `timeoutMs=5000` 下失败；放宽 `PERF_CHECK_TIMEOUT_MS=30000 PERF_CHECK_THRESHOLD_MS=30000` 后可通过，但并发路径耗时约 23s。
   - 追加复测：启动 production-mode `http://localhost:3100` 后执行 `PERF_CHECK_BASE_URL=http://localhost:3100 pnpm script:perf-check`，默认 5s timeout / 2.5s threshold 通过。
   - production-mode 结果：`/zh` 2199ms、`/en` 2133ms、`/ru` 2136ms、`/zh/products` 2120ms、`/zh/news` 2121ms、`/zh/search` 2115ms，均 200 且低于默认阈值。
   - 影响：dev 模式慢请求不再作为同步前阻塞，但服务器同步后仍需在 canonical domain 复核性能与缓存。
   - 建议：同步服务器后复核 PM2/current、canonical health 与公开页首轮/预热后响应。

2. 标题：静态资产总量超过审计预算。
   - 复现命令：`pnpm script:asset-audit`。
   - 结果：`static asset audit: 873.39MB across 667 files (over budget)`。
   - 影响：上线包、服务器磁盘、备份和 CDN 首次分发成本偏高。
   - 建议：不压缩产品原图前提下，确认是否将大素材交由对象存储/CDN，或拆分非首屏/非必要演示素材。

3. 标题：联系页第三方地图 iframe 内存在缺失翻译的可访问名称。
   - 复现路径：`/zh/contact`。
   - 证据：浏览器无障碍树显示 iframe 内按钮名：`[missing "zh-CN.javascripts.map.marker.title" translation]`。
   - 影响：主要 UI 不受影响，但屏幕阅读器/可访问性审查会看到第三方地图控件缺失翻译。
   - 建议：如可配置 OSM/Leaflet marker title，则补齐中文 title；否则在报告中标记为第三方 iframe 限制。

### Low

1. 浏览器自动化快速跳转时出现 `net::ERR_ABORTED`：
   - `/zh/news/may-day-safety-inspection` 中 `hero-campus-background-loop.mp4` 被后续导航中断；页面本身 200，新闻详情视频控件可见。
   - `/zh/contact` 中 OpenStreetMap iframe 被后续导航中断；页面本身 200，地图区域可见。
   - Payload Admin 自动化快速跳转期间若干后台 API 请求被 `ERR_ABORTED`，但 `/admin`、产品、新闻、咨询表单列表均 200 且没有可见 request failed/500。按 dev 模式快速导航中断处理，不作为当前阻塞。

## 3. 验证命令结果

| 命令                                                                    | 结果 | 摘要                                                                                           |
| ----------------------------------------------------------------------- | ---- | ---------------------------------------------------------------------------------------------- |
| `pnpm lint`                                                             | 通过 | ESLint 0 error。                                                                               |
| `pnpm typecheck`                                                        | 通过 | `tsc --noEmit` 通过。                                                                          |
| `pnpm test`                                                             | 通过 | 159 个测试文件 / 613 条测试通过。                                                              |
| `pnpm audit --prod --audit-level high`                                  | 通过 | 仅剩 2 个 moderate，无 critical/high。                                                         |
| `pnpm audit --audit-level high`                                         | 通过 | 仅剩 2 个 moderate，无 critical/high。                                                         |
| `pnpm check:env`                                                        | 通过 | 使用 shell-only 本地验证变量，未写入仓库。                                                     |
| `pnpm payload migrate:status`                                           | 通过 | 所有迁移均 `Ran Yes`。                                                                         |
| `pnpm build`                                                            | 通过 | Next 16.2.6 production build 成功，137 个静态页面生成成功。                                    |
| `pnpm payload:build`                                                    | 通过 | import map 无新增；Payload types 已生成。                                                      |
| `pnpm script:check-i18n-coverage`                                       | 通过 | 1018 个 zh/en/ru key 对齐。                                                                    |
| `pnpm script:asset-audit`                                               | 风险 | 873.39MB / 667 files，over budget。                                                            |
| `pnpm script:verify-home-hero`                                          | 通过 | `home hero smoke OK: http://localhost:3000/zh`。                                               |
| `PERF_CHECK_BASE_URL=http://localhost:3100 pnpm script:perf-check`      | 通过 | production-mode 6 个路径均 200，耗时约 2115ms - 2199ms，低于默认 2.5s 阈值。                   |
| `HOME_HERO_BASE_URL=http://localhost:3100 pnpm script:verify-home-hero` | 通过 | production-mode 首页背景视频 smoke 通过。                                                      |
| `pnpm test:e2e:production`                                              | 通过 | `E2E critical paths OK: http://localhost:3100`。                                               |
| `node .tmp/production-admin-smoke.mjs`                                  | 通过 | production-mode Admin 登录后 `/admin`、产品、新闻、咨询表单列表均 200。                        |
| `pnpm script:perf-check`                                                | 风险 | dev 模式默认 5s timeout 超时；production-mode 已通过，服务器同步后需在 canonical domain 复核。 |
| `git diff --check`                                                      | 通过 | 无 whitespace error，仅 Git Bash CRLF 警告。                                                   |

## 4. 浏览器回归结果

### 桌面 1440x900 覆盖

通过或已修复后通过：

- `/zh`：200，首页首屏正常，背景视频/poster 区域可见，导航无遮挡；Cookie 弹窗可关闭/接受。
- `/en`：200。
- `/ru`：200。
- `/zh/about`：200。
- `/zh/products`：200；修复后不再请求缺失的 `/media/file/1-28.png`。
- `/zh/products/dry-water-rescue-suit-hyf-9905`：200；产品详情 H1、型号 HYF-9905、图册、参数、CTA 可见。
- `/zh/solutions`：200。
- `/zh/news`：200。
- `/zh/news/may-day-safety-inspection`：200；新闻详情视频控件可见。
- `/zh/franchise`：200。
- `/zh/contact`：200；表单加载、必填/格式校验、隐私勾选、成功提示验证完成。
- `/zh/search?q=消防`：200；5 条结果，产品/解决方案筛选显示正常。
- `/zh/privacy`、`/zh/terms`、`/zh/cookies`：200。
- `/sitemap.xml`、`/robots.txt`、`/manifest.webmanifest`：可访问。

交互验证：

- 首页：浏览器视觉检查未见白屏、首屏破图、导航遮挡或明显布局溢出；“观看完整视频”按钮可点击且无控制台错误。
- 搜索：Header 搜索输入“消防”出现建议列表，点击搜索后进入全站搜索页，展示 5 条结果。
- 联系表单：
  - 空/错误邮箱/未勾选隐私时显示“信息不完整或格式不规范，请补充后重新提交。”
  - 使用本地测试数据提交后显示“后台已收到咨询；邮箱已为您打开，请在邮件客户端确认发送。”
  - 本地测试表单记录已清理：匹配 1 条，删除 1 条，剩余 0 条。

### 移动端 390x844 覆盖

- `/zh`：200。
- 移动菜单按钮存在，aria 为“打开导航菜单”。
- 点击后页面内容状态发生变化，菜单交互可用。
- 移动端 smoke 未捕获 console error 或同源 4xx/5xx。

### Payload Admin 覆盖

已通过登录并检查：

- `/admin`：200，标题“仪表板 - 永霏网站后台”，无登录页回退。
- `/admin/collections/products`：200，标题“产品 - 永霏网站后台”，无可见 request failed/500。
- `/admin/collections/news`：200，标题“新闻动态 - 永霏网站后台”，无可见 request failed/500。
- `/admin/collections/form-submissions`：200，标题“咨询表单 - 永霏网站后台”，无可见 request failed/500。

### Production-mode 3100 追加覆盖

- `pnpm start` 以 production-mode 临时启动在 `http://localhost:3100` 后，`/api/health` 返回 200，database ok。
- `PERF_CHECK_BASE_URL=http://localhost:3100 pnpm script:perf-check` 通过默认阈值：6 个路径均 200，耗时约 2115ms - 2199ms。
- `HOME_HERO_BASE_URL=http://localhost:3100 pnpm script:verify-home-hero` 通过。
- `pnpm test:e2e:production` 通过，覆盖首页/语言切换、产品列表/详情、搜索、联系表单 mock 提交。
- production-mode Payload/API smoke 通过：`/payload-api` 404 非 500，`/payload-api/globals/site-settings` 200，`/payload-api/products?limit=1` 200，`/payload-graphql` POST 200。
- production-mode Admin 登录后 `/admin`、产品、新闻、咨询表单列表均 200。
- `/media/file/1-28.png` 在 production-mode 返回 200 image/png。

## 5. 国际化 / 内容 / CMS / 媒体资产检查

- i18n key 覆盖：`pnpm script:check-i18n-coverage` 通过，1018 个 key 对齐。
- 三语首页 `/zh`、`/en`、`/ru` 均 200。
- 浏览器公开页扫描未在页面可见文本中发现 `示例：`、`待补充`、`TODO`、`placeholder`、`lorem ipsum`。
- 产品/新闻详情使用真实 CMS 数据和媒体，不再出现本轮发现的产品卡主图 404。
- 需要继续关注：资产总量 over budget；法务/备案/隐私终稿仍需用户和法务确认。

## 6. 安全 / 隐私 / 上线配置检查

- `.env.local` 未打印真实值，所有生产验证变量通过 shell-only 临时注入。
- `check:env` 通过，说明生产必需 secret、后台保护声明、数据库连接等校验链路正常。
- `payload migrate:status` 全部 Ran Yes。
- `pnpm audit --prod --audit-level high` 与全量 audit high 均通过，无 critical/high。
- `/api/health` 返回 200，`ok: true`，`checks.database.ok: true`。
- `/payload-api/products?limit=1` 返回 200。
- `/payload-api` 裸路径已从 500 修复为非 500 的 404。
- `/payload-graphql` GET 返回 405；POST `{ __typename }` 返回 200，符合 GraphQL POST 预期。
- 联系表单校验、隐私勾选、成功提示已通过本地真实浏览器验证。

## 7. 性能和体验风险

1. dev 模式默认 perf-check 曾失败；production-mode `http://localhost:3100` 已通过默认阈值，服务器同步后仍需在 canonical domain 复核。
2. 静态资产体积较大，应确认对象存储/CDN/缓存策略，而不是直接压缩产品图。
3. Cookie 弹窗首屏会覆盖部分主视觉区域，但可接受/拒绝/关闭；视觉检查未发现导航遮挡或白屏。
4. 联系页地图 iframe 的第三方控件缺失翻译，建议作为可访问性 polish。

## 8. 测试覆盖缺口

已覆盖：

- API：health、forms submit、search、search suggest/click、preview、revalidate。
- 单元：home hero/video、localized videos、news card featured video、admin i18n、Payload private route protection、CSP/middleware、产品详情和 Payload schema 等。
- 新增：Payload REST optional catch-all root slug 归一测试。

建议补充：

1. 增加公开产品卡媒体可达性测试：扫描首页/产品页所有 `/media/file/*` 图片 URL，断言 200。
2. 增加 Playwright 级别移动菜单/语言切换/搜索建议 E2E。
3. 增加 Admin 登录后核心 collection 列表无 request failed 的 smoke 脚本。
4. 增加 production-mode perf-check 或可配置阈值，避免 dev 冷启动/并发编译误报。

## 9. 建议修复顺序

1. 已完成本地 production-mode 3100 smoke，默认 perf-check 通过；下一步如用户同意，可进入服务器同步。
2. 同步前确认新增 `src/uploads/1-28*.png` 必须进入服务器；如果服务器同样缺失，将直接影响产品卡主图。
3. 确认静态资产部署策略：保留高质量原图，但考虑 CDN/对象存储/缓存。
4. 处理联系页地图 iframe marker title 缺失翻译（低优先级）。
5. 用户同意后，再进入服务器同步与生产 smoke；同步后必须复核 health、migrations、PM2/current、公开页、表单、Admin。

## 10. Git 状态和交付说明

本轮没有 commit、没有 push、没有同步服务器。

本轮新增/修改中属于本次回归修复的主要文件：

- `package.json`
- `pnpm-lock.yaml`
- `src/app/(payload)/payload-api/[[...slug]]/route.ts`
- `tests/unit/payload-api-root-route.test.ts`
- `tests/api/forms-submit.test.ts`
- `tests/api/search.test.ts`
- `tests/unit/admin-operations-dashboard.test.ts`
- `tests/unit/payload-private-route-protection.test.ts`
- `tests/unit/public-draft-mode.test.ts`
- `src/uploads/1-28.png`
- `src/uploads/1-28-200x200.png`
- `src/uploads/1-28-600x400.png`
- `src/uploads/1-28-1024x768.png`
- `src/uploads/1-28-480x640.png`
- `src/uploads/1-28-1200x630.png`

本轮前已存在且未归因给本轮修复的改动：

- `Hermes回归测试.md`
- 删除的 `Hermes质检报告.md`
- `messages/en.json`
- `messages/ru.json`
- `messages/zh.json`

生成文件状态：

- `next-env.d.ts` 被 Next build 更新为 `.next/types/routes.d.ts` 引用。
- `src/payload-types.ts` 被 `pnpm payload:build` 重新格式化/生成。

临时说明：

- `.tmp/regression-browser-smoke.mjs`、`.tmp/regression-browser-smoke.json`、`.tmp/production-admin-smoke.mjs` 和 `.tmp/yf_3100_admin.html` 已删除。
- `.tmp/static-assets-audit.*` 由资产审计脚本生成，位于 ignored 临时目录，不会进入 Git。
- 本地 QA 用 dev/prod server 均已停止；端口 3000、3100 当前无监听服务。
