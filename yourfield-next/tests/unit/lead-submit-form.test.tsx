// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LeadSubmitForm, type LeadMailtoCopy } from '@/components/forms/LeadSubmitForm';

const mailtoCopy: LeadMailtoCopy = {
  companyLabel: '公司',
  countryLabel: '国家 / 地区',
  emailLabel: '邮箱',
  inquiryTypeLabel: '咨询类型',
  inquiryTypeValue: '留言咨询',
  messageLabel: '需求 / 反馈',
  mobileLabel: '联系电话',
  nameLabel: '姓名',
  recipient: 'hnyf@yourfield.net',
  subject: '永霏官网询盘',
};

function leadFormElement() {
  return (
    <LeadSubmitForm
      className="contact-form"
      defaultInquiryType="message"
      fieldGridClassName="contact-form-row"
      fields={[
        {
          label: '姓名',
          name: 'name',
          placeholder: '姓名',
          required: true,
          type: 'text',
        },
        {
          label: '邮箱',
          name: 'email',
          placeholder: '邮箱',
          required: true,
          type: 'email',
        },
        {
          label: '联系电话',
          name: 'mobile',
          placeholder: '联系电话',
          required: true,
          type: 'tel',
        },
      ]}
      locale="zh"
      mailtoCopy={mailtoCopy}
      messageLabel="需求 / 反馈"
      messagePlaceholder="请写下您的需求/反馈"
      submitLabel="发送咨询"
    />
  );
}

function renderLeadForm() {
  return render(leadFormElement());
}

async function waitForHydratedSubmit() {
  await waitFor(() => {
    expect(screen.getByRole<HTMLButtonElement>('button', { name: '发送咨询' }).disabled).toBe(
      false,
    );
  });
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('LeadSubmitForm', () => {
  it('renders a safe POST fallback and disables native submit before hydration', () => {
    const html = renderToStaticMarkup(leadFormElement());

    expect(html).toContain('action="/api/forms/submit"');
    expect(html).toContain('method="post"');
    expect(html).toContain('data-hydrated="false"');
    expect(html).toContain('name="sourceLocale"');
    expect(html).toMatch(/<button[^>]+type="submit"[^>]+disabled=""/);
  });

  it('marks email and contact phone as required fields', async () => {
    renderLeadForm();
    await waitForHydratedSubmit();

    expect(screen.getByLabelText(/姓名/)).toHaveProperty('required', true);
    expect(screen.getByLabelText(/邮箱/)).toHaveProperty('required', true);
    expect(screen.getByLabelText(/联系电话/)).toHaveProperty('required', true);
    expect(screen.getByLabelText(/需求 \/ 反馈/)).toHaveProperty('required', true);
  });

  it('saves the inquiry first and then opens an email draft for the user to send', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 'submission-1', ok: true }), {
        headers: { 'Content-Type': 'application/json' },
        status: 201,
      }),
    );
    let clickedHref = '';
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function click(
      this: HTMLAnchorElement,
    ) {
      clickedHref = this.href;
    });

    renderLeadForm();
    await waitForHydratedSubmit();

    fireEvent.change(screen.getByLabelText(/姓名/), { target: { value: '测试客户' } });
    fireEvent.change(screen.getByLabelText(/邮箱/), {
      target: { value: 'lead@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/联系电话/), {
      target: { value: '+86 13800000000' },
    });
    fireEvent.change(screen.getByLabelText(/需求 \/ 反馈/), {
      target: { value: '想了解消防服产品。' },
    });
    fireEvent.click(screen.getByLabelText(/我同意/));
    fireEvent.click(screen.getByRole('button', { name: '发送咨询' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    if (typeof requestInit.body !== 'string') {
      throw new Error('Expected form request body to be a JSON string.');
    }

    expect(JSON.parse(requestInit.body)).toMatchObject({
      email: 'lead@example.com',
      inquiryType: 'message',
      message: '想了解消防服产品。',
      mobile: '+86 13800000000',
      name: '测试客户',
    });
    expect(
      await screen.findByText('已保存到后台，并已为您打开邮件草稿；请在邮箱中确认发送。'),
    ).not.toBeNull();
    expect(decodeURIComponent(clickedHref)).toContain('mailto:hnyf@yourfield.net');
    expect(decodeURIComponent(clickedHref)).toContain('咨询类型: 留言咨询');
    expect(decodeURIComponent(clickedHref)).toContain('邮箱: lead@example.com');
    expect(decodeURIComponent(clickedHref)).toContain('联系电话: +86 13800000000');
    expect(decodeURIComponent(clickedHref)).toContain('想了解消防服产品。');
  });
});
