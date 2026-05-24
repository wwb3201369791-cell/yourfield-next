# 后台 Dashboard 优化设计

- **日期**:2026-05-24
- **作者**:武文斌 × Claude(brainstorming)
- **状态**:Spec(待用户最终确认 → 进入 writing-plans)
- **范围**:仅后台首屏 Dashboard(`AdminOperationsDashboard` 及其子组件)。后台其他页面、公开站首页不在本 spec 内。

## 1. 背景与现状

`AdminOperationsDashboard` 已上线,基于 [src/components/admin/dashboard/DashboardReady.tsx](../../src/components/admin/dashboard/DashboardReady.tsx) 渲染,数据从 [fetch.ts](../../src/components/admin/dashboard/fetch.ts) 拉取 5 个 Payload API(`search-logs / form-submissions / form-submissions?status=new / products / product-groups`),完全是真实数据。当前结构:

1. 头部:运营摘要 + 时间范围切换 + 刷新
2. KPI 卡片(`KpiCards`)
3. 三列内容:`TrendChart` + `TopKeywordsTable` + `FormSubmissionsList`

**问题诊断**:这是一个"运营人员驾驶舱",数据驱动,但实际使用场景是**老板和员工共用一个账号**,需要"**进来 10 秒知道有没有事要管**" — 任务驱动 > 数据驱动。

## 2. 用户场景

- **唯一账号类型**:目前后台只开放一个账号(老板与员工共用)。所有"分配给我 / 我的 / 由 X 负责"概念都不适用,状态变更全部走系统状态字段。
- **使用频次**:老板每周 1-3 次,员工每天若干次。
- **核心问题**:进入后台时,用户最想得到的回答是:
  1. 有没有要紧的事(询盘 / 缺图 / 翻译)?
  2. 网站现在的内容状况怎么样?
  3. 最近的运营趋势是什么样?

## 3. 设计目标(锁定)

| #   | 方向                       | 说明                                           |
| --- | -------------------------- | ---------------------------------------------- |
| 1   | **任务驱动首屏**           | 顶部一条"待办带",汇总所有需要处理的事项        |
| 2   | **KPI 数字可点击下钻**     | 每个 KPI 卡片点击跳转到对应已筛选列表          |
| 3   | **网站内容健康度(简化版)** | 5-8 条硬编码规则,扫出"网站缺什么",直接打开处理 |

**显式不做**(避免范围蔓延):

- 不做角色分流 / 多账号视角切换(单账号)
- 不做"前台文案 Global"(界面文案继续走 `messages/*.json`,需开发改)
- 不做"任务分配 / 我的待办" — 无人可分配
- 不做仪表盘自定义 / 拖拽排序
- 不做完整版健康度配置面板,规则全部硬编码

## 4. 整体布局(A+ 方案)

四带式,自上而下信息密度递减:

```
┌─────────────────────────────────────────────────────────────────┐
│ 头部:运营摘要 + 时间范围段控件 + 刷新           [保留]          │
├─────────────────────────────────────────────────────────────────┤
│ 待办带:N 条新询盘 · M 超时 · K 缺图(横向 chip 列表)  [新增]    │
├─────────────────────────────────────────────────────────────────┤
│ KPI(4 列):询盘 / 搜索 / 产品 / 产品组,可点下钻 + 环比 [改造]  │
├─────────────────────────────────────────────────────────────────┤
│ 健康度环形(1 fr) | 趋势图(1.8 fr) — 并排              [新+保留]│
├─────────────────────────────────────────────────────────────────┤
│ 热门搜索词 Top 5(1 fr) | 最新表单提交(1 fr) — 并排     [保留] │
└─────────────────────────────────────────────────────────────────┘
```

**信息流逻辑**:头部"这是什么数据" → 待办"有什么事" → KPI"做得怎么样" → 健康度+趋势"网站好不好" → 搜索词+表单"用户在干嘛"。

