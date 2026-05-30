/* eslint-disable no-restricted-syntax -- Seed scripts load .env.local before initializing Payload locally. */
import { randomBytes } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

import type { Payload } from 'payload';

import { loadLocalEnv } from '../../src/lib/loadEnvFile';

import { richTextFromPlainText } from './lib/shared';

type ProductDoc = {
  id: number;
  model?: string | null;
  product_id?: string | null;
  sku?: string | null;
  slug?: string | null;
};

type QueryResult<T> = { rows: T[] };
type DbQuery = <T = Record<string, unknown>>(
  sql: string,
  params?: unknown[],
) => Promise<QueryResult<T>>;

type ReferenceProductTarget = {
  productIds: string[];
  sourcePath: string;
};

type ReferenceProductInfo = {
  applications: string;
  color: string;
  model: string;
  name: string;
  report: string;
  selection: string;
  sizeRange: string;
  sourcePath: string;
  standard: string;
};

type ReferenceProductUpdateData = {
  applications: string[];
  description: string;
  features: Array<{ description: string; title: string }>;
  qualityEvidence: Array<{ description: string; status: string; title: string; type: string }>;
  scenarios: Array<{ description: string; title: string }>;
  sellingPoints: Array<{ text: string; title: string }>;
  sizeGuide: {
    columns: string[];
    cornerLabel: string;
    rows: Array<{ label: string; values: string[] }>;
    title: string;
  };
  sizeRange: string[];
  specifications: Array<{ label: string; value: string }>;
  standards: string[];
};

type SyncReferenceProductDetailsOptions = {
  apply: boolean;
  referenceRoot: string;
};

export const referenceProductTargets: ReferenceProductTarget[] = [
  {
    productIds: ['1-ji-fang-dian-hu-fu-chen-shan-kuan'],
    sourcePath:
      '拆分结果/按产品分类/防电弧服/1级防电弧服标品款/001_1级防电弧服（衬衫款）_HYF-3801/说明.md',
  },
  {
    productIds: ['3-ji-fang-dian-hu-fu-jia-ke-kuan-3-4-c-a-l'],
    sourcePath:
      '拆分结果/按产品分类/防电弧服/3级防电弧服标品款/005_3级防电弧服（夹克款）34cal_HYF-3819/说明.md',
  },
  {
    productIds: ['3-ji-fang-dian-hu-fu-da-gua-bei-dai-ku-kuan-3-4-c-a-l'],
    sourcePath:
      '拆分结果/按产品分类/防电弧服/3级防电弧服标品款/006_3级防电弧服（大褂、背带裤款）34cal_HYF-3821-HYF-3856/说明.md',
  },
  {
    productIds: ['4-ji-fang-dian-hu-fu-jia-ke-kuan-4-1-c-a-l'],
    sourcePath:
      '拆分结果/按产品分类/防电弧服/4级防电弧服标品款/007_4级防电弧服（夹克款）41cal_HYF-3826/说明.md',
  },
  {
    productIds: ['4-ji-fang-dian-hu-fu-da-gua-bei-dai-ku-kuan-4-1-c-a-l'],
    sourcePath:
      '拆分结果/按产品分类/防电弧服/4级防电弧服标品款/008_4级防电弧服（大褂、背带裤款）41cal_HYF-3827-HYF-3828/说明.md',
  },
  {
    productIds: ['5-0-0-k-v-dai-dian-zuo-ye-yong-ping-bi-fu'],
    sourcePath: '拆分结果/按产品分类/屏蔽服/未分组/001_500kV带电作业用屏蔽服_HYF-3701/说明.md',
  },
  {
    productIds: ['7-5-0-k-v-dai-dian-zuo-ye-yong-ping-bi-fu'],
    sourcePath: '拆分结果/按产品分类/屏蔽服/未分组/002_750kV带电作业用屏蔽服_HYF-3702/说明.md',
  },
  {
    productIds: ['live-line-shielding-suit'],
    sourcePath: '拆分结果/按产品分类/屏蔽服/未分组/003_1000kV带电作业用屏蔽服_HYF-3703/说明.md',
  },
  {
    productIds: ['5-0-0-k-v-jiao-liu-gao-ya-jing-dian-fu'],
    sourcePath: '拆分结果/按产品分类/屏蔽服/未分组/004_500kV交流高压静电服_HYF-3901/说明.md',
  },
  {
    productIds: ['b-ji-han-jie-fen-ti-tao-zhuang', 'b-ji-han-jie-fu'],
    sourcePath:
      '拆分结果/按产品分类/热防护/B级焊接服标品款2(配件还在完善中，会加入焊接眼镜）/011_B级焊接服_HYF-3244（墨绿）、HYF-3230（藏蓝）/说明.md',
  },
  {
    productIds: ['fang-jing-dian-chun-qiu-fen-ti-tao-zhuang'],
    sourcePath:
      '拆分结果/按产品分类/热防护/防静电服标品款3/009_防静电春秋分体套装_HYF-6107/说明.md',
  },
  {
    productIds: ['fang-jing-dian-xia-ji-fen-ti-tao-zhuang'],
    sourcePath:
      '拆分结果/按产品分类/热防护/防静电服标品款1/007_防静电夏季分体套装_HYF-6106/说明.md',
  },
  {
    productIds: ['fang-jing-dian-xia-ji-lian-ti-fu'],
    sourcePath: '拆分结果/按产品分类/热防护/防静电服标品款2/008_防静电夏季连体服_HYF-6102/说明.md',
  },
  {
    productIds: ['zu-ran-fang-jing-dian-quan-mian-qiu-ji-tao-zhuang'],
    sourcePath:
      '拆分结果/按产品分类/热防护/阻燃防静电服标品款1/005_阻燃防静电全棉秋季套装_HYF-33106/说明.md',
  },
];

