import type { ProductGroupId } from '@/lib/product/types';

export const productGroupIdList = [
  'fire-rescue',
  'electrical-protection',
  'thermal-welding',
  'chemical-medical',
  'water-rescue',
] as const satisfies readonly ProductGroupId[];

export const productGroupTitleKeys: Record<string, string> = {
  'chemical-medical': 'product.group.chemicalMedical',
  'electrical-protection': 'product.group.electrical',
  'fire-rescue': 'product.group.fireRescue',
  'thermal-welding': 'product.group.thermal',
  'water-rescue': 'product.group.waterRescue',
};
