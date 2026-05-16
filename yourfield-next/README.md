# YourField Next

永霏集团官网 v2 的 Next.js 工程骨架。当前阶段是 P0: 脚手架与配置基线，只交付可运行的空架子，不写业务页面、CMS 逻辑或真实运营内容。

## 项目目标

把当前静态演示包逐步升级为多语言、可由后台运营、自托管、可交接给公司 IT 的企业级官网。实施顺序以仓库根目录的 `AGENT.md`、`STATE.md`、`HANDOFF.md`、`DECISIONS.md` 和 `升级实施书_v2/` 为准。

## 当前状态

- P0.S1-S8 已完成: Next.js / TypeScript / pnpm / i18n / lint / Tailwind / env / CI baseline / 文档骨架。
- 业务页面迁移从 P1 开始，Payload CMS 从 P2 开始。
- GitHub Actions workflow 位于仓库根目录 `.github/workflows/ci.yml`，因为当前 Git 仓库根目录在 `yourfield-next/` 上一层。

## 技术栈

| 类别            | 选择                                             |
| --------------- | ------------------------------------------------ |
| Runtime         | Node.js >= 20 LTS                                |
| Package manager | pnpm 10.28.2                                     |
| Framework       | Next.js 14 App Router                            |
| UI runtime      | React 18                                         |
| Language        | TypeScript 5 strict mode                         |
| i18n            | next-intl 3                                      |
| Styling         | Tailwind CSS 3.4 + legacy CSS variables          |
| Quality         | ESLint, Prettier, Husky, lint-staged, commitlint |

## 本地运行

```bash
cd yourfield-next
pnpm install
cp .env.example .env.local
pnpm dev
```

默认开发地址是 `http://localhost:3000`。如果 3000 端口被占用，可以临时使用:

```bash
pnpm dev -- -p 4000
```

当前 P0 路由验证:

- `/` 会跳转到默认语言。
- `/zh`、`/en`、`/ru` 应返回 200。
- 页面只显示 locale 和少量翻译 key，用于验证 i18n 链路。

## 常用命令

```bash
pnpm dev          # 启动本地开发服务器
pnpm build        # 生产构建
pnpm start        # 启动生产构建后的服务
pnpm lint         # ESLint 检查
pnpm lint:fix     # 自动修复可修复的 lint 问题
pnpm typecheck    # TypeScript 类型检查
pnpm format       # Prettier 格式化
```

P0 交付前建议执行:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm build
```

## 目录结构

```text
yourfield-next/
├── src/
│   ├── app/                 # Next.js App Router
│   ├── blocks/              # Payload blocks, P2 后填充
│   ├── collections/         # Payload collections, P2 后填充
│   ├── components/          # Header/Footer/UI/Product/News/Search/Form/SEO
│   ├── globals/             # Payload globals, P2 后填充
│   ├── lib/                 # i18n/env/payload/search/seo/analytics/utils
│   ├── styles/              # 全局样式、CSS variables、Tailwind layers
│   ├── types/               # 项目共享类型
│   ├── i18n.ts              # next-intl 配置入口
│   ├── middleware.ts        # locale middleware
│   └── payload.config.ts    # P0 stub, P2 正式接入
├── public/
│   ├── fonts/
│   ├── images/
│   └── video/
├── messages/                # 旧站 zh/en/ru 翻译 JSON，key 暂不改名
├── scripts/seed/            # P2 内容迁移脚本
├── tests/                   # P1+ 单元和 e2e 测试
├── docs/                    # ADR、运维、交接等内部文档
└── package.json
```

## 环境变量

复制 `.env.example` 为 `.env.local` 后再启动开发服务。`.env.local` 不入仓。

P0 阶段只强校验当前能确定的基础变量；Payload、数据库、对象存储、搜索、统计、邮件、地图、CAPTCHA、监控等变量会在对应 Phase 接入时升级校验。

代码内不要直接读取 `process.env.XXX`，统一通过 `src/lib/env.ts` 暴露的 `env` 对象。

## 开发边界

- P0 只维护工程骨架、配置、文档，不写公开页面业务逻辑。
- 不修改 `升级实施书_v2/` 原文；若发现文档和实现有差异，记录到根目录 `DECISIONS.md`。
- 不重命名旧站 i18n key，P1/P2 前保持 `messages/*.json` 与旧站一致。
- 新增依赖必须符合实施书锁定技术栈；超出范围先请示用户。
