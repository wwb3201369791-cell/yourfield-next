import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { pinyin } from 'pinyin-pro';

const projectRoot = process.cwd();
const contentSourceRoot = path.resolve(
  projectRoot,
  '..',
  process.env.YOURFIELD_PRODUCT_CONTENT_DIR || '拆分结果_20260514_133531',
);
const imageSourceRoot = path.resolve(
  projectRoot,
  '..',
  process.env.YOURFIELD_PRODUCT_IMAGE_DIR || '拆分结果_20260514_133531_高清优化',
);
const manifestPath = path.join(contentSourceRoot, 'manifest.json');
const publicImageRoot = path.join(projectRoot, 'public', 'images', 'products', 'extracted');
const outputPath = path.join(
  projectRoot,
  'src',
  'lib',
  'content',
  'extracted-products.generated.json',
);

const categoryMeta = {
  'anti-static': {
    groupId: 'electrical-protection',
    title: '防静电服',
  },
  'arc-flash': {
    groupId: 'electrical-protection',
    title: '防电弧服',
  },
  chemical: {
    groupId: 'chemical-medical',
    title: '防化服',
  },
  'firefighter-suit': {
    groupId: 'fire-rescue',
    title: '消防员灭火防护服',
  },
  'flame-retardant': {
    groupId: 'thermal-welding',
    title: '阻燃服',
  },
  'forest-fire': {
    groupId: 'fire-rescue',
    title: '森林灭火防护装备',
  },
  'fr-anti-static': {
    groupId: 'chemical-medical',
    title: '阻燃防静电服',
  },
  'high-voltage-static': {
    groupId: 'electrical-protection',
    title: '交流高压静电服',
  },
  'microwave-radiation': {
    groupId: 'chemical-medical',
    title: '微波辐射防护服',
  },
  'rescue-suit': {
    groupId: 'fire-rescue',
    title: '消防员抢险救援服',
  },
  shielding: {
    groupId: 'electrical-protection',
    title: '带电作业用屏蔽服',
  },
  'splash-protection': {
    groupId: 'thermal-welding',
    title: '防喷溅服',
  },
  welding: {
    groupId: 'thermal-welding',
    title: '焊接服',
  },
  'water-rescue-accessories': {
    groupId: 'water-rescue',
    title: '水域救援配套装备',
  },
  'water-rescue-suit': {
    groupId: 'water-rescue',
    title: '水域救援服',
  },
};

const productIdOverrides = {
  '消防员灭火防护服（作战款）': 'firefighter-suit-combat',
  '1级防电弧服（夹克款）': 'arc-flash-suit',
  '1000kV带电作业用屏蔽服': 'live-line-shielding-suit',
  一次性化学防护服: 'chemical-protective-suit',
  A级焊接服: 'welding-protective-clothing',
};

const fieldKeys = [
  '货号',
  '执行标准',
  '颜色',
  '尺码',
  '面料',
  '包装',
  '产品结构及性能',
  '产品如何选用',
  '检测报告说明',
  '报告',
  '注意事项',
];

