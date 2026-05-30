import type { ComponentProps } from 'react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

type MockImageProps = ComponentProps<'img'> & {
  unoptimized?: boolean;
};

vi.mock('next/image', () => ({
  default: ({ unoptimized: _unoptimized, ...props }: MockImageProps) => createElement('img', props),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: ComponentProps<'a'>) => (
    <a href={String(href)} {...props}>
      {children}
    </a>
  ),
}));

const translations: Record<string, string> = {
  'footer.brand': '永霏防护专注个人防护装备制造，自 2002 年以来持续守护全球作业人员安全。',
  'footer.contentLabel': '页脚内容',
  'footer.copyright': '© 2026 湖南永霏特种防护用品有限公司 版权所有',
  'footer.globalManufacturing': '面向全球的 PPE 制造',
  'footer.since': '始于 2002',
  'nav.about': '关于我们',
  'nav.allProducts': '全部产品',
  'nav.companyProfile': '走进我们',
  'nav.companyNews': '公司新闻',
  'nav.contact': '联系我们',
  'nav.culture': '企业文化',
  'nav.events': '展会活动',
  'nav.franchise': '招商加盟',
  'nav.history': '发展历程',
  'nav.home': '首页',
  'nav.honors': '荣誉资质',
  'nav.news': '新闻中心',
  'nav.products': '产品中心',
  'nav.solutions': '解决方案',
  'nav.strategicPartners': '战略伙伴',
  'nav.video': '宣传短片',
  'page.franchise.formTitle': '招商加盟',
  'page.franchise.policyTag': '政策支持',
  'page.franchise.supportTag': '保障体系',
  'page.franchise.targetTag': '招商目标',
  'page.franchise.valueTag': '入驻价值',
  'page.news.partnersTag': '合作伙伴',
  'page.solutions.emergencyTitle': '应急救援',
  'page.solutions.manufacturingTitle': '制造业',
  'page.solutions.petroTitle': '石油石化',
  'page.solutions.powerTitle': '电力与能源',
  'product.group.chemicalMedical': '化学与医用防护',
  'product.group.electrical': '电气作业防护',
  'product.group.fireRescue': '消防救援防护',
  'product.group.thermal': '热工/焊接防护',
  'product.group.waterRescue': '水域救援防护',
};

vi.mock('@/lib/i18n/getTranslations', () => ({
  getTranslations: () => Promise.resolve((key: string) => translations[key] ?? key),
}));

vi.mock('@/lib/cms/media', () => ({
  shouldUseUnoptimizedImage: () => true,
}));

vi.mock('@/lib/cms/site-settings', () => ({
  getCmsSiteSettings: vi.fn(),
}));

import { Footer } from '@/components/footer/Footer';
import type { CmsSiteSettings } from '@/lib/cms/site-settings';
import type { SiteFooterGroup, SiteNavigationItem } from '@/lib/navigation';

const navItem = (key: string, label: string, href: string): SiteNavigationItem => ({
  key,
  label,
  href,
  target: '_self',
  isContact: href.startsWith('/contact'),
});

const siteSettings: CmsSiteSettings = {
  siteName: '永霏防护',
  tagline: '特种防护装备制造商',
  themeColor: '#1e3a5f',
  logoLight: {
    alt: '永霏防护',
    height: 75,
    src: '/images/brand/yourfield-logo-official-a.png',
    width: 233,
  },
  logoDark: {
    alt: '永霏防护',
    height: 75,
    src: '/images/brand/yourfield-logo-official-b.png',
    width: 233,
  },
  contact: {
    address: '湖南省湘潭市高新区创业东路1号湖湘防护科创园',
    businessHours: '',
    email: 'hnyf@yourfield.net',
    emailHref: 'mailto:hnyf@yourfield.net',
    phone: '400-6800181',
    phoneHref: 'tel:+864006800181',
  },
  coordinates: {
    lat: 27.816329,
    lng: 112.989066,
    zoom: 15,
  },
  icp: '湘ICP备18013725号-1',
  cookieConsent: {
    enabled: true,
  },
  analytics: {
    enabled: false,
  },
  mapService: 'amap',
  publicSecurityRecord: '湘公网安备43030002000000号',
};

