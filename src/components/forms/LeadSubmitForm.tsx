'use client';

import Script from 'next/script';
import { useEffect, useState, type FormEvent } from 'react';

import { isValidGlobalPhoneNumber } from '@/lib/forms/phone';

import { getLeadFormCopy, type LeadFormLocale } from './leadFormCopy';

type InquiryType = 'message' | 'franchise';
type FieldName = 'company' | 'country' | 'email' | 'mobile' | 'name' | 'position';
type FieldType = 'email' | 'tel' | 'text';

export type LeadFormField = Readonly<{
  autoComplete?: string;
  label: string;
  name: FieldName;
  placeholder: string;
  required?: boolean;
  type: FieldType;
}>;

type InquiryTypeOption = Readonly<{
  label: string;
  value: InquiryType;
}>;

type LeadSubmitFormProps = Readonly<{
  className: string;
  controlClassName?: string;
  defaultInquiryType: InquiryType;
  defaultMessage?: string;
  fieldGridClassName: string;
  fields: readonly LeadFormField[];
  inquiryTypeLabel?: string;
  inquiryTypeOptions?: readonly InquiryTypeOption[];
  locale: LeadFormLocale;
  messageLabel: string;
  messagePlaceholder: string;
  productKey?: string;
  submitLabel: string;
  supportEmail?: string;
  textareaClassName?: string;
  turnstileSiteKey?: string;
}>;

type FormStatus =
  | Readonly<{ kind: 'idle' }>
  | Readonly<{ kind: 'submitting' }>
  | Readonly<{ fallbackEmailHref?: string; kind: 'success'; message: string }>
  | Readonly<{ fallbackEmailHref?: string; kind: 'error'; message: string }>;

const successMessageVisibleMs = 8_000;
const defaultSupportEmail = 'hnyf@yourfield.net';
const safeEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

export type LeadFormPayload = {
  consentAccepted: true;
  consentAcceptedAt: string;
  inquiryType: InquiryType;
  message: string;
  name: string;
  company?: string;
  country?: string;
  email?: string;
  mobile?: string;
  position?: string;
  product?: string;
  productSlug?: string;
  sourceLocale?: LeadFormLocale;
  sourceUrl?: string;
  turnstileToken?: string;
  website?: string;
};

const optionalFieldNames = ['company', 'country', 'email', 'mobile', 'position'] as const;

type TurnstileApi = {
  reset: () => void;
};

type FormControlElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

function formValue(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === 'string' ? value.trim() : '';
}

function responseErrorCode(data: unknown) {
  if (!data || typeof data !== 'object') {
    return undefined;
  }

  const error = (data as { error?: unknown }).error;
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const code = (error as { code?: unknown }).code;

  return typeof code === 'string' ? code : undefined;
}

function messageForErrorCode(code: string | undefined, copy: ReturnType<typeof getLeadFormCopy>) {
  switch (code) {
    case 'VALIDATION_ERROR':
      return copy.validationError;
    case 'RATE_LIMITED':
      return copy.rateLimited;
    case 'CAPTCHA_FAILED':
    case 'CAPTCHA_REQUIRED':
      return copy.captchaError;
    case 'SERVER_ERROR':
      return copy.serverError;
    default:
      return copy.genericError;
  }
}

function normalizeSupportEmail(email: string | undefined) {
  const trimmed = email?.trim();

  return trimmed && safeEmailPattern.test(trimmed) ? trimmed : defaultSupportEmail;
}

function buildFallbackMailtoHref(
  supportEmail: string | undefined,
  copy: ReturnType<typeof getLeadFormCopy>,
  payload: LeadFormPayload,
) {
  const email = normalizeSupportEmail(supportEmail);
  const bodyLines = [
    `Name: ${payload.name}`,
    payload.mobile ? `Phone: ${payload.mobile}` : undefined,
    payload.email ? `Email: ${payload.email}` : undefined,
    payload.company ? `Company: ${payload.company}` : undefined,
    payload.country ? `Country / Region: ${payload.country}` : undefined,
    payload.inquiryType ? `Inquiry type: ${payload.inquiryType}` : undefined,
    payload.sourceUrl ? `Source: ${payload.sourceUrl}` : undefined,
    '',
    payload.message,
  ].filter((line): line is string => typeof line === 'string');
  const params = new URLSearchParams({
    body: bodyLines.join('\n'),
    subject: copy.emailFallbackSubject,
  });

  return `mailto:${email}?${params.toString()}`;
}

function resetTurnstile() {
  if (typeof window !== 'undefined') {
    window.turnstile?.reset();
  }
}

