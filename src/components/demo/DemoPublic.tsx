"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { ApplyState } from "@/lib/application-actions";
import { looksLikeSpam, parseApplication } from "@/lib/application-validate";
import { toCatView, activeBonds } from "@/lib/cats";
import { createApplication, getDemoDB, useDemoDB } from "@/lib/demo/store";
import type { ApplicationType } from "@/lib/types";
import { ApplicationForm } from "../site/ApplicationForm";
import { CatDetails } from "../site/CatDetails";
import { PhotoCarousel } from "../site/PhotoCarousel";

async function submitDemoApplication(_prev: ApplyState, formData: FormData): Promise<ApplyState> {
  const type: ApplicationType = formData.get("type") === "foster" ? "foster" : "adopt";
  if (looksLikeSpam(formData)) return { ok: true };
  const { contact, answers, catSlug, fieldErrors } = parseApplication(type, formData);
  if (Object.keys(fieldErrors).length) return { error: "Please check the highlighted fields.", fieldErrors };
  const cat = catSlug ? getDemoDB().cats.find((c) => c.slug === catSlug) : undefined;
  createApplication({ type, cat_id: cat?.id ?? null, ...contact, answers });
  return { ok: true };
}

export function DemoApplicationForm({ type }: { type: ApplicationType }) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-card" />}>
      <DemoApplicationFormInner type={type} />
    </Suspense>
  );
}

function DemoApplicationFormInner({ type }: { type: ApplicationType }) {
  const defaultCat = useSearchParams().get("cat") ?? "";
  const db = useDemoDB();
  if (!db) return <div className="h-96 animate-pulse rounded-2xl bg-card" />;
  const cats = db.cats
    .filter((c) => c.status !== "adopted")
    .map((c) => ({ slug: c.slug, name: c.name, status: c.status, bondedWith: activeBonds(c).map((b) => b.name) }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return (
    <ApplicationForm
      type={type}
      cats={cats}
      defaultCat={cats.some((c) => c.slug === defaultCat) ? defaultCat : ""}
      submit={submitDemoApplication}
    />
  );
}

export function DemoCatPage({ slug }: { slug: string }) {
  const db = useDemoDB();
  if (!db) return <div className="h-[480px] animate-pulse rounded-2xl bg-card" />;
  const raw = db.cats.find((c) => c.slug === slug);
  if (!raw) {
    return (
      <div className="py-20 text-center">
        <p className="font-serif text-3xl">We couldn&apos;t find that cat</p>
        <Link href="/adopt" className="btn-primary mt-6">
          See adoptable cats
        </Link>
      </div>
    );
  }
  const cat = toCatView(raw);
  return (
    <div className="grid gap-8 md:grid-cols-2 md:gap-14">
      <PhotoCarousel photos={cat.photos} seed={cat.id} priority />
      <div className="md:pt-4">
        <CatDetails cat={cat} headingLevel="h1" />
        <Link href="/adopt" className="mt-10 inline-block text-sm text-muted underline underline-offset-4 hover:text-ink">
          ← See all adoptable cats
        </Link>
      </div>
    </div>
  );
}
