 'use client';

import { useForm, useFormFields, useFormModified, useFormProcessing } from 'payload/components/forms';
import { useDocumentInfo, useLocale } from 'payload/components/utilities';
import { useConfig } from 'payload/dist/admin/components/utilities/Config';
import React, { useMemo } from 'react';

import { useEditorContext } from './hooks/useEditorContext';
import { collectRequiredErrors } from './utils/collectRequiredErrors';

function appendSearchParam(key: string, value: string) {
  if (typeof window === 'undefined') {
    return '#';
  }

  const url = new URL(window.location.href);
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function EditorToolbar() {
  const { submit } = useForm();
  const modified = useFormModified();
  const processing = useFormProcessing();
  const fields = useFormFields(([formFields]) => formFields);
  const locale = useLocale();
  const { routes } = useConfig();
  const { id } = useDocumentInfo();
  const { openDrawer, previewMode, setPreviewMode } = useEditorContext();
  const requiredErrors = useMemo(() => collectRequiredErrors(fields), [fields]);
  const currentLocale = locale?.code ?? 'zh';
  const previewHref = appendSearchParam('preview', '1').replace(routes.admin, `/${currentLocale}`);

  return (
    <header className="ype-toolbar">
      <a className="ype-back" href={`${routes.admin}/collections/products`}>
        ← 产品列表
      </a>
      <div className="ype-doc-title">产品可视化编辑器 {id ? <small>#{id}</small> : null}</div>
      <div className="ype-locale-group" aria-label="语言切换">
        {['zh', 'en', 'ru'].map((code) => (
          <a key={code} className={code === currentLocale ? 'active' : ''} href={appendSearchParam('locale', code)}>
            {code.toUpperCase()}
          </a>
        ))}
      </div>
      <span className={`ype-save-state ${processing ? 'is-saving' : modified ? 'is-dirty' : 'is-saved'}`}>
        {processing ? '保存中' : modified ? '未保存' : '已保存'}
      </span>
      {requiredErrors.length > 0 ? (
        <button type="button" className="ype-required" onClick={() => openDrawer(requiredErrors[0]?.section as never)}>
          {requiredErrors.length} 项必填未完成
        </button>
      ) : null}
      <button type="button" onClick={() => openDrawer('operations')}>
        ⚙ 运营
      </button>
      <button type="button" onClick={() => setPreviewMode(!previewMode)}>
        {previewMode ? '✏️ 编辑' : '👁 预览'}
      </button>
      <a href={appendSearchParam('view', 'classic')}>⤺ 经典表单</a>
      <a href={previewHref} target="_blank" rel="noopener noreferrer">
        前台预览
      </a>
      <button type="button" className="ype-publish" onClick={() => void submit({ overrides: { _status: 'published' } })}>
        发布
      </button>
    </header>
  );
}