const productLocales = ['zh', 'en', 'ru'] as const;

function newArrayRowId() {
  return randomBytes(12).toString('hex');
}

function cleanValue(value: string) {
  return value
    .replace(/\s+/g, ' ')
    .replace(/其他颜色（采购正在询问）/g, '可定制颜色')
    .replace(/（采购正在询问）/g, '')
    .trim();
}

function normalizeStandard(value: string) {
  return cleanValue(value)
    .replace(/要求GB/g, '要求；GB')
    .replace(/B级GB/g, 'B级；GB')
    .replace(/》(GB|DL\/T|XF)/g, '》；$1');
}

function normalizeReport(value: string) {
  const text = cleanValue(value);

  if (!text || text === '无') {
    return '资料文件未标注检测报告；可按项目需求确认适配检测资料。';
  }

  if (text === '有' || text === '公司有检测报告') {
    return '有检测报告。';
  }

  return text.endsWith('。') ? text : `${text}。`;
}

function reportStatus(value: string) {
  return /未标注|确认/.test(value) ? '资料待确认' : '有检测报告';
}

function splitBulletField(line: string) {
  const match = line.match(/^-\s*([^：:]+)[：:]\s*(.+)$/);

  if (!match?.[1] || !match[2]) {
    return null;
  }

  return [match[1].trim(), cleanValue(match[2])] as const;
}

export function parseReferenceProductMarkdown(filePath: string): ReferenceProductInfo {
  const markdown = fs.readFileSync(filePath, 'utf8');
  const fields = new Map<string, string>();
  const title = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? path.basename(path.dirname(filePath));

  for (const line of markdown.split(/\r?\n/)) {
    const field = splitBulletField(line);

    if (field) {
      fields.set(field[0], field[1]);
    }
  }

  return {
    applications: cleanValue(fields.get('适用领域') ?? ''),
    color: cleanValue(fields.get('颜色') ?? ''),
    model: cleanValue(fields.get('货号') ?? ''),
    name: cleanValue(fields.get('产品名称') ?? title),
    report: normalizeReport(fields.get('检测报告说明') ?? ''),
    selection: cleanValue(fields.get('产品如何选用') ?? ''),
    sizeRange: cleanValue(fields.get('尺码') ?? ''),
    sourcePath: filePath,
    standard: normalizeStandard(fields.get('执行标准') ?? ''),
  };
}

const unique = (values: string[]) =>
  values.filter((value, index, list) => Boolean(value) && list.indexOf(value) === index);

