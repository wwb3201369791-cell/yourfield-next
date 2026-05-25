# Cookie Banner 优化方案(方案 A:轻量告知)

**起草日期**:2026-05-24
**对应版本**:yourfield-next(`src/components/compliance/CookieBanner.tsx` 当前版本)
**目标**:把"伪同意管理"改造为与实际数据用途一致的"轻量告知条"
**状态**:已按方案 A 实施，最终法律文案仍待法务/老板确认

---

## 1. 现状摘录

### 1.1 用户看到的文案(zh.json,L965-L982)

| key | 文案 |
|---|---|
| `cookie.banner.title` | 我们使用 cookies |
| `cookie.banner.description` | 仅用于记住你选择的网站语言,方便下次直接进入对应版本。 |
| `cookie.banner.languageTitle` | 语言偏好 |
| `cookie.banner.languageDescription` | 用于记住你选择的网站语言,便于下次直接显示对应语言。 |
| `cookie.banner.analyticsTitle` | 基础访问统计 |
| `cookie.banner.analyticsDescription` | 用于后台了解页面访问量、搜索表现和内容热度。 |
| `cookie.banner.acknowledge` | 知道了 |
| `cookie.banner.detailsMore` | 查看用途 |

### 1.2 实际代码行为(CookieBanner.tsx)

- 点击"知道了"调用 `saveConsent()`,内部写死 `{ analytics: true, marketing: false }`(L92)。
- 右上角 **X 关闭按钮也走 `saveConsent()`**(L123)— 即关闭等于同意。
- 没有"拒绝"或"仅必要"按钮。
- 展开后显示"语言偏好"和"基础访问统计"两项,但两项都以 `<Check>` 图标渲染,**给用户一种"已勾选/不可更改"的视觉暗示**。

### 1.3 三处与"仅语言偏好"承诺的冲突

1. **文案 vs 数据契约不一致**:顶部说"仅用于语言",展开却列出"基础访问统计"。
2. **暗模式 #1**:点"知道了"实际默认勾上了 analytics。
3. **暗模式 #2**:点 X 关闭也等同于同意 analytics。
4. **设计冗余**:既然只有一项必要 cookie,"查看用途"折叠按钮无实际信息增量(描述行已经说清楚)。

> 这种实现在 GDPR / 中国《个人信息保护法》/ 浙江《个人信息保护办法》框架下,均可能被认定为**无效同意**(同意必须是"自由作出、具体、知情、明确"的)。

---

## 2. 目标(方案 A 的形态)

> **核心原则**:UI 必须与实际数据处理一致。如果只用语言偏好这一类**严格必要的功能性 cookie**,就**不应该假装在做同意管理**。

### 2.1 视觉与交互目标

- 一条非阻塞的**告知条**(notice),不是同意请求(consent request)。
- 仅一个 **X** 关闭按钮(或一个"知道了"次级按钮),关闭后写入 `notice-dismissed` 标记,而**不写任何同意状态**。
- 去掉"查看用途"折叠区块、去掉"知道了 ✓"主按钮、去掉 analytics 卡片。
- 文案中保留指向"隐私政策 / Cookie 用途"页面的文本链接,把详细说明放到独立页面。
- 视觉保留现有玻璃拟态卡片样式(无须重做),仅减少内部模块。

### 2.2 数据契约目标

- 移除/降级 `analytics` / `marketing` 字段在 banner 流程里的使用(banner 永远不会再"代用户同意"统计)。
- 若未来真要上 Umami / GA 等统计,**届时再独立实现一个完整的同意管理流程**(接受 / 拒绝 / 自定义三按钮 + 默认拒绝)。
- 现在 banner 仅持久化一个状态:`{ noticeAckedAt: ISO, version: 1 }`。

---

## 3. 改造范围(文件清单)

