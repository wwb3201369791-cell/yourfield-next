# 永霏集团企业官网

永霏集团企业官网工程，面向正式上线和后续完整项目仓库维护。项目基于 Next.js App Router 与 Payload CMS，支持多语言公开站、后台内容管理、产品/新闻/解决方案管理、站内搜索、表单提交、统计接入与生产构建部署。

## 技术栈

- Node.js 20+
- pnpm 10.28.2
- Next.js 16 App Router
- React 19
- TypeScript strict mode
- Payload CMS 3
- PostgreSQL
- Express 5 集成服务入口
- Umami
- next-intl
- Tailwind CSS 3.4
- Vitest

## 当前质量状态

最近一次本地质检已完成，当前主质量门状态如下：

- `pnpm audit --prod --audit-level high`：通过，无 Critical / High。
- `pnpm audit --audit-level high`：通过，无 Critical / High。
- `pnpm typecheck`：通过。
- `pnpm lint`：通过。
- `pnpm test`：通过，136 个测试文件 / 509 条测试。
- `pnpm build`：通过，公开站、后台、Payload API、manifest、robots、sitemap 均进入构建输出。
- `pnpm test:e2e:production`：通过。
- 真实点击巡检已覆盖 `/zh`、`/zh/products`、产品详情、`/zh/news`、新闻详情、`/admin` 登录页和移动端菜单。

注意：audit 目前仍可能报告 moderate 级别依赖项；上线阻塞标准是 Critical / High 必须为 0。

## 本地准备

```bash
pnpm install
cp .env.example .env.local
```

根据本机情况修改 `.env.local`。本地环境变量文件不应提交到仓库；本地 Docker 依赖服务也从该文件读取数据库密码和 Umami 本地密钥。

如需完整后台和统计联调，启动本地服务：

```bash
docker compose --env-file .env.local up -d postgres umami
```

默认服务端口：

- App: http://localhost:3000
- PostgreSQL: localhost:5432
- Umami: http://localhost:3002

## 开发启动

推荐使用集成服务启动 Next + Payload：

```bash
pnpm dev
```

也可以启动并预热常用公开页：

```bash
pnpm dev:warm
```

只启动 Next.js 开发服务：

```bash
pnpm dev:next
```

## 常用命令

```bash
pnpm lint          # ESLint 检查
pnpm lint:fix      # 自动修复可修复 lint 问题
pnpm typecheck     # TypeScript 类型检查
pnpm test          # Vitest 测试
pnpm test:e2e      # 关键路径 e2e 脚本，默认跑当前已启动的本地服务
pnpm test:e2e:dev  # 同上，显式用于 dev server
pnpm test:e2e:production # 对 http://localhost:3100 的生产服务跑关键路径 e2e
pnpm build         # 生产构建
pnpm payload:build # 生成 Payload 后台生产资源
pnpm payload:migrate # 执行 Payload 数据库迁移
pnpm payload migrate:status # 查看迁移状态
pnpm start         # 启动生产服务
pnpm payload       # Payload CLI
pnpm seed          # 初始化/补充种子数据
```