const compactCmsFooterNavigation: SiteFooterGroup[] = [
  {
    key: 'company',
    label: '公司',
    links: [
      navItem('about', '关于我们', '/about'),
      navItem('solutions', '解决方案', '/solutions'),
      navItem('franchise', '招商合作', '/franchise'),
      navItem('contact', '联系我们', '/contact'),
    ],
  },
  {
    key: 'products',
    label: '产品',
    links: [
      navItem('fire', '消防救援', '/products?group=fire-rescue'),
      navItem('electrical', '电力防护', '/products?group=electrical-protection'),
    ],
  },
  {
    key: 'legal',
    label: '合规',
    links: [
      navItem('privacy', '隐私政策', '/privacy'),
      navItem('cookies', 'Cookie 政策', '/cookies'),
      navItem('terms', '服务条款', '/terms'),
    ],
  },
];

const fullCmsFooterNavigation: SiteFooterGroup[] = [
  {
    key: 'footer-about-row',
    label: '关于我们',
    links: [navItem('about', '走进我们', '/about#company-profile')],
  },
  {
    key: 'footer-products-row',
    label: '产品中心',
    links: [
      navItem('all-products', '全部产品', '/products'),
      navItem('fire', '消防救援防护', '/products?group=fire-rescue'),
      navItem('electrical', '电气作业防护', '/products?group=electrical-protection'),
    ],
  },
  {
    key: 'footer-solutions-row',
    label: '解决方案',
    links: [navItem('power', '电力与能源', '/solutions#power-energy')],
  },
  {
    key: 'footer-news-row',
    label: '新闻中心',
    links: [
      navItem('company-news', '公司新闻', '/news#company-news'),
      navItem('events', '展会活动', '/news#events'),
      navItem('partners', '合作伙伴', '/news#partner-network'),
    ],
  },
  {
    key: 'footer-franchise-row',
    label: '招商加盟',
    links: [navItem('franchise', '招商加盟', '/franchise')],
  },
];

describe('Footer display', () => {
  it('uses the full product footer layout and hides compliance records', async () => {
    const html = renderToStaticMarkup(
      await Footer({
        footerNavigation: compactCmsFooterNavigation,
        locale: 'zh',
        siteSettings,
      }),
    );

    expect(html).toContain('关于我们');
    expect(html).toContain('产品中心');
    expect(html).toContain('解决方案');
    expect(html).toContain('新闻中心');
    expect(html).toContain('招商加盟');
    expect(html).toContain('联系我们');
    expect(html).toContain('href="/zh/about" class="footer-heading-link">关于我们</a>');
    expect(html).toContain('href="/zh/products" class="footer-heading-link">产品中心</a>');
    expect(html).toContain('href="/zh/solutions" class="footer-heading-link">解决方案</a>');
    expect(html).toContain('href="/zh/news" class="footer-heading-link">新闻中心</a>');
    expect(html).toContain('href="/zh/franchise" class="footer-heading-link">招商加盟</a>');
    expect(html).toContain('href="/zh/contact" class="footer-heading-link">联系我们</a>');
    expect(html).toContain('href="/zh/products#fire-rescue"');
    expect(html).not.toContain('全部产品');
    expect(html).not.toContain('公司新闻');
    expect(html).not.toContain('展会活动');
    expect(html).not.toContain('合作伙伴');
    expect(html).not.toContain('合规');
    expect(html).not.toContain('隐私政策');
    expect(html).not.toContain('Cookie 政策');
    expect(html).not.toContain('服务条款');
    expect(html).not.toContain('湘ICP备');
    expect(html).not.toContain('公安备案');
  });

  it('cleans CMS footer products and news links for the public footer', async () => {
    const html = renderToStaticMarkup(
      await Footer({
        footerNavigation: fullCmsFooterNavigation,
        locale: 'zh',
        siteSettings,
      }),
    );

    expect(html).toContain('产品中心');
    expect(html).toContain('新闻中心');
    expect(html).toContain('href="/zh/news" class="footer-heading-link">新闻中心</a>');
    expect(html).toContain('href="/zh/products#fire-rescue"');
    expect(html).not.toContain('href="/zh/products?group=fire-rescue"');
    expect(html).not.toContain('全部产品');
    expect(html).not.toContain('公司新闻');
    expect(html).not.toContain('展会活动');
    expect(html).not.toContain('合作伙伴');
  });
});
