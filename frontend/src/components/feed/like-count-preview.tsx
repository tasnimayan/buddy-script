"use client";

import Image from "next/image";

const REACTION_PREVIEWS = [
  { src: "/images/react_img1.png", className: "_react_img1" },
  { src: "/images/react_img2.png", className: "_react_img" },
  { src: "/images/react_img3.png", className: "_react_img _rect_img_mbl_none" },
  { src: "/images/react_img4.png", className: "_react_img _rect_img_mbl_none" },
  { src: "/images/react_img5.png", className: "_react_img _rect_img_mbl_none" },
] as const;

interface LikeCountPreviewProps {
  likeCount: number;
  onOpenLikers: () => void;
}

/** Restores the stacked reaction preview + count badge from the original feed UI. */
export function LikeCountPreview({
  likeCount,
  onOpenLikers,
}: LikeCountPreviewProps) {
  if (likeCount <= 0) return null;

  const iconCount = Math.min(likeCount, REACTION_PREVIEWS.length);
  const countLabel = likeCount > 9 ? "9+" : String(likeCount);

  return (
    <div
      className="_feed_inner_timeline_total_reacts_image"
      role="button"
      tabIndex={0}
      onClick={onOpenLikers}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpenLikers();
        }
      }}
      aria-label={`${likeCount} likes`}
    >
      {REACTION_PREVIEWS.slice(0, iconCount).map((item) => (
        <Image
          key={item.src}
          width={32}
          height={32}
          src={item.src}
          alt=""
          className={item.className}
          style={{
            width: 32,
            height: 32,
            objectFit: "cover",
            borderRadius: "50%",
          }}
        />
      ))}
      <p className="_feed_inner_timeline_total_reacts_para">{countLabel}</p>
    </div>
  );
}