上线前建议至少执行：

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm check:env
pnpm payload:migrate
pnpm payload migrate:status
pnpm build
pnpm payload:build
pnpm audit --prod --audit-level high
pnpm audit --audit-level high
```

## 生产运行

生产环境应通过服务器环境变量或 CI/CD secrets 注入配置，不要提交 `.env.local`、真实密码、token、cookie 或密钥。

上线前必须先确认这些必填变量已通过环境注入：

- DATABASE_URI
- PAYLOAD_SECRET
- TURNSTILE_SECRET
- NEXT_PUBLIC_TURNSTILE_SITE_KEY
- CRON_SECRET
- REVALIDATE_SECRET
- PAYLOAD_PREVIEW_SECRET

本地执行 `pnpm check:env` 或 `pnpm build` 时也会触发同一套生产安全门。缺少上述变量时失败是预期保护，不应通过降低校验强度绕过。若只做本地构建验收，请使用 shell-only 临时变量注入一次性 throwaway 值，并确保本地 PostgreSQL 已启动、`DATABASE_URI` 指向可连接的库；不要把这些值写入仓库或提交 `.env.local`。

```bash
export PAYLOAD_SECRET=replace-with-32-plus-char-throwaway
export TURNSTILE_SECRET=replace-with-local-turnstile-test-secret
export NEXT_PUBLIC_TURNSTILE_SITE_KEY=replace-with-local-turnstile-test-site-key
export CRON_SECRET=replace-with-32-plus-char-throwaway
export REVALIDATE_SECRET=replace-with-32-plus-char-throwaway
export PAYLOAD_PREVIEW_SECRET=replace-with-32-plus-char-throwaway
export PAYLOAD_PRIVATE_ROUTES_EXTERNAL_PROTECTION=true
pnpm check:env

