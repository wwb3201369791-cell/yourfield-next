export type VisualGroupImageRow = Record<string, unknown> & {
  file?: ProductImageMediaReference | number | string | null;
};

export type VisualGroupRow = Record<string, unknown> & {
  description?: string;
  images?: VisualGroupImageRow[];
  title?: string;
  variant?: string;
};

export type VisualUploadTarget = Readonly<{
  description: string;
  title: string;
  variant: string;
}>;

export type DisplayVisualUploadTarget = VisualUploadTarget & {
  key: string;
  rowIndex?: number;
};

type ProductImageMediaReference = Readonly<{
  id?: number | string;
  sizes?: Record<string, { url?: string } | undefined>;
  thumbnailURL?: string;
  url?: string;
}>;

export const visualUploadTargets: readonly VisualUploadTarget[] = [
  {
    description: '产品整体图册、外观细节与穿着效果图。',
    title: '产品图册',
    variant: 'gallery',
  },
  {
    description: '产品结构、款式、细节或建模展示图。',
    title: '细节图 / 建模图',
    variant: 'detail',
  },
  {
    description: '产品在真实使用场景里的图片。',
    title: '场景图',
    variant: 'scene',
  },
  {
    description: '产品结构、款式或建模展示图。',
    title: '建模图',
    variant: 'modeling',
  },
  {
    description: '模特穿着或上身效果图。',
    title: '模特上身图',
    variant: 'model',
  },
  {
    description: '认证证书、检测报告或资料图片。',
    title: '认证资料',
    variant: 'certificate',
  },
  {
    description: '新旧版本、细节或效果对比图片。',
    title: '对比图',
    variant: 'comparison',
  },
];

function textFromUnknown(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (!value || typeof value !== 'object') {
    return '';
  }

  const record = value as Record<string, unknown>;
  if (typeof record.value === 'string') return record.value.trim();
  if (typeof record.label === 'string') return record.label.trim();
  if (typeof record.title === 'string') return record.title.trim();

  for (const locale of ['zh', 'en', 'ru']) {
    if (typeof record[locale] === 'string' && record[locale].trim()) {
      return record[locale].trim();
    }
  }

  return '';
}

function visualUploadTargetFromRow(
  row: VisualGroupRow,
  rowIndex: number,
): DisplayVisualUploadTarget {
  const variant = textFromUnknown(row.variant) || 'gallery';
  const baseTarget = visualUploadTargets.find((target) => target.variant === variant);
  const title = textFromUnknown(row.title) || baseTarget?.title || '产品图册';
  const description = textFromUnknown(row.description) || baseTarget?.description || '';
  const rowId = textFromUnknown(row.id) || textFromUnknown(row._id) || `${rowIndex}`;

  return {
    description,
    key: `row-${rowId}`,
    rowIndex,
    title,
    variant,
  };
}

export function buildVisualUploadDisplayTargets(
  rows: readonly VisualGroupRow[],
): readonly DisplayVisualUploadTarget[] {
  if (rows.length > 0) {
    return rows.map((row, rowIndex) => visualUploadTargetFromRow(row, rowIndex));
  }

  return visualUploadTargets.map((target) => ({ ...target, key: `target-${target.variant}` }));
}
