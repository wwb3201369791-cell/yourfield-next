'use client';

/* eslint-disable @next/next/no-img-element */
import { useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';

import { type AdminInterfaceLocale, asAdminInterfaceLocale } from './AdminInterfaceLanguageSwitch';
import { AdminLoginEnhancer } from './AdminLoginEnhancer';

const adminRoute = '/admin';

const adminBrandCopy = {
  en: {
    dashboardDescription:
      'Review inquiries, content updates, and product display status in one place, with today’s priorities surfaced first.',
    dashboardLabel: 'Operations workspace',
    dashboardTitle: 'Today’s Operations Workspace',
    iconLabel: 'YourField admin',
    loginDescription: 'Manage products, solutions, news, inquiries, and contact information.',
    loginEyebrow: 'YourField Admin',
    loginLabel: 'Admin login introduction',
    loginTitle: 'Welcome back',
    logoLabel: 'YourField website operations admin',
    logoText: 'Website Admin',
    navAriaLabel: 'Back to YourField admin home',
    navTitle: 'YourField Admin',
  },
  zh: {
    dashboardDescription: '集中查看询盘跟进、内容更新与产品展示状态，优先处理今天最要紧的事项。',
    dashboardLabel: '今日运营工作台',
    dashboardTitle: '今日运营工作台',
    iconLabel: '永霏后台',
    loginDescription: '产品、方案、新闻、询盘与联系方式管理。',
    loginEyebrow: '永霏后台',
    loginLabel: '后台登录说明',
    loginTitle: '欢迎回来',
    logoLabel: '永霏集团网站运营后台',
    logoText: '网站运营后台',
    navAriaLabel: '回到永霏网站后台首页',
    navTitle: '永霏网站后台',
  },
} as const;

function useAdminBrandCopy(): (typeof adminBrandCopy)[AdminInterfaceLocale] {
  const { i18n } = useTranslation();
  const locale = useSyncExternalStore<AdminInterfaceLocale>(
    (onStoreChange) => {
      if (typeof i18n.on !== 'function' || typeof i18n.off !== 'function') {
        return () => undefined;
      }

      i18n.on('languageChanged', onStoreChange);

      return () => i18n.off('languageChanged', onStoreChange);
    },
    () => asAdminInterfaceLocale(i18n.language),
    () => 'zh',
  );

  return adminBrandCopy[locale];
}

export function YourfieldAdminLogo() {
  const copy = useAdminBrandCopy();

  return (
    <>
      <div className="yourfield-admin-logo" aria-label={copy.logoLabel}>
        <span className="yourfield-admin-logo__mark" aria-hidden="true" />
        <span className="yourfield-admin-logo__text">{copy.logoText}</span>
      </div>
    </>
  );
}

export function YourfieldAdminIcon() {
  const copy = useAdminBrandCopy();

  return (
    <span
      className="yourfield-admin-icon"
      aria-label={copy.iconLabel}
      role="img"
      title={copy.iconLabel}
    >
      <img src="/favicon.png" alt="" aria-hidden="true" />
    </span>
  );
}

export function AdminLoginIntro() {
  const copy = useAdminBrandCopy();

  return (
    <section className="yourfield-login-intro" aria-label={copy.loginLabel}>
      <p className="yourfield-login-intro__eyebrow">{copy.loginEyebrow}</p>
      <h1>{copy.loginTitle}</h1>
      <p>{copy.loginDescription}</p>
    </section>
  );
}

export function AdminLoginSupport() {
  return <AdminLoginEnhancer accountEmail="yourfield@yourfield.local" usernameAlias="yourfield" />;
}

export function AdminLogoutButton() {
  return null;
}

export function AdminNavBrand() {
  const copy = useAdminBrandCopy();

  return (
    <a className="yourfield-admin-nav-brand" href={adminRoute} aria-label={copy.navAriaLabel}>
      <span className="yourfield-admin-nav-brand__badge" aria-hidden="true">
        <img src="/favicon.png" alt="" />
      </span>
      <span>
        <strong>{copy.navTitle}</strong>
      </span>
    </a>
  );
}

export function AdminDashboardIntro() {
  const copy = useAdminBrandCopy();

  return (
    <section className="yourfield-dashboard-intro" aria-label={copy.dashboardLabel}>
      <div className="yourfield-dashboard-intro__copy">
        <h1>{copy.dashboardTitle}</h1>
        <p>{copy.dashboardDescription}</p>
      </div>
    </section>
  );
}
