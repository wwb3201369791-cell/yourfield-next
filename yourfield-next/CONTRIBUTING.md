# Contributing

本仓库采用 agent 接力模式。每次开工前先读仓库根目录 `AGENT.md`，再按 `STATE.md` 的 Next 只做一个 Step。

## 工作顺序

1. 读 `AGENT.md`、`升级实施书_v2/README.md`、`05-Roadmap.md`、`STATE.md`、`HANDOFF.md`、`DECISIONS.md`。
2. 只执行 `STATE.md` 标记的一个 Step。
3. 修改前先理解现有结构和当前 Phase 的验收要求。
4. 完成后运行对应验收命令。
5. 更新 `STATE.md`、覆盖 `HANDOFF.md`，必要时追加 `DECISIONS.md`。
6. 按 Conventional Commits 提交。

## 分支命名

推荐格式:

```text
<type>/<phase>-<short-desc>
```

示例:

```text
feat/p1-layout-migration
chore/p0-docs-baseline
fix/p1-header-dropdown
```

当前远程仓库尚未接入，分支保护和 PR 必须 CI 通过需要等 Git remote 配好后启用。

## Commit 规范

使用 Conventional Commits:

```text
<type>(<scope>): <summary>
```

常用 type:

- `feat`: 新功能
- `fix`: 修复
- `docs`: 文档
- `style`: 格式或样式，不改变行为
- `refactor`: 重构，不改变行为
- `test`: 测试
- `chore`: 工程配置、依赖、脚本
- `ci`: CI 配置

常用 scope:

- `p0`, `p1`, `p2`, `p3`, `p4`, `p5`
- `i18n`, `seo`, `payload`, `search`, `forms`, `ci`

示例:

```text
docs(p0): add documentation baseline
feat(p1-header): migrate public header
chore(p0-env): add environment variable validation
```

禁止使用 `--no-verify`、`--amend`、`--force` 等绕过或改写历史的操作，除非用户明确授权。

## 代码规范

- TypeScript 使用 strict mode。
- 不使用 `any`，确实需要时先收窄类型或补充类型定义。
- 不保留 `console.log` / `debugger`。
- 公开 `lib/` 导出函数和组件 Props 写 TSDoc。
- 默认少写注释；只有非显然业务规则、workaround、性能或安全相关逻辑需要注释。
- TODO 必须带 Phase 或责任人，例如 `TODO(P3): ...`。

## 样式规范

- P0 已选择 Tailwind CSS 3.4。
- 旧站品牌 token 保留在 `src/styles/variables.css`，Tailwind 通过 `tailwind.config.js` 映射。
- P1 页面迁移时优先复用旧站视觉，不随意改整体设计语言。

## i18n 规范

- 当前支持 `zh`、`en`、`ru`。
- `messages/*.json` 从旧站复制而来，P1 前不要重命名 key。
- 旧站扁平 key 会在 `src/lib/i18n/messages.ts` 中展开给 `next-intl` 使用。

## 环境变量与密钥

- `.env.local` 不入仓。
- 不把密钥、token、密码、Cookie 写进代码、文档或提交记录。
- 新增环境变量时同步更新 `.env.example` 和 `src/lib/env.ts`。
- 涉及账号、权限、付费服务、生产数据或不可逆操作，先请示用户。

## 提交前检查

P0 阶段至少执行:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

若改了依赖或 lockfile，再执行:

```bash
pnpm install --frozen-lockfile
```

如果涉及 UI，P1 起还要做桌面和移动端浏览器验证，并保留截图给用户验收。

## PR 规范

PR 使用仓库根目录 `.github/pull_request_template.md`。必须说明:

- 关联 Phase / 任务
- 改了什么
- 怎么测的
- 验收命令结果
- 自决项和 BLOCKING
- UI 截图，若涉及页面效果

单个 PR 只对应一个 Step，不跨 Step 混改。
