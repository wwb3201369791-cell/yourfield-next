// @vitest-environment jsdom

import { cleanup, render } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { UmamiScript } from '@/components/analytics/UmamiScript';

vi.mock('next/script', () => ({
  default: (props: ComponentProps<'script'>) => <script {...props} />,
}));

describe('UmamiScript', () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it('does not render analytics while the site uses the lightweight cookie notice flow', () => {
    render(<UmamiScript enabled scriptUrl="/umami.js" websiteId="site-id" />);

    expect(document.querySelector('#yourfield-umami')).toBeNull();
  });

  it('does not render without the required analytics configuration', () => {
    render(<UmamiScript enabled scriptUrl={undefined} websiteId="site-id" />);

    expect(document.querySelector('#yourfield-umami')).toBeNull();
  });
});
