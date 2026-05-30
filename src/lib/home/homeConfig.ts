import type { ProductGroupId } from '@/lib/product/types';

export type CapabilityKey =
  | 'rd'
  | 'manufacturing'
  | 'standards'
  | 'industries'
  | 'custom'
  | 'delivery';

export const capabilityCards = [
  {
    key: 'rd',
    code: '01',
    className: 'capability-card--rd',
    image: '/images/about/yourfield-training-2.jpg',
  },
  {
    key: 'manufacturing',
    code: '02',
    className: 'capability-card--manufacturing',
    image: '/images/about/yourfield-production.png',
  },
  {
    key: 'standards',
    code: '03',
    className: 'capability-card--standards',
    image: '/images/about/quality-management-system.jpg',
  },
  {
    key: 'industries',
    code: '04',
    className: 'capability-card--industries',
    image: '/images/scenes/firefighter-industrial.jpg',
  },
  {
    key: 'custom',
    code: '05',
    className: 'capability-card--custom',
    image: '/images/process/product-selection.png',
  },
  {
    key: 'delivery',
    code: '06',
    className: 'capability-card--delivery',
    image: '/images/about/yourfield-smart-warehouse.png',
  },
] as const satisfies readonly {
  className: string;
  code: string;
  image: string;
  key: CapabilityKey;
}[];

export const productScenarios = [
  { group: 'fire-rescue', labelKey: 'product.group.fireRescue' },
  { group: 'electrical-protection', labelKey: 'product.group.electrical' },
  { group: 'thermal-welding', labelKey: 'product.group.thermal' },
  { group: 'chemical-medical', labelKey: 'product.group.chemicalMedical' },
  { group: 'water-rescue', labelKey: 'product.group.waterRescue' },
] as const satisfies readonly { group: ProductGroupId; labelKey: string }[];

export const processSteps = [
  {
    className: 'process-step--selection',
    code: '01',
    image: '/images/process/product-selection.png',
    textKey: 'home.process.step1.text',
    titleKey: 'home.process.step1.title',
  },
  {
    className: 'process-step--standard',
    code: '02',
    image: '/images/process/standard-confirmation.png',
    textKey: 'home.process.step2.text',
    titleKey: 'home.process.step2.title',
  },
  {
    className: 'process-step--quote',
    code: '03',
    image: '/images/process/sample-quote.png',
    textKey: 'home.process.step3.text',
    titleKey: 'home.process.step3.title',
  },
] as const;

export const industrySlides = [
  {
    className: 'is-active',
    group: 'electrical-protection',
    image: '/images/industries/industry-power-grid.jpg',
    textKey: 'home.industry.power.text',
    titleKey: 'home.industry.power',
  },
  {
    className: '',
    group: 'thermal-welding',
    image: '/images/industries/industry-metal-smelting.jpg',
    textKey: 'home.industry.metal.text',
    titleKey: 'home.industry.metal',
  },
  {
    className: '',
    group: 'thermal-welding',
    image: '/images/industries/industry-equipment-manufacturing.jpg',
    textKey: 'home.industry.manufacturing.text',
    titleKey: 'home.industry.manufacturing',
  },
  {
    className: '',
    group: 'electrical-protection',
    image: '/images/industries/industry-electronic-information.jpg',
    textKey: 'home.industry.electronics.text',
    titleKey: 'home.industry.electronics',
  },
  {
    className: '',
    group: 'chemical-medical',
    image: '/images/industries/industry-petrochemical.jpg',
    textKey: 'home.industry.petrochemical.text',
    titleKey: 'home.industry.petrochemical',
  },
  {
    className: '',
    group: 'fire-rescue',
    image: '/images/industries/industry-emergency-rescue.jpg',
    textKey: 'home.industry.emergency.text',
    titleKey: 'home.industry.emergency',
  },
  {
    className: '',
    group: 'chemical-medical',
    image: '/images/industries/industry-food-processing-cleanroom.jpg',
    textKey: 'home.industry.food.text',
    titleKey: 'home.industry.food',
  },
  {
    className: '',
    group: 'chemical-medical',
    image: '/images/industries/industry-medical-devices.jpg',
    textKey: 'home.industry.medical.text',
    titleKey: 'home.industry.medical',
  },
] as const satisfies readonly {
  className?: string;
  group: ProductGroupId;
  image: string;
  textKey: string;
  titleKey: string;
}[];