const internalStatusPattern = /不推了|需换款/;
const featureStopPattern =
  /^(产品基本信息|产品名称[:：]|产品货号[:：]|面\s*料|面料|颜\s*色|包装[:：]|材料特点|款式[:：]|衣领设计|绣花[:：]|门襟[:：]|口袋[:：]|反光条[:：]|袖口[:：]|上衣|裤子|脚口|SINOPPE)/;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function cleanText(value) {
  return String(value ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function compactText(value, maxLength = 520) {
  const text = cleanText(value).replace(/\n+/g, ' ');

  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function splitValues(value) {
  return cleanText(value)
    .split(/\n|[;；、，,]/)
    .map((item) => item.trim())
    .filter((item) => item && item !== '/' && item !== '暂无标准' && item !== '待定');
}

function splitFieldLines(value) {
  return cleanText(value)
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function scopeFieldsToProduct(fields, productName) {
  const productNames = splitFieldLines(fields['产品名称']);

  if (productNames.length <= 1) {
    return fields;
  }

  const productIndex = productNames.findIndex((name) => name === productName);
  const scopedFields = { ...fields };
  const lineIndex = productIndex >= 0 ? productIndex : 0;

  for (const [key, value] of Object.entries(fields)) {
    const lines = splitFieldLines(value);

    if (lines.length > 1) {
      scopedFields[key] = lines[lineIndex] || lines[0];
    }
  }

  return scopedFields;
}

function slugify(value) {
  const transliterated = pinyin(value, { toneType: 'none', type: 'array' }).join('-');
  const slug = transliterated
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  return slug || crypto.createHash('sha1').update(value).digest('hex').slice(0, 12);
}

function uniqueProductId(product, index, usedIds) {
  const override = productIdOverrides[product.name];
  const baseId = override || slugify(product.name);
  let id = baseId;
  let suffix = 2;

  while (usedIds.has(id)) {
    id = `${baseId}-${suffix}`;
    suffix += 1;
  }

  usedIds.add(id);

  return id || `extracted-product-${String(index + 1).padStart(3, '0')}`;
}

function parseFields(markdown) {
  const fields = {};

  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(/^\|\s*([^|]+?)\s*\|\s*([^|]*?)\s*\|$/);

    if (!match) {
      continue;
    }

    const key = cleanText(match[1]);
    const value = cleanText(match[2]);

    if (!key || !value || key === '字段' || key === '---') {
      continue;
    }

    fields[key] = fields[key] || value;
  }

  return fields;
}

function parseFeatureLines(markdown) {
  const features = [];
  let inFeatureBlock = false;

  for (const line of markdown.split(/\r?\n/)) {
    if (/^#{2,4}\s*产品特点/.test(line)) {
      inFeatureBlock = true;
      continue;
    }

    if (inFeatureBlock && /^#{2,4}\s+/.test(line)) {
      inFeatureBlock = false;
    }

    if (!inFeatureBlock) {
      continue;
    }

    const match = line.match(/^-\s*(.+)$/);
    const feature = match ? compactText(match[1], 130) : '';

    if (feature && (internalStatusPattern.test(feature) || featureStopPattern.test(feature))) {
      inFeatureBlock = false;
      continue;
    }

    if (feature && !/^产品特点/.test(feature) && !features.includes(feature)) {
      features.push(feature);
    }
  }

  return features.slice(0, 8);
}

function uniqueTexts(values) {
  return values.filter((value, index, items) => value && items.indexOf(value) === index);
}

function parseMarkdownSectionLines(markdown, headings) {
  const lines = [];
  let inSection = false;
  const sectionMarkerPattern =
    /^(主要作用|应用领域|符合标准|产品基本信息|产品图片|配套产品|产品特点|材料特点|检测报告说明)\s*l?\s*/;
  const inlineSectionMarkerPattern =
    /\s*l\s*(主要作用|应用领域|符合标准|产品基本信息|产品图片|配套产品|产品特点|材料特点|检测报告说明).*$/;

  for (const rawLine of markdown.split(/\r?\n/)) {
    const heading = rawLine.match(/^#{2,5}\s*(.+?)\s*$/);

    if (heading) {
      const headingText = cleanText(heading[1]).replace(/[：:]/g, '');
      inSection = headings.some((item) => headingText.includes(item));
      continue;
    }

    if (!inSection) {
      continue;
    }

    const match = rawLine.match(/^-\s*(.+)$/);
    const text = match ? compactText(match[1], 280).replace(inlineSectionMarkerPattern, '') : '';

    if (
      !text ||
      internalStatusPattern.test(text) ||
      sectionMarkerPattern.test(text) ||
      headings.some((item) => text === item || text.includes(`${item}l`))
    ) {
      continue;
    }

    lines.push(text);
  }

  return uniqueTexts(lines);
}

function normalizeFieldLabel(value) {
  return value.replace(/[\s:：]/g, '');
}

function valueFromLabeledLines(lines, labels) {
  const normalizedLabels = new Set(labels.map(normalizeFieldLabel));

  for (const line of lines) {
    const match = line.match(/^([^:：]+)[:：]\s*(.+)$/);

    if (!match) {
      continue;
    }

    if (normalizedLabels.has(normalizeFieldLabel(match[1]))) {
      return cleanText(match[2]);
    }
  }

  return '';
}

function descriptionFromFields(fields, fallbackName, bodyDescription = '') {
  const source =
    fields['主要作用'] ||
    bodyDescription ||
    fields['适用领域'] ||
    fields['产品如何选用'] ||
    fields['产品结构及性能'] ||
    fallbackName;
  const firstPart = cleanText(source).split(/产品特点|主要作用|产品如何选用|检测报告说明/)[0];

  return compactText(firstPart || fallbackName, 360);
}

function categoryForProduct(name) {
  if (/水域|救生|牛尾绳|口哨|割绳刀/.test(name)) {
    return /服/.test(name) ? 'water-rescue-suit' : 'water-rescue-accessories';
  }

  if (/防电弧|电弧/.test(name)) {
    return 'arc-flash';
  }

  if (/屏蔽服|带电作业/.test(name)) {
    return 'shielding';
  }

  if (/高压静电|国家电网|电网|防雨服/.test(name)) {
    return 'high-voltage-static';
  }

  if (/微波辐射/.test(name)) {
    return 'microwave-radiation';
  }

  if (/焊接|空调焊/.test(name)) {
    return 'welding';
  }

  if (/熔融金属|防喷溅/.test(name)) {
    return 'splash-protection';
  }

  if (/森林|扑火/.test(name)) {
    return 'forest-fire';
  }

  if (/抢险|应急救援|救援服|矿山|蓝天/.test(name)) {
    return 'rescue-suit';
  }

  if (/消防|防蜂|隔热|避火|防火/.test(name)) {
    return 'firefighter-suit';
  }

  if (/阻燃防静电|高可视/.test(name)) {
    return 'fr-anti-static';
  }

  if (/防静电/.test(name)) {
    return 'anti-static';
  }

  if (/阻燃/.test(name)) {
    return 'flame-retardant';
  }

  if (/化学|防化|耐酸碱|洁净|生物制药|卫生应急|一次性|工业防护/.test(name)) {
    return 'chemical';
  }

  return 'firefighter-suit';
}

function productImageRecords(product, productId) {
  const targetDirectory = path.join(publicImageRoot, productId);
  fs.mkdirSync(targetDirectory, { recursive: true });

  return (product.images || [])
    .map((image, index) => {
      const sourcePath = path.join(imageSourceRoot, product.folder, 'images', image.file);

      if (!fs.existsSync(sourcePath)) {
        throw new Error(`Missing optimized product image: ${sourcePath}`);
      }

      const extension = path.extname(image.file).toLowerCase() || '.png';
      const fileName = `image-${String(index + 1).padStart(3, '0')}${extension}`;
      const targetPath = path.join(targetDirectory, fileName);
      fs.copyFileSync(sourcePath, targetPath);

      return `/images/products/extracted/${productId}/${fileName}`;
    })
    .filter(Boolean);
}

function productFromManifest(product, index, usedIds) {
  const markdownPath = path.join(contentSourceRoot, product.markdown);
  const markdown = fs.existsSync(markdownPath) ? fs.readFileSync(markdownPath, 'utf8') : '';
  const fields = scopeFieldsToProduct(parseFields(markdown), product.name);
  const bodyDescription = parseMarkdownSectionLines(markdown, ['主要作用'])[0] || '';
  const bodyApplications = splitValues(
    parseMarkdownSectionLines(markdown, ['应用领域']).join('\n'),
  );
  const bodyStandards = parseMarkdownSectionLines(markdown, ['符合标准']);
  const bodyProductInfo = parseMarkdownSectionLines(markdown, ['产品基本信息']);
  const bodyMaterials = valueFromLabeledLines(bodyProductInfo, [
    '面料',
    '面 料',
    '面料材质',
    '材料',
  ]);
  const categoryId = categoryForProduct(product.name);
  const category = categoryMeta[categoryId] || categoryMeta['firefighter-suit'];
  const productId = uniqueProductId(product, index, usedIds);
  const images = productImageRecords(product, productId);
  const model = splitValues(fields['货号'])[0] || `YF-${String(index + 1).padStart(3, '0')}`;
  const description = descriptionFromFields(fields, product.name, bodyDescription);
  const standards = uniqueTexts([...splitValues(fields['执行标准']), ...bodyStandards]);
  const materials = splitValues(fields['面料'] || fields['产品结构及性能'] || bodyMaterials).slice(
    0,
    5,
  );
  const applications = uniqueTexts([...splitValues(fields['适用领域']), ...bodyApplications]).slice(
    0,
    4,
  );
  const features = parseFeatureLines(markdown);
  const fallbackFeatures = [
    fields['产品如何选用'] ? compactText(fields['产品如何选用'], 140) : '',
    fields['检测报告说明'] || fields['报告']
      ? compactText(fields['检测报告说明'] || fields['报告'], 140)
      : '',
  ].filter(Boolean);
  const specifications = fieldKeys
    .filter((key) => fields[key])
    .map((key) => ({
      label: key,
      value: compactText(fields[key], 640),
    }));

  return {
    id: productId,
    model,
    sku: model.startsWith('YF-') ? '' : model,
    categoryId,
    categoryName: category.title,
    groupId: category.groupId,
    name: product.name,
    description,
    image: images[0] || '',
    images,
    standards,
    materials,
    applications,
    features: features.length > 0 ? features : fallbackFeatures,
    specifications,
    sourceFolder: product.folder,
    sourceMarkdown: product.markdown,
  };
}

function main() {
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Cannot find extracted product manifest: ${manifestPath}`);
  }

  if (!fs.existsSync(imageSourceRoot)) {
    throw new Error(`Cannot find optimized product image directory: ${imageSourceRoot}`);
  }

  fs.rmSync(publicImageRoot, { recursive: true, force: true });
  fs.mkdirSync(publicImageRoot, { recursive: true });

  const manifest = readJson(manifestPath);
  const manifestProducts = manifest.products.map((product, index) => ({ index, product }));
  const excludedProducts = manifestProducts
    .map(({ product }) => {
      if (internalStatusPattern.test(product.name)) {
        return {
          imageCount: product.images?.length || 0,
          name: product.name,
          reason: 'marked as internal or not ready',
        };
      }

      if (!product.images?.length) {
        return {
          imageCount: 0,
          name: product.name,
          reason: 'missing product images',
        };
      }

      return null;
    })
    .filter(Boolean);
  const publicProducts = manifestProducts.filter(
    ({ product }) => product.images?.length && !internalStatusPattern.test(product.name),
  );
  const usedIds = new Set();
  const products = publicProducts.map(({ product, index }) =>
    productFromManifest(product, index, usedIds),
  );
  const imageCount = products.reduce((sum, product) => sum + product.images.length, 0);
  const payload = {
    source: path.basename(imageSourceRoot),
    contentSource: path.basename(contentSourceRoot),
    imageSource: path.basename(imageSourceRoot),
    originalProductCount: manifest.products.length,
    productCount: products.length,
    imageCount,
    excludedProducts,
    generatedAt: new Date().toISOString(),
    products,
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`Imported ${products.length} products and ${imageCount} images.`);
  console.log(`Data: ${path.relative(projectRoot, outputPath)}`);
  console.log(`Images: ${path.relative(projectRoot, publicImageRoot)}`);
}

main();