function namedFormControl(form: HTMLFormElement, name: string): FormControlElement | null {
  const element = form.elements.namedItem(name);

  return element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
    ? element
    : null;
}

function focusFirstInvalidControl(control: FormControlElement | null) {
  control?.focus();
}

function firstInvalidControl(form: HTMLFormElement, fields: readonly LeadFormField[]) {
  const formData = new FormData(form);

  for (const field of fields) {
    const control = namedFormControl(form, field.name);
    const value = formValue(formData, field.name);

    if (field.required === true && !value) {
      return control;
    }

    if (field.type === 'email' && value && !control?.checkValidity()) {
      return control;
    }

    if (field.type === 'tel' && value && !isValidGlobalPhoneNumber(value)) {
      return control;
    }
  }

  const messageControl = namedFormControl(form, 'message');
  if (formValue(formData, 'message').length < 2) {
    return messageControl;
  }

  const consentControl = namedFormControl(form, 'consentAccepted');
  if (consentControl instanceof HTMLInputElement && !consentControl.checked) {
    return consentControl;
  }

  return null;
}

function RequiredFieldLabel({
  children,
  required,
  requiredLabel,
}: Readonly<{
  children: string;
  required?: boolean;
  requiredLabel: string;
}>) {
  return (
    <span>
      {children}
      {required ? (
        <>
          <span aria-hidden="true"> *</span>
          <span className="sr-only"> ({requiredLabel})</span>
        </>
      ) : null}
    </span>
  );
}

