import '@/styles/legacy-about.css';

import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';

import { AboutSectionNav } from '@/components/about/AboutSectionNav';
import { AboutShowcase, type AboutShowcaseTheme } from '@/components/about/AboutShowcase';
import {
  HonorsCarouselSection,
  type HonorCarouselGroup,
} from '@/components/about/HonorsCarouselSection';
import { JsonLd } from '@/components/public/JsonLd';
import { getCmsPageByKey } from '@/lib/cms/pages';
import { getTranslations } from '@/lib/i18n/getTranslations';
import { resolveRouteLocaleFromParams, type LocaleRouteParams } from '@/lib/i18n/route';
import { resolvePublicVideoUrl } from '@/lib/media/publicAsset';
import { isDraftModeEnabled } from '@/lib/preview/draft';
import { buildPageMetadata, localizedPath } from '@/lib/seo/buildMetadata';
import { breadcrumbJsonLd } from '@/lib/seo/jsonld';

type AboutPageProps = Readonly<{
  params: LocaleRouteParams;
}>;

const aboutSections = [
  ['company-profile', 'nav.companyProfile'],
  ['culture', 'nav.culture'],
  ['honors', 'nav.honors'],
  ['history', 'nav.history'],
  ['strategic-partners', 'nav.strategicPartners'],
  ['video', 'nav.video'],
] as const;

const qualificationCertificates = [
  { image: 1, titleKey: 'page.about.qualification1Title' },
  { image: 2, titleKey: 'page.about.qualification2Title' },
  { image: 3, titleKey: 'page.about.qualification3Title' },
  { image: 4, titleKey: 'page.about.qualification4Title' },
  { image: 5, titleKey: 'page.about.qualification5Title' },
  { image: 6, titleKey: 'page.about.qualification6Title' },
  { image: 7, titleKey: 'page.about.qualification7Title' },
  { image: 8, titleKey: 'page.about.qualification8Title' },
  { image: 9, titleKey: 'page.about.qualification9Title' },
  { image: 10, titleKey: 'page.about.qualification10Title' },
  { image: 11, titleKey: 'page.about.qualification11Title' },
  { image: 12, titleKey: 'page.about.qualification12Title' },
  { image: 13, titleKey: 'page.about.qualification13Title' },
  { image: 14, titleKey: 'page.about.qualification14Title' },
] as const;

const recognitionCertificates = [
  { image: 1, title: '全国五一劳动奖状' },
  { image: 2, title: '国家专精特新小巨人企业' },
  { image: 3, title: '第三届安全科技进步奖二等奖' },
  { image: 4, title: '高新技术企业' },
  { image: 5, title: '中国纺织工业联合会产品开发贡献奖' },
  { image: 6, title: '国家绿色工厂' },
  { image: 7, title: '中国职业防护纺织品研发中心' },
  { image: 8, title: '第六批全国劳保行业推荐品牌' },
  { image: 9, title: '省认定企业技术中心' },
  { image: 10, title: '湖南省制造业质量标杆认定名单' },
  { image: 11, title: '精工设计优秀案例' },
  { image: 12, title: '2022年中国优秀工业设计奖铜奖' },
  { image: 13, title: '湖南名品' },
  { image: 14, title: '2024年度十大类纺织创新产品（轻量化焊接服）' },
  { image: 15, title: '湖南省制造业单项冠军产品' },
  { image: 16, title: '湖南省安全生产学会证书' },
  { image: 17, title: '应急救援装备产业技术理事单位' },
  { image: 18, title: '湖南省标杆党组织' },
  { image: 19, title: '湘潭高新区2023年高质量发展创新创业奖' },
  { image: 20, title: '全国抗击新冠肺炎疫情先进集体' },
  { image: 21, title: '全国抗击新冠肺炎疫情先进集体' },
  { image: 22, title: '湖南省消费品工业“三品”标杆企业' },
  { image: 23, title: '湖南省第九批省级工业设计中心' },
  { image: 24, title: '湖南省疫情防控突出贡献企业' },
  { image: 25, title: '2020年度抗击新冠疫情防控复工复产先进单位' },
  { image: 26, title: '抗疫英雄' },
  { image: 27, title: '2020抗击疫情品牌贡献企业' },
  { image: 28, title: '国务院应对新型冠状病毒肺炎疫情联防联控机制医疗物资保障组感谢信' },
  { image: 29, title: '湖南省新冠肺炎疫情防控工作领导小组防疫物资保障组感谢信' },
  { image: 30, title: '捐赠证书' },
  { image: 31, title: '捐赠证书' },
  { image: 32, title: '捐赠证书' },
  { image: 33, title: '捐赠证书' },
] as const;

