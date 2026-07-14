"use client";

import Image from "next/image";

interface PostMediaGalleryProps {
  urls: string[];
}

const GAP = 4;

function GalleryImage({
  url,
  priority = false,
}: {
  url: string;
  priority?: boolean;
}) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <Image
        src={url}
        alt=""
        fill
        sizes="(max-width: 768px) 100vw, 600px"
        className="_time_img"
        style={{ objectFit: "cover", borderRadius: 6 }}
        loading={priority ? "eager" : "lazy"}
      />
    </div>
  );
}

/**
 * Renders post attachments (1–4) in a count-aware grid:
 * 1 → full-bleed, 2 → side-by-side, 3 → large + two stacked, 4 → 2×2.
 */
export function PostMediaGallery({ urls }: PostMediaGalleryProps) {
  const images = urls.filter(Boolean).slice(0, 4);
  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div
        className="_feed_inner_timeline_image"
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16 / 9",
          overflow: "hidden",
        }}
      >
        <GalleryImage url={images[0]!} priority />
      </div>
    );
  }

  if (images.length === 2) {
    return (
      <div
        className="_feed_inner_timeline_image"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: GAP,
          width: "100%",
          aspectRatio: "16 / 9",
          overflow: "hidden",
        }}
      >
        {images.map((url) => (
          <GalleryImage key={url} url={url} />
        ))}
      </div>
    );
  }

  if (images.length === 3) {
    return (
      <div
        className="_feed_inner_timeline_image"
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gridTemplateRows: "1fr 1fr",
          gap: GAP,
          width: "100%",
          aspectRatio: "16 / 10",
          overflow: "hidden",
        }}
      >
        <div style={{ gridRow: "1 / -1", minHeight: 0 }}>
          <GalleryImage url={images[0]!} priority />
        </div>
        <GalleryImage url={images[1]!} />
        <GalleryImage url={images[2]!} />
      </div>
    );
  }

  return (
    <div
      className="_feed_inner_timeline_image"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "1fr 1fr",
        gap: GAP,
        width: "100%",
        aspectRatio: "1 / 1",
        overflow: "hidden",
      }}
    >
      {images.map((url, index) => (
        <GalleryImage key={url} url={url} priority={index === 0} />
      ))}
    </div>
  );
}
