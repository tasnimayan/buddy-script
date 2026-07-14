"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { displayName } from "@/lib/posts/format";
import { useLikers } from "@/lib/posts/use-likers";

import { UserAvatar } from "./user-avatar";

interface LikersModalProps {
  open: boolean;
  onClose: () => void;
  target: { kind: "post" | "comment"; id: string };
  title?: string;
}

export function LikersModal({
  open,
  onClose,
  target,
  title = "Likes",
}: LikersModalProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const {
    data: likers = [],
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useLikers(target, open);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const onBodyScroll = () => {
    const el = bodyRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;
    const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (remaining < 80) {
      void fetchNextPage();
    }
  };

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1055,
        background: "transparent",
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          margin: "0 auto",
          maxWidth: 480,
          width: "100%",
          height: "min(70vh, 520px)",
          background: "#fff",
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          boxShadow: "0 -8px 32px rgba(0, 0, 0, 0.12)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid #edeff1",
            flexShrink: 0,
          }}
        >
          <h5 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{title}</h5>
          <button
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={onClose}
          />
        </div>
        <div
          ref={bodyRef}
          onScroll={onBodyScroll}
          style={{
            padding: "16px 20px",
            overflowY: "auto",
            flex: 1,
            background: "#fff",
          }}
        >
          {isLoading && <p>Loading…</p>}
          {isError && <p>Couldn&apos;t load likers. Try again.</p>}
          {!isLoading && !isError && likers.length === 0 && (
            <p>No likes yet.</p>
          )}
          <ul className="list-unstyled mb-0">
            {likers.map((liker) => (
              <li
                key={`${liker.user.id}-${liker.likedAt}`}
                className="d-flex align-items-center gap-3 mb-3"
              >
                <UserAvatar
                  src={liker.user.avatarUrl}
                  size={40}
                  className="_comment_img1"
                />
                <span>{displayName(liker.user)}</span>
              </li>
            ))}
          </ul>
          {isFetchingNextPage && (
            <p className="text-muted mb-0 mt-2">Loading more…</p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
