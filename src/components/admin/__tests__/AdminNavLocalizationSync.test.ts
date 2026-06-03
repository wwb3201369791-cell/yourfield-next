import { describe, expect, it } from 'vitest';

import { localizeAdminNavText } from '../adminNavLocalization';
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
});
