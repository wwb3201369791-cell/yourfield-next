'use client';

import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

import { CloseIcon } from '@/components/ui/icons';

export type HeroVideoModalProps = Readonly<{
  open: boolean;
  src: string;
  poster: string;
  title: string;
  closeLabel: string;
  onClose: () => void;
}>;

export function HeroVideoModal({
  open,
  src,
  poster,
  title,
  closeLabel,
  onClose,
}: HeroVideoModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus({ preventScroll: true });

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const dialog = dialogRef.current;
      if (!dialog) {
        return;
      }

      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), video[controls], [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.getAttribute('aria-hidden') !== 'true');
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) {
        event.preventDefault();
        closeButtonRef.current?.focus({ preventScroll: true });
        return;
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus({ preventScroll: true });
        return;
      }

      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus({ preventScroll: true });
      }
    };

    document.addEventListener('keydown', handleKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus({ preventScroll: true });
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      ref={dialogRef}
      className="fixed inset-0 z-[1800] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/85"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
      />
      <div className="relative w-full max-w-5xl">
        <h2 id={titleId} className="sr-only">
          {title}
        </h2>
        <button
          ref={closeButtonRef}
          className="absolute -top-12 right-0 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white outline-offset-2 transition hover:bg-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          type="button"
          aria-label={closeLabel}
          title={closeLabel}
          onClick={onClose}
        >
          <CloseIcon className="h-5 w-5 fill-none stroke-current stroke-2" />
        </button>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          className="aspect-video w-full rounded bg-black shadow-2xl"
          controls
          autoPlay
          playsInline
          preload="auto"
          poster={poster}
          aria-label={title}
          tabIndex={0}
          controlsList="nodownload"
        >
          <source src={src} type="video/mp4" />
        </video>
      </div>
    </div>,
    document.body,
  );
}
