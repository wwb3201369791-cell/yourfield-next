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
      text: 'SEO procurement terms: FR Coveralls, flame resistant clothing, FR clothing manufacturer, FR coveralls supplier China, oil and gas flame resistant clothing, petrochemical protective clothing, PPE manufacturer China.',
      title: 'FR Coveralls & Flame Resistant Clothing for Oil & Gas',
    },
    {
      anchor: 'industry-power',
      id: 'seo-arc-flash-clothing',
      meta: 'Utilities & Power Protection',
      text: 'SEO procurement terms: Arc Flash Clothing, Arc Flash Suit, Arc Rated Clothing, arc flash clothing manufacturer, ATPV arc flash clothing, IEC 61482 arc flash suit, electrical utility PPE.',
      title: 'Arc Flash Clothing & Arc Rated PPE for Utilities',
    },
    {
      anchor: 'industry-emergency',
      id: 'seo-firefighter-protective-clothing',
      meta: 'Fire Services / Emergency Rescue',
      text: 'SEO procurement terms: Firefighter Protective Clothing, firefighter turnout gear, firefighter protective clothing manufacturer, NFPA 1971 turnout gear supplier, fire services PPE, emergency rescue protective clothing.',
      title: 'Firefighter Protective Clothing & Turnout Gear',
    },
    {
      anchor: 'industry-petrochemical',
      id: 'seo-chemical-protective-suit',
      meta: 'Chemical Protection',
      text: 'SEO procurement terms: Chemical Protective Suit, chemical resistant clothing, chemical protective suit manufacturer, hazmat suit manufacturer, chemical splash protective suit, EN 14605 chemical protective clothing.',
      title: 'Chemical Protective Suits & Chemical Resistant Clothing',
    },
    {
      anchor: 'industry-equipment',
      id: 'seo-industrial-ppe-manufacturer',
      meta: 'Industrial Protective Clothing Manufacturer',
      text: 'SEO procurement terms: PPE Manufacturer, China PPE Manufacturer, protective clothing manufacturer, industrial protective clothing manufacturer, safety clothing manufacturer China, protective workwear OEM.',
      title: 'Industrial PPE Manufacturer & Protective Clothing Supplier',
    },
  ],
  ru: [],
  zh: [],
} as const satisfies Record<SearchLocale, readonly SearchSourceDocument[]>;

export function getSeoHotTerms(locale: SearchLocale) {
  return seoHotTerms[locale];
}

export function getSeoIndustryCaseDocuments(locale: SearchLocale) {
  return seoIndustryCases[locale];
}