export function buildReferenceProductUpdateData(
  info: ReferenceProductInfo,
): ReferenceProductUpdateData {
  const description = unique([info.applications, info.selection]).join('\n\n');
  const reportDescription = unique([
    info.standard ? `执行标准：${info.standard}` : '',
    info.report ? `检测报告说明：${info.report}` : '',
  ]).join('\n');
  const specifications = (
    [
      ['货号', info.model],
      ['执行标准', info.standard],
      ['颜色', info.color],
      ['尺码', info.sizeRange],
      ['适用领域', info.applications],
      ['选用建议', info.selection],
      ['检测报告说明', info.report],
    ] satisfies Array<[string, string]>
  )
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([label, value]) => ({ label, value }));

  const sellingPoints = [
    { title: '标准依据', text: info.standard },
    { title: '场景适配', text: info.applications },
    { title: '选用建议', text: info.selection },
  ].filter((item) => item.text);

  return {
    applications: info.applications ? [info.applications] : [],
    description: description || `${info.name}产品资料已整理。`,
    features: sellingPoints.map((item) => ({
      title: item.title,
      description: item.text,
    })),
    qualityEvidence: reportDescription
      ? [
          {
            type: 'other',
            status: reportStatus(info.report),
            title: '检测与标准说明',
            description: reportDescription,
          },
        ]
      : [],
    scenarios: [
      ...(info.applications ? [{ title: '适用领域', description: info.applications }] : []),
      ...(info.selection ? [{ title: '选用建议', description: info.selection }] : []),
    ],
    sellingPoints,
    sizeGuide: {
      title: '尺码范围',
      cornerLabel: '项目',
      columns: ['说明'],
      rows: info.sizeRange ? [{ label: '可选尺码', values: [info.sizeRange] }] : [],
    },
    sizeRange: info.sizeRange ? [info.sizeRange] : [],
    specifications,
    standards: info.standard ? [info.standard] : [],
  };
}

function getDbQuery(payload: Payload): DbQuery {
  const db = (
    payload as unknown as {
      db?: { pool?: { query?: DbQuery } };
    }
  ).db;
  const query = db?.pool?.query?.bind(db.pool);

  if (typeof query !== 'function') {
    throw new Error('Payload database pool is not available.');
  }

  return query;
}

async function findProductByProductId(query: DbQuery, productId: string) {
  const result = await query<ProductDoc>(
    'select id, product_id, sku, model, slug from products where product_id = $1 or slug = $1 limit 1',
    [productId],
  );

  return result.rows[0];
}

async function deleteProductDetailRows(query: DbQuery, productId: number) {
  await query(
    'delete from products_size_guide_rows_values where _parent_id in (select id from products_size_guide_rows where _parent_id = $1)',
    [productId],
  );
  await query(
    'delete from products_size_guide_rows_locales where _parent_id in (select id from products_size_guide_rows where _parent_id = $1)',
    [productId],
  );
  await query('delete from products_size_guide_rows where _parent_id = $1', [productId]);
  await query(
    'delete from products_size_guide_columns_locales where _parent_id in (select id from products_size_guide_columns where _parent_id = $1)',
    [productId],
  );
  await query('delete from products_size_guide_columns where _parent_id = $1', [productId]);
  await query(
    'delete from products_specifications_locales where _parent_id in (select id from products_specifications where _parent_id = $1)',
    [productId],
  );

  for (const table of [
    'products_standards',
    'products_size_range',
    'products_features',
    'products_selling_points',
    'products_specifications',
    'products_applications',
    'products_scenarios',
    'products_quality_evidence',
  ]) {
    await query(`delete from ${table} where _parent_id = $1`, [productId]);
  }
}

async function upsertProductLocale(
  query: DbQuery,
  productId: number,
  data: ReferenceProductUpdateData,
) {
  for (const locale of productLocales) {
    await query(
      `insert into products_locales (_locale, _parent_id, description, size_guide_title, size_guide_corner_label)
       values ($1, $2, $3::jsonb, $4, $5)
       on conflict (_locale, _parent_id)
       do update set
         description = excluded.description,
         size_guide_title = excluded.size_guide_title,
         size_guide_corner_label = excluded.size_guide_corner_label`,
      [
        locale,
        productId,
        JSON.stringify(richTextFromPlainText(data.description)),
        data.sizeGuide.title,
        data.sizeGuide.cornerLabel,
      ],
    );
  }
}

