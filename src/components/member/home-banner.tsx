"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export type BannerSlide = {
  id: string;
  src: string;
  alt: string;
};

type Props = {
  slides: BannerSlide[];
  /** Auto-advance interval in seconds. */
  intervalSec?: number;
  className?: string;
};

function nearIndex(i: number, index: number, len: number) {
  if (len <= 3) return true;
  if (i === index) return true;
  if (i === (index + 1) % len) return true;
  if (i === (index - 1 + len) % len) return true;
  return false;
}

export function HomeBanner({
  slides,
  intervalSec = 5,
  className,
}: Props) {
  const items = slides.length > 0 ? slides : [];
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const [dragPx, setDragPx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const ms = Math.max(2, Math.min(60, intervalSec)) * 1000;

  const wrapRef = useRef<HTMLDivElement>(null);
  const active = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const axis = useRef<"h" | "v" | null>(null);
  const dragPxRef = useRef(0);

  useEffect(() => {
    if (items.length <= 1 || dragging) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, ms);
    return () => window.clearInterval(id);
  }, [items.length, ms, dragging, index]);

  if (items.length === 0) return null;

  const current = items[index] ?? items[0];

  function go(delta: number) {
    setIndex((i) => (i + delta + items.length) % items.length);
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (items.length <= 1 || e.button !== 0) return;
    active.current = true;
    startX.current = e.clientX;
    startY.current = e.clientY;
    axis.current = null;
    dragPxRef.current = 0;
    setDragPx(0);
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!active.current) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;

    if (axis.current === null) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      axis.current = Math.abs(dx) >= Math.abs(dy) ? "h" : "v";
      if (axis.current === "v") {
        active.current = false;
        dragPxRef.current = 0;
        setDragPx(0);
        setDragging(false);
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          /* already released */
        }
        return;
      }
    }

    if (axis.current !== "h") return;
    dragPxRef.current = dx;
    setDragPx(dx);
  }

  function endDrag() {
    if (!active.current) return;
    const dx = dragPxRef.current;
    const w = wrapRef.current?.offsetWidth ?? 1;
    const threshold = Math.min(56, w * 0.18);
    if (axis.current === "h") {
      if (dx <= -threshold) go(1);
      else if (dx >= threshold) go(-1);
    }
    active.current = false;
    axis.current = null;
    dragPxRef.current = 0;
    setDragPx(0);
    setDragging(false);
  }

  const sliding = dragging;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/80 bg-muted",
        className,
      )}
    >
      <div
        ref={wrapRef}
        className="relative aspect-[2.2/1] w-full touch-none overflow-hidden select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div
          className={cn(
            "flex h-full will-change-transform",
            sliding
              ? "transition-none"
              : "transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
          )}
          style={{
            transform: `translate3d(calc(-${index * 100}% + ${dragPx}px), 0, 0)`,
          }}
        >
          {items.map((slide, i) => {
            const show = nearIndex(i, index, items.length);
            return (
              <div
                key={slide.id}
                className="relative h-full w-full shrink-0 grow-0 basis-full"
                aria-hidden={i !== index}
              >
                {show ? (
                  <Image
                    src={slide.src}
                    alt={slide.alt}
                    fill
                    draggable={false}
                    sizes="(max-width: 768px) 100vw, 768px"
                    className={cn(
                      "pointer-events-none object-cover transition-opacity duration-300",
                      loaded[slide.id] ? "opacity-100" : "opacity-0",
                    )}
                    priority={i === 0}
                    decoding="async"
                    onLoad={() =>
                      setLoaded((m) =>
                        m[slide.id] ? m : { ...m, [slide.id]: true },
                      )
                    }
                    // Uploaded banners live on a Docker volume; Image optimizer
                    // returns null for those files under standalone output.
                    unoptimized={
                      slide.src.startsWith("/banners/") ||
                      slide.src.endsWith(".svg")
                    }
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {items.length > 1 ? (
        <div className="absolute inset-x-0 bottom-2.5 z-10 flex justify-center gap-1.5">
          {items.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Slide ${i + 1}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={cn(
                "size-1.5 rounded-full transition-colors",
                i === index ? "bg-white" : "bg-white/45",
              )}
            />
          ))}
        </div>
      ) : null}

      <span className="sr-only">
        Banner {index + 1} dari {items.length}: {current.alt}
      </span>
    </div>
  );
}