| # | 文件 | 改动类型 | 关键改动 |
|---|---|---|---|
| 1 | `src/components/compliance/CookieBanner.tsx` | 重写 | 简化为单条告知条,删除展开/同意逻辑 |
| 2 | `src/lib/compliance/cookieConsent.ts` | 重构 | `CookieConsentState` → `CookieNoticeState`(仅含 `version`/`acknowledgedAt`/`expiresAt`);保留旧导出名做兼容 shim,或同步删除并修复引用 |
| 3 | `src/components/footer/CookiePreferencesFooterButton.tsx` | 调整 | 若仍展示,改为指向 `/cookies` 页面的链接(而非重新弹 banner);否则删除 |
| 4 | `messages/zh.json` `en.json` `ru.json` | 文案重写 | 见 §4 |
| 5 | `src/app/[locale]/(public)/cookies/page.tsx` | 内容补全 | 此页变成"权威说明源",描述我们仅使用语言偏好 cookie、何时写入、如何手动清除 |
| 6 | `tests/unit/cookie-banner-ui.test.tsx` | 重写 | 验证:仅一个 X 按钮、点击后 localStorage 写入 `noticeAckedAt`、不写 `analytics:true`、再次渲染时不显示 |
| 7 | `tests/unit/cookie-consent.test.ts` | 调整 | 删除 analytics/marketing 相关用例;新增 `parseCookieNoticeState` 测试 |
| 8 | `tests/unit/footer-display.test.tsx` | 验证 | 若 footer 按钮文案变化,同步快照 |
| 9 | `src/lib/cms/site-settings.ts` `src/globals/SiteSettings.ts` `src/payload-types.ts` | 视情况 | 若 CMS 字段中暴露 analytics/marketing 开关,标记为 deprecated 或移除 |

> **未列入的文件**:`tests/unit/umami-script.test.tsx` 若依赖 `hasAnalyticsConsent`,需配套迁移到"始终关闭"或重命名为"待真同意流程实现"。

---

## 4. 文案对照表

### 4.1 中文(zh.json)

| key | 旧文案 | 新文案 |
|---|---|---|
| `cookie.notice.title` | 我们使用 cookies | (可去掉标题,或保留为"关于 cookie") |
| `cookie.notice.body` | (新增) | 本站仅在你切换语言时写入一个**语言偏好 cookie**,以便下次访问直接显示对应语言。我们不使用统计、广告或第三方追踪 cookie。 |
| `cookie.notice.linkLabel` | (新增) | 查看 Cookie 用途 |
| `cookie.notice.close` | 关闭 | 关闭 |

**移除**:`cookie.banner.title` / `description` / `acknowledge` / `acceptAll` / `essentialOnly` / `analyticsTitle` / `analyticsDescription` / `marketingDescription` / `detailsMore` / `detailsLess` / `save` / `manage` 等所有 banner 同意管理相关 key。

### 4.2 英文(en.json)

| key | 新文案 |
|---|---|
| `cookie.notice.title` | About cookies |
| `cookie.notice.body` | We only set a **language-preference cookie** when you change the site language, so we can show the right version next time. We do not use analytics, advertising, or third-party tracking cookies. |
| `cookie.notice.linkLabel` | Cookie details |
| `cookie.notice.close` | Close |

### 4.3 俄文(ru.json)

| key | 新文案 |
|---|---|
| `cookie.notice.title` | О файлах cookie |
| `cookie.notice.body` | Мы сохраняем только **cookie с выбранным языком сайта**, чтобы при следующем визите сразу показать нужную версию. Аналитические, рекламные и сторонние cookie не используются. |
| `cookie.notice.linkLabel` | Подробнее о cookie |
| `cookie.notice.close` | Закрыть |

> 所有文案最终需经法务确认(参考 `OPERATIONS.md` 中提及的 TODO 流程)。

---

## 5. 组件新形态(伪代码骨架)

```tsx
// src/components/compliance/CookieNotice.tsx(可保留原文件名,内部重写)
export function CookieNotice({ copy, enabled, cookiesHref }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const acked = readNoticeState(localStorage.getItem(STORAGE_KEY));
    setVisible(!acked);
  }, [enabled]);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(createNoticeState()));
    } catch { /* swallow */ }
    setVisible(false);
  }

  if (!enabled || !visible) return null;

  return (
    <aside role="status" aria-live="polite" className="...玻璃拟态卡...">
      <ShieldCheck aria-hidden />
      <div>
        <h2>{copy.title}</h2>
        <p>
          {copy.body} <a href={cookiesHref}>{copy.linkLabel}</a>
        </p>
      </div>
      <button type="button" aria-label={copy.close} onClick={dismiss}>
        <X aria-hidden />
      </button>
    </aside>
  );
}
```

**关键差异**:
- 只有一个 `dismiss()` 写入告知状态,**不写同意状态**。
- 无 `isExpanded`、无双卡片、无主按钮。
- 仍保留 `enabled` prop(便于在 CMS 关闭整个告知条)。
- 仍保留 `aria-live="polite"` 与 `role="status"`(屏幕阅读器友好)。

---

## 6. 数据契约新形态

