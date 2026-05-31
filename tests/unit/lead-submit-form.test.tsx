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

  it('opens the email client on submit, saves the inquiry, and keeps a manual retry link', async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ id: 'submission-1', ok: true }), {
          headers: { 'Content-Type': 'application/json' },
          status: 201,
        }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);

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

    expect(clickSpy).toHaveBeenCalledTimes(1);
    const openedLink = clickSpy.mock.instances[0] as unknown as HTMLAnchorElement;
    expect(openedLink.href).toContain('mailto:hnyf@yourfield.net');
    expect(decodeURIComponent(openedLink.href)).toContain('测试客户');
    expect(decodeURIComponent(openedLink.href)).toContain('想了解消防服产品。');

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
      '后台已收到咨询；邮箱已为您打开，请在邮件客户端确认发送。',
    );
    const retryLink = screen.getByRole<HTMLAnchorElement>('link', {
      name: '未弹出？再次打开邮箱',
    });
    expect(retryLink.href).toContain('mailto:hnyf@yourfield.net');
  });

  it('keeps the success email backup visible until the visitor edits the form again', async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ id: 'submission-1', ok: true }), {
          headers: { 'Content-Type': 'application/json' },
          status: 201,
        }),
      ),
    );

    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

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
    expect(screen.getByRole('status').textContent).toBe(
      '后台已收到咨询；邮箱已为您打开，请在邮件客户端确认发送。',
    );
    expect(screen.getByRole('link', { name: '未弹出？再次打开邮箱' })).toBeTruthy();
    expect(screen.getByRole<HTMLButtonElement>('button', { name: '发送咨询' }).disabled).toBe(
      false,
    );
    expect(screen.getByLabelText<HTMLInputElement>(/姓名/).disabled).toBe(false);

    vi.useFakeTimers();
    await vi.advanceTimersByTimeAsync(8_500);
    vi.useRealTimers();
    expect(screen.getByRole('status').textContent).toBe(
      '后台已收到咨询；邮箱已为您打开，请在邮件客户端确认发送。',
    );
    expect(screen.getByRole('link', { name: '未弹出？再次打开邮箱' })).toBeTruthy();

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
    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toBe(
        '后台已收到咨询；邮箱已为您打开，请在邮件客户端确认发送。',
      ),
    );
  }, 12_000);

  it('offers a mail client fallback when the backend cannot accept a submission', async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ error: { code: 'SERVER_ERROR' }, ok: false }), {
          headers: { 'Content-Type': 'application/json' },
          status: 500,
        }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

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
      target: { value: '想了解招商合作。' },
    });
    fireEvent.click(screen.getByLabelText(/我同意/));
    fireEvent.click(screen.getByRole('button', { name: '发送咨询' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect((await screen.findByRole('alert')).textContent).toContain(
      '邮箱已尝试打开，但后台暂时未保存成功；请确认邮件客户端内容后发送，或稍后再试。',
    );

    const fallbackLink = screen.getByRole<HTMLAnchorElement>('link', {
      name: '未弹出？再次打开邮箱',
    });
    expect(fallbackLink.href).toContain('mailto:hnyf@yourfield.net');
    expect(decodeURIComponent(fallbackLink.href)).toContain('测试客户');
    expect(decodeURIComponent(fallbackLink.href)).toContain('想了解招商合作。');
  });

  it('shows a friendly validation message for incomplete or invalid input', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

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
