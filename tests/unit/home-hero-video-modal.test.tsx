// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { HeroVideoModal } from '@/components/home/HeroVideoModal';

function ModalHarness() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open video
      </button>
      <button type="button">Outside target</button>
      <HeroVideoModal
        open={open}
        src="/video/home/hero-campus-background-original.mp4"
        poster="/images/home/hero-campus-video-poster.jpg"
        title="Watch full video"
        closeLabel="Close"
        onClose={() => setOpen(false)}
      />
    </>
  );
}

describe('HeroVideoModal', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('closes with Escape and restores focus to the opener', () => {
    render(<ModalHarness />);

    const opener = screen.getByRole('button', { name: 'Open video' });
    opener.focus();
    fireEvent.click(opener);

    expect(screen.getByRole('dialog', { name: 'Watch full video' })).not.toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close' }));

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it('keeps keyboard focus inside the dialog while open', () => {
    render(<ModalHarness />);

    const opener = screen.getByRole('button', { name: 'Open video' });
    fireEvent.click(opener);

    const closeButton = screen.getByRole('button', { name: 'Close' });
    const video = document.querySelector('video');

    expect(video).not.toBeNull();
    expect(document.activeElement).toBe(closeButton);

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(video);

    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(closeButton);
  });
});
