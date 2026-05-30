# Hermes 执行文档：终局托管执行版

## 目标

从当前状态继续执行，一口气把项目跑到最终可交付状态。中途不要再写阶段性汇报，不要因为小疑问停下来问用户；能自行判断的全部自行判断并执行。最终只允许输出一份完成后的 `Hermes质检报告.md`。

最终状态必须是：

- 代码问题已修完。
- 全量验证已跑完。
- 生产 smoke test 已跑完。
- 临时文件已清理。
- 敏感信息已排查。
- Git 提交切片建议已给出。
- 没有直接提交代码。

## 当前最新状态

根据最新 `Hermes质检报告.md`，目前已经完成：

- 后台英文化残留已大幅清理，`src/components/admin/**/*.tsx` 已没有裸露中文 JSX 文本节点。
- 首页 / 新闻视频语言映射已复核，fallback 指向真实存在的视频文件。
- 临时 helper `scripts/tmp-local-prod-env.sh` 已删除。
- 多个临时输出已清理。
- 敏感信息扫描已推进，硬编码本地密码模式已修复。
- 合规页面里的开发期 TODO / skeleton / placeholder draft 已替换为正式状态说明。
- `typecheck`、脚本类型检查、定向视频测试、`git diff --check` 已通过过。

目前还没完成，必须继续做完：

- 重新跑最新状态下的 `pnpm lint`。
- 跑全量 `pnpm test`。
- 跑 `pnpm check:env`。
- 跑 `pnpm build`。
- 跑 `pnpm payload:build`。
- 启动生产服务并完成 smoke test。

## 执行原则

### 不要中途汇报

执行期间不要再写“已推进但未完成”的阶段性报告。除非遇到不可绕过的硬阻塞，否则继续修、继续跑、继续验。

硬阻塞只包括：

- 本地数据库完全不可用，且无法通过现有环境变量、Docker 容器信息或安全的 shell-only 临时变量恢复验证。
- Docker 服务不可用，且当前环境无法启动。
- 缺少必须文件，且无法从项目已有文件恢复。
- 外部服务必须登录、付费、授权或需要用户真实账号操作。

普通失败不算硬阻塞，例如：

- lint 失败。
- test 失败。
- build 失败。
- payload:build 失败。
- 数据库密码不匹配。
- 端口占用。
- 环境变量缺失。
- smoke test 页面报错。
- patch 失败。

这些都必须自行定位并修复，然后重跑验证。

### 自行决策规则

遇到疑问时按以下优先级自行决定：

1. 保持项目可运行、可构建、可验证。
2. 不泄露、不写入、不提交真实密钥和密码。
3. 不删除正式素材、数据库数据、产品图片、视频资产。
4. 不做无关重构。
5. 保留合理的安全 fallback、loading、error boundary、空状态、权限失败处理。
6. 删除会伪造生产业务数据的 mock / legacy / extracted 兜底。
7. 使用现有项目结构和脚本，不另起复杂体系。

## 禁止事项

- 不直接 `git add -A`。
- 不提交代码。
- 不删除 `/admin` Next 兜底页。
- 不处理 Git LFS 归一化。
- 不删除或压缩产品图片、视频、大素材。
- 不删除 Docker volume 或数据库数据，除非用户明确要求。
- 不把 `.env.local`、真实密码、真实密钥、Token、Cookie 写进源码、文档、日志或报告。
- 不把 `.next/`、`node_modules/`、`tmp/`、测试输出、临时截图纳入交付。

## 终局执行流程

### 1. 先确认当前状态

执行：

```bash
git status --short
pnpm exec tsc --noEmit --pretty false
```

要求：

- 大量 `??` 未跟踪文件是当前独立仓库尚无首个 commit 的预期状态，不要因此停下。
- 确认 `.env.local`、`.next/`、`node_modules/`、`tmp/` 未进入待提交。
- 如果 typecheck 失败，先修复，再继续。

### 2. 跑 lint，失败就修

执行：

```bash
pnpm lint
```

如果失败：

- 优先用项目已有 lint fix：

```bash
pnpm exec next lint --fix --max-warnings=0
```

- 修复 import 顺序、未使用变量、hooks、格式、可达性问题。
- 修完后必须重跑 `pnpm lint`，直到通过。

### 3. 跑全量测试，失败就修

执行：

```bash
NODE_ENV=test pnpm test
```

如果失败：

- 定位失败测试。
- 判断是代码问题、测试预期过期、环境变量问题，还是 jsdom / Node 环境问题。
- 能修就修，不能绕。
- 修完后重跑失败测试，再重跑全量测试。

至少确认这些相关测试通过：

- `tests/unit/admin-i18n-resources.test.ts`
- `tests/unit/admin-interface-language-switch.test.tsx`
- `tests/unit/admin-brand-bilingual.test.tsx`
- `tests/unit/localized-videos.test.ts`
- `tests/unit/news-card-featured-video.test.tsx`
- `tests/unit/home-hero-background-video.test.tsx`
- `tests/unit/home-hero-video-modal.test.tsx`

### 4. 跑环境检查、build、payload:build