async function insertPlainRows(query: DbQuery, table: string, productId: number, values: string[]) {
  for (const [index, value] of values.entries()) {
    await query(`insert into ${table} (_order, _parent_id, id, value) values ($1, $2, $3, $4)`, [
      index + 1,
      productId,
      newArrayRowId(),
      value,
    ]);
  }
}

async function insertLocalizedRows(
  query: DbQuery,
  table: string,
  productId: number,
  rows: Array<Record<string, string>>,
) {
  for (const locale of productLocales) {
    for (const [index, row] of rows.entries()) {
      await query(
        `insert into ${table} (_order, _parent_id, _locale, id, ${Object.keys(row).join(', ')})
         values ($1, $2, $3, $4, ${Object.keys(row)
           .map((_, keyIndex) => `$${keyIndex + 5}`)
           .join(', ')})`,
        [index + 1, productId, locale, newArrayRowId(), ...Object.values(row)],
      );
    }
  }
}

async function insertSpecifications(
  query: DbQuery,
  productId: number,
  rows: ReferenceProductUpdateData['specifications'],
) {
  for (const [index, row] of rows.entries()) {
    const rowId = newArrayRowId();

    await query(
      'insert into products_specifications (_order, _parent_id, id, "group", "order") values ($1, $2, $3, $4, $5)',
      [index + 1, productId, rowId, '产品资料', index + 1],
    );

    for (const locale of productLocales) {
      await query(
        'insert into products_specifications_locales (label, value, _locale, _parent_id) values ($1, $2, $3, $4)',
        [row.label, row.value, locale, rowId],
      );
    }
  }
}

async function insertSizeGuide(
  query: DbQuery,
  productId: number,
  sizeGuide: ReferenceProductUpdateData['sizeGuide'],
) {
  for (const [index, label] of sizeGuide.columns.entries()) {
    const rowId = newArrayRowId();

    await query(
      'insert into products_size_guide_columns (_order, _parent_id, id) values ($1, $2, $3)',
      [index + 1, productId, rowId],
    );

    for (const locale of productLocales) {
      await query(
        'insert into products_size_guide_columns_locales (label, _locale, _parent_id) values ($1, $2, $3)',
        [label, locale, rowId],
      );
    }
  }

  for (const [index, row] of sizeGuide.rows.entries()) {
    const rowId = newArrayRowId();

    await query(
      'insert into products_size_guide_rows (_order, _parent_id, id) values ($1, $2, $3)',
      [index + 1, productId, rowId],
    );

    for (const locale of productLocales) {
      await query(
        'insert into products_size_guide_rows_locales (label, _locale, _parent_id) values ($1, $2, $3)',
        [row.label, locale, rowId],
      );
    }

    for (const [valueIndex, value] of row.values.entries()) {
      await query(
        'insert into products_size_guide_rows_values (_order, _parent_id, id, value) values ($1, $2, $3, $4)',
        [valueIndex + 1, rowId, newArrayRowId(), value],
      );
    }
  }
}

async function cleanupVisibleSyncLabels(query: DbQuery) {
  await query(
    `update products_quality_evidence
       set status = case when status = '按官网资料同步' then '资料已整理' else status end,
           title = case when title = '官网资料说明' then '检测与标准说明' else title end,
           description = replace(description, '按官网资料说明同步。', '产品资料已整理。')
     where status = '按官网资料同步'
        or title = '官网资料说明'
        or description like '%官网资料%'`,
  );
  await query(
    `update products_selling_points
       set title = case when title = '官网资料同步' then '产品资料概览' else title end,
           text = replace(replace(text, '按官网资料更新', '资料已整理'), '官网资料', '产品资料')
     where title = '官网资料同步' or text like '%官网资料%'`,
  );
  await query(
    `update products_visual_groups
       set description = case
         when _locale = 'en' then 'Shows product images, details, and wearing effect.'
         when _locale = 'ru' then 'Показывает изображения, детали и посадку изделия.'
         else '展示产品图片、细节与穿着效果。'
       end
     where description like '%官网资料%' or description like '%official material%' or description like '%официальных материалов%'`,
  );
}

