import * as fs from 'node:fs';
import * as path from 'node:path';

import type { Payload } from 'payload';

import { richTextFromPlainText, splitLocalizedData, splitLocalizedMediaData } from './lib/shared';

type Locale = 'zh' | 'en' | 'ru';
type PayloadData = Record<string, unknown>;
type ArrayRowIdMode = 'preserve' | 'numeric';

const prepareArrayRowsForPostgres = (value: unknown, idMode: ArrayRowIdMode): unknown => {
  if (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    typeof (value as { type?: unknown }).type === 'string' &&
    typeof (value as { version?: unknown }).version === 'number'
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item, index) => {
      const prepared = prepareArrayRowsForPostgres(item, idMode);
      if (prepared && typeof prepared === 'object' && !Array.isArray(prepared)) {
        const row = prepared as Record<string, unknown>;
        if (idMode === 'numeric' && typeof row.id === 'string') {
          const { id: _id, ...rowWithoutId } = row;
          void _id;
          return rowWithoutId;
        }

        if (idMode === 'numeric' && typeof row.id === 'undefined') {
          return row;
        }

        if (idMode === 'preserve' && typeof row.id === 'undefined') {
          return row;
        }

        return row;
      }
      return prepared;
    });
  }

  if (value && typeof value === 'object') {
    const prepared: Record<string, unknown> = {};
    for (const [key, childValue] of Object.entries(value as Record<string, unknown>)) {
      prepared[key] = prepareArrayRowsForPostgres(childValue, idMode);
    }
    return prepared;
  }

  return value;
};

const prepareProductDataForWrite = (data: Record<string, unknown>, idMode: ArrayRowIdMode) =>
  prepareArrayRowsForPostgres(data, idMode) as Record<string, unknown>;

type ProductDoc = {
  id: string | number;
  productId?: string;
  slug?: string;
  name?: string;
  model?: string;
  sku?: string;
  _status?: string;
  publishedAt?: string;
  productGroup?: string | number | { id?: string | number; groupId?: string };
  displayOrder?: number;
};

type ProductGroupDoc = {
  id: string | number;
  groupId?: string;
  name?: string;
};

export type OfficialMaterial = {
  dirName: string;
  dirPath: string;
  name: string;
  model: string;
  modelTokens: string[];
  color: string;
  category: string;
  description: string;
  purpose: string;
  standards: string[];
  materials: string[];
  applications: string[];
  features: string[];
  sizeRange: string;
  imagePaths: string[];
  skip: boolean;
};

export type ImportOfficialMaterialsOptions = {
  apply: boolean;
  allowCreate: boolean;
  replaceMedia: boolean;
  materialsRoot: string;
};

const imageExtensionPattern = /\.(png|jpe?g|webp|gif)$/i;
const skippedNames = new Set(['消防员灭火防护服(作战款)', '消防员灭火防护服（作战款）']);
const skippedModels = new Set(['HYF-5506']);
const locales: Locale[] = ['zh', 'en', 'ru'];

const sectionLabels = [
  '货号',
  '型号',
  '颜色',
  '面料材质',
  '材料材质',
  '面料',
  '材质',
  '执行标准',
  '所属分类',
  '产品描述',
  '产品介绍',
  '主要作用',
  '应用领域',
  '适用范围',
  '材料特点',
  '产品特点',
  '防护性能',
  '性能特点',
  '尺码',
  '规格',
  '维护保养',
];

const normalizeLine = (line: string) => line.replace(/\uFEFF/g, '').trim();

const readInstructionLines = (filePath: string) =>
  fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .map(normalizeLine)
    .filter(Boolean)
    .filter((line) => !/^\d{3,4}-\d+/.test(line));

const labelPattern = new RegExp(`^(${sectionLabels.join('|')})(?:\\s*[：:]\\s*(.*))?$`);

const lineLabel = (line: string) => {
  const match = line.match(labelPattern);
  return match?.[1];
};

const inlineValueFor = (lines: string[], labels: string[]) => {
  for (const line of lines) {
    for (const label of labels) {
      const match = line.match(new RegExp(`^${label}\\s*[：:]\\s*(.+)$`));
      if (match?.[1]?.trim()) {
        return match[1].trim();
      }
    }
  }
  return '';
};

