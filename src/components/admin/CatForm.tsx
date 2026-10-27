"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { saveCat, type CatInput } from "@/lib/admin/cat-actions";
import { ageInMonths, formatAge, photoUrl } from "@/lib/cats";
import type { Cat, YesNoUnknown } from "@/lib/types";
import { links } from "@/lib/links";

type Photo = { path: string; alt: string; url: string; uploading?: boolean };

const MAX_EDGE = 1600;

/** Resize to at most 1600px and convert to WebP in the browser before uploading. */
async function compress(file: File, maxEdge = MAX_EDGE): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not process image"))), "image/webp", 0.82),
  );
}

function birthDateFromAge(years: number, months: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - (years * 12 + months));
  return d.toISOString().slice(0, 10);
}

type CatFormProps = {
  cat?: Cat;
  /** Defaults to the real server action. */
  onSave?: (input: CatInput) => Promise<{ error?: string; id?: string }>;
  /** Stores a processed photo and returns its path. Defaults to the site's photo storage (R2). */
  upload?: (blob: Blob, path: string) => Promise<string>;
  /** Longest photo edge in px (demo mode uses smaller photos to fit browser storage). */
  maxEdge?: number;
  /** Cats this one can be bonded with (the rescue's other cats still looking for a home). */
  otherCats?: { id: string; name: string }[];
};

async function uploadToStorage(blob: Blob, path: string) {
  const res = await fetch(`/admin/upload?path=${encodeURIComponent(path)}`, { method: "POST", body: blob });
  const data = (await res.json().catch(() => ({}))) as { path?: string; error?: string };
  if (!res.ok || !data.path) throw new Error(data.error ?? "upload failed");
  return data.path;
}