**没有**:Tab、折叠、抽屉、模态层 — 中国老板心智下"看不见 = 不存在",一切关键信息都在第一屏可见。

## 5. 三个新功能详细规格

### 5.1 待办带(TodoStrip)

**位置**:头部下方,KPI 上方,贯穿整行。

**视觉**:浅色渐变背景(基于最高严重级),内部水平排列 chip;每个 chip 一个待办项。

**严重级**:

- `severe`(红):新询盘 / 超时未跟进 / 产品缺主图 / 分类无产品
- `warning`(琥珀):翻译缺失 / SEO 描述缺失 / 新闻久未更新
- 全部归零时显示空态插画:"暂无待办 · 网站状态良好"

**数据源**(直接复用现有 fetch + 新增聚合):

- 新询盘数:`form-submissions?status=new` (已有)
- 超时未跟进:`form-submissions?status=new&createdAt<now-24h` (新增 1 次请求)
- 缺主图产品数:`products?_status=published&mainImage[exists]=false`(新增)
- 分类无产品数:聚合查询(新增)

**交互**:

- chip hover 时浮起 + 阴影
- chip 右侧出现快捷操作浮层("标记已查看" / "去回复" / "去补图")
- 点击 chip 主体 = 跳转到对应已筛选列表

**文案纪律**:

- 不用第一人称、第二人称
- 直接陈述:"3 条新询盘待处理"、"2 条询盘超 24h 未处理"
- 动作按钮:"标记已查看 / 标记已联系 / 标记已关闭 / 去回复 / 去补图"

### 5.2 KPI 可点击下钻(改造现有 KpiCards)

**改造点**:

1. 每张卡变为 `<a href>` 或 `onClick`,跳转到对应已筛选的 Payload 列表
2. 数字下方增加环比变化(如 `↑ 33%`),颜色:升=绿、降=红、持平=灰
3. hover 状态:卡片上浮 2-3px + 阴影加深 + 右下角出现"点击查看 →"
4. 数字加载时执行 0 → target 滚动动画(800ms easeOutCubic)
5. 加载中显示骨架占位(shimmer 微光从左到右扫过,1.4s 一轮)

**4 张卡片**:
| KPI | 跳转 |
|---|---|
| 新增询盘 | `/admin/collections/form-submissions?where[createdAt][greater_than_equal]=<range_start>` |
| 站内搜索 | `/admin/collections/search-logs?where[createdAt][greater_than_equal]=<range_start>` |
| 在售产品 | `/admin/collections/products?where[_status][equals]=published` |
| 展示中产品组 | `/admin/collections/product-groups?where[showOnFrontend][not_equals]=false` |

### 5.3 网站内容健康度(简化版)

**位置**:与趋势图并排,1fr : 1.8fr 比例。

**视觉**:

- SVG 环形进度条(直径 80-100px),颜色按分数分档:
  - `>= 90` 绿(`#10B981`)
  - `60-89` 琥珀(`#F59E0B`)
  - `< 60` 红(`#DC2626`)
- 加载时环形从 0° 描边到目标角度(800ms)
- 中心显示数字 `76`,下方副文本 `/100`
- 旁边竖列三档计数:`严重 2 项 / 提醒 3 项 / 良好 —`(用色 dot 区分,**不用 emoji**)

**硬编码规则清单**(简化版,首期 6 条):

| 规则 ID | 描述                                     | 严重度  | 扣分                 |
| ------- | ---------------------------------------- | ------- | -------------------- |
| `R1`    | 已发布产品缺主图                         | severe  | 每个 -5,封顶 -20     |
| `R2`    | 产品分类下无任何产品                     | severe  | 每个 -5,封顶 -15     |
| `R3`    | 已发布产品的 `localized` 字段(en/ru)缺失 | warning | 每 10 个 -2,封顶 -10 |
| `R4`    | 已发布产品缺 SEO 描述                    | warning | 每 5 个 -2,封顶 -10  |
| `R5`    | 最近 30 天无新发布的 News                | info    | 固定 -5              |
| `R6`    | `status=new` 的询盘超 48h 未处理         | severe  | 每个 -5,封顶 -20     |

