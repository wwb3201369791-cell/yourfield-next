# 2026-05-30 依赖安全漏洞修复计划

## 背景

`pnpm audit --audit-level high` 报告 Critical/High 漏洞，影响 Payload、Next、Express、AWS SDK / fast-xml-parser 等生产依赖链。项目生产启动会把 Express、Payload、Next 挂在同一服务，后台 `/admin`、Payload API、GraphQL 具备真实暴露面。

## 目标

- 消除生产依赖中的 Critical / High audit 项。
- 升级或替换直接引入漏洞链的依赖：Payload、Next、Express、AWS SDK。
- 补充后台和 Payload API 的临时访问控制，降低公网暴露风险。
- 保持现有站点、后台、上传、搜索、预览、revalidate 等关键功能可构建、可测试。

## Scope

- `package.json` / `pnpm-lock.yaml`
- `src/server.ts`
- `src/payload.config.ts` 及 Payload v3 必要迁移点
- `next.config.js` / Next 16 必要迁移点
- `.env.example`、`src/lib/env.ts`、README 的安全配置说明
- 聚焦必要测试，不做无关 UI 和内容改版

## Invariant

- 不降低已有认证、权限、CSRF、CORS、上传限制和审计逻辑。
- 不删除生产数据、迁移文件、用户素材或原始上传。
- 后台保护默认在生产可启用；本地开发不应被无谓阻断。
- 所有新增环境变量必须同步 `.env.example` 和 `src/lib/env.ts`。

## 实施清单

1. 升级依赖：Payload 3 安全线、Next 16 安全线、Express 5 / 安全路由、AWS SDK 最新线。
2. 调整 Next 配置：`serverComponentsExternalPackages` 迁移到 `serverExternalPackages`，保留构建 worker 配置。
3. 调整 Express 5 catch-all 路由语法。
4. 添加后台/API 网络访问控制中间件：支持 Basic Auth 和 IP allowlist，覆盖 `/admin`、Payload API、GraphQL、Playground。
5. 修复大版本迁移带来的类型/构建错误。
6. 运行验证命令并记录结果。

## 验证命令

```bash
pnpm audit --prod --audit-level high
pnpm typecheck
pnpm test
pnpm build
pnpm payload:build
```

## 实际结果

- 已升级 Payload 到 3.85.0、Next 到 16.2.6、Express 到 5.2.1、AWS SDK 到 3.1057.0，并更新 `pnpm-lock.yaml`。
- 已移除 Payload 2 的 webpack bundler 路径，迁移到 Payload 3 App Router routes、import map、`getPayload({ config })` local API、`@payloadcms/storage-s3`。
- 已新增生产后台/Payload 私有路由保护：Basic Auth、IP allowlist、可信代理头、外部 VPN/反代保护声明。
- 已让生产环境缺少 Turnstile、cron/revalidate/preview secret 或后台保护时启动/构建失败，避免公网裸露后台。
- 已迁移 Next 16 异步路由 API、`revalidateTag(tag, 'max')`、ESLint 9 flat config，并删除不再需要的 `src/pages` Pages Router 特殊页。
- 已修复 Payload 3 import map、admin route、collection admin component 字符串引用、测试 mock 以及 React 19 JSX 自动运行时的未使用 React 导入。

## 验证记录

- `pnpm audit --prod --audit-level high`：通过；仅剩 2 个 moderate，无 Critical/High。
- `pnpm audit --audit-level high`：通过；仅剩 4 个 moderate，无 Critical/High。
- `pnpm payload:build`：通过；已生成 `src/app/(payload)/admin/importMap.js` 和 `src/payload-types.ts`。
- `pnpm typecheck`：通过。
- `pnpm lint`：通过。
- `pnpm test`：通过，127 个测试文件 / 494 个测试。
- `pnpm build`：生产安全校验按预期阻断，缺少 `TURNSTILE_SECRET`、`NEXT_PUBLIC_TURNSTILE_SITE_KEY`、`CRON_SECRET`、`REVALIDATE_SECRET`、`PAYLOAD_PREVIEW_SECRET` 和后台保护配置。
- `SKIP_ENV_VALIDATION=true pnpm build`：代码编译和 TypeScript 通过；页面数据收集阶段被本机数据库 schema 阻断，`news.cover_id` 缺列。
- `pnpm payload migrate:status`：只读检查通过；确认多条迁移未执行，包含 `20260530_000000_news_featured_media`，解释了 `news.cover_id` 缺列。

## 剩余风险 / 上线前动作

- 上线前必须配置生产 secret 和后台保护变量；不能依赖 `SKIP_ENV_VALIDATION=true` 运行生产。
- 上线前必须在目标数据库执行并验证待执行 Payload 迁移，尤其是新闻 featured media 相关迁移。
- Next 16 构建提示 `middleware` 文件约定已弃用，后续可单独把 `src/middleware.ts` 迁移到 `proxy`，本次未作为安全漏洞修复范围处理。
- Payload CLI 提示图片处理需要显式安装/传入 `sharp`；当前依赖已有 `sharp`，但 Payload 配置尚未传入，后续可单独优化图片 resize 配置。

## Rollback

如 Payload 3 迁移无法在当前会话内稳定通过，回滚路径是：保留后台/API 网络访问控制，依赖升级拆分为 Next/AWS/Express 小步提交，Payload 3 单独新分支迁移。

## 状态

已完成代码与依赖安全修复；生产构建剩余阻断为环境密钥和本机数据库迁移状态，未自动执行数据库迁移。
