import type { Payload } from 'payload';

import enMessages from '../../messages/en.json';
import ruMessages from '../../messages/ru.json';
import zhMessages from '../../messages/zh.json';

import {
  localized,
  localizedRichTextFromPlainText,
  splitLocalizedData,
  textRows,
  type Locale,
  type LocalizedString,
  type SeedOptions,
  type SeedResult,
} from './lib/shared';
import { upsertCollection } from './lib/upsert';

type MediaManifest = Map<string, number>;
type MessageMap = Record<string, string>;
type PayloadData = { [key: string]: Partial<unknown> | undefined; id?: string | number };

type NewsBodyBlock =
  | {
      text: LocalizedString;
      type: 'paragraph';
    }
  | {
      imagePath: string;
      type: 'image';
    };

type LegacyNewsSeed = {
  body?: NewsBodyBlock[];
  slug: string;
  categoryKey?: string;
  categoryLabel?: LocalizedString;
  datePublished: string;
  excerpt?: LocalizedString;
  excerptKey?: string;
  imagePath: string;
  title?: LocalizedString;
  titleKey?: string;
};

const coverImagePath =
  'assets/images/products/firefighter-protective-suit/modeling-jacket-front.png';
const partyBuildingImagePath = 'assets/images/news/party-building-safety-industry.jpg';
const centralSafetyValleyImagePath = 'assets/images/news/central-safety-valley.png';
const mayDayInspectionImagePath = 'assets/images/news/may-day-safety-inspection.png';
const nonDefaultLocales = ['en', 'ru'] as const satisfies ReadonlyArray<Exclude<Locale, 'zh'>>;

const messages: Record<Locale, MessageMap> = {
  zh: zhMessages,
  en: enMessages,
  ru: ruMessages,
};

const sampleNewsCategoryLabel = localized('示例内容', 'Sample Content', 'Пример материала');
const sampleNewsExcerpt = localized(
  '此条为前台版式示例，用于展示新闻卡片、列表和详情页结构，正式标题、正文和配图确认后替换。',
  'This layout sample keeps the news card, list, and detail page visible until the final title, copy, and media are confirmed.',
  'Этот пример макета показывает карточку, список и страницу новости до подтверждения финального заголовка, текста и изображения.',
);

const sampleNewsBody = (topic: LocalizedString): NewsBodyBlock[] => [
  {
    type: 'paragraph',
    text: localized(
      `此条为“${topic.zh}”前台版式示例，用于预览新闻标题、摘要、配图和正文在网站中的展示效果。`,
      `This is a layout sample for ${topic.en}. It previews how the news title, summary, cover image, and article body will appear on the website.`,
      `Это пример макета для темы "${topic.ru}". Он показывает, как на сайте будут выглядеть заголовок, краткое описание, обложка и текст новости.`,
    ),
  },
  {
    type: 'paragraph',
    text: localized(
      '正式内容确认后，可替换为企业动态、活动回顾、产品进展、荣誉资质或行业资讯等真实新闻文本。',
      'After approval, replace this sample with real company updates, event recaps, product progress, certifications, or industry news.',
      'После утверждения замените этот пример реальными новостями компании, итогами мероприятий, развитием продуктов, сертификатами или отраслевыми материалами.',
    ),
  },
  {
    type: 'paragraph',
    text: localized(
      '发布前请补充准确日期、来源、图片说明和正文信息，确认无误后再作为正式新闻对外展示。',
      'Before publishing, add the correct date, source, image caption, and article copy, then confirm the page before showing it as official news.',
      'Перед публикацией добавьте точную дату, источник, подпись к изображению и текст статьи, затем проверьте страницу перед официальным показом.',
    ),
  },
];

