import type { PayloadRequest } from 'payload/types';

import { env } from '../env';

type NotificationResult = {
  status: 'sent' | 'skipped' | 'failed';
  reason?: string;
};

type PayloadDocument = Record<string, unknown>;
type EmailRow = [label: string, value: unknown];

type SendNotificationArgs = {
  req: PayloadRequest;
  submission: PayloadDocument;
};

const textValue = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const messageLine = (label: string, value: unknown) => {
  const text = textValue(value);
  return text ? `${label}: ${text}` : undefined;
};

const inquiryTypeLabel = (value: unknown) => {
  const text = textValue(value);

  if (text === 'franchise') {
    return '招商咨询';
  }

  if (text === 'message') {
    return '留言咨询';
  }

  return text;
};

const buildTextBody = (submission: PayloadDocument) =>
  [
    '收到新的官网咨询表单提交。',
    '',
    messageLine('类型', inquiryTypeLabel(submission.inquiryType)),
    messageLine('姓名', submission.name),
    messageLine('公司', submission.company),
    messageLine('职位', submission.position),
    messageLine('电话', submission.phone),
    messageLine('邮箱', submission.email),
    messageLine('国家/地区', submission.country),
    messageLine('来源页面', submission.sourceUrl),
    messageLine('来源语言', submission.sourceLocale),
    '',
    '留言:',
    textValue(submission.message) || '(空)',
  ]
    .filter((line): line is string => typeof line === 'string')
    .join('\n');

const buildHtmlBody = (submission: PayloadDocument) => {
  const rows: EmailRow[] = [
    ['类型', inquiryTypeLabel(submission.inquiryType)],
    ['姓名', submission.name],
    ['公司', submission.company],
    ['职位', submission.position],
    ['电话', submission.phone],
    ['邮箱', submission.email],
    ['国家/地区', submission.country],
    ['来源页面', submission.sourceUrl],
    ['来源语言', submission.sourceLocale],
  ];
  const tableRows = rows
    .map(([label, value]) => [label, textValue(value)] as const)
    .filter((row): row is readonly [string, string] => Boolean(row[1]))
    .map(
      ([label, value]) =>
        `<tr><th align="left">${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`,
    )
    .join('');
  const message = escapeHtml(textValue(submission.message) || '(空)').replace(/\n/g, '<br>');

  return `<p>收到新的官网咨询表单提交。</p><table cellpadding="6" cellspacing="0" border="1"><tbody>${tableRows}</tbody></table><p><strong>留言:</strong></p><p>${message}</p>`;
};

const getSubmissionId = (submission: PayloadDocument) => {
  const { id } = submission;
  if (typeof id === 'string' || typeof id === 'number') {
    return String(id);
  }

  return undefined;
};

export const sendNotification = async ({
  req,
  submission,
}: SendNotificationArgs): Promise<NotificationResult> => {
  if (!env.SMTP_HOST || !env.SMTP_FROM || !env.CONTACT_NOTIFY_TO) {
    return { status: 'skipped', reason: 'smtp-not-configured' };
  }

  const submissionId = getSubmissionId(submission);
  const subjectSuffix = submissionId ? ` #${submissionId}` : '';

  try {
    await req.payload.sendEmail({
      from: env.SMTP_FROM,
      to: env.CONTACT_NOTIFY_TO,
      replyTo: textValue(submission.email) || env.SUPPORT_REPLY_TO,
      subject: `官网咨询表单提交通知${subjectSuffix}`,
      text: buildTextBody(submission),
      html: buildHtmlBody(submission),
    });

    return { status: 'sent' };
  } catch (error) {
    console.warn('[form-notification] failed to send notification', {
      submissionId,
      error: error instanceof Error ? error.message : 'Unknown email error',
    });

    return { status: 'failed', reason: 'send-error' };
  }
};
