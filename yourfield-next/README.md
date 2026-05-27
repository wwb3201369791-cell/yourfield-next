# 永霏集团企业官网

永霏集团企业官网工程，面向正式上线和后续独立仓库维护。项目基于 Next.js App Router 与 Payload CMS，支持多语言公开站、后台内容管理、产品/新闻/解决方案管理、站内搜索、表单提交、统计接入与生产构建部署。

## 技术栈

- Node.js 20+
- pnpm 10.28.2
- Next.js 14 App Router
- React 18
- TypeScript strict mode
- Payload CMS 2
- PostgreSQL
- Umami
- next-intl
- Tailwind CSS 3.4
- Vitest

## 本地准备

```bash
pnpm install
cp .env.example .env.local
```

根据本机情况修改 `.env.local`。本地环境变量文件不应提交到仓库。

如需完整后台和统计联调，启动本地服务：

```bash
docker compose up -d postgres umami
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
pnpm build
pnpm payload:build
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

如启用对象存储，还需完整配置 S3 相关环境变量。

```bash
pnpm install --frozen-lockfile
pnpm check:env
pnpm build
pnpm payload:build
pnpm start
```

如需用生产服务跑关键路径 e2e，可在另一个端口启动生产服务，避免影响正在开发的 3000 端口：

```bash
PORT=3100 pnpm start
pnpm test:e2e:production
```

## 目录结构

```text
yourfield-next/
├── docker/                 # 本地依赖服务初始化配置
├── messages/               # zh/en/ru 多语言文案
├── public/                 # 静态资源、图片、字体、视频
├── scripts/                # 数据导入、备份、质检和工具脚本
├── src/
│   ├── app/                # Next.js App Router 页面和 API
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
│   ├── middleware.ts       # 多语言中间件和旧链接重定向
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

## 后台入口

默认后台地址：

```text
/admin/
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

## 独立仓库说明

本目录可作为独立项目仓库管理。独立成仓库时，应以当前目录作为 Git 根目录，并保留 `package.json`、`pnpm-lock.yaml`、`.env.example`、`public/`、`src/`、`scripts/`、`tests/` 和部署所需配置文件。