const legacyNewsSeeds: LegacyNewsSeed[] = [
  {
    slug: 'party-building-safety-industry',
    categoryLabel: localized('公司新闻', 'Company News', 'Новости компании'),
    title: localized(
      '党建铸安 赋能产业',
      'Party Building for Safety and Industry Enablement',
      'Партийное строительство для безопасности и промышленного развития',
    ),
    excerpt: localized(
      '永霏集团围绕党建引领、安全生产和产业协同开展主题活动，将组织建设转化为企业高质量发展的稳定动能。',
      'YourField links Party-building work with safety management and industrial collaboration to support steady high-quality growth.',
      'YourField связывает партийное строительство, управление безопасностью и отраслевое сотрудничество для устойчивого развития.',
    ),
    imagePath: partyBuildingImagePath,
    datePublished: '2026-05-20',
    body: [
      {
        type: 'paragraph',
        text: localized(
          '永霏集团围绕党建引领安全生产和产业发展，开展“党建铸安 赋能产业”主题活动，将安全责任、组织建设和产业协同结合起来，推动企业高质量发展。',
          '永霏集团围绕党建引领安全生产和产业发展，开展“党建铸安 赋能产业”主题活动，将安全责任、组织建设和产业协同结合起来，推动企业高质量发展。',
          '永霏集团围绕党建引领安全生产和产业发展，开展“党建铸安 赋能产业”主题活动，将安全责任、组织建设和产业协同结合起来，推动企业高质量发展。',
        ),
      },
      {
        type: 'paragraph',
        text: localized(
          '活动强调以党建带安全、以安全促生产，把风险防控、岗位责任和员工能力建设落实到一线场景。',
          '活动强调以党建带安全、以安全促生产，把风险防控、岗位责任和员工能力建设落实到一线场景。',
          '活动强调以党建带安全、以安全促生产，把风险防控、岗位责任和员工能力建设落实到一线场景。',
        ),
      },
      {
        type: 'paragraph',
        text: localized(
          '后续，企业将继续完善党建与安全生产融合机制，为安全防护产业链发展提供更稳固的组织保障。',
          '后续，企业将继续完善党建与安全生产融合机制，为安全防护产业链发展提供更稳固的组织保障。',
          '后续，企业将继续完善党建与安全生产融合机制，为安全防护产业链发展提供更稳固的组织保障。',
        ),
      },
    ],
  },
  {
    slug: 'central-safety-valley',
    categoryLabel: localized('公司新闻', 'Company News', 'Новости компании'),
    title: localized('中部“安谷”', 'Central Safety Valley', 'Центральная долина безопасности'),
    excerpt: localized(
      '省工业和信息化行业事务中心在永霏开展“设计赋能安全应急装备”专场对接活动。',
      'The Hunan industry affairs center held a design-enabled safety emergency equipment matchmaking session at YourField.',
      'Профильный центр провел в YourField встречу по промышленному дизайну для аварийно-спасательного оборудования.',
    ),
    imagePath: centralSafetyValleyImagePath,
    datePublished: '2026-05-09',
    body: [
      {
        type: 'paragraph',
        text: localized(
          '5月7日，由湖南省工业和信息化行业事务中心（以下简称中心）主办的“设计赋能安全应急装备”专场对接活动在湖南永霏特种防护用品有限公司开展。本次活动旨在以工业设计为切入点，推动政产学研协同，助力安全应急产业高质量发展。',
          '5月7日，由湖南省工业和信息化行业事务中心（以下简称中心）主办的“设计赋能安全应急装备”专场对接活动在湖南永霏特种防护用品有限公司开展。本次活动旨在以工业设计为切入点，推动政产学研协同，助力安全应急产业高质量发展。',
          '5月7日，由湖南省工业和信息化行业事务中心（以下简称中心）主办的“设计赋能安全应急装备”专场对接活动在湖南永霏特种防护用品有限公司开展。本次活动旨在以工业设计为切入点，推动政产学研协同，助力安全应急产业高质量发展。',
        ),
      },
      {
        imagePath: centralSafetyValleyImagePath,
        type: 'image',
      },
      {
        type: 'paragraph',
        text: localized(
          '中心党委书记、主任邓光亮带队，省工业和信息化厅产业政策与法规处、中心、省同天工业设计创新中心相关负责同志及高校设计专家和工业设计机构代表共同参与。湘潭市人民政府副秘书长李先金主持座谈会，湘潭市工业和信息化局相关人员参加活动。',
          '中心党委书记、主任邓光亮带队，省工业和信息化厅产业政策与法规处、中心、省同天工业设计创新中心相关负责同志及高校设计专家和工业设计机构代表共同参与。湘潭市人民政府副秘书长李先金主持座谈会，湘潭市工业和信息化局相关人员参加活动。',
          '中心党委书记、主任邓光亮带队，省工业和信息化厅产业政策与法规处、中心、省同天工业设计创新中心相关负责同志及高校设计专家和工业设计机构代表共同参与。湘潭市人民政府副秘书长李先金主持座谈会，湘潭市工业和信息化局相关人员参加活动。',
        ),
      },
      {
        type: 'paragraph',
        text: localized(
          '活动伊始，专家团队首先参观了公司的新产品展示，实地了解永霏在安全应急装备领域的最新研发成果与技术亮点。在对接座谈会上，针对企业提出的产品功能、外观、工艺和品牌升级四大需求，专家现场给出系统化建议：一是深入一线作业场景，体验真实使用痛点；二是组织工人、工程师等共同参与设计；三是从安全、性价比、用户体验等角度综合评判产品；四是拓展民用防护市场，提升品牌大众认知；五是加强与高校协同合作，充分利用高校资源优势。期间，双方聚焦产品创新、设计升级与品牌提升达成需求意向。',
          '活动伊始，专家团队首先参观了公司的新产品展示，实地了解永霏在安全应急装备领域的最新研发成果与技术亮点。在对接座谈会上，针对企业提出的产品功能、外观、工艺和品牌升级四大需求，专家现场给出系统化建议：一是深入一线作业场景，体验真实使用痛点；二是组织工人、工程师等共同参与设计；三是从安全、性价比、用户体验等角度综合评判产品；四是拓展民用防护市场，提升品牌大众认知；五是加强与高校协同合作，充分利用高校资源优势。期间，双方聚焦产品创新、设计升级与品牌提升达成需求意向。',
          '活动伊始，专家团队首先参观了公司的新产品展示，实地了解永霏在安全应急装备领域的最新研发成果与技术亮点。在对接座谈会上，针对企业提出的产品功能、外观、工艺和品牌升级四大需求，专家现场给出系统化建议：一是深入一线作业场景，体验真实使用痛点；二是组织工人、工程师等共同参与设计；三是从安全、性价比、用户体验等角度综合评判产品；四是拓展民用防护市场，提升品牌大众认知；五是加强与高校协同合作，充分利用高校资源优势。期间，双方聚焦产品创新、设计升级与品牌提升达成需求意向。',
        ),
      },
      {
        type: 'paragraph',
        text: localized(
          '邓光亮指出，工业设计是产业转型升级的关键引擎，也是现代服务业的一种重要模式，对于提升安全应急装备的附加值、科技含量及市场竞争力具有重要意义。此次对接活动是工信系统精准服务企业的一次专项行动，体现了“政府引导、企业主体、院校支撑、机构协同”的工作思路。他表示，省工信系统将全力支持永霏开展设计升级、深化校企合作及推进创新平台建设，助力企业加快成长为全国安全应急装备领域的龙头企业，为安全应急产业发展贡献更大力量。',
          '邓光亮指出，工业设计是产业转型升级的关键引擎，也是现代服务业的一种重要模式，对于提升安全应急装备的附加值、科技含量及市场竞争力具有重要意义。此次对接活动是工信系统精准服务企业的一次专项行动，体现了“政府引导、企业主体、院校支撑、机构协同”的工作思路。他表示，省工信系统将全力支持永霏开展设计升级、深化校企合作及推进创新平台建设，助力企业加快成长为全国安全应急装备领域的龙头企业，为安全应急产业发展贡献更大力量。',
          '邓光亮指出，工业设计是产业转型升级的关键引擎，也是现代服务业的一种重要模式，对于提升安全应急装备的附加值、科技含量及市场竞争力具有重要意义。此次对接活动是工信系统精准服务企业的一次专项行动，体现了“政府引导、企业主体、院校支撑、机构协同”的工作思路。他表示，省工信系统将全力支持永霏开展设计升级、深化校企合作及推进创新平台建设，助力企业加快成长为全国安全应急装备领域的龙头企业，为安全应急产业发展贡献更大力量。',
        ),
      },
      {
        type: 'paragraph',
        text: localized(
          '本次活动为永霏产品升级与品牌提升注入新动能，也为湖南省安全应急产业探索了“设计赋能、协同创新”的有效路径。',
          '本次活动为永霏产品升级与品牌提升注入新动能，也为湖南省安全应急产业探索了“设计赋能、协同创新”的有效路径。',
          '本次活动为永霏产品升级与品牌提升注入新动能，也为湖南省安全应急产业探索了“设计赋能、协同创新”的有效路径。',
        ),
      },
    ],
  },
  {
    slug: 'may-day-safety-inspection',
    categoryLabel: localized('公司新闻', 'Company News', 'Новости компании'),
    title: localized(
      '胡贺波带队督导检查“五一”节前安全生产工作',
      'Hu Hebo Led a Pre-May Day Workplace Safety Inspection',
      'Ху Хэбо провел проверку безопасности производства перед Первомаем',
    ),
    excerpt: localized(
      '围绕节前安全生产检查要求，相关领导深入企业一线，督导安全责任落实和生产运行保障工作。',
      'The inspection focused on workplace safety before the May Day holiday, with on-site guidance for safety responsibility and production safeguards.',
      'Проверка перед майскими праздниками была посвящена производственной безопасности, ответственности на местах и стабильной работе предприятия.',
    ),
    imagePath: mayDayInspectionImagePath,
    datePublished: '2026-05-01',
    body: [
      {
        type: 'paragraph',
        text: localized(
          '“五一”节前，胡贺波带队深入相关企业开展安全生产督导检查，现场了解生产运行、仓储管理和节日期间值班值守安排。',
          '“五一”节前，胡贺波带队深入相关企业开展安全生产督导检查，现场了解生产运行、仓储管理和节日期间值班值守安排。',
          '“五一”节前，胡贺波带队深入相关企业开展安全生产督导检查，现场了解生产运行、仓储管理和节日期间值班值守安排。',
        ),
      },
      {
        type: 'paragraph',
        text: localized(
          '检查组强调，要压实企业主体责任，紧盯重点场所、重点环节和关键岗位，持续排查风险隐患，确保节日期间安全生产形势稳定。',
          '检查组强调，要压实企业主体责任，紧盯重点场所、重点环节和关键岗位，持续排查风险隐患，确保节日期间安全生产形势稳定。',
          '检查组强调，要压实企业主体责任，紧盯重点场所、重点环节和关键岗位，持续排查风险隐患，确保节日期间安全生产形势稳定。',
        ),
      },
      {
        type: 'paragraph',
        text: localized(
          '永霏将按照检查要求完善现场管理和应急响应机制，保障节日期间生产经营平稳有序。',
          '永霏将按照检查要求完善现场管理和应急响应机制，保障节日期间生产经营平稳有序。',
          '永霏将按照检查要求完善现场管理和应急响应机制，保障节日期间生产经营平稳有序。',
        ),
      },
    ],
  },
  {
    slug: 'hunan-labor-award-publicity',
    categoryLabel: sampleNewsCategoryLabel,
    title: localized(
      '示例：荣誉公示新闻标题待补充',
      'Example: Award Notice News Title Pending',
      'Пример: заголовок новости о наградах ожидает заполнения',
    ),
    excerpt: sampleNewsExcerpt,
    body: sampleNewsBody(localized('荣誉公示新闻', 'award notice news', 'новости о наградах')),
    imagePath: coverImagePath,
    datePublished: '2026-04-30',
  },
  {
    slug: 'yonghe-protection-established',
    categoryLabel: sampleNewsCategoryLabel,
    title: localized(
      '示例：产业链动态新闻标题待补充',
      'Example: Industry Chain News Title Pending',
      'Пример: заголовок новости о промышленной цепочке ожидает заполнения',
    ),
    excerpt: sampleNewsExcerpt,
    body: sampleNewsBody(
      localized('产业链动态新闻', 'industry chain news', 'новости о промышленной цепочке'),
    ),
    imagePath: coverImagePath,
    datePublished: '2026-01-22',
  },
  {
    slug: 'advanced-emergency-equipment-catalog',
    categoryLabel: sampleNewsCategoryLabel,
    title: localized(
      '示例：行业目录新闻标题待补充',
      'Example: Industry Catalog News Title Pending',
      'Пример: заголовок новости об отраслевом каталоге ожидает заполнения',
    ),
    excerpt: sampleNewsExcerpt,
    body: sampleNewsBody(
      localized('行业目录新闻', 'industry catalog news', 'новости об отраслевом каталоге'),
    ),
    imagePath: coverImagePath,
    datePublished: '2026-01-01',
  },
  {
    slug: 'provincial-technology-platform',
    categoryLabel: sampleNewsCategoryLabel,
    title: localized(
      '示例：技术平台新闻标题待补充',
      'Example: Technology Platform News Title Pending',
      'Пример: заголовок новости о технологической платформе ожидает заполнения',
    ),
    excerpt: sampleNewsExcerpt,
    body: sampleNewsBody(
      localized('技术平台新闻', 'technology platform news', 'новости о технологической платформе'),
    ),
    imagePath: coverImagePath,
    datePublished: '2026-01-01',
  },
  {
    slug: 'li-wenhui-hunan-entrepreneur',
    categoryLabel: sampleNewsCategoryLabel,
    title: localized(
      '示例：人物报道新闻标题待补充',
      'Example: Profile Story Title Pending',
      'Пример: заголовок персональной истории ожидает заполнения',
    ),
    excerpt: sampleNewsExcerpt,
    body: sampleNewsBody(localized('人物报道新闻', 'profile story', 'персональной истории')),
    imagePath: coverImagePath,
    datePublished: '2025-12-01',
  },
  {
    slug: 'strategy-seminar-2026',
    categoryLabel: sampleNewsCategoryLabel,
    title: localized(
      '示例：会议活动新闻标题待补充',
      'Example: Event News Title Pending',
      'Пример: заголовок новости о мероприятии ожидает заполнения',
    ),
    excerpt: sampleNewsExcerpt,
    body: sampleNewsBody(localized('会议活动新闻', 'event news', 'новости о мероприятии')),
    imagePath: coverImagePath,
    datePublished: '2025-12-01',
  },
  {
    slug: 'textile-brand-cultivation',
    categoryLabel: sampleNewsCategoryLabel,
    title: localized(
      '示例：品牌建设新闻标题待补充',
      'Example: Brand Development News Title Pending',
      'Пример: заголовок новости о развитии бренда ожидает заполнения',
    ),
    excerpt: sampleNewsExcerpt,
    body: sampleNewsBody(
      localized('品牌建设新闻', 'brand development news', 'новости о развитии бренда'),
    ),
    imagePath: coverImagePath,
    datePublished: '2025-12-01',
  },
];