export const partnerCards = [
  {
    hrefHash: 'industry-petrochemical',
    image: '/images/industries/industry-petrochemical.jpg',
    name: 'PETROCHINA',
    sectorKey: 'partners.energy',
    summaryKey: 'home.partners.case.energy',
    visualKey: 'home.partners.visual.energy',
  },
  {
    hrefHash: 'industry-petrochemical',
    image: '/images/solutions/solution-petrochemical.jpg',
    name: 'SINOPEC',
    sectorKey: 'partners.petrochemical',
    summaryKey: 'home.partners.case.energy',
    visualKey: 'home.partners.visual.refinery',
  },
  {
    hrefHash: 'industry-petrochemical',
    image: '/images/partners/cnooc-offshore-crew.jpg',
    name: 'CNOOC',
    sectorKey: 'partners.energy',
    summaryKey: 'home.partners.case.energy',
    visualKey: 'home.partners.visual.offshore',
  },
  {
    hrefHash: 'industry-power',
    image: '/images/industries/industry-power-grid.jpg',
    name: 'STATE GRID',
    sectorKey: 'partners.power',
    summaryKey: 'home.partners.case.power',
    visualKey: 'home.partners.visual.power',
  },
  {
    hrefHash: 'industry-power',
    image: '/images/solutions/solution-power-grid.jpg',
    name: 'CSG',
    sectorKey: 'partners.power',
    summaryKey: 'home.partners.case.power',
    visualKey: 'home.partners.visual.substation',
  },
  {
    hrefHash: 'industry-equipment',
    image: '/images/solutions/solution-equipment-manufacturing.jpg',
    name: 'CRRC',
    sectorKey: 'partners.transport',
    summaryKey: 'home.partners.case.transport',
    visualKey: 'home.partners.visual.transport',
  },
  {
    hrefHash: 'industry-equipment',
    image: '/images/industries/industry-metal-smelting.jpg',
    name: 'SANY',
    sectorKey: 'partners.manufacturing',
    summaryKey: 'home.partners.case.manufacturing',
    visualKey: 'home.partners.visual.manufacturing',
  },
  {
    hrefHash: 'industry-electronics',
    image: '/images/industries/industry-electronic-information.jpg',
    name: 'HONEYWELL',
    sectorKey: 'partners.multinational',
    summaryKey: 'home.partners.case.multinational',
    visualKey: 'home.partners.visual.multinational',
  },
] as const;

export const certificationItems = [
  {
    detailKey: 'home.certs.iso9001.text',
    image: '/images/certifications/iso-9001-quality-management.jpg',
    metaKey: 'home.certs.iso9001.meta',
    title: 'ISO 9001',
  },
  {
    detailKey: 'home.certs.iso14001.text',
    image: '/images/certifications/iso-14001-environmental-management.jpg',
    metaKey: 'home.certs.iso14001.meta',
    title: 'ISO 14001',
  },
  {
    detailKey: 'home.certs.iso45001.text',
    image: '/images/certifications/iso-45001-occupational-health-safety.jpg',
    metaKey: 'home.certs.iso45001.meta',
    title: 'ISO 45001',
  },
  {
    detailKey: 'home.certs.iso13485.text',
    image: '/images/certifications/iso-13485-medical-device-quality.jpg',
    metaKey: 'home.certs.iso13485.meta',
    title: 'ISO 13485',
  },
  {
    detailKey: 'home.certs.greenSupply.text',
    image: '/images/certifications/gbt-33635-green-supply-chain.jpg',
    metaKey: 'home.certs.greenSupply.meta',
    title: 'GB/T 33635',
  },
  {
    detailKey: 'home.certs.iso50001.text',
    image: '/images/certifications/iso-50001-energy-management.jpg',
    metaKey: 'home.certs.iso50001.meta',
    title: 'ISO 50001',
  },
] as const;
