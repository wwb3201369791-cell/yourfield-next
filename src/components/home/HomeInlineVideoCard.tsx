'use client';

import { useRef, useState } from 'react';

export type HomeInlineVideoCardProps = Readonly<{
  label: string;
  poster: string;
  src: string;
}>;

export function HomeInlineVideoCard({ label, poster, src }: HomeInlineVideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [controlsVisible, setControlsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const playVideo = () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    setControlsVisible(true);
    video.play().catch(() => {
      setIsPlaying(false);
      setControlsVisible(true);
    });
  };

  return (
    <div
      className={[
        'about-image home-about-media about-video-card',
        isPlaying ? 'is-playing' : '',
      ].join(' ')}
    >
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        className="about-video"
        muted
        playsInline
        preload="none"
        poster={poster}
        controls={controlsVisible}
        controlsList="nodownload"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      >
        <source src={src} type="video/mp4" />
      </video>
      <button
        className="about-video-trigger"
        type="button"
        aria-label={label}
        title={label}
        onClick={playVideo}
      >
        <span aria-hidden="true" />
      </button>
    </div>
  );
}
