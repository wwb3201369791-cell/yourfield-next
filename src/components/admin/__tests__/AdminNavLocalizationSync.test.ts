// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';

import {
  localizeAdminChromeRoot,
  localizeAdminDocumentTitle,
  localizeAdminNavText,
} from '../adminNavLocalization';
import { adminUiText } from '@/lib/payload/adminText';

describe('AdminNavLocalizationSync', () => {
  it('translates Payload nav labels to English when the admin interface is EN', () => {
    expect(localizeAdminNavText('内容管理', 'en')).toBe('Content Management');
    expect(localizeAdminNavText('咨询表单', 'en')).toBe('Inquiry Forms');
    expect(localizeAdminNavText('解决方案', 'en')).toBe('Solutions');
    expect(localizeAdminNavText('新闻动态', 'en')).toBe('News');
    expect(localizeAdminNavText('产品管理', 'en')).toBe('Product Management');
    expect(localizeAdminNavText('产品大类', 'en')).toBe('Product Groups');
    expect(localizeAdminNavText('产品', 'en')).toBe('Products');
    expect(localizeAdminNavText('全局设置', 'en')).toBe('Global Settings');
    expect(localizeAdminNavText('联系方式', 'en')).toBe('Contact Info');
    expect(localizeAdminNavText('永霏网站后台', 'en')).toBe('YourField Admin');
  });

  it('localizes browser document titles without translating edited content names', () => {
    expect(localizeAdminDocumentTitle('Editing - 产品 - 永霏网站后台', 'en')).toBe(
      'Editing - Products - YourField Admin',
    );
    expect(localizeAdminDocumentTitle('Editing - Products - YourField Admin', 'zh')).toBe(
      'Editing - 产品 - 永霏网站后台',
    );
    expect(localizeAdminDocumentTitle('Editing - 干式水域救援服 - 永霏网站后台', 'en')).toBe(
      'Editing - 干式水域救援服 - YourField Admin',
    );
  });

  it('restores English nav labels to Chinese when the admin interface returns to ZH', () => {
    expect(localizeAdminNavText('Content Management', 'zh')).toBe('内容管理');
    expect(localizeAdminNavText('Inquiry Forms', 'zh')).toBe('咨询表单');
    expect(localizeAdminNavText('Solutions', 'zh')).toBe('解决方案');
    expect(localizeAdminNavText('News', 'zh')).toBe('新闻动态');
    expect(localizeAdminNavText('Product Management', 'zh')).toBe('产品管理');
    expect(localizeAdminNavText('Product Groups', 'zh')).toBe('产品大类');
    expect(localizeAdminNavText('Products', 'zh')).toBe('产品');
    expect(localizeAdminNavText('Global Settings', 'zh')).toBe('全局设置');
    expect(localizeAdminNavText('Contact Info', 'zh')).toBe('联系方式');
  });

  it('translates the built-in super admin display name used by the dashboard greeting', () => {
    expect(adminUiText('en', '超级管理员')).toBe('Super Admin');
    expect(adminUiText('zh', '超级管理员')).toBe('超级管理员');
  });

  it('translates Payload page titles, breadcrumbs and tabs outside the sidebar', () => {
    document.body.innerHTML = `
      <main>
        <div class="payload-breadcrumb" aria-label="联系方式">联系方式</div>
        <h1>联系方式</h1>
        <div role="tablist"><button type="button" title="联系方式">联系方式</button></div>
      </main>
    `;

    localizeAdminChromeRoot(document.body, 'en');

    expect(document.querySelector('.payload-breadcrumb')?.textContent).toBe('Contact Info');
    expect(document.querySelector('.payload-breadcrumb')?.getAttribute('aria-label')).toBe(
      'Contact Info',
    );
    expect(document.querySelector('h1')?.textContent).toBe('Contact Info');
    expect(document.querySelector('button')?.textContent).toBe('Contact Info');
    expect(document.querySelector('button')?.getAttribute('title')).toBe('Contact Info');
  });

  it('restores translated page chrome to Chinese and leaves content-locale chips native', () => {
    document.body.innerHTML = `
      <main>
        <h1>Contact Info</h1>
        <section data-yf-preserve-admin-text>
          <a><span>中文</span><small>编辑</small></a>
        </section>
      </main>
    `;

    localizeAdminChromeRoot(document.body, 'zh');

    expect(document.querySelector('h1')?.textContent).toBe('联系方式');
    expect(
      document.querySelector('[data-yf-preserve-admin-text]')?.textContent?.replace(/\s+/g, ''),
    ).toBe('中文编辑');
  });
});
