export type SolutionProfile = Readonly<{
  id: string;
  labelKey: string;
  titleKey: string;
  textKey: string;
  image: string;
  altKey: string;
  featureKeys: readonly string[];
  productTagKeys: readonly string[];
}>;

export type IndustryCase = Readonly<{
  id: string;
  titleKey: string;
  textKey: string;
  metaKey: string;
  image: string;
  altKey: string;
}>;

export const solutionProfiles: readonly SolutionProfile[] = [
  {
    id: 'power-energy',
    labelKey: 'page.solutions.powerLabel',
    titleKey: 'page.solutions.powerTitle',
    textKey: 'page.solutions.powerText',
    image: '/images/solutions/solution-power-grid.jpg',
    altKey: 'page.solutions.powerAlt',
    featureKeys: [
      'page.solutions.powerF1',
      'page.solutions.powerF2',
      'page.solutions.powerF3',
      'page.solutions.powerF4',
    ],
    productTagKeys: [
      'page.solutions.tagArcFlash',
      'page.solutions.tagShielding',
      'page.solutions.tagGloves',
      'page.solutions.tagElectrical',
    ],
  },
  {
    id: 'petrochemical',
    labelKey: 'page.solutions.petroLabel',
    titleKey: 'page.solutions.petroTitle',
    textKey: 'page.solutions.petroText',
    image: '/images/solutions/solution-petrochemical.jpg',
    altKey: 'page.solutions.petroAlt',
    featureKeys: [
      'page.solutions.petroF1',
      'page.solutions.petroF2',
      'page.solutions.petroF3',
      'page.solutions.petroF4',
    ],
    productTagKeys: [
      'page.solutions.tagChemical',
      'page.solutions.tagFR',
      'page.solutions.tagRespiratory',
      'page.solutions.tagAccessories',
    ],
  },
  {
    id: 'manufacturing',
    labelKey: 'page.solutions.manufacturingLabel',
    titleKey: 'page.solutions.manufacturingTitle',
    textKey: 'page.solutions.manufacturingText',
    image: '/images/solutions/solution-equipment-manufacturing.jpg',
    altKey: 'page.solutions.manufacturingAlt',
    featureKeys: [
      'page.solutions.manufacturingF1',
      'page.solutions.manufacturingF2',
      'page.solutions.manufacturingF3',
      'page.solutions.manufacturingF4',
    ],
    productTagKeys: [
      'page.solutions.tagWelding',
      'page.solutions.tagCut',
      'page.solutions.tagESD',
      'page.solutions.tagFootwear',
    ],
  },
  {
    id: 'emergency-response',
    labelKey: 'page.solutions.emergencyLabel',
    titleKey: 'page.solutions.emergencyTitle',
    textKey: 'page.solutions.emergencyText',
    image: '/images/solutions/solution-emergency-rescue.jpg',
    altKey: 'page.solutions.emergencyAlt',
    featureKeys: [
      'page.solutions.emergencyF1',
      'page.solutions.emergencyF2',
      'page.solutions.emergencyF3',
      'page.solutions.emergencyF4',
    ],
    productTagKeys: [
      'page.solutions.tagFirefighter',
      'page.solutions.tagRescue',
      'page.solutions.tagHazmat',
      'page.solutions.tagMedical',
    ],
  },
];

export const industryCases: readonly IndustryCase[] = [
  {
    id: 'case-power',
    titleKey: 'page.solutions.casePowerTitle',
    textKey: 'page.solutions.casePowerText',
    metaKey: 'page.solutions.casePowerMeta',
    image: '/images/solutions/solution-power-grid.jpg',
    altKey: 'page.solutions.casePowerAlt',
  },
  {
    id: 'case-metal',
    titleKey: 'page.solutions.caseMetalTitle',
    textKey: 'page.solutions.caseMetalText',
    metaKey: 'page.solutions.caseMetalMeta',
    image: '/images/solutions/solution-metal-smelting.jpg',
    altKey: 'page.solutions.caseMetalAlt',
  },
  {
    id: 'case-manufacturing',
    titleKey: 'page.solutions.caseManufacturingTitle',
    textKey: 'page.solutions.caseManufacturingText',
    metaKey: 'page.solutions.caseManufacturingMeta',
    image: '/images/solutions/solution-equipment-manufacturing.jpg',
    altKey: 'page.solutions.caseManufacturingAlt',
  },
  {
    id: 'case-electronics',
    titleKey: 'page.solutions.caseElectronicsTitle',
    textKey: 'page.solutions.caseElectronicsText',
    metaKey: 'page.solutions.caseElectronicsMeta',
    image: '/images/solutions/solution-electronic-information.jpg',
    altKey: 'page.solutions.caseElectronicsAlt',
  },
  {
    id: 'case-petro',
    titleKey: 'page.solutions.casePetroTitle',
    textKey: 'page.solutions.casePetroText',
    metaKey: 'page.solutions.casePetroMeta',
    image: '/images/solutions/solution-petrochemical.jpg',
    altKey: 'page.solutions.casePetroAlt',
  },
  {
    id: 'case-emergency',
    titleKey: 'page.solutions.caseEmergencyTitle',
    textKey: 'page.solutions.caseEmergencyText',
    metaKey: 'page.solutions.caseEmergencyMeta',
    image: '/images/solutions/solution-emergency-rescue.jpg',
    altKey: 'page.solutions.caseEmergencyAlt',
  },
  {
    id: 'case-food',
    titleKey: 'page.solutions.caseFoodTitle',
    textKey: 'page.solutions.caseFoodText',
    metaKey: 'page.solutions.caseFoodMeta',
    image: '/images/solutions/solution-food-processing.jpg',
    altKey: 'page.solutions.caseFoodAlt',
  },
  {
    id: 'case-medical',
    titleKey: 'page.solutions.caseMedicalTitle',
    textKey: 'page.solutions.caseMedicalText',
    metaKey: 'page.solutions.caseMedicalMeta',
    image: '/images/solutions/solution-medical-devices.jpg',
    altKey: 'page.solutions.caseMedicalAlt',
  },
];
