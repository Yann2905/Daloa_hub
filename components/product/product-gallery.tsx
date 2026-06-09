"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProductGallery({
  images,
  alt,
}: {
  images: { id: string; url: string }[];
  alt: string;
}) {
  const [idx, setIdx] = useState(0);
  const startX = useRef<number | null>(null);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl border bg-secondary text-muted-foreground">
        <ImageOff className="size-10" />
      </div>
    );
  }

  const go = (d: number) => setIdx((i) => (i + d + images.length) % images.length);
  const multi = images.length > 1;

  return (
    <div className="space-y-3">
      <div
        className="group relative aspect-square select-none overflow-hidden rounded-2xl border bg-secondary shadow-card"
        onTouchStart={(e) => (startX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (startX.current == null) return;
          const dx = e.changedTouches[0].clientX - startX.current;
          if (dx > 40) go(-1);
          else if (dx < -40) go(1);
          startX.current = null;
        }}
      >
        <Image
          key={images[idx].id}
          src={images[idx].url}
          alt={alt}
          fill
          sizes="(max-width:768px) 100vw, 50vw"
          className="object-cover"
          priority
        />

        {multi && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Image precedente"
              className="absolute left-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-foreground shadow-soft backdrop-blur transition hover:bg-white active:scale-90"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Image suivante"
              className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-foreground shadow-soft backdrop-blur transition hover:bg-white active:scale-90"
            >
              <ChevronRight className="size-5" />
            </button>
            <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
              {images.map((img, i) => (
                <span
                  key={img.id}
                  className={cn(
                    "h-1.5 rounded-full bg-white/70 transition-all",
                    i === idx ? "w-5 bg-white" : "w-1.5",
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {multi && (
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setIdx(i)}
              className={cn(
                "relative aspect-square overflow-hidden rounded-lg border bg-secondary transition",
                i === idx ? "ring-2 ring-primary ring-offset-1" : "opacity-80 hover:opacity-100",
              )}
            >
              <Image src={img.url} alt="" fill sizes="20vw" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
