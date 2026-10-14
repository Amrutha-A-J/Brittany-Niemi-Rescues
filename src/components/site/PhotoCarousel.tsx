"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { CatIllustration } from "./CatIllustration";

type Photo = { url: string; alt: string };

export function PhotoCarousel({
  photos,
  seed,
  priority = false,
}: {
  photos: Photo[];
  seed: string;
  priority?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const goTo = useCallback((i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const next = Math.max(0, Math.min(i, track.children.length - 1));
    track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
  }, []);

  if (photos.length === 0) {
    return (
      <div className="flex aspect-[4/5] w-full items-center justify-center bg-card text-ink/80">
        <CatIllustration seed={seed} className="h-28 w-28" />
      </div>
    );
  }

  return (
    <div
      className="w-full"
      role="region"
      aria-roledescription="carousel"
      aria-label="Photos"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") goTo(index + 1);
        if (e.key === "ArrowLeft") goTo(index - 1);
      }}
    >
      <div className="relative">
        <div
          ref={trackRef}
          className="flex aspect-[4/5] snap-x snap-mandatory overflow-x-auto bg-card [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onScroll={(e) => {
            const t = e.currentTarget;
            setIndex(Math.round(t.scrollLeft / t.clientWidth));
          }}
          tabIndex={0}
        >
          {photos.map((p, i) => (
            <div
              key={p.url}
              className="relative h-full w-full shrink-0 snap-center"
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${photos.length}`}
            >
              <Image
                src={p.url}
                alt={p.alt}
                fill
                priority={priority && i === 0}
                sizes="(min-width: 768px) 480px, 100vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>

        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              disabled={index === 0}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm transition-opacity hover:bg-white disabled:opacity-0"
            >
              <Chevron dir="left" />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              disabled={index === photos.length - 1}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm transition-opacity hover:bg-white disabled:opacity-0"
            >
              <Chevron dir="right" />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/30 px-2 py-1.5">
              {photos.map((p, i) => (
                <span
                  key={p.url}
                  className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-white" : "bg-white/50"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {photos.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {photos.map((p, i) => (
            <button
              key={p.url}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === index}
              className={`relative h-16 w-14 shrink-0 overflow-hidden bg-card outline-offset-2 ${
                i === index ? "outline-2 outline-ink" : "opacity-60 hover:opacity-100"
              }`}
            >
              <Image src={p.url} alt="" fill sizes="56px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d={dir === "left" ? "M12.5 4.5 7 10l5.5 5.5" : "M7.5 4.5 13 10l-5.5 5.5"} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