const message = (locale: Locale, key: string) => messages[locale][key] ?? messages.zh[key] ?? key;

const localizedMessage = (key: string): LocalizedString =>
  localized(message('zh', key), message('en', key), message('ru', key));

const fallbackBody = (title: LocalizedString, excerpt: LocalizedString): LocalizedString => ({
  zh: `${excerpt.zh}\n\n${title.zh}`,
  en: `${excerpt.en}\n\n${title.en}`,
  ru: `${excerpt.ru}\n\n${title.ru}`,
});

const localizedValueForSeed = (
  item: LegacyNewsSeed,
  field: 'categoryLabel' | 'excerpt' | 'title',
  keyField: 'categoryKey' | 'excerptKey' | 'titleKey',
) => {
  const value = item[field];

  if (value) {
    return value;
  }

  const key = item[keyField];

  if (!key) {
    throw new Error(`Missing ${field} for news ${item.slug}`);
  }

  return localizedMessage(key);
};

const textNode = (text: string) => ({
  detail: 0,
  format: 0,
  mode: 'normal' as const,
  style: '',
  text,
  type: 'text' as const,
  version: 1,
});

const paragraphNode = (text: string) => ({
  children: [textNode(text)],
  direction: null,
  format: '',
  indent: 0,
  type: 'paragraph' as const,
  version: 1,
});

