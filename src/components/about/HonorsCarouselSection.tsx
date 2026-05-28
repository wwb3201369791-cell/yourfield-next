'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Carousel } from '@/components/ui/Carousel';

type HonorImageItem = Readonly<{
  id: string;
  src: string;
  title: string;
}>;

type HonorTextItem = Readonly<{
  id: string;
  text: string;
  title: string;
}>;

export type HonorCarouselGroup = Readonly<{
  id: string;
  items: readonly (HonorImageItem | HonorTextItem)[];
  label: string;
}>;

type HonorsCarouselSectionProps = Readonly<{
  ariaLabel: string;
  closeLabel: string;
  groups: readonly HonorCarouselGroup[];
  previewLabelTemplate: string;
}>;

function isImageItem(item: HonorImageItem | HonorTextItem): item is HonorImageItem {
  return 'src' in item;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function HonorsCarouselSection({
  ariaLabel,
  closeLabel,
  groups,
  previewLabelTemplate,
}: HonorsCarouselSectionProps) {
  const [activeGroupId, setActiveGroupId] = useState(groups[0]?.id ?? '');
  const [preview, setPreview] = useState<HonorImageItem | null>(null);
  const activeGroup = useMemo(
    () => groups.find((group) => group.id === activeGroupId) ?? groups[0],
    [activeGroupId, groups],
  );
  const closePreview = useCallback(() => setPreview(null), []);

  useEffect(() => {
    if (!preview) {
      return undefined;
    }

    document.body.classList.add('honors-lightbox-open');

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closePreview();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.classList.remove('honors-lightbox-open');
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closePreview, preview]);

  if (!activeGroup) {
    return null;
  }

  const previewLabel = (title: string) => previewLabelTemplate.replace('__TITLE__', title);

  return (
    <div className="honors-gallery">
      <div className="honors-tabs" role="tablist" aria-label={ariaLabel}>
        {groups.map((group) => {
          const isActive = group.id === activeGroup.id;

          return (
            <button
              key={group.id}
              className={cx('honors-tab', isActive && 'is-active')}
              id={`honors-tab-${group.id}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`honors-panel-${group.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveGroupId(group.id)}
            >
              <span>{group.label}</span>
              <strong>{group.items.length}</strong>
            </button>
          );
        })}
      </div>

      <div
        className="honors-panel is-active"
        id={`honors-panel-${activeGroup.id}`}
        role="tabpanel"
        aria-labelledby={`honors-tab-${activeGroup.id}`}
      >
        <div className="honors-marquee">
          <Carousel
            key={activeGroup.id}
            ariaLabel={activeGroup.label}
            autoScroll={{
              speed: 0.32,
              startDelay: 500,
              stopOnInteraction: false,
              stopOnMouseEnter: true,
            }}
            className="honors-carousel"
            containerClassName="honors-track"
            options={{
              align: 'start',
              containScroll: false,
              dragFree: true,
              duration: 18,
              loop: activeGroup.items.length > 4,
              skipSnaps: true,
            }}
            slideClassName="honors-carousel-slide"
            viewportClassName="honors-viewport"
          >
            {activeGroup.items.map((item, index) =>
              isImageItem(item) ? (
                <button
                  key={item.id}
                  className="honor-image-card"
                  type="button"
                  aria-label={previewLabel(item.title)}
                  title={previewLabel(item.title)}
                  onClick={() => setPreview(item)}
                >
                  <span className="honor-image-card__media">
                    <Image
                      src={item.src}
                      alt={item.title}
                      fill
                      sizes="(min-width: 1280px) 196px, (min-width: 768px) 176px, 46vw"
                    />
                    <span className="honor-image-card__zoom" aria-hidden="true" />
                  </span>
                  <span className="honor-image-card__caption">{item.title}</span>
                </button>
              ) : (
                <article key={item.id} className="honor-text-carousel-card">
                  <span className="honor-text-carousel-card__index">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                </article>
              ),
            )}
          </Carousel>
        </div>
      </div>

      {preview ? (
        <div
          className="honors-lightbox"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closePreview();
            }
          }}
        >
          <div
            className="honors-lightbox__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="honors-lightbox-title"
          >
            <button
              className="honors-lightbox__close"
              type="button"
              aria-label={closeLabel}
              onClick={closePreview}
            />
            <figure className="honors-lightbox__figure">
              <span className="honors-lightbox__media">
                <Image
                  src={preview.src}
                  alt={preview.title}
                  width={720}
                  height={900}
                  sizes="min(860px, 92vw)"
                />
              </span>
              <figcaption className="honors-lightbox__caption" id="honors-lightbox-title">
                {preview.title}
              </figcaption>
            </figure>
          </div>
        </div>
      ) : null}
    </div>
  );
}