const spiritCards = [
  ['values', 'page.about.spirit1Title', 'page.about.spirit1Text'],
  ['mission', 'page.about.spirit2Title', 'page.about.spirit2Text'],
  ['spirit', 'page.about.spirit3Title', 'page.about.spirit3Text'],
  ['vision', 'page.about.spirit4Title', 'page.about.spirit4Text'],
] as const;

const aboutVideos = [
  [
    'page.about.videoPrimaryEyebrow',
    'page.about.videoPrimaryTitle',
    resolvePublicVideoUrl('/video/about.mp4'),
    '/images/scenes/about-video-poster.jpg',
  ],
  [
    'page.about.videoSecondaryEyebrow',
    'page.about.videoSecondaryTitle',
    resolvePublicVideoUrl('/video/culture.mp4'),
    '/images/scenes/culture-video-poster.jpg',
  ],
] as const;

const timelineItems = [
  ['2002', 'page.about.h2002Title', 'page.about.h2002Text'],
  ['2010', 'page.about.h2010Title', 'page.about.h2010Text'],
  ['2018', 'page.about.h2018Title', 'page.about.h2018Text'],
  ['2020', 'page.about.h2020Title', 'page.about.h2020Text'],
  ['2022', 'page.about.h2022Title', 'page.about.h2022Text'],
  ['2024', 'page.about.h2024Title', 'page.about.h2024Text'],
  ['2025', 'page.about.h2025Title', 'page.about.h2025Text'],
] as const;

const partnerCards = [
  ['honeywell', 'Honeywell', '霍尼韦尔', '#d71920'],
  ['cecit', 'CECIT', '中电国睿', '#3f438f'],
  ['taiho', 'TAIHO', '泰和新材', '#1e7fba'],
  ['hna', 'HNA', '海航集团', '#d71920'],
  ['yanchang-petroleum', 'Yanchang Petroleum', '延长石油', '#d71920', 'long'],
  ['basf', 'BASF', '巴斯夫', '#00599c'],
  ['valin-group', 'VALIN GROUP', '华菱集团', '#0072bc', 'long'],
  ['baic', 'BAIC', '北汽集团', '#d71920'],
  ['zoomlion', 'Zoomlion', '中联重科', '#6dbb2f'],
  ['cnnp', 'CNNP', '中国核电', '#1f6fbc'],
  ['china-tietong', 'China Tietong', '中国铁通', '#008d4f', 'long'],
  ['crcc', 'CRCC', '中国铁建', '#d71920'],
  ['cnooc', 'CNOOC', '中国海油', '#e21b2d'],
  ['cscec', 'CSCEC', '中国建筑', '#159bd7'],
  ['baowu', 'BAOWU', '中国宝武', '#2367b0'],
  ['chinacoal', 'ChinaCoal', '中国中煤', '#1f506d', 'long'],
  ['saic-motor', 'SAIC Motor', '上汽集团', '#1f78c8', 'long'],
  ['state-grid', 'State Grid', '国家电网', '#0f9b69', 'long'],
  ['china-post', 'China Post', '中国邮政', '#008f4f', 'long'],
  ['crrc', 'CRRC', '中国中车', '#c71920'],
  ['petrochina', 'PetroChina', '中国石油', '#d71920', 'long'],
  ['sinopharm', 'Sinopharm', '国药集团', '#4e9d63'],
  ['spic', 'SPIC', '国家电投', '#34a853'],
  ['sinopec', 'Sinopec', '中国石化', '#c71920'],
  ['china-huaneng', 'China Huaneng', '中国华能', '#1b66b1', 'long'],
  ['sany', 'SANY', '三一重工', '#d71920'],
  ['csg', 'CSG', '中国南方电网', '#256aa8', 'long'],
  ['cgn', 'CGN', '中广核', '#0e73b8'],
  ['valin-steel', 'Valin Steel', '华菱钢铁', '#1177bf', 'long'],
  ['hangzhou-metro', 'Hangzhou Metro', '杭州地铁', '#d71920', 'long'],
  ['3m', '3M', 'Multinational', '#ff1f1f'],
  ['catl', 'CATL', '宁德时代', '#2254a3'],
] as const;