const sectionValues = (lines: string[], labels: string[]) => {
  const values: string[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const current = lines[index];
    const label = labels.find(
      (candidate) =>
        current === candidate ||
        current.startsWith(`${candidate}：`) ||
        current.startsWith(`${candidate}:`),
    );
    if (!label) {
      continue;
    }

    const inline = current.match(new RegExp(`^${label}\\s*[：:]\\s*(.+)$`))?.[1]?.trim();
    if (inline) {
      values.push(inline);
    }

    for (let child = index + 1; child < lines.length; child += 1) {
      const next = lines[child];
      if (lineLabel(next) || inlineValueFor([next], ['货号', '型号'])) {
        break;
      }
      values.push(next);
    }
  }

  return unique(values.map((value) => value.trim()).filter(Boolean));
};

const unique = <T>(values: T[]) => Array.from(new Set(values));

const splitList = (values: string[]) =>
  unique(
    values.flatMap((value) =>
      value
        .split(/[；;\n]+/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );

const naturalImageSort = (left: string, right: string) => {
  const leftName = path.basename(left);
  const rightName = path.basename(right);
  const leftNumber = Number(leftName.match(/^\d+/)?.[0] ?? Number.POSITIVE_INFINITY);
  const rightNumber = Number(rightName.match(/^\d+/)?.[0] ?? Number.POSITIVE_INFINITY);
  if (leftNumber !== rightNumber) {
    return leftNumber - rightNumber;
  }
  return leftName.localeCompare(rightName, 'zh-Hans-CN');
};

const modelTokensFrom = (model: string) =>
  unique((model.match(/[A-Z]+[-\w]*(?:-\d+)?/gi) ?? []).map((item) => item.toUpperCase()));

export const normalizeProductName = (name: string) =>
  name
    .toLowerCase()
    .replace(/[\s\u3000]/g, '')
    .replace(/[()（）\[\]【】「」《》\-—_,，、/\\]/g, '')
    .replace(/kv/g, 'kV'.toLowerCase());

export const officialMaterialMediaTag = (material: OfficialMaterial, imagePath: string) =>
  `官网资料/${material.dirName}/${path.basename(imagePath)}`;

export const parseOfficialMaterialFolder = (dirPath: string): OfficialMaterial => {
  const instructionPath = path.join(dirPath, '说明');
  if (!fs.existsSync(instructionPath)) {
    throw new Error(`Missing instruction file: ${instructionPath}`);
  }

  const lines = readInstructionLines(instructionPath);
  const dirName = path.basename(dirPath);
  const name = dirName || lines[0];
  const model = inlineValueFor(lines, ['货号', '型号']);
  const color = inlineValueFor(lines, ['颜色']);
  const materials = sectionValues(lines, ['面料材质', '材料材质', '面料', '材质']);
  const standards = splitList(sectionValues(lines, ['执行标准']));
  const category = sectionValues(lines, ['所属分类'])[0] || '';
  const descriptionParts = [
    ...sectionValues(lines, ['产品描述', '产品介绍']),
    ...sectionValues(lines, ['主要作用']),
  ].filter((value) => !['主要作用', '产品描述', '产品介绍'].includes(value));
  const purpose = sectionValues(lines, ['主要作用']).join('\n');
  const applications = sectionValues(lines, ['应用领域', '适用范围']);
  const features = sectionValues(lines, ['材料特点', '产品特点', '防护性能', '性能特点']);
  const sizeRange = sectionValues(lines, ['尺码', '规格']).join('；');
  const imagePaths = fs
    .readdirSync(dirPath)
    .filter((filename) => imageExtensionPattern.test(filename))
    .map((filename) => path.join(dirPath, filename))
    .sort(naturalImageSort);

  const modelTokens = modelTokensFrom(model);
  const skip = skippedNames.has(name) || modelTokens.some((token) => skippedModels.has(token));

  return {
    dirName,
    dirPath,
    name,
    model,
    modelTokens,
    color,
    category,
    description: unique(descriptionParts).join('\n') || purpose || applications.join('\n'),
    purpose,
    standards,
    materials,
    applications,
    features,
    sizeRange,
    imagePaths,
    skip,
  };
};

export const discoverOfficialMaterials = (materialsRoot: string): OfficialMaterial[] => {
  if (!fs.existsSync(materialsRoot)) {
    throw new Error(`Materials root not found: ${materialsRoot}`);
  }

  return fs
    .readdirSync(materialsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => parseOfficialMaterialFolder(path.join(materialsRoot, entry.name)))
    .sort((left, right) => left.dirName.localeCompare(right.dirName, 'zh-Hans-CN'));
};

const threeLocaleText = (value: string) => ({ zh: value, en: value, ru: value });
const textRows = (values: string[]) => unique(values.filter(Boolean)).map((value) => ({ value }));
const localizedTextRows = (values: string[]) =>
  unique(values.filter(Boolean)).map((value) => ({ value: threeLocaleText(value) }));

const firstNonEmpty = (...values: Array<string | undefined>) =>
  values.find((value) => value?.trim())?.trim() || '';

const buildSpecifications = (material: OfficialMaterial) => {
  const entries = [
    ['货号', material.model],
    ['颜色', material.color],
    ['执行标准', material.standards.join('；')],
    ['所属分类', material.category],
    ['面料材质', material.materials.join('；')],
    ['尺码/规格', material.sizeRange],
  ].filter(([, value]) => value);

  return entries.map(([label, value], index) => ({
    label: threeLocaleText(label),
    value: threeLocaleText(value),
    group: '产品资料',
    order: index + 1,
  }));
};

const buildFeatures = (material: OfficialMaterial) => {
  const featureLines = material.features.length
    ? material.features
    : [firstNonEmpty(material.purpose, material.description)];
  return unique(featureLines.filter(Boolean)).map((description, index) => ({
    title: threeLocaleText(index === 0 ? '产品特点' : `产品特点 ${index + 1}`),
    description: threeLocaleText(description),
  }));
};

const buildSellingPoints = (material: OfficialMaterial) => {
  const text = firstNonEmpty(
    material.purpose,
    material.description,
    material.applications[0],
    `${material.name} 产品资料已整理。`,
  );
  return [
    {
      title: threeLocaleText('产品资料概览'),
      text: threeLocaleText(text),
    },
  ];
};

const buildSizeGuide = (material: OfficialMaterial) => ({
  title: threeLocaleText('尺码说明'),
  cornerLabel: threeLocaleText('项目'),
  columns: [{ label: threeLocaleText('说明') }],
  rows: [
    {
      label: threeLocaleText('尺码/规格'),
      values: [{ value: material.sizeRange || '按需定制' }],
    },
  ],
});

const buildScenarios = (material: OfficialMaterial) => [
  {
    title: threeLocaleText('应用领域'),
    description: threeLocaleText(
      material.applications.join('\n') ||
        material.description ||
        `${material.name} 适用场景资料已整理。`,
    ),
  },
];

const buildQualityEvidence = (material: OfficialMaterial) => [
  {
    type: 'other',
    status: '资料已整理',
    title: threeLocaleText('检测与标准说明'),
    description: threeLocaleText(
      material.standards.length ? `执行标准：${material.standards.join('；')}` : '产品资料已整理。',
    ),
  },
];

export const buildProductUpdateData = (
  material: OfficialMaterial,
  mediaIds: Array<string | number>,
): PayloadData => {
  const mainImageId = mediaIds[0];
  const detailImageIds = mediaIds.slice(1);
  const visualGroups = detailImageIds.length
    ? [
        {
          variant: 'detail',
          title: '建模图',
          description: '展示产品细节、结构与穿着效果。',
          images: detailImageIds.map((file) => ({ file })),
        },
      ]
    : [];

  const description = firstNonEmpty(
    material.description,
    material.purpose,
    material.applications[0],
    `${material.name} 产品资料说明。`,
  );

  return {
    name: threeLocaleText(material.name),
    sku: material.model,
    model: material.model,
    images: mainImageId ? [{ file: mainImageId }] : [],
    description: {
      zh: richTextFromPlainText(description),
      en: richTextFromPlainText(description),
      ru: richTextFromPlainText(description),
    },
    standards: textRows(material.standards),
    materials: localizedTextRows(
      material.materials.length ? material.materials : [material.category || material.name],
    ),
    features: buildFeatures(material),
    sellingPoints: buildSellingPoints(material),
    specifications: buildSpecifications(material),
    sizeGuide: buildSizeGuide(material),
    applications: localizedTextRows(
      material.applications.length ? material.applications : [description],
    ),
    scenarios: buildScenarios(material),
    visualGroups,
    qualityEvidence: buildQualityEvidence(material),
    careInstructions: localizedTextRows(['请按产品随附说明和企业安全管理要求维护、检查与存放。']),
  } as PayloadData;
};

const inferGroupId = (material: OfficialMaterial) => {
  const text = `${material.name} ${material.category}`;
  if (/消防员|森林防火|抢险救援/.test(text)) return 'fire-rescue';
  if (/防电弧|屏蔽服|高压静电|防静电服/.test(text) && !/阻燃防静电/.test(text))
    return 'electrical-protection';
  if (/焊接|熔融|阻燃服|智能降温/.test(text)) return 'thermal-welding';
  if (/化学|微波|辐射|阻燃防静电/.test(text)) return 'chemical-medical';
  return 'fire-rescue';
};

const materialProductId = (material: OfficialMaterial) => {
  const model = (material.modelTokens.join('-') || material.name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `official-${model}`;
};

const productName = (doc: ProductDoc) => (typeof doc.name === 'string' ? doc.name : '');
const productModelTokens = (doc: ProductDoc) =>
  modelTokensFrom([doc.model, doc.sku].filter(Boolean).join(' '));

const isSkippedProductDoc = (doc: ProductDoc) => {
  const name = productName(doc);
  const tokens = productModelTokens(doc);
  return (
    skippedNames.has(name) ||
    name.includes('作战款') ||
    tokens.some((token) => skippedModels.has(token))
  );
};

const findMatch = (material: OfficialMaterial, products: ProductDoc[]) => {
  const candidates = products.filter((doc) => !isSkippedProductDoc(doc));
  const materialModelTokens = new Set(material.modelTokens);
  const targetName = normalizeProductName(material.name);
  const namedCandidates = candidates.filter(
    (doc) => normalizeProductName(productName(doc)).length > 0,
  );
  const exactNameMatches = namedCandidates.filter(
    (doc) => normalizeProductName(productName(doc)) === targetName,
  );
  if (exactNameMatches.length === 1) return { doc: exactNameMatches[0], strategy: 'name' };
  if (exactNameMatches.length > 1) {
    const exactNameAndModelMatches = exactNameMatches.filter((doc) =>
      productModelTokens(doc).some((token) => materialModelTokens.has(token)),
    );
    if (exactNameAndModelMatches.length === 1)
      return { doc: exactNameAndModelMatches[0], strategy: 'name+model' };

    const literalNameMatches = exactNameMatches.filter((doc) => productName(doc) === material.name);
    if (literalNameMatches.length === 1)
      return { doc: literalNameMatches[0], strategy: 'literal-name' };

    const parenthesizedMatches = exactNameMatches.filter((doc) =>
      /[（(].+[）)]/.test(productName(doc)),
    );
    if (parenthesizedMatches.length === 1)
      return { doc: parenthesizedMatches[0], strategy: 'parenthesized-name' };

    return { ambiguous: exactNameMatches, strategy: 'name' };
  }

  const modelMatches = candidates.filter((doc) =>
    productModelTokens(doc).some((token) => materialModelTokens.has(token)),
  );
  if (modelMatches.length === 1) return { doc: modelMatches[0], strategy: 'model' };
  if (modelMatches.length > 1) return { ambiguous: modelMatches, strategy: 'model' };

  const containsMatches = namedCandidates.filter((doc) => {
    const source = normalizeProductName(productName(doc));
    return source.includes(targetName) || targetName.includes(source);
  });
  if (containsMatches.length === 1) return { doc: containsMatches[0], strategy: 'name-contains' };
  if (containsMatches.length > 1) return { ambiguous: containsMatches, strategy: 'name-contains' };

  return { doc: undefined, strategy: 'none' };
};

const findProductGroups = async (payload: Payload) => {
  const result = await payload.find({
    collection: 'product-groups',
    depth: 0,
    pagination: false,
    overrideAccess: true,
  } as never);

  const groups = new Map<string, string | number>();
  for (const group of result.docs as ProductGroupDoc[]) {
    if (group.groupId) {
      groups.set(group.groupId, group.id);
    }
  }
  return groups;
};

const findProducts = async (payload: Payload) => {
  const result = await payload.find({
    collection: 'products',
    depth: 0,
    pagination: false,
    overrideAccess: true,
    locale: 'zh',
  } as never);
  return result.docs as ProductDoc[];
};

const mediaDataFor = (material: OfficialMaterial, imagePath: string, index: number) => {
  const role = index === 0 ? '首页展示/详情主图' : '详情页建模图';
  const title = `${material.name} ${role} ${index + 1}`;
  return {
    alt: threeLocaleText(title),
    caption: threeLocaleText(title),
    credit: '官网资料',
    folder: 'products',
    tags: [
      { value: officialMaterialMediaTag(material, imagePath) },
      { value: 'official-materials' },
      ...(material.modelTokens.length ? [{ value: material.modelTokens.join(',') }] : []),
    ],
    usageCount: 0,
  };
};

const uploadOrUpdateMaterialMedia = async (
  payload: Payload,
  material: OfficialMaterial,
  imagePath: string,
  index: number,
  options: ImportOfficialMaterialsOptions,
) => {
  const tag = officialMaterialMediaTag(material, imagePath);
  const existing = await payload.find({
    collection: 'media',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    sort: '-createdAt',
    where: {
      'tags.value': {
        equals: tag,
      },
    },
  } as never);
  const existingDoc = existing.docs[0] as { id?: string | number } | undefined;
  const { zhData, localizedData } = splitLocalizedMediaData(
    mediaDataFor(material, imagePath, index),
  );

  if (!options.apply) {
    return {
      id: existingDoc?.id ?? `dry-media-${index + 1}`,
      action: existingDoc ? 'reuse' : 'create',
    };
  }

  if (existingDoc?.id) {
    if (options.replaceMedia) {
      await payload.update({
        collection: 'media',
        id: existingDoc.id,
        data: zhData as never,
        depth: 0,
        filePath: imagePath,
        locale: 'zh',
        overrideAccess: true,
      } as never);
    } else {
      await payload.update({
        collection: 'media',
        id: existingDoc.id,
        data: zhData as never,
        depth: 0,
        locale: 'zh',
        overrideAccess: true,
      } as never);
    }
    for (const locale of ['en', 'ru'] as const) {
      await payload.update({
        collection: 'media',
        id: existingDoc.id,
        data: localizedData[locale] as never,
        depth: 0,
        locale,
        overrideAccess: true,
      } as never);
    }
    return { id: existingDoc.id, action: 'update' };
  }

  const created = (await payload.create({
    collection: 'media',
    data: zhData as never,
    depth: 0,
    filePath: imagePath,
    locale: 'zh',
    overrideAccess: true,
  } as never)) as { id?: string | number };

  for (const locale of ['en', 'ru'] as const) {
    await payload.update({
      collection: 'media',
      id: created.id,
      data: localizedData[locale] as never,
      depth: 0,
      locale,
      overrideAccess: true,
    } as never);
  }

  return { id: created.id as string | number, action: 'create' };
};

const resetProductNestedRows = async (payload: Payload, id: string | number) => {
  const db = (
    payload as unknown as {
      db?: { pool?: { query?: (sql: string, params?: unknown[]) => Promise<unknown> } };
    }
  ).db;
  const query = db?.pool?.query?.bind(db.pool);
  if (typeof query !== 'function') {
    return;
  }

  await query(
    'delete from products_size_guide_rows_values where _parent_id in (select id from products_size_guide_rows where _parent_id = $1)',
    [id],
  );
  await query(
    'delete from products_size_guide_rows_locales where _parent_id in (select id from products_size_guide_rows where _parent_id = $1)',
    [id],
  );
  await query('delete from products_size_guide_rows where _parent_id = $1', [id]);
  await query(
    'delete from products_size_guide_columns_locales where _parent_id in (select id from products_size_guide_columns where _parent_id = $1)',
    [id],
  );
  await query('delete from products_size_guide_columns where _parent_id = $1', [id]);
  await query(
    'delete from products_specifications_locales where _parent_id in (select id from products_specifications where _parent_id = $1)',
    [id],
  );
  await query(
    'delete from products_visual_groups_images where _parent_id in (select id from products_visual_groups where _parent_id = $1)',
    [id],
  );

  const parentIdTables = [
    'products_images',
    'products_standards',
    'products_materials',
    'products_features',
    'products_selling_points',
    'products_specifications',
    'products_applications',
    'products_scenarios',
    'products_visual_groups',
    'products_quality_evidence',
    'products_care_instructions',
  ];

  for (const table of parentIdTables) {
    await query(`delete from ${table} where _parent_id = $1`, [id]);
  }
};

const updateProductLocales = async (payload: Payload, id: string | number, data: PayloadData) => {
  const { zhData } = splitLocalizedData(data);
  const rowData = prepareProductDataForWrite(zhData, 'preserve');

  const existingProduct = (await payload.findByID({
    collection: 'products',
    id,
    depth: 0,
    draft: true,
    locale: 'zh',
    overrideAccess: true,
    showHiddenFields: true,
  } as never)) as Record<string, unknown>;

  const stableIdentity = {
    productId: existingProduct.productId,
    slug: existingProduct.slug,
  };

  await resetProductNestedRows(payload, id);

  await payload.update({
    collection: 'products',
    id,
    data: {
      ...rowData,
      ...stableIdentity,
      _status: 'published',
      publishedAt: new Date().toISOString(),
    } as never,
    depth: 0,
    locale: 'zh',
    overrideAccess: true,
  } as never);

  // Do not write secondary locales in this replacement import. Payload Postgres keeps
  // localized array rows in per-locale tables; rewriting the same nested array IDs
  // across locales can trigger duplicate-row constraints on existing products. The
  // active site content is Chinese, and publishing is allowed with STRICT_I18N_PUBLISH=false.
};

const createProduct = async (
  payload: Payload,
  material: OfficialMaterial,
  productGroups: Map<string, string | number>,
  data: PayloadData,
) => {
  const groupId = inferGroupId(material);
  const productGroup = productGroups.get(groupId);
  const productGroupId = typeof productGroup === 'string' ? Number(productGroup) : productGroup;
  if (!productGroupId) {
    throw new Error(`Missing product group ${groupId} for ${material.name}`);
  }

  const { zhData, localizedData } = splitLocalizedData({
    productId: materialProductId(material),
    productGroup: productGroupId,
    displayOrder: 0,
    ...data,
    _status: 'draft',
  });

  const created = (await payload.create({
    collection: 'products',
    data: prepareProductDataForWrite(zhData, 'numeric') as never,
    depth: 0,
    draft: true,
    locale: 'zh',
    overrideAccess: true,
  } as never)) as { id?: string | number };

  await payload.update({
    collection: 'products',
    id: created.id,
    data: prepareProductDataForWrite(
      {
        ...zhData,
        _status: 'published',
        publishedAt: new Date().toISOString(),
      },
      'preserve',
    ) as never,
    depth: 0,
    locale: 'zh',
    overrideAccess: true,
  } as never);

  // See updateProductLocales: this import intentionally writes zh content only.

  return created.id as string | number;
};

const loadEnvFile = (filePath: string) => {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const equalIndex = line.indexOf('=');
    const key = line.slice(0, equalIndex).trim();
    const rawValue = line.slice(equalIndex + 1).trim();
    if (!key || process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, '');
  }
};

const setupEnv = () => {
  process.env.PAYLOAD_SEED_MODE = 'true';
  process.env.PAYLOAD_CONFIG_PATH = process.env.PAYLOAD_CONFIG_PATH || 'src/payload.config.ts';
  process.env.STRICT_I18N_PUBLISH = 'false';
  process.env.REVALIDATE_SECRET = '';
  loadEnvFile(path.resolve(process.cwd(), '.env.local'));
  loadEnvFile(path.resolve(process.cwd(), '.env'));
};

const initPayloadForImport = async () => {
  setupEnv();
  const [{ default: payload }, secretModule] = await Promise.all([
    import('payload'),
    import('../../src/lib/payload/secret'),
  ]);
  await payload.init({
    local: true,
    secret: secretModule.getPayloadSecret(process.env),
  } as never);
  return payload as Payload;
};

export const parseImportOptions = (argv = process.argv): ImportOfficialMaterialsOptions => ({
  apply: argv.includes('--apply'),
  allowCreate: argv.includes('--allow-create'),
  replaceMedia: argv.includes('--replace-media'),
  materialsRoot: path.resolve(process.cwd(), '官网资料'),
});

export const importOfficialMaterials = async (
  payload: Payload,
  options: ImportOfficialMaterialsOptions,
) => {
  const materials = discoverOfficialMaterials(options.materialsRoot);
  const products = await findProducts(payload);
  const productGroups = await findProductGroups(payload);
  const summary = {
    total: materials.length,
    skippedExcluded: 0,
    mediaCreated: 0,
    mediaUpdated: 0,
    mediaReused: 0,
    productsUpdated: 0,
    productsCreated: 0,
    unmatched: [] as string[],
    ambiguous: [] as string[],
    dryRun: !options.apply,
  };

  for (const material of materials) {
    if (material.skip) {
      summary.skippedExcluded += 1;
      console.log(`SKIP excluded ${material.name} ${material.model}`);
      continue;
    }

    const match = findMatch(material, products);
    if ('ambiguous' in match && match.ambiguous?.length) {
      const names = match.ambiguous
        .map((doc) => `${doc.id}:${productName(doc)}:${doc.model || doc.sku || ''}`)
        .join(' | ');
      summary.ambiguous.push(`${material.name} ${material.model} -> ${names}`);
      console.warn(`AMBIGUOUS ${material.name} ${material.model} -> ${names}`);
      continue;
    }

    if (!match.doc && !options.allowCreate) {
      summary.unmatched.push(`${material.name} ${material.model}`);
      console.warn(`UNMATCHED ${material.name} ${material.model}`);
      continue;
    }

    const mediaResults = [];
    for (let index = 0; index < material.imagePaths.length; index += 1) {
      const mediaResult = await uploadOrUpdateMaterialMedia(
        payload,
        material,
        material.imagePaths[index],
        index,
        options,
      );
      mediaResults.push(mediaResult);
      if (mediaResult.action === 'create') summary.mediaCreated += 1;
      if (mediaResult.action === 'update') summary.mediaUpdated += 1;
      if (mediaResult.action === 'reuse') summary.mediaReused += 1;
    }

    const mediaIds = mediaResults.map((item) => item.id).filter(Boolean) as Array<string | number>;
    const productData = buildProductUpdateData(material, mediaIds);

    if (match.doc?.id) {
      if (options.apply) {
        await updateProductLocales(payload, match.doc.id, productData);
      }
      summary.productsUpdated += 1;
      console.log(
        `${options.apply ? 'UPDATED' : 'DRY-UPDATE'} ${material.name} ${material.model} -> ${match.doc.id} (${match.strategy})`,
      );
      continue;
    }

    if (options.allowCreate) {
      if (options.apply) {
        const createdId = await createProduct(payload, material, productGroups, productData);
        products.push({
          id: createdId,
          name: material.name,
          model: material.model,
          sku: material.model,
        });
      }
      summary.productsCreated += 1;
      console.log(`${options.apply ? 'CREATED' : 'DRY-CREATE'} ${material.name} ${material.model}`);
    }
  }

  return summary;
};

const run = async () => {
  const options = parseImportOptions();
  const payload = await initPayloadForImport();
  const summary = await importOfficialMaterials(payload, options);
  console.log(JSON.stringify(summary, null, 2));
  if (summary.ambiguous.length || (!options.allowCreate && summary.unmatched.length)) {
    process.exitCode = 1;
  }
};

const isMain = process.argv[1]
  ? path.basename(process.argv[1]) === 'import-official-materials.ts'
  : false;

if (isMain) {
  run().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
