'use client';

import {
  reduceFieldsToValues,
  useForm,
  useFormFields,
  useFormModified,
  useFormProcessing,
} from 'payload/components/forms';
import { useDocumentInfo, useLocale } from 'payload/components/utilities';
import { useConfig } from 'payload/dist/admin/components/utilities/Config';
import React, { useEffect, useMemo, useState } from 'react';

import {
  collectProductI18nCompleteness,
  type ProductI18nLocale,
} from '@/lib/i18n/productI18nCompleteness';

import { useEditorContext, type EditorSection } from './hooks/useEditorContext';
import { collectRequiredErrors } from './utils/collectRequiredErrors';
import { focusDrawerField, openDrawerAndFocus } from './utils/focusDrawerField';
import {
  buildLocaleBadges,
  collectPublishPreflight,
  type PublishPreflightItem,
  type PublishPreflightResult,
} from './utils/productEditorPreflight';

const localeCodes = new Set(['zh', 'en', 'ru']);

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
    window.location.href = updateSearchParams({
      locale: item.locale,
      ypeFocus: item.path,
      ypeSection: item.section,
    });
    return;
  }

  if (item.section === 'identity') {
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

export function EditorToolbar() {
  const { submit } = useForm();
  const modified = useFormModified();
  const processing = useFormProcessing();
  const fields = useFormFields(([formFields]) => formFields);
  const locale = useLocale();
  const { routes, serverURL } = useConfig();
  const { id } = useDocumentInfo();
  const { allLocaleDoc, openDrawer, setAllLocaleDoc } = useEditorContext();
  const [preflight, setPreflight] = useState<PublishPreflightResult | null>(null);
  const [handledDeepLink, setHandledDeepLink] = useState(false);
  const [previewError, setPreviewError] = useState('');

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
        hrefForLocale: (nextLocale) => updateSearchParams({ locale: nextLocale }),
      }),
    [completeness, currentLocale],
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
      : '未命名产品';
  const productNumber =
    typeof currentValues.productId === 'string' && currentValues.productId.trim()
      ? currentValues.productId.trim()
      : '待填写产品编号';

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

    if (section === 'identity') {
      openDrawer(section);
    }
    scrollToSection(section);
    window.setTimeout(() => focusDrawerField(path), 120);
    setHandledDeepLink(true);
  }, [handledDeepLink, openDrawer]);

  const onPublish = () => {
    const result = collectPublishPreflight({ currentLocale, requiredErrors });

    if (result.canPublish) {
      void submit({ overrides: { _status: 'published' } });
      return;
    }

    setPreflight(result);
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
      setPreviewError('预览前保存失败，请先检查必填内容或稍后重试。');
    }
  };

  return (
    <>
      <header className="ype-toolbar">
        <div className="ype-toolbar-row ype-toolbar-main">
          <a className="ype-back" href={`${routes.admin}/collections/products`}>
            ← 产品列表
          </a>
          <div className="ype-doc-title">
            <strong>{productTitle}</strong>
            <button
              type="button"
              className="ype-doc-id-button"
              onClick={() => openDrawerAndFocus(openDrawer, 'identity', 'productId')}
            >
              {productNumber}
            </button>
          </div>
          <span
            className={`ype-save-state ${processing ? 'is-saving' : modified ? 'is-dirty' : 'is-saved'}`}
          >
            {processing ? '保存中' : modified ? '未保存' : '已保存'}
          </span>
        </div>
        <div className="ype-toolbar-row ype-toolbar-actions">
          <div className="ype-locale-group" aria-label="语言切换">
            {badges.map((badge) => (
              <a
                key={badge.code}
                className={`ype-locale-badge ${badge.active ? 'active' : ''} ${badge.status === 'missing' ? 'is-missing' : 'is-complete'}`}
                href={badge.href}
                title={badge.title}
              >
                {badge.text}
              </a>
            ))}
          </div>
          <div className="ype-toolbar-spacer" />
          <button type="button" onClick={() => openDrawer('identity')}>
            产品标识
          </button>
          <button type="button" disabled={processing} onClick={() => void onPreview()}>
            {processing ? '保存中…' : modified ? '保存并预览 ↗' : '前台预览 ↗'}
          </button>
          <button type="button" className="ype-publish" onClick={onPublish}>
            发布
          </button>
        </div>
        {previewError ? <p className="ype-toolbar-error">{previewError}</p> : null}
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
                <p className="ype-kicker">发布预检</p>
                <h2 id="ype-preflight-title">还有 {preflight.items.length} 项内容需要补齐</h2>
              </div>
              <button type="button" aria-label="关闭发布预检" onClick={() => setPreflight(null)}>
                ×
              </button>
            </div>
            <p className="ype-preflight-copy">
              草稿可以继续保存；发布前只需要补齐产品编号、名称、产品大类等基础必填项。
            </p>
            <div className="ype-preflight-list">
              {Object.entries(groupPreflightItems(preflight.items)).map(([group, items]) => (
                <section key={group}>
                  <h3>{group}</h3>
                  <ul>
                    {items.map((item, index) => (
                      <li key={`${item.locale}-${item.path}-${index}`}>
                        <span>{item.label}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setPreflight(null);
                            routeToPreflightItem(item, currentLocale, openDrawer);
                          }}
                        >
                          去填写
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
