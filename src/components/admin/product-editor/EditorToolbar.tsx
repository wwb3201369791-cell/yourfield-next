'use client';

import {
  useConfig,
  useDocumentInfo,
  useForm,
  useFormFields,
  useFormModified,
  useFormProcessing,
  useLocale,
} from '@payloadcms/ui';
import { reduceFieldsToValues } from 'payload/shared';
import { useEffect, useMemo, useState, type MouseEvent } from 'react';

import { buildSectionPropsFromFormValues } from '@/lib/content/buildSectionProps';
import {
  collectProductI18nCompleteness,
  type ProductI18nLocale,
} from '@/lib/i18n/productI18nCompleteness';

import { markCurrentAdminContentLocaleIntent } from '../adminContentLocaleState';
import { useAdminText } from '../adminUiLocale';

import { useEditorContext, type EditorSection } from './hooks/useEditorContext';
import { collectRequiredErrors } from './utils/collectRequiredErrors';
import { focusDrawerField } from './utils/focusDrawerField';
import { summarizeProductEditorSections } from './utils/productEditorCompletion';
import {
  buildLocaleBadges,
  collectPublishPreflight,
  type PublishPreflightItem,
  type PublishPreflightResult,
} from './utils/productEditorPreflight';

const localeCodes = new Set(['zh', 'en', 'ru']);
const productLabelPassthrough = (key: string) => key;

const sectionAnchors: Partial<Record<EditorSection, string>> = {
  care: 'care-instructions',
  evidence: 'quality-evidence',
  faq: 'faq',
  hero: 'hero',
  identity: 'hero',
  intro: 'product-intro',
  scenarios: 'application-scenarios',
  'selling-points': 'selling-points',
  'size-guide': 'size-guide',
  specifications: 'specifications',
  'visual-groups': 'visual-gallery',
};

function asProductLocale(value: unknown): ProductI18nLocale {
  return typeof value === 'string' && localeCodes.has(value) ? (value as ProductI18nLocale) : 'zh';
}

function asEditorSection(value: string | null): EditorSection | null {
  const sections = new Set<EditorSection>([
    'hero',
    'intro',
    'selling-points',
    'specifications',
    'size-guide',
    'scenarios',
    'visual-groups',
    'evidence',
    'care',
    'faq',
    'identity',
  ]);

  return value && sections.has(value as EditorSection) ? (value as EditorSection) : null;
}