export function LeadSubmitForm({
  className,
  controlClassName = 'min-h-12 rounded border border-border bg-white px-4 text-base font-normal text-text disabled:cursor-not-allowed disabled:opacity-70',
  defaultInquiryType,
  defaultMessage,
  fieldGridClassName,
  fields,
  inquiryTypeLabel,
  inquiryTypeOptions,
  locale,
  messageLabel,
  messagePlaceholder,
  productKey,
  submitLabel,
  supportEmail = defaultSupportEmail,
  textareaClassName = 'min-h-36 rounded border border-border bg-white px-4 py-3 text-base font-normal text-text disabled:cursor-not-allowed disabled:opacity-70',
  turnstileSiteKey,
}: LeadSubmitFormProps) {
  const copy = getLeadFormCopy(locale);
  const [isHydrated, setIsHydrated] = useState(false);
  const [status, setStatus] = useState<FormStatus>({ kind: 'idle' });
  const isSubmitting = status.kind === 'submitting';
  const isSubmitDisabled = isSubmitting || !isHydrated;

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (status.kind !== 'success') {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setStatus({ kind: 'idle' });
    }, successMessageVisibleMs);

    return () => window.clearTimeout(timeoutId);
  }, [status]);

  function clearSettledStatus() {
    if (status.kind === 'success' || status.kind === 'error') {
      setStatus({ kind: 'idle' });
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const invalidControl = firstInvalidControl(form, fields);
    if (invalidControl) {
      setStatus({ kind: 'error', message: copy.validationError });
      focusFirstInvalidControl(invalidControl);

      return;
    }

    const formData = new FormData(form);
    const inquiryTypeValue = formValue(formData, 'inquiryType');
    const inquiryType: InquiryType =
      inquiryTypeValue === 'franchise' || inquiryTypeValue === 'message'
        ? inquiryTypeValue
        : defaultInquiryType;
    const payload: LeadFormPayload = {
      consentAccepted: true,
      consentAcceptedAt: new Date().toISOString(),
      inquiryType,
      message: formValue(formData, 'message'),
      name: formValue(formData, 'name'),
      sourceLocale: locale,
    };

    const honeypot = formValue(formData, 'website');
    if (honeypot) {
      payload.website = honeypot;
    }

    if (turnstileSiteKey) {
      const turnstileToken = formValue(formData, 'cf-turnstile-response');
      if (!turnstileToken) {
        setStatus({ kind: 'error', message: copy.captchaError });

        return;
      }

      payload.turnstileToken = turnstileToken;
    }

    for (const fieldName of optionalFieldNames) {
      const value = formValue(formData, fieldName);
      if (value) {
        payload[fieldName] = value;
      }
    }

    if (productKey) {
      payload.product = productKey;
      payload.productSlug = productKey;
    }

    if (typeof window !== 'undefined') {
      payload.sourceUrl = window.location.href;
    }

    setStatus({ kind: 'submitting' });

    try {
      const response = await fetch('/api/forms/submit', {
        body: JSON.stringify(payload),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });
      const data = (await response.json().catch(() => null)) as unknown;

      if (
        !response.ok ||
        !data ||
        typeof data !== 'object' ||
        (data as { ok?: unknown }).ok !== true
      ) {
        if (turnstileSiteKey) {
          resetTurnstile();
        }

        setStatus({
          fallbackEmailHref: buildFallbackMailtoHref(supportEmail, copy, payload),
          kind: 'error',
          message: messageForErrorCode(responseErrorCode(data), copy),
        });

        return;
      }

      form.reset();
      setStatus({
        fallbackEmailHref: buildFallbackMailtoHref(supportEmail, copy, payload),
        kind: 'success',
        message: copy.success,
      });
    } catch {
      if (turnstileSiteKey) {
        resetTurnstile();
      }

      setStatus({
        fallbackEmailHref: buildFallbackMailtoHref(supportEmail, copy, payload),
        kind: 'error',
        message: copy.genericError,
      });
    }
  }

  return (
    <form
      acceptCharset="UTF-8"
      action="/api/forms/submit"
      className={className}
      data-hydrated={isHydrated ? 'true' : 'false'}
      method="post"
      noValidate
      onChange={clearSettledStatus}
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      aria-busy={isSubmitting}
    >
      {turnstileSiteKey ? (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="afterInteractive"
        />
      ) : null}

      <input
        aria-hidden="true"
        autoComplete="off"
        className="lead-form-honeypot"
        name="website"
        tabIndex={-1}
        type="text"
      />

      {inquiryTypeOptions && inquiryTypeLabel ? (
        <label className="grid gap-2 text-sm font-bold text-primary">
          {inquiryTypeLabel}
          <select
            className="min-h-12 rounded border border-border bg-white px-4 text-base font-normal text-text disabled:cursor-not-allowed disabled:opacity-70"
            name="inquiryType"
            defaultValue={defaultInquiryType}
            disabled={isSubmitting}
          >
            {inquiryTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <input type="hidden" name="inquiryType" value={defaultInquiryType} />
      )}
      <input type="hidden" name="sourceLocale" value={locale} />
      {productKey ? <input type="hidden" name="product" value={productKey} /> : null}

      <div className={fieldGridClassName}>
        {fields.map((field) => (
          <label key={field.name} className="grid gap-2 text-sm font-bold text-primary">
            <RequiredFieldLabel
              required={field.required === true}
              requiredLabel={copy.requiredLabel}
            >
              {field.label}
            </RequiredFieldLabel>
            <input
              className={controlClassName}
              name={field.name}
              type={field.type}
              placeholder={field.placeholder}
              autoComplete={field.autoComplete}
              required={field.required}
              disabled={isSubmitting}
            />
          </label>
        ))}
      </div>

      <label className="grid gap-2 text-sm font-bold text-primary">
        <RequiredFieldLabel required requiredLabel={copy.requiredLabel}>
          {messageLabel}
        </RequiredFieldLabel>
        <textarea
          className={textareaClassName}
          name="message"
          placeholder={messagePlaceholder}
          defaultValue={defaultMessage}
          required
          disabled={isSubmitting}
        />
      </label>

      <label className="flex items-start gap-3 text-sm leading-6 text-text-light">
        <input
          className="mt-1 h-4 w-4 rounded border-border accent-primary disabled:cursor-not-allowed"
          name="consentAccepted"
          type="checkbox"
          required
          disabled={isSubmitting}
        />
        <span>{copy.consent}</span>
      </label>

      {turnstileSiteKey ? (
        <div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-theme="light" />
      ) : null}

      <div className="grid gap-3 sm:flex sm:items-center">
        <button
          className="btn btn-primary justify-self-start disabled:cursor-not-allowed disabled:opacity-70"
          type="submit"
          disabled={isSubmitDisabled}
        >
          {isSubmitting ? copy.submitting : submitLabel}
        </button>
        {status.kind === 'success' ? (
          <>
            <p className="text-sm font-semibold text-primary" role="status">
              {status.message}
            </p>
            {status.fallbackEmailHref ? (
              <a
                className="text-sm font-semibold text-primary underline underline-offset-4"
                href={status.fallbackEmailHref}
              >
                {copy.emailFallbackLabel}
              </a>
            ) : null}
          </>
        ) : null}
        {status.kind === 'error' ? (
          <div className="grid gap-1 text-sm font-semibold text-red-700" role="alert">
            <p>{status.message}</p>
            {status.fallbackEmailHref ? (
              <a
                className="text-primary underline underline-offset-4"
                href={status.fallbackEmailHref}
              >
                {copy.emailFallbackLabel}
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </form>
  );
}