async function updateProductDetails(
  query: DbQuery,
  product: ProductDoc,
  data: ReferenceProductUpdateData,
) {
  await query('begin');

  try {
    await deleteProductDetailRows(query, product.id);
    await upsertProductLocale(query, product.id, data);
    await insertPlainRows(query, 'products_standards', product.id, data.standards);
    await insertPlainRows(query, 'products_size_range', product.id, data.sizeRange);
    await insertLocalizedRows(
      query,
      'products_applications',
      product.id,
      data.applications.map((value) => ({ value })),
    );
    await insertLocalizedRows(query, 'products_features', product.id, data.features);
    await insertLocalizedRows(query, 'products_selling_points', product.id, data.sellingPoints);
    await insertLocalizedRows(query, 'products_scenarios', product.id, data.scenarios);
    await insertLocalizedRows(query, 'products_quality_evidence', product.id, data.qualityEvidence);
    await insertSpecifications(query, product.id, data.specifications);
    await insertSizeGuide(query, product.id, data.sizeGuide);
    await query('update products set updated_at = now() where id = $1', [product.id]);
    await cleanupVisibleSyncLabels(query);
    await query('commit');
  } catch (error) {
    await query('rollback');
    throw error;
  }
}

const setupEnv = () => {
  process.env.PAYLOAD_SEED_MODE = 'true';
  process.env.PAYLOAD_CONFIG_PATH = process.env.PAYLOAD_CONFIG_PATH || 'src/payload.config.ts';
  process.env.STRICT_I18N_PUBLISH = 'false';
  process.env.REVALIDATE_SECRET = '';
  loadLocalEnv();
};

async function initPayloadForImport() {
  setupEnv();
  const [{ getPayload }, { default: config }] = await Promise.all([
    import('payload'),
    import('../../src/payload.config'),
  ]);

  return getPayload({ config });
}

export const parseSyncReferenceProductDetailsOptions = (
  argv = process.argv,
): SyncReferenceProductDetailsOptions => ({
  apply: argv.includes('--apply'),
  referenceRoot: path.resolve(process.cwd(), '资料文件'),
});

export async function syncReferenceProductDetails(
  payload: Payload,
  options: SyncReferenceProductDetailsOptions,
) {
  const query = getDbQuery(payload);
  const summary = {
    dryRun: !options.apply,
    productsUpdated: 0,
    targetProducts: referenceProductTargets.reduce(
      (total, target) => total + target.productIds.length,
      0,
    ),
    unmatched: [] as string[],
  };

  if (options.apply) {
    await cleanupVisibleSyncLabels(query);
  }

  for (const target of referenceProductTargets) {
    const sourcePath = path.join(options.referenceRoot, target.sourcePath);
    const info = parseReferenceProductMarkdown(sourcePath);
    const updateData = buildReferenceProductUpdateData(info);

    for (const productId of target.productIds) {
      const product = await findProductByProductId(query, productId);

      if (!product) {
        summary.unmatched.push(`${productId} <- ${target.sourcePath}`);
        console.warn(`UNMATCHED ${productId} <- ${target.sourcePath}`);
        continue;
      }

      if (options.apply) {
        await updateProductDetails(query, product, updateData);
      }

      summary.productsUpdated += 1;
      console.log(
        `${options.apply ? 'UPDATED' : 'DRY-UPDATE'} ${product.product_id} ${product.model ?? product.sku ?? ''} <- ${info.model}`,
      );
    }
  }

  return summary;
}

const run = async () => {
  const options = parseSyncReferenceProductDetailsOptions();
  const payload = await initPayloadForImport();
  const summary = await syncReferenceProductDetails(payload, options);

  console.log(JSON.stringify(summary, null, 2));

  if (summary.unmatched.length) {
    process.exitCode = 1;
  }
};

const isMain = process.argv[1]
  ? path.basename(process.argv[1]) === 'sync-reference-product-details.ts'
  : false;

if (isMain) {
  run().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