# pnpm build 还会读取数据库做静态生成，需先确认本地 Postgres / Docker Compose 服务在线。
pnpm build
```

如启用对象存储，还需完整配置 S3 相关环境变量。

生产后台和 Payload 私有接口必须配置访问保护，至少满足以下一种方式：

- `PAYLOAD_PRIVATE_ROUTES_EXTERNAL_PROTECTION=true`，表示已由 VPN、反向代理、Vercel/Cloudflare 防护或内网策略保护。
- 配置 `PAYLOAD_PRIVATE_ROUTES_BASIC_AUTH_*`。
- 配置 `PAYLOAD_PRIVATE_ROUTES_IP_ALLOWLIST`。

联系表单限流默认不信任 `x-forwarded-for`、`x-real-ip`、`cf-connecting-ip` 等代理头。生产环境如部署在 Cloudflare、Nginx、负载均衡或其他反向代理后面，应先确保入口代理会覆盖或清洗这些真实 IP 头，再设置 `CONTACT_FORM_TRUST_PROXY_HEADERS=true`。如果未启用该设置，表单会使用匿名表单会话 cookie + User-Agent 分桶，避免所有用户共享 `unknown` 限流桶；真实 IP 限流仍是更准确的生产配置。

```bash
pnpm install --frozen-lockfile
pnpm check:env
pnpm payload:migrate
pnpm payload migrate:status
pnpm build
pnpm payload:build
pnpm start
```

代码仓库包含官网源码、静态图片、产品资料源文件、导入脚本和迁移文件；数据库里的后台内容不会仅靠 `git pull` 自动同步。服务器首次部署或换库时，需要在目标数据库执行迁移，并使用 `pnpm seed` / 现有导入脚本补齐产品、新闻、导航、站点设置和媒体记录，或直接恢复同一份数据库备份，前台展示才会与本地一致。

如需用生产服务跑关键路径 e2e，可在另一个端口启动生产服务，避免影响正在开发的 3000 端口：

```bash
PORT=3100 pnpm start
pnpm test:e2e:production
```

Windows PowerShell 可用：

```powershell
$env:PORT='3100'; pnpm start
pnpm test:e2e:production
```

## 数据库迁移

本项目已迁移到 Payload 3，数据库结构包含一批 Payload 3 直连列和认证/session 表迁移。修改 Payload schema、字段命名、relationship、upload 或后台认证相关配置后，需要执行：

```bash
pnpm payload:migrate
pnpm payload migrate:status
pnpm payload:build
pnpm typecheck
```

当前关键迁移包括：

- `20260530_120000_remove_placeholder_news`：移除公开新闻占位内容。
- `20260530_130000_users_payload3_auth_columns`：补齐 Payload 3 用户 `role_id` 和 `users_sessions`。
- `20260530_140000_search_logs_payload3_field_columns`：补齐搜索日志 `event_type` / `result_type`，避免构建期热门搜索查询退回默认值。
- `20260531_090000_backfill_product_display_order_by_group`：按产品大类为旧产品补齐正数展示序号，避免公开首页和产品中心排序漂移。

迁移文件不应删除或合并；后续环境上线前必须在目标数据库跑 `pnpm payload migrate:status` 确认全部 `Ran Yes`。

## 目录结构

```text
./
├── docker/                 # 本地依赖服务初始化配置
├── messages/               # zh/en/ru 多语言文案
├── public/                 # 静态资源、图片、字体、视频
├── scripts/                # 数据导入、备份、质检和工具脚本
├── src/
│   ├── app/                # Next.js App Router，(site) 与 (payload) 分离 root layout
│   │   ├── (site)/         # 公开官网页面、公开 API、站点 layout
│   │   └── (payload)/      # Payload Admin、Payload API、GraphQL
│   ├── blocks/             # Payload blocks
│   ├── collections/        # Payload collections
│   ├── components/         # React 组件，含公开页、产品、搜索和后台 UI
│   ├── globals/            # Payload globals
│   ├── lib/                # CMS 查询、搜索核心、SEO、i18n、业务工具
│   ├── migrations/         # 数据库/Payload 迁移
│   ├── styles/             # 全局样式和后台样式
│   ├── types/              # 共享类型
│   ├── uploads/            # 本地/CMS 上传资源
│   ├── i18n.ts             # next-intl 配置入口
│   ├── proxy.ts            # Next 16 Proxy：CSP、next-intl、旧链接重定向、后台/API 直通
│   ├── payload.config.ts   # Payload CMS 配置
│   ├── payload-types.ts    # Payload 自动生成类型
│   └── server.ts           # Express + Next + Payload 集成入口
├── tests/                  # API、unit、e2e 和截图基线测试
├── docker-compose.yml
├── next.config.js
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
└── vitest.config.ts
```

## 命名规范

- App Router 文件使用 Next.js 约定：`page.tsx`、`layout.tsx`、`route.ts`、`loading.tsx`、`error.tsx`、`not-found.tsx`。
- 路由目录、脚本、CSS、测试和资源文件优先使用小写 kebab-case。
- React 组件文件使用 PascalCase，例如 `ProductCard.tsx`。
- Payload collections/globals/blocks 使用 PascalCase，例如 `Products.ts`、`SiteSettings.ts`、`ContactBlock.ts`。
- 业务工具函数文件可使用 camelCase，例如 `buildMetadata.ts`、`productDetail.ts`。
- 静态图片和视频使用小写 kebab-case，避免中文、空格和特殊符号。

## 重要约定

- 代码中不要直接读取 `process.env.X`，统一通过 `src/lib/env.ts` 暴露的 `env` 对象读取环境变量。
- `src/payload-types.ts` 是 Payload 自动生成文件，不要手动修改。
- `.env.local`、构建产物、缓存目录和依赖目录不应提交。
- 新增环境变量时同步更新 `.env.example` 和 `src/lib/env.ts`。
- 修改 Payload schema 后需要同步生成类型并验证后台功能。
- Payload Admin 会渲染自己的 `<html>/<body>`，必须保留在 `src/app/(payload)` 独立 root layout 下；公开官网保留在 `src/app/(site)`，不要把两者合回同一个 root layout。
- Next 16 使用 `src/proxy.ts`，不要新增旧版 `src/middleware.ts`。
- 公开页面发布前应检查用户可见文本，不能出现“示例：”“待补充”“TODO”“lorem ipsum”等占位内容。
- 后台和 Payload API 默认路径不能被 next-intl 加语言前缀；如调整路径，需要同步更新 `src/proxy.ts` matcher 和直通逻辑。

## 后台入口

默认后台地址：

```text
/admin
```

本地或生产预览后台时，请使用集成服务启动方式（`pnpm dev` 或 `pnpm start`），不要只用 `pnpm dev:next` 验证后台。

Payload API 默认地址：

```text
/payload-api
```

GraphQL 默认地址：

```text
/payload-graphql
```
