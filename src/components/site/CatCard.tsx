import Image from "next/image";
import Link from "next/link";
import { activeBonds, bondLabel, catSummary, categoryLabel } from "@/lib/cats";
import type { CatView } from "@/lib/types";
import { CatIllustration } from "./CatIllustration";
import { links } from "@/lib/links";

export function CatTag({ cat }: { cat: CatView }) {
  if (cat.status === "pending") return <span className="tag bg-ink text-white">Pending</span>;
  if (cat.status === "adopted") return <span className="tag bg-ink text-white">Adopted</span>;
  return <span className="tag">{categoryLabel(cat.category)}</span>;
}

export function CatCard({
  cat,
  onOpen,
  priority = false,
}: {
  cat: CatView;
  onOpen?: (cat: CatView) => void;
  priority?: boolean;
}) {
  const cover = cat.photos[0];
  return (
    <Link
      href={links.publicCat(cat.slug)}
      className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
      onClick={(e) => {
        if (!onOpen || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        onOpen(cat);
      }}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-card">
        {cover ? (
          <Image
            src={cover.url}
            alt={cover.alt}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 260px, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink/80">
            <CatIllustration seed={cat.id} className="h-20 w-20 transition-transform duration-500 group-hover:scale-110" />
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <CatTag cat={cat} />
          {cat.status !== "adopted" && activeBonds(cat).length > 0 && (
            <span className="tag">{bondLabel(activeBonds(cat).length)}</span>
          )}
        </div>
      </div>
      <h3 className="mt-3 font-serif text-[22px] leading-tight">{cat.name}</h3>
      <p className="mt-1 text-xs text-muted">{catSummary(cat)}</p>
    </Link>
  );
}
