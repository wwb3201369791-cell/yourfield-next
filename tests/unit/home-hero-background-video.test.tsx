// @vitest-environment jsdom
/* eslint-disable @next/next/no-img-element */

import { act, cleanup, render } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  HeroBackgroundVideo,
  type HeroBackgroundVideoCopy,
} from '@/components/home/HeroBackgroundVideo';

vi.mock('next/image', () => ({
  default: ({
    alt,
    fill: _fill,
    priority: _priority,
    src,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean;
    priority?: boolean;
  }) => <img alt={alt ?? ''} src={typeof src === 'string' ? src : ''} {...props} />,
}));

const copy: HeroBackgroundVideoCopy = {
  watchFull: 'Watch full video',
  mute: 'Mute video',
  unmute: 'Unmute video',
  modalTitle: 'Watch full video',
  modalClose: 'Close',
};

function renderHeroBackgroundVideo() {
  return render(
    <HeroBackgroundVideo
      loopSrc="/video/home/hero-campus-background-loop.mp4"
      fullSrc="/video/home/hero-campus-background-original.mp4"
      posterSrc="/images/home/franchise-campus-hero-clean-hd.jpg"
      modalPoster="/images/home/hero-campus-video-poster.jpg"
      copy={copy}
    />,
  );
}

describe('HeroBackgroundVideo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function settlePageAndStartVideo() {
    act(() => {
      window.dispatchEvent(new Event('load'));
      vi.advanceTimersByTime(1200);
    });
  }

  it('keeps the loop video off the critical page load path', () => {
    const { container } = renderHeroBackgroundVideo();

    expect(container.querySelector('video')).toBeNull();

    settlePageAndStartVideo();

    const video = container.querySelector('video');
    const source = container.querySelector('video source');

    expect(video).not.toBeNull();
    expect(video?.getAttribute('preload')).toBe('metadata');
    expect(video?.autoplay).toBe(true);
    expect(video?.loop).toBe(true);
    expect(video?.getAttribute('poster')).toBe('/images/home/franchise-campus-hero-clean-hd.jpg');
    expect(source?.getAttribute('src')).toBe('/video/home/hero-campus-background-loop.mp4');
  });

  it('keeps the video visible without waiting for a playback event', () => {
    const { container } = renderHeroBackgroundVideo();

    settlePageAndStartVideo();

    const video = container.querySelector('video');

    expect(video).not.toBeNull();
    expect(video?.className).not.toContain('opacity-0');
  });
});
