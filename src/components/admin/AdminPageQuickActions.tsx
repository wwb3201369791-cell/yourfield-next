'use client';

import { useConfig, useTranslation } from '@payloadcms/ui';

import { type AdminInterfaceLocale, asAdminInterfaceLocale } from './AdminInterfaceLanguageSwitch';

type QuickActionItem = Readonly<{
  label: Record<AdminInterfaceLocale, string>;
  path: string;
}>;

type QuickActionGroup = Readonly<{
  label: Record<AdminInterfaceLocale, string>;
  items: readonly QuickActionItem[];
}>;

export const adminQuickActionGroups: readonly QuickActionGroup[] = [
  {
    label: { zh: '工作台', en: 'Workspace' },
    items: [
      { label: { zh: '运营首页', en: 'Operations home' }, path: '/' },
      { label: { zh: '系统健康', en: 'System health' }, path: '/health' },
    ],
  },
  {
    label: { zh: '询盘管理', en: 'Inquiries' },
    items: [
      {
        label: { zh: '咨询与招商记录', en: 'Contact & franchise inquiries' },
        path: '/collections/form-submissions',
      },
    ],
  },
  {
    label: { zh: '产品中心', en: 'Products' },
    items: [
      { label: { zh: '产品列表', en: 'Products' }, path: '/collections/products' },
      { label: { zh: '产品大类', en: 'Product groups' }, path: '/collections/product-groups' },
      {
        label: { zh: '产品分类', en: 'Product categories' },
        path: '/collections/product-categories',
      },
      { label: { zh: '媒体库', en: 'Media library' }, path: '/collections/media' },
    ],
  },
  {
    label: { zh: '内容页面', en: 'Content' },
    items: [
      { label: { zh: '解决方案', en: 'Solutions' }, path: '/collections/solutions' },
      { label: { zh: '新闻动态', en: 'News' }, path: '/collections/news' },
      { label: { zh: '页面内容', en: 'Pages' }, path: '/collections/pages' },
      { label: { zh: '常见问题', en: 'FAQs' }, path: '/collections/faqs' },
      { label: { zh: '导航配置', en: 'Navigation' }, path: '/globals/navigation' },
    ],
  },
  {
    label: { zh: '站点与权限', en: 'Settings & access' },
    items: [
      { label: { zh: '站点设置', en: 'Site settings' }, path: '/globals/site-settings' },
      { label: { zh: '用户账号', en: 'Users' }, path: '/collections/users' },
      { label: { zh: '角色权限', en: 'Roles' }, path: '/collections/roles' },
      { label: { zh: '审计日志', en: 'Audit logs' }, path: '/collections/audit-logs' },
      { label: { zh: '站内搜索日志', en: 'Search logs' }, path: '/collections/search-logs' },
    ],
  },
] as const;

const copy = {
  en: {
    ariaLabel: 'Admin page quick actions',
    placeholder: 'Page actions',
  },
  zh: {
    ariaLabel: '后台页内功能快速跳转',
    placeholder: '页内功能',
  },
} as const;

export function buildAdminQuickActionHref(adminBase: string, path: string) {
  const normalizedBase = adminBase.replace(/\/+$/g, '') || '/admin';
  const normalizedPath = path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;

  return `${normalizedBase}${normalizedPath}`;
}

export function AdminPageQuickActions() {
  const {
    config: { routes },
  } = useConfig();
  const { i18n } = useTranslation();
  const locale = asAdminInterfaceLocale(i18n.language);
  const labels = copy[locale];

  return (
    <label className="yourfield-admin-quick-actions">
      <span className="sr-only">{labels.ariaLabel}</span>
      <select
        aria-label={labels.ariaLabel}
        className="yourfield-admin-quick-actions__select"
        defaultValue=""
        onChange={(event) => {
          const href = event.currentTarget.value;

          if (href) {
            window.location.href = href;
          }
        }}
      >
        <option value="" disabled>
          {labels.placeholder}
        </option>
        {adminQuickActionGroups.map((group) => (
          <optgroup key={group.label.zh} label={group.label[locale]}>
            {group.items.map((item) => {
              const href = buildAdminQuickActionHref(routes.admin, item.path);

              return (
                <option key={href} value={href}>
                  {item.label[locale]}
                </option>
              );
            })}
          </optgroup>
        ))}
      </select>
    </label>
  );
}
