'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

import { HeroVideoModal } from '@/components/home/HeroVideoModal';

export type HeroBackgroundVideoCopy = Readonly<{
  watchFull: string;
  mute: string;
  unmute: string;
  modalTitle: string;
  modalClose: string;
}>;

export type HeroBackgroundVideoProps = Readonly<{
  loopSrc: string;
  fullSrc: string;
  posterSrc: string;
  modalPoster: string;
  copy: HeroBackgroundVideoCopy;
}>;

const backgroundVideoStartDelayMs = 1200;

export function HeroBackgroundVideo({
  loopSrc,
  fullSrc,
  posterSrc,
  modalPoster,
  copy,
}: HeroBackgroundVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wasPlayingBeforeModalRef = useRef(false);
  const [muted, setMuted] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);

  const failVideo = useCallback(() => {
    setVideoFailed(true);
  }, []);

  const playVideo = useCallback((video: HTMLVideoElement) => {
    try {
      const playAttempt = video.play();

      if (typeof playAttempt?.then === 'function') {
        void playAttempt.catch(() => undefined);
      }
    } catch {
      // Keep the poster visible if the browser refuses autoplay.
    }
  }, []);

  useEffect(() => {
    if (videoFailed) {
      return undefined;
    }

    let timeoutId: number | undefined;
    const scheduleVideoStart = () => {
      timeoutId = window.setTimeout(() => {
        setShouldLoadVideo(true);
      }, backgroundVideoStartDelayMs);
    };

    if (document.readyState === 'complete') {
      scheduleVideoStart();
    } else {
      window.addEventListener('load', scheduleVideoStart, { once: true });
    }

    return () => {
      window.removeEventListener('load', scheduleVideoStart);
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [videoFailed]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    video.muted = muted;
    if (!videoFailed && !modalOpen) {
      if (video.error) {
        failVideo();
        return;
      }
      playVideo(video);
    }
  }, [failVideo, modalOpen, muted, playVideo, videoFailed]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (modalOpen) {
      wasPlayingBeforeModalRef.current = !videoFailed && !video.paused;
      video.pause();

      return;
    }

    if (wasPlayingBeforeModalRef.current && !videoFailed) {
      wasPlayingBeforeModalRef.current = false;
      playVideo(video);
      return;
    }

    wasPlayingBeforeModalRef.current = false;
  }, [modalOpen, playVideo, videoFailed]);

  const showMuteControl = shouldLoadVideo && !videoFailed;
  const muteLabel = muted ? copy.unmute : copy.mute;

  return (
    <>
      <Image
        className="absolute inset-0 -z-30 h-full w-full object-cover"
        src={posterSrc}
        alt=""
        fill
        priority
        sizes="100vw"
        aria-hidden="true"
      />

      {shouldLoadVideo ? (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video
          ref={videoRef}
          className={[
            'absolute inset-0 -z-20 h-full w-full object-cover',
            videoFailed ? 'hidden' : '',
          ].join(' ')}
          muted
          autoPlay
          loop
          playsInline
          preload="metadata"
          poster={posterSrc}
          aria-hidden="true"
          onError={failVideo}
        >
          <source src={loopSrc} type="video/mp4" />
        </video>
      ) : null}

      <div className="absolute bottom-6 right-6 z-10 flex items-center gap-2 md:bottom-8 md:right-8">
        <button
          className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur-sm transition hover:bg-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          type="button"
          onClick={() => setModalOpen(true)}
          aria-label={copy.watchFull}
          title={copy.watchFull}
        >
          <svg
            className="h-4 w-4 fill-current"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M9 7.5v9l7-4.5-7-4.5Z" />
          </svg>
          <span>{copy.watchFull}</span>
        </button>
        {showMuteControl ? (
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            type="button"
            onClick={() => {
              setMuted((current) => !current);
            }}
            aria-label={muteLabel}
            aria-pressed={!muted}
            title={muteLabel}
          >
            {muted ? (
              <svg
                className="h-4 w-4 fill-none stroke-current stroke-2"
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M5 9.5h3.2L13 6v12l-4.8-3.5H5v-5Z" />
                <path d="m17 9 4 4" />
                <path d="m21 9-4 4" />
              </svg>
            ) : (
              <svg
                className="h-4 w-4 fill-none stroke-current stroke-2"
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M5 9.5h3.2L13 6v12l-4.8-3.5H5v-5Z" />
                <path d="M16 9c.8.8 1.2 1.8 1.2 3s-.4 2.2-1.2 3" />
              </svg>
            )}
          </button>
        ) : null}
      </div>

      <HeroVideoModal
        open={modalOpen}
        src={fullSrc}
        poster={modalPoster}
        title={copy.modalTitle}
        closeLabel={copy.modalClose}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