const uploadNode = (mediaId: number) => ({
  fields: {},
  format: '',
  relationTo: 'media',
  type: 'upload' as const,
  value: {
    id: mediaId,
  },
  version: 1,
});

const richTextFromBlocks = (
  blocks: readonly NewsBodyBlock[],
  locale: Locale,
  mediaManifest: MediaManifest,
) => ({
  root: {
    children: blocks.map((block) => {
      if (block.type === 'paragraph') {
        return paragraphNode(block.text[locale]);
      }

      const mediaId = mediaManifest.get(block.imagePath);

      if (!mediaId) {
        throw new Error(`Missing media for news body image: ${block.imagePath}`);
      }

      return uploadNode(mediaId);
    }),
    direction: null,
    format: '',
    indent: 0,
    type: 'root' as const,
    version: 1,
  },
});

const localizedRichTextFromBlocks = (
  blocks: readonly NewsBodyBlock[],
  mediaManifest: MediaManifest,
) => ({
  zh: richTextFromBlocks(blocks, 'zh', mediaManifest),
  en: richTextFromBlocks(blocks, 'en', mediaManifest),
  ru: richTextFromBlocks(blocks, 'ru', mediaManifest),
});

const updateLocalizedNewsData = async (
  payload: Payload,
  id: string,
  localizedData: Record<Exclude<Locale, 'zh'>, Record<string, unknown>>,
) => {
  for (const locale of nonDefaultLocales) {
    await payload.update({
      collection: 'news',
      id,
      data: localizedData[locale] as PayloadData,
      depth: 0,
      locale,
      overrideAccess: true,
    });
  }
};