export async function generateMetadata({ params }: AboutPageProps) {
  const locale = await resolveRouteLocaleFromParams(params);
  const isDraft = await isDraftModeEnabled();
  const t = await getTranslations(locale);
  const page = await getCmsPageByKey(locale, 'about', isDraft);

  return buildPageMetadata({
    locale,
    path: '/about',
    title: page?.seoTitle || page?.title || t('page.about.title'),
    description: page?.seoDescription || t('page.about.groupBody1'),
    image: page?.seoImage || page?.heroImage,
    noIndex: isDraft || Boolean(page?.noIndex),
  });
}

export default async function AboutPage({ params }: AboutPageProps) {
  const locale = await resolveRouteLocaleFromParams(params);
  const isDraft = await isDraftModeEnabled();
  const t = await getTranslations(locale);
  const page = await getCmsPageByKey(locale, 'about', isDraft);
  const heroImage = page?.heroImage;
  const navSections = aboutSections.map(([id, labelKey]) => ({
    id,
    label: t(labelKey),
  }));
  const showcaseThemes: readonly AboutShowcaseTheme[] = [
    {
      body: [t('page.about.groupBody1'), t('page.about.groupBody2'), t('page.about.groupBody3')],
      caption: t('page.about.groupCaption'),
      facts: [1, 2, 3, 4].map((item) => t(`page.about.groupFact${item}`)),
      images: [
        {
          alt: t('page.about.theme.group'),
          src: '/images/about/yourfield-campus.png',
        },
        {
          alt: t('page.about.groupCaption'),
          src: '/images/about/yourfield-production.png',
        },
        {
          alt: t('page.about.groupCaption'),
          src: '/images/about/yourfield-smart-warehouse.png',
        },
      ],
      metrics: [1, 2, 3].map((item) => ({
        label: t(`page.about.groupMetric${item}Label`),
        value: t(`page.about.groupMetric${item}Value`),
      })),
      theme: t('page.about.theme.group'),
      title: t('page.about.groupTitle'),
    },
    {
      body: [
        t('page.about.medicalBody1'),
        t('page.about.medicalBody2'),
        t('page.about.medicalBody3'),
      ],
      caption: t('page.about.medicalCaption'),
      facts: [1, 2, 3, 4].map((item) => t(`page.about.medicalFact${item}`)),
      images: [
        {
          alt: t('page.about.medicalCaption'),
          src: '/images/about/yourfield-medical-1.jpg',
        },
        {
          alt: t('page.about.medicalCaption'),
          src: '/images/about/yourfield-medical-2.png',
        },
        {
          alt: t('page.about.medicalCaption'),
          src: '/images/about/yourfield-medical-3.jpg',
        },
      ],
      metrics: [1, 2, 3].map((item) => ({
        label: t(`page.about.medicalMetric${item}Label`),
        value: t(`page.about.medicalMetric${item}Value`),
      })),
      theme: t('page.about.theme.medical'),
      title: t('page.about.medicalTitle'),
    },
    {
      body: [
        t('page.about.trainingBody1'),
        t('page.about.trainingBody2'),
        t('page.about.trainingBody3'),
      ],
      caption: t('page.about.trainingCaption'),
      facts: [1, 2, 3, 4].map((item) => t(`page.about.trainingFact${item}`)),
      images: [
        {
          alt: t('page.about.trainingCaption'),
          src: '/images/about/yourfield-training-1.jpg',
        },
        {
          alt: t('page.about.trainingCaption'),
          src: '/images/about/yourfield-training-2.jpg',
        },
        {
          alt: t('page.about.trainingCaption'),
          src: '/images/about/yourfield-training-3.jpg',
        },
      ],
      metrics: [1, 2, 3].map((item) => ({
        label: t(`page.about.trainingMetric${item}Label`),
        value: t(`page.about.trainingMetric${item}Value`),
      })),
      theme: t('page.about.theme.training'),
      title: t('page.about.trainingTitle'),
    },
    {
      body: [t('page.about.sewingBody1'), t('page.about.sewingBody2'), t('page.about.sewingBody3')],
      caption: t('page.about.sewingCaption'),
      facts: [1, 2, 3, 4].map((item) => t(`page.about.sewingFact${item}`)),
      images: [
        {
          alt: t('page.about.sewingCaption'),
          src: '/images/about/yourfield-sewing-1.jpg',
        },
        {
          alt: t('page.about.sewingCaption'),
          src: '/images/about/yourfield-sewing-2.jpg',
        },
        {
          alt: t('page.about.sewingCaption'),
          src: '/images/about/yourfield-sewing-3.jpg',
        },
      ],
      metrics: [1, 2, 3].map((item) => ({
        label: t(`page.about.sewingMetric${item}Label`),
        value: t(`page.about.sewingMetric${item}Value`),
      })),
      theme: t('page.about.theme.sewing'),
      title: t('page.about.sewingTitle'),
    },
  ];
  const honorGroups: readonly HonorCarouselGroup[] = [
    {
      id: 'qualification',
      items: qualificationCertificates.map(({ image, titleKey }) => {
        const paddedNumber = String(image).padStart(2, '0');

        return {
          id: `qualification-${paddedNumber}`,
          src: `/images/about/honors/qualifications/${image}.jpg`,
          title: t(titleKey),
        };
      }),
      label: t('page.about.enterpriseQualifications'),
    },
    {
      id: 'recognition',
      items: recognitionCertificates.map(({ image, title }) => {
        const paddedNumber = String(image).padStart(2, '0');

        return {
          id: `recognition-${paddedNumber}`,
          src: `/images/about/honors/recognitions/${image}.jpg`,
          title,
        };
      }),
      label: t('page.about.enterpriseHonors'),
    },
  ];

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: t('nav.home'), path: localizedPath(locale, '/') },
          { name: t('page.about.title'), path: localizedPath(locale, '/about') },
        ])}
      />

      {page?.heroEnabled !== false ? (
        <section
          className="page-header about-page-header"
          aria-labelledby="about-page-title"
          style={heroImage ? { backgroundImage: `url("${heroImage}")` } : undefined}
        >
          <div className="container">
            <h1 id="about-page-title">{page?.heroTitle || t('page.about.title')}</h1>
            <div className="divider" aria-hidden="true" />
            <nav className="breadcrumb" aria-label="Breadcrumb">
              <Link href={`/${locale}`}>{t('nav.home')}</Link>
              <span aria-hidden="true">/</span>
              <span>{t('page.about.title')}</span>
            </nav>
          </div>
        </section>
      ) : null}

      <AboutSectionNav
        currentLabel={t('page.about.currentSection')}
        label={t('page.about.sectionNavLabel')}
        sections={navSections}
      />

      <section id="company-profile" className="about-intro about-anchor">
        <div className="container">
          <AboutShowcase
            nextLabel={t('product.detail.carouselNext')}
            previousLabel={t('product.detail.carouselPrevious')}
            themes={showcaseThemes}
          />
        </div>
      </section>

      <section id="culture" className="culture-section about-anchor">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">{t('page.about.cultureTag')}</span>
            <h2>{t('page.about.cultureTitle')}</h2>
            <p>{t('page.about.cultureText')}</p>
          </div>
          <div className="culture-layout">
            <div className="culture-video-feature">
              <div className="culture-video-card">
                <video
                  poster="/images/scenes/about-video-poster.jpg"
                  preload="none"
                  muted
                  playsInline
                  controls
                  src={resolvePublicVideoUrl('/video/about.mp4')}
                />
              </div>
              <div className="culture-video-caption">
                <span>{t('page.about.cultureVideoEyebrow')}</span>
                <h3>{t('page.about.cultureVideoTitle')}</h3>
                <p>{t('page.about.cultureVideoText')}</p>
              </div>
            </div>
            <div className="spirit-grid">
              {spiritCards.map(([variant, titleKey, textKey], index) => (
                <article key={variant} className={`spirit-card spirit-card--${variant}`}>
                  <div className="spirit-card__top">
                    <span className="section-tag">{t('page.about.theme.group')}</span>
                    <span className="spirit-card__index">0{index + 1}</span>
                  </div>
                  <h3>{t(titleKey)}</h3>
                  <p>{t(textKey)}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="honors" className="honors-section about-anchor">
        <div className="container">
          <div className="section-header" style={{ textAlign: 'center' }}>
            <span className="section-tag">{t('page.about.honorsTag')}</span>
            <h2>{t('page.about.honorsTitle')}</h2>
          </div>
          <HonorsCarouselSection
            ariaLabel={t('page.about.honorsTabsLabel')}
            closeLabel={t('page.about.honorsLightboxClose')}
            groups={honorGroups}
            previewLabelTemplate={t('page.about.honorsPreviewLabel', { title: '__TITLE__' })}
          />
        </div>
      </section>

      <section id="history" className="history-section about-anchor">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">{t('page.about.historyTag')}</span>
            <h2>{t('page.about.historyTitle')}</h2>
            <p>{t('page.about.historyLead')}</p>
          </div>
          <div className="timeline">
            {timelineItems.map(([year, titleKey, textKey]) => (
              <div key={year} className="timeline-item">
                <article className="timeline-content">
                  <div className="timeline-year">{year}</div>
                  <h3>{t(titleKey)}</h3>
                  <p>{t(textKey)}</p>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="strategic-partners" className="strategic-partners-section about-anchor">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">{t('page.about.partnersTag')}</span>
            <h2>{t('page.about.partnersTitle')}</h2>
            <p>{t('page.about.partnersText')}</p>
          </div>
          <div className="strategic-partner-proof" aria-label={t('page.about.partnersGridLabel')}>
            {[1, 2, 3].map((item) => (
              <div key={item} className="strategic-partner-proof__item">
                <strong>{t(`page.about.partnersStat${item}Value`)}</strong>
                <span>{t(`page.about.partnersStat${item}Label`)}</span>
              </div>
            ))}
          </div>
          <div
            className="strategic-partner-board"
            role="list"
            aria-label={t('page.about.partnersGridLabel')}
          >
            {partnerCards.map(([slug, mark, name, color, length]) => (
              <article
                key={slug}
                className={['partner-card', length === 'long' ? 'is-long' : '']
                  .filter(Boolean)
                  .join(' ')}
                role="listitem"
                aria-label={`${mark} ${name}`}
                style={{ '--partner-color': color } as CSSProperties}
              >
                <span className="partner-card__logo" aria-hidden="true">
                  <Image
                    src={`/images/partners/logos/${slug}.png`}
                    alt=""
                    fill
                    sizes="(min-width: 1180px) 10vw, (min-width: 768px) 18vw, 38vw"
                    unoptimized
                  />
                </span>
                <span className="sr-only">{name}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="video" className="about-video-section about-anchor">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">{t('page.about.videoTag')}</span>
            <h2>{t('page.about.videoTitle')}</h2>
            <p>{t('page.about.videoText')}</p>
          </div>
          <div className="about-video-shell" aria-label={t('page.about.videoGroupLabel')}>
            {aboutVideos.map(([eyebrowKey, titleKey, videoSrc, posterSrc]) => (
              <article key={titleKey} className="about-video-item">
                <div className="about-video-card">
                  <video
                    poster={posterSrc}
                    preload="none"
                    muted
                    playsInline
                    controls
                    src={videoSrc}
                  />
                </div>
                <div className="about-video-caption">
                  <span>{t(eyebrowKey)}</span>
                  <h3>{t(titleKey)}</h3>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
