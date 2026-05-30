// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LeadSubmitForm } from '@/components/forms/LeadSubmitForm';

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
      messageLabel="咨询问题"
      messagePlaceholder="请写下您想咨询的问题"
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
  vi.useRealTimers();
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
    expect(screen.getByLabelText(/咨询问题/)).toHaveProperty('required', true);
  });

  it('saves the inquiry and shows inline success without opening an email draft', async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ id: 'submission-1', ok: true }), {
          headers: { 'Content-Type': 'application/json' },
          status: 201,
        }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click');

    renderLeadForm();
    await waitForHydratedSubmit();

    fireEvent.change(screen.getByLabelText(/姓名/), { target: { value: '测试客户' } });
    fireEvent.change(screen.getByLabelText(/邮箱/), {
      target: { value: 'lead@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/联系电话/), {
      target: { value: '+44 20 7946 0958' },
    });
    fireEvent.change(screen.getByLabelText(/咨询问题/), {
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
      mobile: '+44 20 7946 0958',
      name: '测试客户',
    });
    expect((await screen.findByRole('status')).textContent).toBe(
      '已收到您的咨询，我们会尽快与您联系。',
    );
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('does not leave the form stuck after a successful submission', async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ id: 'submission-1', ok: true }), {
          headers: { 'Content-Type': 'application/json' },
          status: 201,
        }),
      ),
    );

    vi.stubGlobal('fetch', fetchMock);

    renderLeadForm();
    await waitForHydratedSubmit();

    fireEvent.change(screen.getByLabelText(/姓名/), { target: { value: '测试客户' } });
    fireEvent.change(screen.getByLabelText(/邮箱/), {
      target: { value: 'lead@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/联系电话/), {
      target: { value: '+44 20 7946 0958' },
    });
    fireEvent.change(screen.getByLabelText(/咨询问题/), {
      target: { value: '想了解消防服产品。' },
    });
    fireEvent.click(screen.getByLabelText(/我同意/));
    fireEvent.click(screen.getByRole('button', { name: '发送咨询' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('status').textContent).toBe('已收到您的咨询，我们会尽快与您联系。');
    expect(screen.getByRole<HTMLButtonElement>('button', { name: '发送咨询' }).disabled).toBe(
      false,
    );
    expect(screen.getByLabelText<HTMLInputElement>(/姓名/).disabled).toBe(false);

    fireEvent.change(screen.getByLabelText(/姓名/), { target: { value: '第二位客户' } });
    expect(screen.queryByRole('status')).toBeNull();

    fireEvent.change(screen.getByLabelText(/邮箱/), {
      target: { value: 'lead@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/联系电话/), {
      target: { value: '+44 20 7946 0958' },
    });
    fireEvent.change(screen.getByLabelText(/咨询问题/), {
      target: { value: '再次咨询。' },
    });
    fireEvent.click(screen.getByLabelText(/我同意/));
    fireEvent.click(screen.getByRole('button', { name: '发送咨询' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(screen.getByRole('status').textContent).toBe('已收到您的咨询，我们会尽快与您联系。');
  });

  it('shows a friendly validation message for incomplete or invalid input', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    renderLeadForm();
    await waitForHydratedSubmit();

    fireEvent.change(screen.getByLabelText(/姓名/), { target: { value: '测试客户' } });
    fireEvent.change(screen.getByLabelText(/邮箱/), {
      target: { value: 'lead@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/联系电话/), {
      target: { value: '12345' },
    });
    fireEvent.change(screen.getByLabelText(/咨询问题/), {
      target: { value: '想了解合作。' },
    });
    fireEvent.click(screen.getByLabelText(/我同意/));
    fireEvent.click(screen.getByRole('button', { name: '发送咨询' }));

    expect((await screen.findByRole('alert')).textContent).toBe(
      '信息不完整或格式不规范，请补充后重新提交。',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