export const importLegacyNews = async (
  payload: Payload,
  options: SeedOptions,
  mediaManifest: MediaManifest,
): Promise<SeedResult> => {
  const result: SeedResult = { created: 0, updated: 0, skipped: 0 };

  for (const item of legacyNewsSeeds) {
    const cover = mediaManifest.get(item.imagePath);

    if (!cover) {
      throw new Error(`Missing media for news ${item.slug}: ${item.imagePath}`);
    }

    const title = localizedValueForSeed(item, 'title', 'titleKey');
    const excerpt = localizedValueForSeed(item, 'excerpt', 'excerptKey');
    const categoryLabel = localizedValueForSeed(item, 'categoryLabel', 'categoryKey');
    const content = item.body
      ? localizedRichTextFromBlocks(item.body, mediaManifest)
      : localizedRichTextFromPlainText(fallbackBody(title, excerpt));
    const data = {
      title,
      slug: item.slug,
      category: 'news',
      cover,
      excerpt,
      content,
      author: '永霏集团',
      publishedAt: new Date(`${item.datePublished}T08:00:00.000+08:00`).toISOString(),
      tags: {
        zh: textRows([categoryLabel.zh]),
        en: textRows([categoryLabel.en]),
        ru: textRows([categoryLabel.ru]),
      },
      relatedNews: [],
      relatedProducts: [],
      isFeatured: legacyNewsSeeds.indexOf(item) < 3,
      _status: 'published',
    };
    const { zhData, localizedData } = splitLocalizedData(data);

    const upserted = await upsertCollection({
      collection: 'news',
      data: zhData,
      payload,
      uniqueField: 'slug',
      uniqueValue: item.slug,
      options,
    });

    if (!upserted.skipped) {
      await updateLocalizedNewsData(payload, upserted.id, localizedData);
    }

    result.created += upserted.created;
    result.updated += upserted.updated;
    result.skipped += upserted.skipped;
  }

  return result;
};
