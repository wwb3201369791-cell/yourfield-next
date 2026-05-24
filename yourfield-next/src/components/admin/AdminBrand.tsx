/* eslint-disable @next/next/no-img-element */
import React from 'react';

import { AdminLoginEnhancer } from './AdminLoginEnhancer';

const adminRoute = '/admin';

const dashboardShortcuts = [
  { label: '咨询表单', href: `${adminRoute}/collections/form-submissions` },
  { label: '产品目录', href: `${adminRoute}/collections/product-groups` },
  { label: '产品内容', href: `${adminRoute}/collections/products` },
  { label: '新闻动态', href: `${adminRoute}/collections/news` },
  { label: '联系方式', href: `${adminRoute}/globals/site-settings` },
] as const;

export function YourfieldAdminLogo() {
  return (
    <React.Fragment>
      <div className="yourfield-admin-logo" aria-label="永霏集团网站运营后台">
        <span className="yourfield-admin-logo__mark" aria-hidden="true" />
        <span className="yourfield-admin-logo__text">网站运营后台</span>
      </div>
    </React.Fragment>
  );
}

export function YourfieldAdminIcon() {
  return (
    <span className="yourfield-admin-icon" aria-label="永霏后台" role="img" title="永霏后台">
      <img src="/favicon.png" alt="" aria-hidden="true" />
    </span>
  );
}

export function AdminLoginIntro() {
  return (
    <section className="yourfield-login-intro" aria-label="后台登录说明">
      <p className="yourfield-login-intro__eyebrow">永霏后台</p>
      <h1>欢迎回来</h1>
      <p>产品、方案、新闻、询盘与联系方式管理。</p>
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
  return (
    <a className="yourfield-admin-nav-brand" href={adminRoute} aria-label="回到永霏网站后台首页">
      <span className="yourfield-admin-nav-brand__badge" aria-hidden="true">
        <img src="/favicon.png" alt="" />
      </span>
      <span>
        <strong>永霏网站后台</strong>
      </span>
    </a>
  );
}

export function AdminDashboardIntro() {
  return (
    <section className="yourfield-dashboard-intro" aria-label="永霏后台工作台">
      <div>
        <p className="yourfield-dashboard-intro__eyebrow">永霏后台</p>
        <h1>永霏集团官网运营工作台</h1>
        <p>从这里维护产品资料、解决方案、新闻动态、咨询表单和联系方式。</p>
      </div>
      <nav className="yourfield-dashboard-intro__shortcuts" aria-label="常用后台模块">
        {dashboardShortcuts.map((shortcut) => (
          <a href={shortcut.href} key={shortcut.href}>
            {shortcut.label}
          </a>
        ))}
      </nav>
    </section>
  );
}