function updateSearchParams(updates: Record<string, string>) {
  if (typeof window === 'undefined') {
    return '#';
  }

  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(updates)) {
    url.searchParams.set(key, value);
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

function scrollToSection(section: EditorSection) {
  const anchor = sectionAnchors[section];
  if (!anchor || typeof document === 'undefined') {
    return;
  }

  document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function routeToPreflightItem(
  item: PublishPreflightItem,
  currentLocale: ProductI18nLocale,
  openDrawer: (section: EditorSection) => void,
) {
  if (item.locale !== currentLocale && typeof window !== 'undefined') {
    markCurrentAdminContentLocaleIntent(item.locale);
    window.location.href = updateSearchParams({
      locale: item.locale,
      ypeFocus: item.path,
      ypeSection: item.section,
    });
    return;
  }

  if (item.section === 'identity' && item.path === 'displayOrder') {
    openDrawer(item.section);
  }
  scrollToSection(item.section);
  window.setTimeout(() => focusDrawerField(item.path), 80);
}

function groupPreflightItems(items: readonly PublishPreflightItem[]) {
  return items.reduce<Record<string, PublishPreflightItem[]>>((groups, item) => {
    const key = `${item.localeLabel} ${item.locale.toUpperCase()}`;
    groups[key] = [...(groups[key] ?? []), item];
    return groups;
  }, {});
}

function hasFormValue(value: unknown) {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value);
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return Boolean(value);
}

export function EditorToolbar() {
  const t = useAdminText();
  const { submit } = useForm();
  const modified = useFormModified();
  const processing = useFormProcessing();
  const fields = useFormFields(([formFields]) => formFields);
  const locale = useLocale();
  const {
    config: { routes, serverURL },
  } = useConfig();
  const { id } = useDocumentInfo();
  const { allLocaleDoc, openDrawer, setAllLocaleDoc } = useEditorContext();
  const [preflight, setPreflight] = useState<PublishPreflightResult | null>(null);
  const [handledDeepLink, setHandledDeepLink] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [clientHrefReady, setClientHrefReady] = useState(false);

  const currentLocale = asProductLocale(locale?.code);
  const currentValues = useMemo(
    () => reduceFieldsToValues(fields, true, true) as Record<string, unknown>,
    [fields],
  );
  const requiredErrors = useMemo(() => collectRequiredErrors(fields), [fields]);
  const completeness = useMemo(
    () =>
      collectProductI18nCompleteness({
        currentLocale,
        currentValues,
        ...(allLocaleDoc ? { doc: allLocaleDoc } : {}),
      }),
    [allLocaleDoc, currentLocale, currentValues],
  );
  const badges = useMemo(
    () =>
      buildLocaleBadges({
        completeness,
        currentLocale,
        hrefForLocale: (nextLocale) =>
          clientHrefReady ? updateSearchParams({ locale: nextLocale }) : '#',
      }),
    [clientHrefReady, completeness, currentLocale],
  );
  const sectionSummary = useMemo(
    () =>
      summarizeProductEditorSections(
        buildSectionPropsFromFormValues(currentValues, currentLocale, productLabelPassthrough)
          .sections,
        currentValues,
      ),
    [currentLocale, currentValues],
  );
  const completeLocaleCount = useMemo(
    () => Object.values(completeness.locales).filter((item) => item.missing.length === 0).length,
    [completeness],
  );
  const previewSlug =
    typeof currentValues.slug === 'string' && currentValues.slug.trim()
      ? currentValues.slug.trim()
      : typeof currentValues.productId === 'string' && currentValues.productId.trim()
        ? currentValues.productId.trim()
        : 'draft-product';
  const previewHref = `/${currentLocale}/products/${previewSlug}?preview=1`;
  const productTitle =
    typeof currentValues.name === 'string' && currentValues.name.trim()
      ? currentValues.name.trim()
      : t('未命名产品');
  const isPublished = currentValues._status === 'published';
  const hasPublishedAt = hasFormValue(currentValues.publishedAt);
  const hasProductGroup = hasFormValue(currentValues.productGroup);
  const storefrontState = isPublished && hasPublishedAt && hasProductGroup ? 'visible' : 'draft';

  useEffect(() => {
    setClientHrefReady(true);
  }, []);

  useEffect(() => {
    if (!id) {
      setAllLocaleDoc(null);
      return undefined;
    }

    const controller = new AbortController();
    const apiBase = `${serverURL ?? ''}${routes.api}`;
    const url = `${apiBase}/products/${id}?locale=all&fallback-locale=null&draft=true&depth=0`;

    void fetch(url, { credentials: 'include', signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((doc) => {
        if (doc && typeof doc === 'object') {
          setAllLocaleDoc(doc as Record<string, unknown>);
        }
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [id, routes.api, serverURL, setAllLocaleDoc]);

  useEffect(() => {
    if (handledDeepLink || typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const section = asEditorSection(params.get('ypeSection'));
    const path = params.get('ypeFocus') ?? '';

    if (!section) {
      setHandledDeepLink(true);
      return;
    }

    if (section === 'identity' && path === 'displayOrder') {
      openDrawer(section);
    }
    scrollToSection(section);
    window.setTimeout(() => focusDrawerField(path), 120);
    setHandledDeepLink(true);
  }, [handledDeepLink, openDrawer]);

  const onSaveDraft = async () => {
    setPreviewError('');

    try {
      await submit({ overrides: { _status: isPublished ? 'published' : 'draft' } });
    } catch {
      setPreviewError(t('保存失败，请检查必填内容或稍后重试。'));
    }
  };

  const onPublish = () => {
    const result = collectPublishPreflight({ currentLocale, requiredErrors });

    if (result.canPublish) {
      const overrides: Record<string, unknown> = { _status: 'published' };

      if (!hasFormValue(currentValues.publishedAt)) {
        overrides.publishedAt = new Date().toISOString();
      }

      void submit({ overrides });
      return;
    }

    setPreflight(result);
  };

  const onLocaleSwitch = async (
    event: MouseEvent<HTMLAnchorElement>,
    nextLocale: ProductI18nLocale,
    href: string,
  ) => {
    markCurrentAdminContentLocaleIntent(nextLocale);

    if (!modified || href === '#') {
      return;
    }

    event.preventDefault();
    setPreviewError('');

    try {
      await submit({ overrides: { _status: isPublished ? 'published' : 'draft' } });
      window.location.href = href;
    } catch {
      setPreviewError(t('切换语言前保存失败，请先检查必填内容或稍后重试。'));
    }
  };

  const onPreview = async () => {
    setPreviewError('');

    const previewWindow =
      typeof window !== 'undefined' ? window.open('about:blank', '_blank') : null;

    if (previewWindow) {
      previewWindow.opener = null;
    }

    try {
      if (modified) {
        await submit();
      }

      if (previewWindow) {
        previewWindow.location.href = previewHref;
        return;
      }

      if (typeof window !== 'undefined') {
        window.location.href = previewHref;
      }
    } catch {
      previewWindow?.close();
      setPreviewError(t('预览前保存失败，请先检查必填内容或稍后重试。'));
    }
  };

  return (
    <>
      <header className="ype-toolbar">
        <div className="ype-toolbar-row ype-toolbar-main">
          <a className="ype-back" href={`${routes.admin}/collections/products`}>
            ← {t('产品列表')}
          </a>
          <div className="ype-doc-title">
            <strong>{productTitle}</strong>
          </div>
          <span
            className={`ype-save-state ${processing ? 'is-saving' : modified ? 'is-dirty' : 'is-saved'}`}
          >
            {processing ? t('保存中') : modified ? t('未保存') : t('已保存')}
          </span>
        </div>
        <div className="ype-toolbar-row ype-toolbar-actions">
          <div className="ype-locale-group" aria-label={t('语言切换')}>
            {badges.map((badge) => (
              <a
                key={badge.code}
                className={`ype-locale-badge ${badge.active ? 'active' : ''} ${badge.status === 'missing' ? 'is-missing' : 'is-complete'}`}
                href={badge.href}
                onClick={(event) => {
                  void onLocaleSwitch(event, badge.code, badge.href);
                }}
                title={badge.title}
              >
                {badge.text}
              </a>
            ))}
          </div>
          <div className="ype-toolbar-spacer" />
          <button type="button" disabled={processing} onClick={() => void onSaveDraft()}>
            {processing ? t('保存中…') : isPublished ? t('保存修改') : t('保存草稿')}
          </button>
          <button type="button" disabled={processing} onClick={() => void onPreview()}>
            {processing ? t('保存中…') : modified ? t('保存并预览 ↗') : t('前台预览 ↗')}
          </button>
          <button type="button" className="ype-publish" disabled={processing} onClick={onPublish}>
            {processing ? t('保存中…') : t('发布上线')}
          </button>
        </div>
        <div className="ype-publish-overview" aria-label={t('发布总览')}>
          <button
            type="button"
            className={`ype-overview-chip ${
              sectionSummary.coreMissing > 0 ? 'is-warning' : 'is-good'
            }`}
            onClick={() =>
              scrollToSection(sectionSummary.coreMissing > 0 ? 'intro' : 'specifications')
            }
          >
            <strong>{t('核心内容')}</strong>
            <span>
              {sectionSummary.coreMissing > 0
                ? t({
                    en: `${sectionSummary.coreMissing} core sections missing`,
                    zh: `缺 ${sectionSummary.coreMissing} 项`,
                  })
                : t({
                    en: `${sectionSummary.complete}/${sectionSummary.total} sections filled`,
                    zh: `${sectionSummary.complete}/${sectionSummary.total} 已填写`,
                  })}
            </span>
          </button>
          <div
            className={`ype-overview-chip ${
              completeLocaleCount === badges.length ? 'is-good' : 'is-warning'
            }`}
          >
            <strong>{t('多语言')}</strong>
            <span>
              {completeLocaleCount === badges.length
                ? t('三语内容完整')
                : t({
                    en: `${completeLocaleCount}/${badges.length} languages complete`,
                    zh: `${completeLocaleCount}/${badges.length} 语言完整`,
                  })}
            </span>
          </div>
          <button
            type="button"
            className={`ype-overview-chip ${
              storefrontState === 'visible' ? 'is-good' : 'is-muted'
            }`}
            onClick={() => scrollToSection('hero')}
          >
            <strong>{t('前台展示')}</strong>
            <span>
              {storefrontState === 'visible'
                ? t('已满足展示条件')
                : isPublished && !hasPublishedAt
                  ? t('已发布，缺发布时间')
                  : !hasProductGroup
                    ? t('缺产品大类')
                    : t('草稿未上线')}
            </span>
          </button>
        </div>
        {previewError ? <p className="ype-toolbar-error">{previewError}</p> : null}
        <p className="ype-toolbar-help">
          {t(
            '填写完成后直接点“保存草稿”暂存；确认三语和图片无误后点“发布上线”，不需要切换到经典表单页面。切换语言时如有未保存内容会先自动保存。',
          )}
        </p>
      </header>
      {preflight ? (
        <div
          className="ype-preflight"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ype-preflight-title"
        >
          <div className="ype-preflight-card">
            <div className="ype-preflight-head">
              <div>
                <p className="ype-kicker">{t('发布预检')}</p>
                <h2 id="ype-preflight-title">
                  {t({
                    en: `${preflight.items.length} items still need content`,
                    zh: `还有 ${preflight.items.length} 项内容需要补齐`,
                  })}
                </h2>
              </div>
              <button
                type="button"
                aria-label={t('关闭发布预检')}
                onClick={() => setPreflight(null)}
              >
                ×
              </button>
            </div>
            <p className="ype-preflight-copy">
              {t('草稿可以继续保存；发布前只需要补齐产品编号、名称、产品大类等基础必填项。')}
            </p>
            <div className="ype-preflight-list">
              {Object.entries(groupPreflightItems(preflight.items)).map(([group, items]) => (
                <section key={group}>
                  <h3>{group}</h3>
                  <ul>
                    {items.map((item, index) => (
                      <li key={`${item.locale}-${item.path}-${index}`}>
                        <span>{t(item.label)}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setPreflight(null);
                            routeToPreflightItem(item, currentLocale, openDrawer);
                          }}
                        >
                          {t('去填写')}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
