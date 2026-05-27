'use client';

import { useFormFields, useFormModified } from 'payload/components/forms';
import { useDocumentInfo, useLocale } from 'payload/components/utilities';
import { useConfig } from 'payload/dist/admin/components/utilities/Config';
import React, { useEffect, useMemo, useState } from 'react';

import { isRecord, type RequiredI18nPath } from '@/lib/i18n/i18nCompleteness';

import {
  asContentLocale,
  collectLocaleSummaries,
  formValuesForI18nSummary,
  localeLabels,
  requiredLabelSummary,
  type ContentLocale,
} from './i18nEditGuideProgress';

const emptyRequiredPaths: readonly RequiredI18nPath[] = [];

export type I18nEditGuideProps = Readonly<{
  custom?: {
    collectionSlug?: string;
    globalSlug?: string;
    requiredPaths?: readonly RequiredI18nPath[];
  };
}>;

function updateLocaleHref(nextLocale: ContentLocale) {
  if (typeof window === 'undefined') {
    return '#';
  }

  const url = new URL(window.location.href);
  url.searchParams.set('locale', nextLocale);
  url.searchParams.set('fallback-locale', 'null');
  return `${url.pathname}${url.search}${url.hash}`;
}

export default function I18nEditGuide({ custom }: I18nEditGuideProps) {
  const locale = useLocale();
  const modified = useFormModified();
  const fields = useFormFields(([formFields]) => formFields);
  const { routes, serverURL } = useConfig();
  const { id } = useDocumentInfo();
  const [allLocaleDoc, setAllLocaleDoc] = useState<Record<string, unknown> | undefined>();

  const collectionSlug = custom?.collectionSlug;
  const globalSlug = custom?.globalSlug;
  const requiredPaths = custom?.requiredPaths ?? emptyRequiredPaths;
  const currentLocale = asContentLocale(locale?.code);
  const currentValues = useMemo(() => formValuesForI18nSummary(fields), [fields]);
  const requiredLabels = useMemo(() => requiredLabelSummary(requiredPaths), [requiredPaths]);
  const summaries = useMemo(
    () =>
      collectLocaleSummaries({
        currentLocale,
        currentValues,
        doc: allLocaleDoc,
        requiredPaths,
      }),
    [allLocaleDoc, currentLocale, currentValues, requiredPaths],
  );
  const canShowProgress = requiredPaths.length > 0;
  const missingTotal = summaries.reduce((sum, item) => sum + item.missingLabels.length, 0);
  const allLocaleDocUrl = useMemo(() => {
    const apiBase = `${serverURL ?? ''}${routes.api}`;

    if (globalSlug) {
      return `${apiBase}/globals/${globalSlug}?locale=all&fallback-locale=null&draft=true&depth=0`;
    }

    if (collectionSlug && id) {
      return `${apiBase}/${collectionSlug}/${id}?locale=all&fallback-locale=null&draft=true&depth=0`;
    }

    return undefined;
  }, [collectionSlug, globalSlug, id, routes.api, serverURL]);

  useEffect(() => {
    if (!allLocaleDocUrl) {
      setAllLocaleDoc(undefined);
      return undefined;
    }

    const controller = new AbortController();

    void fetch(allLocaleDocUrl, { credentials: 'include', signal: controller.signal })
      .then((response) => (response.ok ? response.json() : undefined))
      .then((doc: unknown) => {
        setAllLocaleDoc(isRecord(doc) ? doc : undefined);
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [allLocaleDocUrl]);

  const onLocaleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!modified) {
      return;
    }

    const confirmed = window.confirm(
      '当前语言还有未保存修改，建议先保存再切换语言。确定要继续切换吗？',
    );
    if (!confirmed) {
      event.preventDefault();
    }
  };

  return (
    <section className="yf-i18n-guide" aria-label="三语内容编辑">
      <div className="yf-i18n-guide__copy">
        <strong>三语内容编辑</strong>
        <span>
          当前编辑：{localeLabels[currentLocale]}。
          {canShowProgress
            ? `进度只统计三语必填内容：${requiredLabels}。`
            : '发布前需要中文、英文、俄文内容都补齐。'}
        </span>
      </div>
      <div className="yf-i18n-guide__locales" aria-label="切换内容语言">
        {summaries.map((summary) => {
          const isActive = summary.code === currentLocale;
          const hasMissing = canShowProgress && summary.missingLabels.length > 0;
          const title = hasMissing
            ? `${localeLabels[summary.code]}缺失：${summary.missingLabels.join('、')}`
            : `${localeLabels[summary.code]}内容${canShowProgress ? '已完成' : '编辑'}`;

          return (
            <a
              key={summary.code}
              className={[
                'yf-i18n-guide__locale',
                isActive ? 'is-active' : '',
                hasMissing ? 'is-missing' : 'is-complete',
              ]
                .filter(Boolean)
                .join(' ')}
              href={updateLocaleHref(summary.code)}
              title={title}
              onClick={onLocaleClick}
            >
              <span>{localeLabels[summary.code]}</span>
              <small>{canShowProgress ? `${summary.completed}/${summary.total}` : '编辑'}</small>
            </a>
          );
        })}
      </div>
      <p className="yf-i18n-guide__note">
        {canShowProgress
          ? missingTotal > 0
            ? `当前还有 ${missingTotal} 项三语内容未补齐；草稿可保存，发布会被拦截。非翻译项不计入这里。`
            : '当前三语必填内容已补齐，可以发布。非翻译项不计入这里。'
          : '该页面包含多语言内容，发布时会检查所有需要翻译的字段。'}
      </p>
    </section>
  );
}
