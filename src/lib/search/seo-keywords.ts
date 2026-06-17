import type { SearchLocale, SearchSourceDocument } from './types';

const seoHotTerms = {
  en: [
    'FR Coveralls Manufacturer',
    'Flame Resistant Clothing Manufacturer',
    'Arc Flash Clothing Manufacturer',
    'Firefighter Protective Clothing Manufacturer',
    'Chemical Protective Suit Manufacturer',
    'PPE Manufacturer China',
    'Industrial Protective Clothing Manufacturer',
    'Firefighter Turnout Gear',
  ],
  ru: [
    'Производитель огнестойких комбинезонов',
    'Производитель огнестойкой одежды',
    'Одежда для защиты от электрической дуги',
    'Боевая одежда пожарного',
    'Костюм химической защиты',
    'Производитель СИЗ в Китае',
    'Промышленная защитная одежда',
    'Снаряжение пожарного',
  ],
  zh: [
    '阻燃连体服厂家',
    '阻燃防护服厂家',
    '防电弧服厂家',
    '消防员灭火防护服厂家',
    '化学防护服厂家',
    '中国 PPE 制造商',
    '工业防护服厂家',
    '消防战斗服',
  ],
} as const satisfies Record<SearchLocale, readonly string[]>;

const seoIndustryCases = {
  en: [
    {
      anchor: 'industry-petrochemical',
      id: 'seo-oil-gas-fr-clothing',
      meta: 'Oil & Gas / Petrochemical PPE',
      queryTerms: [
        'FR Coveralls Manufacturer',
        'Flame Resistant Clothing Manufacturer',
        'FR Coveralls Supplier China',
        'Oil and Gas Flame Resistant Clothing',
      ],
      text: 'SEO procurement terms: FR Coveralls, flame resistant clothing, FR clothing manufacturer, FR coveralls supplier China, oil and gas flame resistant clothing, petrochemical protective clothing, PPE manufacturer China.',
      title: 'FR Coveralls & Flame Resistant Clothing for Oil & Gas',
    },
    {
      anchor: 'industry-power',
      id: 'seo-arc-flash-clothing',
      meta: 'Utilities & Power Protection',
      queryTerms: [
        'Arc Flash Clothing Manufacturer',
        'Arc Flash Suit Manufacturer',
        'Arc Rated Clothing Supplier',
        'IEC 61482 Arc Flash Clothing',
      ],
      text: 'SEO procurement terms: Arc Flash Clothing, Arc Flash Suit, Arc Rated Clothing, arc flash clothing manufacturer, ATPV arc flash clothing, IEC 61482 arc flash suit, electrical utility PPE.',
      title: 'Arc Flash Clothing & Arc Rated PPE for Utilities',
    },
    {
      anchor: 'industry-emergency',
      id: 'seo-firefighter-protective-clothing',
      meta: 'Fire Services / Emergency Rescue',
      queryTerms: [
        'Firefighter Protective Clothing Manufacturer',
        'Firefighter Turnout Gear Manufacturer',
        'NFPA 1971 Turnout Gear Supplier',
      ],
      text: 'SEO procurement terms: Firefighter Protective Clothing, firefighter turnout gear, firefighter protective clothing manufacturer, NFPA 1971 turnout gear supplier, fire services PPE, emergency rescue protective clothing.',
      title: 'Firefighter Protective Clothing & Turnout Gear',
    },
    {
      anchor: 'industry-petrochemical',
      id: 'seo-chemical-protective-suit',
      meta: 'Chemical Protection',
      queryTerms: [
        'Chemical Protective Suit Manufacturer',
        'Chemical Resistant Clothing Supplier',
        'Hazmat Suit Manufacturer',
        'EN 14605 Chemical Protective Clothing',
      ],
      text: 'SEO procurement terms: Chemical Protective Suit, chemical resistant clothing, chemical protective suit manufacturer, hazmat suit manufacturer, chemical splash protective suit, EN 14605 chemical protective clothing.',
      title: 'Chemical Protective Suits & Chemical Resistant Clothing',
    },
    {
      anchor: 'industry-equipment',
      id: 'seo-industrial-ppe-manufacturer',
      meta: 'Industrial Protective Clothing Manufacturer',
      queryTerms: [
        'PPE Manufacturer China',
        'Industrial Protective Clothing Manufacturer',
        'Protective Clothing Manufacturer',
        'Safety Clothing Manufacturer China',
      ],
      text: 'SEO procurement terms: PPE Manufacturer, China PPE Manufacturer, protective clothing manufacturer, industrial protective clothing manufacturer, safety clothing manufacturer China, protective workwear OEM.',
      title: 'Industrial PPE Manufacturer & Protective Clothing Supplier',
    },
  ],
  ru: [
    {
      anchor: 'industry-petrochemical',
      id: 'seo-oil-gas-fr-clothing',
      meta: 'Нефтегаз / нефтехимия',
      queryTerms: ['Производитель огнестойких комбинезонов', 'Производитель огнестойкой одежды'],
      text: 'Закупочные запросы: производитель огнестойких комбинезонов, производитель огнестойкой одежды, поставщик FR одежды Китай, защитная одежда для нефтегаза и нефтехимии.',
      title: 'Огнестойкие комбинезоны и FR одежда для нефтегаза',
    },
    {
      anchor: 'industry-power',
      id: 'seo-arc-flash-clothing',
      meta: 'Энергетика и электросети',
      queryTerms: ['Одежда для защиты от электрической дуги'],
      text: 'Закупочные запросы: одежда для защиты от электрической дуги, производитель дугостойкой одежды, IEC 61482, СИЗ для электросетей.',
      title: 'Одежда для защиты от электрической дуги для энергетики',
    },
    {
      anchor: 'industry-emergency',
      id: 'seo-firefighter-protective-clothing',
      meta: 'Пожарные службы и спасение',
      queryTerms: ['Боевая одежда пожарного', 'Снаряжение пожарного'],
      text: 'Закупочные запросы: боевая одежда пожарного, производитель пожарной защитной одежды, снаряжение пожарного, аварийно-спасательная защита.',
      title: 'Защитная одежда пожарного и боевое снаряжение',
    },
    {
      anchor: 'industry-petrochemical',
      id: 'seo-chemical-protective-suit',
      meta: 'Химическая защита',
      queryTerms: ['Костюм химической защиты'],
      text: 'Закупочные запросы: костюм химической защиты, химически стойкая одежда, производитель химических защитных костюмов, EN 14605.',
      title: 'Костюмы химической защиты и химически стойкая одежда',
    },
    {
      anchor: 'industry-equipment',
      id: 'seo-industrial-ppe-manufacturer',
      meta: 'Промышленная защитная одежда',
      queryTerms: ['Производитель СИЗ в Китае', 'Промышленная защитная одежда'],
      text: 'Закупочные запросы: производитель СИЗ Китай, производитель защитной одежды, промышленная защитная одежда, защитная рабочая одежда OEM.',
      title: 'Производитель промышленных СИЗ и защитной одежды',
    },
  ],
  zh: [
    {
      anchor: 'industry-petrochemical',
      id: 'seo-oil-gas-fr-clothing',
      meta: '石油天然气 / 石油石化防护',
      queryTerms: ['阻燃连体服厂家', '阻燃防护服厂家', '中国 PPE 制造商'],
      text: '采购搜索词：阻燃连体服厂家、阻燃防护服厂家、石油天然气阻燃防护服、石化行业 PPE、防护服供应商。',
      title: '石油天然气阻燃防护服采购方案',
    },
    {
      anchor: 'industry-power',
      id: 'seo-arc-flash-clothing',
      meta: '电力与公用事业防护',
      queryTerms: ['防电弧服厂家'],
      text: '采购搜索词：防电弧服厂家、防电弧套装供应商、ATPV 防电弧服、IEC 61482 防电弧服、电力作业 PPE。',
      title: '电力行业防电弧服采购方案',
    },
    {
      anchor: 'industry-emergency',
      id: 'seo-firefighter-protective-clothing',
      meta: '消防与应急救援',
      queryTerms: ['消防员灭火防护服厂家'],
      text: '采购搜索词：消防员灭火防护服厂家、消防战斗服供应商、消防救援 PPE、应急救援防护装备。',
      title: '消防救援防护服采购方案',
    },
    {
      anchor: 'industry-petrochemical',
      id: 'seo-chemical-protective-suit',
      meta: '化学防护',
      queryTerms: ['化学防护服厂家'],
      text: '采购搜索词：化学防护服厂家、防化服供应商、Chemical Protective Suit、Hazmat Suit、EN 14605 化学防护服。',
      title: '化学防护服采购方案',
    },
    {
      anchor: 'industry-equipment',
      id: 'seo-industrial-ppe-manufacturer',
      meta: '工业防护服制造商',
      queryTerms: ['工业防护服厂家', '中国 PPE 制造商'],
      text: '采购搜索词：工业防护服厂家、防护服制造商、中国 PPE 制造商、安全防护服 OEM、工业防护用品供应商。',
      title: '工业 PPE 与防护服采购方案',
    },
  ],
} as const satisfies Record<SearchLocale, readonly SearchSourceDocument[]>;

function normalizedTerm(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

function queryMatchesSeoTerm(query: string, term: string) {
  const normalizedQuery = normalizedTerm(query);
  const normalizedSeoTerm = normalizedTerm(term);

  if (!normalizedQuery || !normalizedSeoTerm) {
    return false;
  }

  if (normalizedQuery === normalizedSeoTerm || normalizedQuery.includes(normalizedSeoTerm)) {
    return true;
  }

  return normalizedQuery.length >= 6 && normalizedSeoTerm.includes(normalizedQuery);
}

function seoCaseMatchesQuery(document: SearchSourceDocument, query: string) {
  const queryTerms = Array.isArray(document.queryTerms) ? document.queryTerms : [];

  return queryTerms.some((term) => typeof term === 'string' && queryMatchesSeoTerm(query, term));
}

export function getSeoHotTerms(locale: SearchLocale) {
  return seoHotTerms[locale];
}

export function getSeoIndustryCaseDocuments(locale: SearchLocale, query = '') {
  const documents = seoIndustryCases[locale];

  return query.trim()
    ? documents.filter((document) => seoCaseMatchesQuery(document, query))
    : documents;
}