**初始分**:100,按规则扣完取下限 0。

**计算位置**:服务端聚合 API(新增 `/admin-api/dashboard/health`),不在前端做,避免泄露规则细节并保证一致。

**交互**:

- 整块卡片可点击,跳转独立"健康度详情"页(路径 `${adminBase}/health`,通过 Payload `admin.components.routes` 注册自定义路由)
- 每条规则项右侧"去处理 →"按钮,跳转对应已筛选列表
- 规则后续若需要扩展,直接改服务端代码即可(不做配置面板)

## 6. 交互规格(8 项)

| #   | 交互            | 实现要点                                                                  |
| --- | --------------- | ------------------------------------------------------------------------- |
| 1   | 卡片 hover 浮起 | `transform: translateY(-2px); box-shadow: ...; transition: 180ms`         |
| 2   | 数字滚动动画    | `requestAnimationFrame` + easeOutCubic,800ms,初次渲染和切换时间范围时触发 |
| 3   | 健康度环形描边  | SVG `<circle>` + `stroke-dasharray` 动画,从 0 描到目标角度,800ms          |
| 4   | 待办快捷操作    | chip hover 时右侧 fade-in 操作浮层(单账号,无"分配给我")                   |
| 5   | 趋势图鼠标跟随  | 替换现有 click 选中,改为 mousemove 跟随 + 垂直引导线 + 浮窗               |
| 6   | 时间范围段控件  | iOS Segmented Control 样式,选中态用 absolute 滑块过渡 200ms               |
| 7   | 骨架屏 shimmer  | linear-gradient 背景 + `animation: shimmer 1.4s infinite`                 |
| 8   | 空态插画        | 线性 SVG(单色描边,无填色),配合简短文案                                    |

**所有交互的统一参数**:

- 缓动:`cubic-bezier(0.4, 0, 0.2, 1)`(Material standard)
- 过渡时长:微交互 180ms / 状态切换 240-300ms / 数据动画 600-800ms
- 减弱动效:遵守 `prefers-reduced-motion: reduce`,跳过所有非必要动画(滚动数字直接显示终值、shimmer 改为静态灰块、环形直接显示目标角度)

## 7. 视觉规范

### 7.1 图标库

**采用 Lucide**(`lucide-react`):

- 开源,MIT 协议
- 线性单色,描边 1.5-2px
- 与现有 Yourfield logo 风格一致
- React 友好,按需 tree-shake

**禁用 emoji**(包括交通灯 🔴🟡🟢、警告 ⚠、对勾 ✓ 等装饰用 emoji)。

### 7.2 严重度的视觉表达

不用 emoji,用纯色 dot + Lucide icon 组合:

- `severe`:`#DC2626` 6px 圆点 + `alert-triangle` 图标(可选)
- `warning`:`#F59E0B` 6px 圆点 + `alert-circle` 图标(可选)
- `info`:`#0369A1` 6px 圆点 + `info` 图标(可选)
- `success`:`#10B981` 6px 圆点 + `check` 图标(可选)

### 7.3 文案纪律(全局)

- 不用第一人称(我 / 我的 / 我们)
- 不用第二人称(您 / 你的)
- 直接陈述事实,主语前置:"3 条新询盘"而非"您有 3 条新询盘"
- 动作按钮用动词短语:"标记已联系 / 去补图 / 去回复"
- 状态字段固定 4 档:`new / contacted / closed / archived`(实施时先核对 [src/collections/FormSubmissions.ts](../../src/collections/FormSubmissions.ts) 现有取值,若已有不同枚举值优先沿用现状,本 spec 不强制重命名以免破坏既有数据)

## 8. 数据与 API

### 8.1 新增聚合 API

**路径**:`/admin-api/dashboard/health`(需新建,放在 `src/app/api/admin/dashboard/health/route.ts`)

