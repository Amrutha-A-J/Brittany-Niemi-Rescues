import Link from "next/link";
import { activeBonds, bondLabel, catSummary, categoryLabel, namesList, sexLabel } from "@/lib/cats";
import { links } from "@/lib/links";
import type { CatView, YesNoUnknown } from "@/lib/types";

const goodWith: Record<YesNoUnknown, string> = { yes: "Yes", no: "No", unknown: "Not sure yet" };

export function CatDetails({ cat, headingLevel = "h2" }: { cat: CatView; headingLevel?: "h1" | "h2" }) {
  const Heading = headingLevel;
  const adopted = cat.status === "adopted";
  const bonds = adopted ? [] : activeBonds(cat);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="tag border border-line">{categoryLabel(cat.category)}</span>
          {bonds.length > 0 && <span className="tag border border-line">{bondLabel(bonds.length)}</span>}
          {cat.status === "pending" && <span className="tag bg-ink text-white">Adoption pending</span>}
          {adopted && <span className="tag bg-ink text-white">Found a home</span>}
        </div>
        <Heading className="font-serif text-[40px] leading-none">{cat.name}</Heading>
        <p className="mt-2 text-sm text-muted">{catSummary(cat)}</p>
      </div>

      {adopted && (
        <p className="rounded-xl bg-card p-4 text-sm">
          🎉 {cat.name} has found a forever home! Take a look at the other cats still waiting.
        </p>
      )}

      {bonds.length > 0 && (
        <div className="rounded-xl border border-line p-4">
          <p className="eyebrow mb-1.5">{bondLabel(bonds.length)}</p>
          <p className="text-sm leading-relaxed">
            {cat.name} is bonded with{" "}
            {bonds.map((b, i) => (
              <span key={b.id}>
                {i > 0 && (i === bonds.length - 1 ? " and " : ", ")}
                <Link href={links.publicCat(b.slug)} className="underline underline-offset-2">
                  {b.name}
                </Link>
              </span>
            ))}
            , so they&apos;ll go home together. One application covers {bonds.length > 1 ? "all of them" : "both"}.
          </p>
        </div>
      )}

      {cat.description && <p className="text-[15px] leading-relaxed text-ink/85">{cat.description}</p>}

      {cat.personality.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Personality">
          {cat.personality.map((p) => (
            <li key={p} className="rounded-full border border-line px-3 py-1 text-xs">
              {p}
            </li>
          ))}
        </ul>
      )}

      {cat.special_needs && cat.special_needs_notes && (
        <div className="rounded-xl border border-line p-4">
          <p className="eyebrow mb-1.5">Special care</p>
          <p className="text-sm leading-relaxed">{cat.special_needs_notes}</p>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-5 text-sm">
        <Fact label="Sex" value={sexLabel(cat.sex)} />
        <Fact label="Age" value={cat.ageLabel} />
        <Fact label="Colour" value={cat.color || "—"} />
        <Fact label="Breed" value={cat.breed || "—"} />
        <Fact label="Good with kids" value={goodWith[cat.good_with_kids]} />
        <Fact label="Good with cats" value={goodWith[cat.good_with_cats]} />
        <Fact label="Good with dogs" value={goodWith[cat.good_with_dogs]} />
        <Fact label="Adoption fee" value={cat.adoption_fee != null ? `$${cat.adoption_fee}` : "Ask us"} />
      </dl>

      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <Health ok={cat.spayed_neutered} label={cat.sex === "female" ? "Spayed" : "Neutered"} />
        <Health ok={cat.vaccinated} label="Vaccinated" />
        <Health ok={cat.microchipped} label="Microchipped" />
      </ul>

      {!adopted && (
        <div className="flex flex-wrap gap-3 pt-1">
          <Link href={`/apply?cat=${cat.slug}`} className="btn-primary">
            Apply to adopt {bonds.length ? namesList([cat.name, ...bonds.map((b) => b.name)]) : cat.name}
          </Link>
        </div>
      )}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}

function Health({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={`flex items-center gap-1.5 ${ok ? "text-ink" : "text-faint"}`}>
      <span aria-hidden>{ok ? "✓" : "–"}</span>
      {ok ? label : `Not yet ${label.toLowerCase()}`}
    </li>
  );
}
