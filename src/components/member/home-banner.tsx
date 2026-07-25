"use client";

import { useEffect, useState } from "react";
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

export function HomeBanner({
  slides,
  intervalSec = 5,
  className,
}: Props) {
  const items = slides.length > 0 ? slides : [];
  const [index, setIndex] = useState(0);
  const ms = Math.max(2, Math.min(60, intervalSec)) * 1000;

  useEffect(() => {
    if (items.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, ms);
    return () => window.clearInterval(id);
  }, [items.length, ms]);

  if (items.length === 0) return null;

  const current = items[index] ?? items[0];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/80 bg-muted",
        className,
      )}
    >
      <div className="relative aspect-[2.2/1] w-full overflow-hidden">
        <div
          className="flex h-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
          style={{ transform: `translate3d(-${index * 100}%, 0, 0)` }}
        >
          {items.map((slide, i) => (
            <div
              key={slide.id}
              className="relative h-full w-full shrink-0 grow-0 basis-full"
              aria-hidden={i !== index}
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
                priority={i === 0}
                unoptimized={slide.src.endsWith(".svg")}
              />
            </div>
          ))}
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
