'use client';

import { useEffect } from 'react';

type AdminLoginEnhancerProps = Readonly<{
  accountEmail?: string;
  usernameAlias?: string;
}>;

function setNativeInputValue(input: HTMLInputElement, value: string) {
  const valueDescriptor = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value',
  );

  if (valueDescriptor?.set) {
    valueDescriptor.set.call(input, value);
  } else {
    input.value = value;
  }

  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

export function AdminLoginEnhancer({ accountEmail, usernameAlias }: AdminLoginEnhancerProps) {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.template-minimal.login');
    const card = document.querySelector<HTMLElement>(
      '.template-minimal.login .template-minimal__wrap',
    );
    const form = document.querySelector<HTMLFormElement>(
      '.template-minimal.login form.login__form',
    );
    const accountInput = document.querySelector<HTMLInputElement>(
      '.template-minimal.login input[name="email"]',
    );
    const passwordInput = document.querySelector<HTMLInputElement>(
      '.template-minimal.login input[name="password"]',
    );
    const passwordField = passwordInput?.closest<HTMLElement>('.field-type.password');
    const submitButton = form?.querySelector<HTMLButtonElement>('button[type="submit"]');
    const normalizedUsername = usernameAlias?.trim().toLowerCase();
    const normalizedAccountEmail = accountEmail?.trim().toLowerCase();

    root?.classList.add('yourfield-login-enhanced');

    if (accountInput) {
      accountInput.type = 'text';
      accountInput.autocomplete = 'username';
      accountInput.inputMode = 'text';
      accountInput.placeholder = '请输入登录账号';
      accountInput.spellcheck = false;
    }

    if (passwordInput) {
      passwordInput.placeholder = '请输入密码';
    }

    function normalizeAccountForSubmit() {
      if (!accountInput || !normalizedUsername || !normalizedAccountEmail) {
        return false;
      }

      if (accountInput.value.trim().toLowerCase() !== normalizedUsername) {
        return false;
      }

      setNativeInputValue(accountInput, normalizedAccountEmail);
      return true;
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (!card) {
        return;
      }

      const rect = card.getBoundingClientRect();
      card.style.setProperty('--pointer-x', `${event.clientX - rect.left}px`);
      card.style.setProperty('--pointer-y', `${event.clientY - rect.top}px`);
    };

    const handlePointerLeave = () => {
      card?.style.removeProperty('--pointer-x');
      card?.style.removeProperty('--pointer-y');
    };

    card?.addEventListener('pointermove', handlePointerMove);
    card?.addEventListener('pointerleave', handlePointerLeave);
    submitButton?.addEventListener('click', normalizeAccountForSubmit, true);

    let isResubmitting = false;
    const handleSubmitCapture = (event: SubmitEvent) => {
      if (!form || isResubmitting || !normalizeAccountForSubmit()) {
        isResubmitting = false;
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      isResubmitting = true;

      window.setTimeout(() => {
        if (submitButton) {
          form.requestSubmit(submitButton);
        } else {
          form.requestSubmit();
        }
      }, 0);
    };

    form?.addEventListener('submit', handleSubmitCapture, true);

    let toggleButton: HTMLButtonElement | undefined;

    if (
      passwordInput &&
      passwordField &&
      !passwordField.querySelector('.yourfield-password-toggle')
    ) {
      passwordField.classList.add('yourfield-password-field');
      const button = document.createElement('button');
      toggleButton = button;
      button.className = 'yourfield-password-toggle';
      button.type = 'button';
      button.textContent = '显示';
      button.setAttribute('aria-label', '显示密码');

      button.addEventListener('click', () => {
        const isVisible = passwordInput.type === 'text';
        passwordInput.type = isVisible ? 'password' : 'text';
        button.textContent = isVisible ? '显示' : '隐藏';
        button.setAttribute('aria-label', isVisible ? '显示密码' : '隐藏密码');
        passwordInput.focus();
      });

      passwordField.append(button);
    }

    return () => {
      root?.classList.remove('yourfield-login-enhanced');
      card?.removeEventListener('pointermove', handlePointerMove);
      card?.removeEventListener('pointerleave', handlePointerLeave);
      submitButton?.removeEventListener('click', normalizeAccountForSubmit, true);
      form?.removeEventListener('submit', handleSubmitCapture, true);
      toggleButton?.remove();
      passwordField?.classList.remove('yourfield-password-field');
    };
  }, [accountEmail, usernameAlias]);

  return null;
}
