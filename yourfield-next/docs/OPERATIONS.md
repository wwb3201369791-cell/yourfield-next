# OPERATIONS

本文件是运维手册占位。P5 阶段会补齐部署、回滚、备份、恢复、监控告警和应急联系人。P0 阶段只记录当前工程骨架的本地运行与验证方式。

## 当前阶段

- 当前 Phase: P0 脚手架与配置基线。
- 当前能力: Next.js 空架子、三语 locale 路由、基础 lint/typecheck/build、GitHub Actions 本地配置。
- 尚未接入: Payload CMS、PostgreSQL、对象存储、Meilisearch、Umami、邮件、地图、CAPTCHA、监控、部署脚本。

## 本地启动

```bash
cd yourfield-next
pnpm install
cp .env.example .env.local
pnpm dev:warm
```

`pnpm dev:warm` 会启动本地开发服务并预热公开页顶部导航常用路由，适合本地质检时使用，避免首次点击页面才触发冷编译。

如果只需要启动底层开发服务、不做页面预热:

```bash
pnpm dev
```

健康检查方式:

```bash
curl -sI http://localhost:3000/zh
curl -sI http://localhost:3000/en
curl -sI http://localhost:3000/ru
```

## 产品可视化编辑器

产品编辑运营说明见 [`PRODUCT_EDITOR.md`](./PRODUCT_EDITOR.md)。

核心入口:

```text
/admin/collections/products
/admin/collections/products/:id?view=classic
```

- 默认编辑页为产品可视化编辑器。
- `?view=classic` 保留 Payload 原生表单逃生口。
- 图片字段不再限制 20 张；30+ 图片建议在经典表单中用 Payload 原生上传控件维护。

## 生产构建验证

```bash
cd yourfield-next
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm build
pnpm start
```

`pnpm start` 需要先完成 `pnpm build`。

## CI

当前有效的 GitHub Actions workflow 在仓库根目录:

```text
.github/workflows/ci.yml
```

workflow 会在 `yourfield-next/` 工作目录中执行:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm build
```

远程 Git 仓库尚未配置，因此 GitHub Actions 远端绿灯还未验证。

## 环境变量

- 示例文件: `.env.example`
- 本地实际文件: `.env.local`
- `.env.local` 不入仓。
- 生产环境应通过 CI/CD secrets 或服务器环境变量注入。

P0 阶段允许未来服务密钥为空；P2-P5 接入对应服务时再升级为必填校验。

## 部署

P0 暂不部署。P5 阶段补齐:

- 预发布环境部署步骤
- 生产部署步骤
- CI/CD 触发条件
- 环境变量注入方式
- 域名和 SSL 配置

## 回滚

P0 暂无生产回滚流程。P5 阶段补齐:

- 应用版本回滚
- 数据库回滚或恢复
- 对象存储媒体恢复
- DNS / CDN 故障切换

## 备份与恢复

P0 暂未接入数据库和对象存储。P4/P5 阶段补齐:

- PostgreSQL 备份脚本
- PostgreSQL 恢复脚本
- 媒体文件备份策略
- 恢复演练记录

## 监控告警

P0 暂未接入监控。P4/P5 阶段补齐:

- 错误监控
- Uptime 监控
- 搜索服务监控
- 数据库慢查询监控
- 告警接收人和告警渠道

## 应急原则

- 不在仓库里写入密钥、密码、token 或私密配置。
- 不在未确认的情况下删除生产数据、重置数据库或覆盖媒体文件。
- 遇到生产事故时，先保护现场和日志，再执行回滚或恢复。
- 无法确认影响范围时，先停下并请示用户。