export function CatForm({ cat, onSave = saveCat, upload = uploadToStorage, maxEdge = MAX_EDGE, otherCats = [] }: CatFormProps) {
  const router = useRouter();
  const [saving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const [folder] = useState(() => cat?.id ?? crypto.randomUUID());

  const [v, setV] = useState({
    name: cat?.name ?? "",
    sex: cat?.sex ?? "female",
    birth_date: cat?.birth_date ?? "",
    color: cat?.color ?? "",
    breed: cat?.breed ?? "Domestic shorthair",
    status: cat?.status === "pending" ? "pending" : "available",
    special_needs: cat?.special_needs ?? false,
    special_needs_notes: cat?.special_needs_notes ?? "",
    description: cat?.description ?? "",
    personality: (cat?.personality ?? []).join(", "),
    good_with_kids: cat?.good_with_kids ?? "unknown",
    good_with_cats: cat?.good_with_cats ?? "unknown",
    good_with_dogs: cat?.good_with_dogs ?? "unknown",
    spayed_neutered: cat?.spayed_neutered ?? false,
    vaccinated: cat?.vaccinated ?? false,
    microchipped: cat?.microchipped ?? false,
    adoption_fee: cat?.adoption_fee != null ? String(cat.adoption_fee) : "",
  });
  const [photos, setPhotos] = useState<Photo[]>(
    [...(cat?.cat_photos ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((p) => ({ path: p.path, alt: p.alt, url: photoUrl(p.path) })),
  );
  const [bondedIds, setBondedIds] = useState<string[]>(() => (cat?.bonded ?? []).map((b) => b.id));
  // Partners that are already adopted aren't in `otherCats`, but the bond is kept.
  const bondChoices = [
    ...otherCats.filter((c) => c.id !== cat?.id),
    ...(cat?.bonded ?? []).filter((b) => !otherCats.some((c) => c.id === b.id)),
  ].sort((a, b) => a.name.localeCompare(b.name));
  const thisCat = v.name.trim() || "this cat";
  const set = <K extends keyof typeof v>(key: K, value: (typeof v)[K]) => setV((s) => ({ ...s, [key]: value }));

  const uploading = photos.some((p) => p.uploading);

  async function addFiles(files: FileList | File[]) {
    const images = [...files].filter((f) => f.type.startsWith("image/"));
    if (!images.length) return;
    setError(null);
    const pending = images.map((f) => ({
      path: `${folder}/${crypto.randomUUID()}.webp`,
      alt: "",
      url: URL.createObjectURL(f),
      uploading: true,
      file: f,
    }));
    setPhotos((list) => [...list, ...pending.map((p) => ({ path: p.path, alt: p.alt, url: p.url, uploading: true }))]);

    await Promise.all(
      pending.map(async (p) => {
        try {
          const blob = await compress(p.file, maxEdge);
          const stored = await upload(blob, p.path);
          setPhotos((list) =>
            list.map((x) => (x.path === p.path ? { ...x, path: stored, url: photoUrl(stored), uploading: false } : x)),
          );
        } catch (e) {
          setPhotos((list) => list.filter((x) => x.path !== p.path));
          setError(`Couldn't upload ${p.file.name}: ${e instanceof Error ? e.message : "unknown error"}`);
        }
      }),
    );
  }

  function move(index: number, to: number) {
    setPhotos((list) => {
      if (to < 0 || to >= list.length) return list;
      const next = [...list];
      const [item] = next.splice(index, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fee = v.adoption_fee.trim() === "" ? null : Number(v.adoption_fee);
    const input: CatInput = {
      ...v,
      id: cat?.id,
      sex: v.sex as CatInput["sex"],
      status: v.status as CatInput["status"],
      good_with_kids: v.good_with_kids as YesNoUnknown,
      good_with_cats: v.good_with_cats as YesNoUnknown,
      good_with_dogs: v.good_with_dogs as YesNoUnknown,
      personality: v.personality.split(","),
      adoption_fee: fee,
      photos: photos.map((p) => ({ path: p.path, alt: p.alt })),
      bonded_ids: bondedIds,
    };
    startSaving(async () => {
      const res = await onSave(input);
      if (res.error) {
        setError(res.error);
        return;
      }
      router.push(`/admin/cats?saved=${encodeURIComponent(v.name)}`);
      router.refresh();
    });
  }

  const age = v.birth_date ? formatAge(ageInMonths(v.birth_date)) : null;

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
        <section className="rounded-2xl border border-line bg-white p-5 sm:p-6">
          <h2 className="mb-1 text-sm font-semibold">Photos</h2>
          <p className="mb-4 text-xs text-muted">The first photo is the cover. Photos are resized automatically.</p>

          {photos.length > 0 && (
            <ul className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {photos.map((p, i) => (
                <li key={p.path} className="overflow-hidden rounded-xl border border-line">
                  <div className="relative aspect-[4/5] bg-card">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt="" className={`h-full w-full object-cover ${p.uploading ? "opacity-40" : ""}`} />
                    {p.uploading && (
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">Uploading…</span>
                    )}
                    {i === 0 && !p.uploading && <span className="tag absolute left-2 top-2">Cover</span>}
                    <button
                      type="button"
                      onClick={() => setPhotos((l) => l.filter((x) => x.path !== p.path))}
                      aria-label="Remove photo"
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-sm shadow-sm hover:bg-white"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="space-y-2 p-2">
                    <div className="flex items-center justify-between gap-1">
                      <button type="button" className="btn-ghost px-2 py-1 text-xs" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label="Move earlier">
                        ←
                      </button>
                      {i !== 0 && (
                        <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={() => move(i, 0)}>
                          Make cover
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-ghost px-2 py-1 text-xs"
                        disabled={i === photos.length - 1}
                        onClick={() => move(i, i + 1)}
                        aria-label="Move later"
                      >
                        →
                      </button>
                    </div>
                    <input
                      className="field px-2.5 py-1.5 text-xs"
                      placeholder="Describe the photo (optional)"
                      value={p.alt}
                      onChange={(e) => setPhotos((l) => l.map((x) => (x.path === p.path ? { ...x, alt: e.target.value } : x)))}
                      aria-label="Photo description"
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              addFiles(e.dataTransfer.files);
            }}
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
              dragOver ? "border-ink bg-card" : "border-line"
            }`}
          >
            <p className="text-sm">Drag photos here</p>
            <p className="my-2 text-xs text-muted">or</p>
            <button type="button" className="btn-outline py-2" onClick={() => fileInput.current?.click()}>
              Choose photos
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-line bg-white p-5 sm:p-6">
          <h2 className="text-sm font-semibold">About</h2>
          <label className="block">
            <span className="field-label">Name *</span>
            <input className="field" required value={v.name} onChange={(e) => set("name", e.target.value)} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <fieldset>
              <legend className="field-label">Sex *</legend>
              <div className="flex gap-2">
                {(["female", "male"] as const).map((s) => (
                  <label
                    key={s}
                    className="flex flex-1 cursor-pointer items-center justify-center rounded-xl border border-line py-2.5 text-sm has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-white"
                  >
                    <input type="radio" name="sex" className="sr-only" checked={v.sex === s} onChange={() => set("sex", s)} />
                    {s === "female" ? "Female" : "Male"}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="block">
              <span className="field-label">Colour / markings</span>
              <input className="field" placeholder="Grey tabby" value={v.color} onChange={(e) => set("color", e.target.value)} />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="field-label">Birth date * {age && <span className="font-normal text-muted">({age} old)</span>}</span>
              <input type="date" className="field" required value={v.birth_date} onChange={(e) => set("birth_date", e.target.value)} />
              <span className="field-hint">An estimate is fine. The age on the site updates by itself.</span>
            </label>
            <div>
              <span className="field-label">…or set from approximate age</span>
              <AgeShortcut onSet={(d) => set("birth_date", d)} />
            </div>
          </div>
          <label className="block">
            <span className="field-label">Breed</span>
            <input className="field" value={v.breed} onChange={(e) => set("breed", e.target.value)} />
          </label>
          <label className="block">
            <span className="field-label">Their story</span>
            <textarea
              className="field"
              rows={5}
              placeholder="What are they like? How did they come to the rescue? What home would suit them?"
              value={v.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </label>
          <label className="block">
            <span className="field-label">Personality</span>
            <input className="field" placeholder="Playful, Cuddly, Loves feather toys" value={v.personality} onChange={(e) => set("personality", e.target.value)} />
            <span className="field-hint">Separate with commas. Each one shows as a little tag.</span>
          </label>
        </section>

        <section className="space-y-4 rounded-2xl border border-line bg-white p-5 sm:p-6">
          <h2 className="text-sm font-semibold">Health &amp; special care</h2>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <Check label={v.sex === "female" ? "Spayed" : "Neutered"} checked={v.spayed_neutered} onChange={(c) => set("spayed_neutered", c)} />
            <Check label="Vaccinated" checked={v.vaccinated} onChange={(c) => set("vaccinated", c)} />
            <Check label="Microchipped" checked={v.microchipped} onChange={(c) => set("microchipped", c)} />
          </div>
          <Check label="This cat has special needs" checked={v.special_needs} onChange={(c) => set("special_needs", c)} />
          {v.special_needs && (
            <label className="block">
              <span className="field-label">Special care notes (shown on the site)</span>
              <textarea
                className="field"
                rows={3}
                placeholder="e.g. Deaf, does best indoor-only. Responds well to hand signals."
                value={v.special_needs_notes}
                onChange={(e) => set("special_needs_notes", e.target.value)}
              />
            </label>
          )}
        </section>
      </div>

      <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
        <section className="space-y-4 rounded-2xl border border-line bg-white p-5 sm:p-6">
          <h2 className="text-sm font-semibold">Listing</h2>
          {cat?.status === "adopted" ? (
            <p className="rounded-xl bg-card p-3 text-sm">
              This cat is adopted. Manage that from the <Link href={links.adopted(cat.id)} className="underline">Adopted</Link> section.
            </p>
          ) : (
            <label className="block">
              <span className="field-label">Status</span>
              <select className="field" value={v.status} onChange={(e) => set("status", e.target.value)}>
                <option value="available">Available</option>
                <option value="pending">Adoption pending</option>
              </select>
            </label>
          )}
          <label className="block">
            <span className="field-label">Adoption fee ($)</span>
            <input
              className="field"
              inputMode="numeric"
              placeholder="Leave blank to show “Ask us”"
              value={v.adoption_fee}
              onChange={(e) => set("adoption_fee", e.target.value.replace(/[^\d]/g, ""))}
            />
          </label>
          <GoodWith label="Good with kids" value={v.good_with_kids} onChange={(x) => set("good_with_kids", x)} />
          <GoodWith label="Good with cats" value={v.good_with_cats} onChange={(x) => set("good_with_cats", x)} />
          <GoodWith label="Good with dogs" value={v.good_with_dogs} onChange={(x) => set("good_with_dogs", x)} />
        </section>

        <section className="space-y-3 rounded-2xl border border-line bg-white p-5 sm:p-6">
          <div>
            <h2 className="text-sm font-semibold">Bonded cats</h2>
            <p className="mt-1 text-xs text-muted">
              Does {thisCat} have to go home with another cat? Tick them below. This only links cats that are already on
              the site; it doesn&apos;t add a new one.
            </p>
          </div>
          {bondChoices.length ? (
            <div className="max-h-56 space-y-2 overflow-y-auto">
              {bondChoices.map((c) => (
                <Check
                  key={c.id}
                  label={c.name}
                  checked={bondedIds.includes(c.id)}
                  onChange={(on) => setBondedIds((ids) => (on ? [...ids, c.id] : ids.filter((x) => x !== c.id)))}
                />
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-card p-3 text-xs leading-relaxed text-muted">
              There are no other cats to pick yet. If {thisCat} has a bonded partner, save {thisCat} first, add the
              partner as its own cat, and tick {thisCat} on the partner&apos;s page.
            </p>
          )}
        </section>

        {error && (
          <p role="alert" className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}
        <div className="flex gap-3">
          <button type="submit" className="btn-primary flex-1" disabled={saving || uploading}>
            {saving ? "Saving…" : uploading ? "Uploading photos…" : cat ? "Save changes" : "Add cat"}
          </button>
          <button type="button" className="btn-outline" onClick={() => router.back()}>
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (c: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input type="checkbox" className="h-4 w-4 accent-ink" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

function GoodWith({ label, value, onChange }: { label: string; value: string; onChange: (v: YesNoUnknown) => void }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <select className="field" value={value} onChange={(e) => onChange(e.target.value as YesNoUnknown)}>
        <option value="unknown">Not sure yet</option>
        <option value="yes">Yes</option>
        <option value="no">No</option>
      </select>
    </label>
  );
}

function AgeShortcut({ onSet }: { onSet: (date: string) => void }) {
  const [years, setYears] = useState("");
  const [months, setMonths] = useState("");
  const apply = (y: string, m: string) => {
    if (y === "" && m === "") return;
    onSet(birthDateFromAge(Number(y) || 0, Number(m) || 0));
  };
  return (
    <div className="flex items-center gap-2">
      <input
        className="field w-20"
        inputMode="numeric"
        placeholder="0"
        aria-label="Years"
        value={years}
        onChange={(e) => {
          const y = e.target.value.replace(/\D/g, "");
          setYears(y);
          apply(y, months);
        }}
      />
      <span className="text-sm text-muted">yrs</span>
      <input
        className="field w-20"
        inputMode="numeric"
        placeholder="0"
        aria-label="Months"
        value={months}
        onChange={(e) => {
          const m = e.target.value.replace(/\D/g, "");
          setMonths(m);
          apply(years, m);
        }}
      />
      <span className="text-sm text-muted">mos</span>
    </div>
  );
}