**响应结构**:

```ts
{
  score: number; // 0-100
  level: 'good' | 'warning' | 'severe';
  items: Array<{
    ruleId: 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'R6';
    severity: 'severe' | 'warning' | 'info';
    count: number;
    label: string; // 已国际化
    actionHref: string; // Payload list 已筛选 URL
  }>;
  computedAt: string; // ISO timestamp
}
```

**鉴权**:必须复用现有 Payload admin session(`payload.authenticate(req)`),拒绝未登录请求。

### 8.2 现有 fetch 改造

`fetch.ts:fetchDashboardState` 增加:

- 第 6 个并行请求:`form-submissions?status=new&where[createdAt][less_than]=<24h前>`(超时询盘)
- 第 7 个并行请求:健康度 `/admin-api/dashboard/health`

类型扩展:`DashboardState` 增加 `overdueSubmissions: ApiCollectionResponse<...>` 和 `health: HealthResponse`。

## 9. 实施成本与拆分粒度

**预估**:中等工作量,分 4 个 PR / 4 段实施:

| 阶段   | 内容                                                                               | 依赖 |
| ------ | ---------------------------------------------------------------------------------- | ---- |
| **P1** | 视觉基础设施:Lucide 引入 + dot / shimmer / hover-elevate / 段控件等通用 CSS / 组件 | 无   |
| **P2** | 待办带 + KPI 改造(可点下钻 + 数字滚动 + 环比)                                      | P1   |
| **P3** | 健康度聚合 API + 环形进度条 + 详情页                                               | P1   |
| **P4** | 趋势图 hover 改造 + 骨架 shimmer + 所有空态插画                                    | P1   |

每个 PR 都能独立交付不破坏现有功能,P1 完成后即使后续暂停,Dashboard 也是"略好看一点的现状",不会变难看。

## 10. 关键文件清单(实施时入口)

- 主组件:[src/components/admin/dashboard/DashboardReady.tsx](../../src/components/admin/dashboard/DashboardReady.tsx)
- 数据拉取:[src/components/admin/dashboard/fetch.ts](../../src/components/admin/dashboard/fetch.ts)
- 类型:[src/components/admin/dashboard/types.ts](../../src/components/admin/dashboard/types.ts)
- 子组件:[src/components/admin/dashboard/sections/](../../src/components/admin/dashboard/sections/)(`KpiCards / TrendChart / TopKeywordsTable / FormSubmissionsList / AdminOpsSkeleton / AdminOpsError`)
- 样式:[src/styles/payload-admin.css](../../src/styles/payload-admin.css)(1991 行,在此扩展)
- 新增 API:`src/app/api/admin/dashboard/health/route.ts`(本 spec 创建)
- Payload 配置:[src/payload.config.ts](../../src/payload.config.ts)(`admin.components.beforeDashboard` 已挂载 `AdminOperationsDashboardWithRoutes`)

## 11. 验收清单

- [ ] 第一屏可见 4 个新模块:待办带、可点 KPI、健康度环形、保留的趋势/搜索/表单
- [ ] 所有 KPI 数字点击后跳转到 Payload 已筛选列表
- [ ] 待办 chip 提供"标记已查看 / 去回复 / 去补图"快捷操作,无"分配给我"
- [ ] 健康度分数与扣分规则在源码可一目了然(单文件)
- [ ] 全页面**零 emoji** — 用 Lucide + 色 dot 替代
- [ ] 所有文案**零第一/二人称**,用直接陈述
- [ ] 加载状态走 shimmer 骨架
- [ ] 空态有线性 SVG 插画(待办 / 搜索词 / 表单 / 健康度均覆盖)
- [ ] `prefers-reduced-motion: reduce` 用户全部动画退化为静态
- [ ] 健康度聚合 API 鉴权,未登录返回 401
- [ ] 现有 5 个模块(摘要 / KPI / 趋势 / 搜索词 / 表单)行为不退化