```ts
// src/lib/compliance/cookieNotice.ts (新文件,替代 cookieConsent.ts)
export const cookieNoticeStorageKey = 'yourfield.cookieNotice';
export const cookieNoticeVersion = 1;
export const cookieNoticeMaxAgeMs = 365 * 24 * 60 * 60 * 1000;

export type CookieNoticeState = Readonly<{
  acknowledgedAt: string;  // ISO
  expiresAt: string;       // ISO
  version: typeof cookieNoticeVersion;
}>;
```

**迁移策略**:
- 旧 localStorage key `yourfield.cookieConsent` 留一次性兼容读取,首次访问时**清除**,以避免老用户保留着"已同意 analytics"的残留状态。
- `hasAnalyticsConsent()` 函数全局返回 `false`,直到真同意流程上线。

---

## 7. 合规与可访问性

- **法律依据切换**:从"同意 (consent)"切换为"告知 + 合法利益 (legitimate interest) / 严格必要 (strictly necessary)"。理由记录在本文档与隐私政策正式版中。
- **可访问性**:
  - `role="status"` + `aria-live="polite"`,不打断屏幕阅读流。
  - 关闭按钮 `aria-label` 取自文案。
  - 焦点环保留 `focus-visible:outline-accent`。
  - 在不能用 localStorage 的浏览器(隐私模式)上,告知条会每次显示,这是预期行为。
- **未来若引入统计**:必须**重新实现**真正的同意管理(默认拒绝、有拒绝按钮、可撤回),并更新本文档。

---

## 8. 测试调整清单

| 测试文件 | 删除 | 新增 |
|---|---|---|
| `cookie-banner-ui.test.tsx` | "点击知道了写入 analytics:true"等用例 | "点击 X 写入 acknowledgedAt 且不含 analytics 字段";"再次渲染时不再显示" |
| `cookie-consent.test.ts` | `createCookieConsentState` / `parseCookieConsentState` 中 analytics/marketing 相关分支 | `parseCookieNoticeState` 的有效/过期/版本不匹配三种情况 |
| `umami-script.test.tsx` | 依赖 `analytics:true` 来注入脚本的用例 | 改为"始终不注入"或加 `it.todo('待真同意流程上线')` |
| `footer-display.test.tsx` | (无) | 若 footer 按钮文案改了,同步快照 |

---

## 9. 验收清单(交付前必过)

- [ ] 全站三语 banner 显示与实际行为一致:仅说语言,且只写语言相关 cookie。
- [ ] 点 X 或点链接关闭后,刷新页面不再出现 banner。
- [ ] localStorage 中**不存在** `analytics:true` 字段。
- [ ] `pnpm test --run` 全绿(包含上述新增/调整用例)。
- [ ] `pnpm exec tsc --noEmit` 无报错。
- [ ] `pnpm lint` 无报错。
- [ ] 三语 `cookies` 法律页面内容更新,与 banner 链接对齐。
- [ ] DECISIONS.md 新增一条 D-002 记录此次方案 A 选择。
- [ ] 法务/老板对最终文案确认。

---

## 10. 风险与回滚

| 风险 | 应对 |
|---|---|
| 老用户 localStorage 仍含"已同意 analytics"残留 | 迁移期清空旧 key;若未来上 analytics,需重新弹出真同意 banner。 |
| 未来上 Umami/GA 时遗忘 banner 是告知版 | 在 `umami-script.test.tsx` 留 `it.todo` + DECISIONS.md 标注。 |
| 法务对"告知而非同意"提出异议 | 回退到方案 C(完整同意管理);UI 与文案均需重写,工作量约本方案 3 倍。 |
| 现有 CMS 字段(analytics 开关)被其它逻辑误用 | grep `hasAnalyticsConsent` 全仓,确认改为常 `false` 不破坏其它流程。 |

回滚成本低:本次改动仅涉及一个组件 + 一个 lib + 文案,**不动 CMS schema** 的话可一次 revert。

---

## 11. 工作量估算

| 阶段 | 人时 |
|---|---|
| 组件重写 + lib 重构 | 1.5 h |
| 三语文案改写 + 法律页对齐 | 1 h |
| 测试调整(3 个文件) | 1.5 h |
| 联调 / 浏览器手测三语 | 0.5 h |
| ADR / DECISIONS 收尾 | 0.5 h |
| **合计** | **约 5 h** |

---

## 12. 下一步

1. 把本文件作为评审稿,确认方案 A 与文案。
2. 通过后由 Claude Code 直接按 §3 文件清单执行改造,逐步提交。
3. 改造完成后,在 `DECISIONS.md` 追加 D-002 条目并归档本文档到 `docs/decisions/`。