先准备安全的本地验证环境：

- 使用 shell-only 临时变量。
- `PAYLOAD_SECRET`、`CRON_SECRET`、`REVALIDATE_SECRET`、`PAYLOAD_PREVIEW_SECRET` 使用本地 throwaway 值。
- Turnstile 使用 Cloudflare 官方测试 key：
  - `NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA`
  - `TURNSTILE_SECRET=1x0000000000000000000000000000000AA`
- 数据库连接优先使用现有 `.env.local` 或当前 Docker Postgres 可用连接；可以读取但不能打印真实密码。

执行：

```bash
pnpm check:env
pnpm build
pnpm payload:build
```

如果失败：

- 不要停下写报告。
- 定位具体失败阶段。
- 修复后从失败命令开始重跑。
- 最后必须三项都通过。

### 5. 生产服务 smoke test

启动生产服务，优先使用项目已有命令：

```bash
pnpm start
```

如端口冲突：

- 找到占用端口的本项目旧服务并停止。
- 或改用可用端口，但报告里说明实际端口。

如数据库认证失败：

- 不要删除 volume。
- 优先使用当前 `.env.local`、Docker 容器环境、现有 Postgres 用户状态恢复连接。
- 不能打印真实密码。
- 修复后重启服务并继续 smoke test。

必须验收：

- `/api/health`：HTTP 200，数据库 `ok: true`。
- `/admin/`：进入 Payload Admin 登录页。
- `/zh`、`/en`、`/ru`：首页正常加载，视频映射不报错。
- `/zh/news`、`/en/news`、`/ru/news`：重点新闻速览媒体区是视频。
- `/zh/products`：产品列表正常。
- 至少一个产品详情页正常打开。
- 搜索建议能出现并跳转。
- `/zh/contact`：使用 Turnstile 官方测试 key 的 clean build，表单提交成功。

如果页面报错：

- 查服务端日志和浏览器控制台。
- 修复后重跑对应页面。
- 不要只刷新一次就放弃。

### 6. 全项目安全和假兜底复查

执行扫描：

```bash
rg -n "mock|fixture|demo|placeholder|legacy|extracted|fallback|TODO|console\.log|debug" src scripts tests messages
rg -n "password|secret|token|api[_-]?key|private[_-]?key" src scripts docs . --glob "!node_modules/**" --glob "!.next/**"
rg -n "catch\s*\([^)]*\)\s*\{\s*\}" src scripts
```

处理规则：

- 测试 fixture、测试 token、测试 mock 可以保留。
- 安全 fallback、空状态、图片缺失兜底、视频素材未提供时使用真实存在文件的 fallback 可以保留。
- CLI 脚本里的 `console.log` 可以保留。
- 会在生产页面伪造业务数据的 mock / legacy / extracted fallback 必须删除。
- 前台不能出现开发期 TODO / placeholder draft / skeleton 文案。
- 源码或文档不能出现真实密码、真实密钥、Token。

### 7. 清理最终交付状态

最后检查：

```bash
git status --short
git diff --check
```

确认：

- 临时 helper 已删除或正式化。
- 临时输出不在待提交范围。
- `.env.local` 被忽略。
- `.next/`、`node_modules/` 被忽略。
- 没有 whitespace error。
- 没有因为质检误删产品图片或视频素材。

## 最终报告要求

只有全部执行完后，才写入 `Hermes质检报告.md`。

报告必须包含：

1. **最终结论**
   - 明确写：项目是否已达到当前本地可交付状态。

2. **已完成修复**
   - 后台英文化。
   - 视频映射复核。
   - 安全 / secret 修复。
   - mock / fallback / TODO 清理。
   - 临时文件清理。

3. **验证结果**
   - `pnpm exec tsc --noEmit --pretty false`
   - `pnpm lint`
   - `NODE_ENV=test pnpm test`
   - `pnpm check:env`
   - `pnpm build`
   - `pnpm payload:build`
   - `git diff --check`
   - 生产 smoke test 每个页面 / 流程结果。

4. **未完成事项**
   - 如果仍有未完成，只能是硬阻塞。
   - 必须写清楚阻塞原因、已经尝试过什么、还缺什么。
   - 不允许再写“工具调用上限所以没跑完”作为完成报告。

5. **仍需用户确认**
   - 客户最终分语言视频素材。
   - 法务 / 隐私 / 条款 / 备案号终稿。
   - Git LFS 归一化是否单独处理。
   - 是否开始做首个 Git 提交。

6. **Git 建议**
   - 只给提交切片。
   - 不直接提交。

报告中禁止出现：

- 真实数据库密码。
- 真实密钥。
- Token。
- Cookie。
- 完整敏感日志。

## 成功标准

只有满足以下条件，才算执行完成：

- `typecheck` 通过。
- `lint` 通过。
- 全量测试通过。
- `check:env` 通过。
- `build` 通过。
- `payload:build` 通过。
- 生产 smoke test 通过。
- 临时文件清理完成。
- 敏感信息检查完成。
- 质检报告更新完成。
- 没有 Git 提交。

如果没有达到以上条件，就继续执行，不要阶段性汇报。
