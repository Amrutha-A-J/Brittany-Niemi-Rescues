"use client";

/**
 * Admin screens for demo mode. They reuse the real admin components but read and
 * write the browser-only demo store instead of Supabase.
 */
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useSyncExternalStore } from "react";
import type { FormState } from "@/lib/admin/auth-actions";
import type { CatInput } from "@/lib/admin/cat-actions";
import type { MeetingRow } from "@/lib/admin/meetings";
import { formatDate, icsFile, parseLocalDateTime, toLocalInputValue } from "@/lib/calendar";
import { catSummary, photoUrl, toCatView } from "@/lib/cats";
import {
  blobToDataUrl,
  deleteCat,
  demoLogin,
  deleteApplication,
  resetDemo,
  returnToAvailable,
  saveAdoption,
  saveCat,
  scheduleMeeting,
  setCatStatus,
  setMeetingStatus,
  updateApplication,
  useDemoDB,
  type DemoDB,
} from "@/lib/demo/store";
import { applicationFields, applicationTypeLabel } from "@/lib/forms";
import { meetingEvent } from "@/lib/admin/meetings";
import type { Adoption, Application, ApplicationType } from "@/lib/types";
import { APPLICATION_TABS, applicationListMeta } from "@/lib/admin/application-tabs";
import { AdminNav } from "../admin/AdminNav";
import { AdoptionForm, type ApplicantOption } from "../admin/AdoptionForm";
import { ApplicationActions } from "../admin/ApplicationActions";
import { AuthCard } from "../admin/AuthCard";
import { CatForm } from "../admin/CatForm";
import { FilterableCatList } from "../admin/FilterableCatList";
import { ActionForm, SubmitButton } from "../admin/Forms";
import { MeetingList } from "../admin/MeetingList";
import { ApplicationStatusBadge, Card, CatRow, Empty, PageHeader, rowButton, rowDangerButton, Thumb } from "../admin/ui";
import { Logo } from "../site/Logo";
import { links } from "@/lib/links";

const EMAIL_NOTE = " (Demo: no email is sent.)";

/* ------------------------------------------------------------------ helpers */

function Loading() {
  return <div className="h-64 animate-pulse rounded-2xl bg-card" />;
}

/** Reads a query-string value. */
function useQuery(name: string) {
  return useSearchParams().get(name) ?? undefined;
}

/** On the static demo, record pages live at `/…/_?id=<id>`. */
function useRecordId(id?: string) {
  const fromQuery = useQuery("id");
  return id === "_" || !id ? fromQuery : id;
}

/** Wraps a screen that reads the query string, as static pages require. */
function suspended<P extends object>(Inner: (props: P) => React.ReactNode) {
  function Suspended(props: P) {
    return (
      <Suspense fallback={<Loading />}>
        <Inner {...props} />
      </Suspense>
    );
  }
  return Suspended;
}

function useNow() {
  const [now] = useState(() => Date.now());
  return now;
}

function meetingRows(db: DemoDB): MeetingRow[] {
  return db.meetings.map((m) => {
    const app = db.applications.find((a) => a.id === m.application_id);
    const cat = app?.cat_id ? db.cats.find((c) => c.id === app.cat_id) : undefined;
    return {
      ...m,
      applications: app
        ? { id: app.id, name: app.name, email: app.email, phone: app.phone, type: app.type, status: app.status, cats: cat ? { name: cat.name, slug: cat.slug } : null }
        : null,
    };
  });
}

const icsHref = (m: MeetingRow) => `data:text/calendar;charset=utf-8,${encodeURIComponent(icsFile(meetingEvent(m)))}`;

async function setMeetingStatusAction(fd: FormData) {
  setMeetingStatus(String(fd.get("id")), String(fd.get("status")) as "scheduled" | "completed" | "cancelled");
}

function applicantOptions(db: DemoDB, catId: string): ApplicantOption[] {
  const rank = (a: Application) => (a.cat_id === catId ? 0 : 2) + (a.status === "approved" ? 0 : 1);
  return db.applications
    .filter((a) => a.type === "adopt" && (a.cat_id === catId || a.status === "approved"))
    .sort((a, b) => rank(a) - rank(b))
    .map((a) => {
      const cat = db.cats.find((c) => c.id === a.cat_id);
      return {
        id: a.id,
        name: a.name,
        email: a.email,
        phone: a.phone,
        city: a.city,
        label: `${a.name} (${a.status.replace("_", " ")}${cat && a.cat_id !== catId ? `, applied for ${cat.name}` : ""})`,
      };
    });
}

function adoptionAction(catId: string, onCreated?: () => void) {
  return async (_prev: FormState, fd: FormData): Promise<FormState> => {
    const text = (n: string) => String(fd.get(n) ?? "").trim();
    if (!text("adopter_name")) return { error: "Add the adopter's name." };
    const fee = text("fee_paid");
    saveAdoption({
      cat_id: catId,
      application_id: text("application_id") || null,
      adopted_on: text("adopted_on") || new Date().toISOString().slice(0, 10),
      adopter_name: text("adopter_name"),
      adopter_email: text("adopter_email"),
      adopter_phone: text("adopter_phone"),
      adopter_address: text("adopter_address"),
      fee_paid: fee === "" ? null : Number(fee),
      microchip_number: text("microchip_number"),
      follow_up_on: text("follow_up_on") || null,
      notes: text("notes"),
    });
    onCreated?.();
    return { message: "Saved." };
  };
}

/* ------------------------------------------------------------- login & shell */

const noop = () => () => {};
function useLoggedIn() {
  return useSyncExternalStore(noop, demoLogin.isLoggedIn, () => null);
}

export const DemoLogin = suspended(function DemoLogin() {
  const router = useRouter();
  const next = useQuery("next");
  const [error, setError] = useState("");
  return (
    <AuthCard title="Rescue login">
      <p className="mb-5 rounded-xl bg-card px-3.5 py-2.5 text-sm">
        Demo login: <strong>brittany</strong> / <strong>catsrule</strong>
      </p>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          if (demoLogin.check(String(fd.get("username")), String(fd.get("password")))) {
            router.push(next && next.startsWith("/admin") ? next : "/admin");
          } else {
            setError("That username and password don't match.");
          }
        }}
      >
        <label className="block">
          <span className="field-label">Username</span>
          <input name="username" autoComplete="username" required className="field" />
        </label>
        <label className="block">
          <span className="field-label">Password</span>
          <input name="password" type="password" autoComplete="current-password" required className="field" />
        </label>
        <button className="btn-primary w-full">Log in</button>
        {error && (
          <p role="alert" className="rounded-xl border border-danger/30 bg-danger/5 px-3.5 py-2.5 text-sm text-danger">
            {error}
          </p>
        )}
      </form>
      <Link href="/admin/forgot-password" className="mt-5 inline-block text-sm text-muted underline underline-offset-4 hover:text-ink">
        Forgot password?
      </Link>
    </AuthCard>
  );
});

export function DemoForgotPassword() {
  return (
    <AuthCard title="Reset your password">
      <p className="text-sm leading-relaxed text-muted">
        In the real site, you&apos;ll enter your email here and get a link to choose a new password. That isn&apos;t
        switched on in this demo. The demo login is <strong>brittany</strong> / <strong>catsrule</strong>.
      </p>
      <Link href="/admin/login" className="btn-outline mt-6">
        ← Back to login
      </Link>
    </AuthCard>
  );
}

export function DemoPanel({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const loggedIn = useLoggedIn();
  const db = useDemoDB();

  useEffect(() => {
    if (loggedIn === false) router.replace("/admin/login");
  }, [loggedIn, router]);

  if (!loggedIn || !db) return <div className="p-10"><Loading /></div>;
  const isNew = (type: string) => db.applications.filter((a) => a.status === "new" && a.type === type).length;
  const newCounts = { adopt: isNew("adopt"), foster: isNew("foster") };

  const logout = () => {
    demoLogin.logout();
    router.replace("/admin/login");
  };
  const reset = () => {
    if (window.confirm("Reset the demo? Everything you've added or changed goes back to the sample data.")) {
      resetDemo();
      router.push("/admin");
    }
  };

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col md:flex-row">
      <aside className="border-b border-line bg-white px-4 py-4 md:sticky md:top-0 md:h-dvh md:w-60 md:shrink-0 md:border-b-0 md:border-r md:px-5 md:py-8">
        <div className="mb-4 flex items-center justify-between md:mb-8 md:block">
          <Link href="/admin" aria-label="Dashboard">
            <Logo size={28} />
          </Link>
          <button onClick={logout} className="text-sm text-muted hover:text-ink md:hidden">
            Log out
          </button>
        </div>
        <nav aria-label="Admin">
          <AdminNav newCounts={newCounts} />
        </nav>
        <div className="mt-8 hidden space-y-2 border-t border-line pt-6 text-sm md:block">
          <Link href="/" target="_blank" className="block text-muted hover:text-ink">
            View website ↗
          </Link>
          <button onClick={reset} className="block text-muted hover:text-ink">
            Reset demo data
          </button>
          <button onClick={logout} className="block text-muted hover:text-ink">
            Log out
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-5 py-8 md:px-10 md:py-10">{children}</main>
    </div>
  );
}

/* ----------------------------------------------------------------- overview */

export function DemoOverview() {
  const db = useDemoDB();
  const now = useNow();
  if (!db) return <Loading />;
  const count = (s: string) => db.cats.filter((c) => c.status === s).length;
  const newApps = db.applications.filter((a) => a.status === "new");
  const upcoming = meetingRows(db)
    .filter((m) => m.status === "scheduled" && new Date(m.starts_at).getTime() > now - 3 * 3600_000)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const today = new Date(now).toISOString().slice(0, 10);
  const followUps = db.adoptions.filter((a) => a.follow_up_on && a.follow_up_on <= today);
  const stats = [
    { label: "Available cats", value: count("available"), href: "/admin/cats" },
    { label: "Adoption pending", value: count("pending"), href: "/admin/cats" },
    { label: "New adoption applications", value: newApps.filter((a) => a.type === "adopt").length, href: "/admin/applications/adopt" },
    { label: "New foster applications", value: newApps.filter((a) => a.type === "foster").length, href: "/admin/applications/foster" },
    { label: "Upcoming meet & greets", value: upcoming.length, href: "/admin/meetings" },
  ];

  return (
    <>
      <PageHeader
        title="Hello!"
        description="Here's what's happening at the rescue."
        actions={
          <Link href="/admin/cats/new" className="btn-primary">
            + Add a cat
          </Link>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-2xl border border-line bg-white p-5 hover:border-ink">
            <p className="font-serif text-4xl leading-none">{s.value}</p>
            <p className="mt-2 text-xs text-muted">{s.label}</p>
          </Link>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="New applications">
          {newApps.length ? (
            <ul className="divide-y divide-line">
              {newApps.slice(0, 6).map((a) => {
                const cat = db.cats.find((c) => c.id === a.cat_id);
                return (
                  <li key={a.id}>
                    <Link href={links.application(a.id)} className="flex items-center justify-between gap-3 py-3 hover:underline">
                      <span>
                        <span className="font-medium">{a.name}</span>
                        <span className="text-sm text-muted">
                          {" "}
                          · {applicationTypeLabel[a.type]}
                          {cat ? ` for ${cat.name}` : ""}
                        </span>
                      </span>
                      <span className="text-xs text-muted">{formatDate(a.created_at)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Empty>You&apos;re all caught up.</Empty>
          )}
        </Card>
        <Card title="Upcoming meet & greets">
          {upcoming.length ? (
            <MeetingList meetings={upcoming.slice(0, 5)} setStatus={setMeetingStatusAction} icsHref={icsHref} />
          ) : (
            <Empty>Nothing scheduled.</Empty>
          )}
        </Card>
        {followUps.length > 0 && (
          <Card title="Adoption follow-ups due">
            <ul className="divide-y divide-line">
              {followUps.map((f) => (
                <li key={f.cat_id}>
                  <Link href={links.adopted(f.cat_id)} className="flex justify-between gap-3 py-3 hover:underline">
                    <span>
                      {db.cats.find((c) => c.id === f.cat_id)?.name} <span className="text-muted">with {f.adopter_name}</span>
                    </span>
                    <span className="text-xs text-muted">{f.follow_up_on && formatDate(f.follow_up_on)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </>
  );
}

/* --------------------------------------------------------------------- cats */

export const DemoCats = suspended(function DemoCats() {
  const saved = useQuery("saved");
  const db = useDemoDB();
  if (!db) return <Loading />;
  const cats = db.cats.filter((c) => c.status !== "adopted").map((c) => toCatView(c));

  return (
    <>
      <PageHeader
        title="Cats"
        description="Cats listed on the website. Adopted cats move to the Adopted section."
        actions={
          <Link href="/admin/cats/new" className="btn-primary">
            + Add a cat
          </Link>
        }
      />
      {saved && (
        <p role="status" className="mb-6 rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
          Saved {saved}. It&apos;s live on the website.
        </p>
      )}
      {cats.length === 0 ? (
        <Empty>No cats listed yet. Add your first one!</Empty>
      ) : (
        <FilterableCatList
          items={cats.map((c) => ({
            cat: c,
            row: (
            <CatRow cat={c} href={links.cat(c.id)}>
              <Link href={links.cat(c.id)} className={rowButton}>
                Edit
              </Link>
              <button className={rowButton} onClick={() => setCatStatus(c.id, c.status === "pending" ? "available" : "pending")}>
                {c.status === "pending" ? "Mark available" : "Mark pending"}
              </button>
              <Link href={links.adoptCat(c.id)} className={rowButton}>
                Mark adopted
              </Link>
              <button
                className={rowDangerButton}
                onClick={() => window.confirm(`Delete ${c.name} and all photos? This can't be undone.`) && deleteCat(c.id)}
              >
                Delete
              </button>
            </CatRow>
            ),
          }))}
        />
      )}
    </>
  );
});

async function saveDemoCat(input: CatInput) {
  try {
    if (!input.name.trim()) return { error: "Give the cat a name." };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.birth_date)) return { error: "Add a birth date (an estimate is fine)." };
    return saveCat({
      ...input,
      name: input.name.trim(),
      personality: input.personality.map((p) => p.trim()).filter(Boolean),
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Couldn't save." };
  }
}

const storeAsDataUrl = (blob: Blob) => blobToDataUrl(blob);

export const DemoCatEditor = suspended(function DemoCatEditor({ id: routeId }: { id?: string }) {
  const isNew = routeId === undefined;
  const queryId = useRecordId(routeId);
  const id = isNew ? undefined : queryId;
  const db = useDemoDB();
  if (!db) return <Loading />;
  const cat = id ? db.cats.find((c) => c.id === id) : undefined;
  if (id && !cat) return <Empty>That cat doesn&apos;t exist (it may have been deleted).</Empty>;

  return (
    <>
      <PageHeader
        title={cat ? `Edit ${cat.name}` : "Add a cat"}
        back={
          cat?.status === "adopted"
            ? { href: links.adopted(cat.id), label: "Adoption record" }
            : { href: "/admin/cats", label: "Cats" }
        }
        actions={
          cat && (
            <>
              <Link href={links.publicCat(cat.slug)} target="_blank" className="btn-ghost">
                View on site ↗
              </Link>
              {cat.status !== "adopted" && (
                <Link href={links.adoptCat(cat.id)} className="btn-outline">
                  Mark as adopted
                </Link>
              )}
            </>
          )
        }
      />
      <CatForm key={cat?.id ?? "new"} cat={cat} onSave={saveDemoCat} upload={storeAsDataUrl} maxEdge={1000} />
    </>
  );
});

export const DemoAdoptCat = suspended(function DemoAdoptCat({ id: routeId }: { id: string }) {
  const id = useRecordId(routeId) ?? "";
  const application = useQuery("application");
  const router = useRouter();
  const db = useDemoDB();
  if (!db) return <Loading />;
  const cat = db.cats.find((c) => c.id === id);
  if (!cat) return <Empty>That cat doesn&apos;t exist.</Empty>;
  if (cat.status === "adopted") {
    return (
      <Empty>
        {cat.name} is already adopted. <Link href={links.adopted(cat.id)} className="underline">See the record</Link>
      </Empty>
    );
  }
  return (
    <>
      <PageHeader
        title={`${cat.name} is going home!`}
        description="This removes them from the website and keeps a record in the Adopted section."
        back={{ href: links.cat(cat.id), label: cat.name }}
      />
      <div className="max-w-[760px]">
        <AdoptionForm
          catId={cat.id}
          catName={cat.name}
          applicants={applicantOptions(db, cat.id)}
          defaultApplication={application}
          defaultFee={cat.adoption_fee}
          isNew
          action={adoptionAction(cat.id, () => router.push(links.adopted(cat.id)))}
        />
      </div>
    </>
  );
});

/* ------------------------------------------------------------- applications */

export const DemoApplications = suspended(function DemoApplications({ type }: { type: ApplicationType }) {
  const router = useRouter();
  const rawStatus = useQuery("status");
  const catQuery = useQuery("cat") ?? "";
  const catId = type === "adopt" ? catQuery : "";
  const meta = applicationListMeta[type];
  const db = useDemoDB();
  if (!db) return <Loading />;
  const status = APPLICATION_TABS.some((t) => t.value === rawStatus) ? rawStatus! : "new";
  const ofType = db.applications.filter((a) => a.type === type);
  const rows = ofType
    .filter((a) => (status === "all" || a.status === status) && (!catId || a.cat_id === catId))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const countBy = (s: string) => ofType.filter((a) => s === "all" || a.status === s).length;
  const href = (patch: Record<string, string>) => {
    const p = new URLSearchParams({ status, cat: catId, ...patch });
    for (const [k, v] of [...p]) if (!v) p.delete(k);
    return `${meta.href}?${p}`;
  };

  return (
    <>
      <PageHeader title={meta.title} description={meta.description} />
      <nav className="mb-4 flex gap-2 overflow-x-auto pb-1" aria-label="Application status">
        {APPLICATION_TABS.map((t) => (
          <Link key={t.value} href={href({ status: t.value })} className="pill" aria-current={status === t.value ? "page" : undefined}>
            {t.label} <span className="opacity-60">{countBy(t.value)}</span>
          </Link>
        ))}
      </nav>
      {type === "adopt" && (
        <form
          className="mb-6 flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(href({ cat: String(new FormData(e.currentTarget).get("cat") ?? "") }));
          }}
        >
          <label>
            <span className="field-label">Cat</span>
            <select name="cat" defaultValue={catId} className="field py-2">
              <option value="">Any cat</option>
              {[...db.cats]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </label>
          <button className="btn-outline py-2">Filter</button>
          {catId && (
            <Link href={href({ cat: "" })} className="py-2 text-sm text-muted underline">
              Clear
            </Link>
          )}
        </form>
      )}
      {rows.length === 0 ? (
        <Empty>No {type === "adopt" ? "adoption" : "foster"} applications here.</Empty>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {rows.map((a) => {
            const cat = db.cats.find((c) => c.id === a.cat_id);
            return (
              <li key={a.id}>
                <Link href={links.application(a.id)} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3.5 hover:bg-card/60 sm:px-5">
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{a.name}</span>
                    <span className="block truncate text-xs text-muted">
                      {type === "adopt" ? `${cat?.name ?? "No specific cat"} · ` : ""}
                      {a.city || "—"}
                    </span>
                  </span>
                  <span className="text-xs text-muted">{formatDate(a.created_at)}</span>
                  <ApplicationStatusBadge status={a.status} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
});

function decisionActions(app: Application, db: DemoDB) {
  const text = (fd: FormData, n: string) => String(fd.get(n) ?? "").trim();
  return {
    approve: async (_p: FormState, fd: FormData): Promise<FormState> => {
      updateApplication(app.id, { status: "approved", decided_at: new Date().toISOString() });
      const cat = db.cats.find((c) => c.id === app.cat_id);
      if (cat && fd.get("mark_pending") === "on" && cat.status === "available") setCatStatus(cat.id, "pending");
      return { message: `Approved.${fd.get("send_email") === "on" ? EMAIL_NOTE : ""}` };
    },
    reject: async (_p: FormState, fd: FormData): Promise<FormState> => {
      updateApplication(app.id, { status: "rejected", decided_at: new Date().toISOString() });
      return { message: `Marked as not a match.${fd.get("send_email") === "on" ? EMAIL_NOTE : ""}` };
    },
    schedule: async (_p: FormState, fd: FormData): Promise<FormState> => {
      const when = text(fd, "when");
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(when)) return { error: "Choose a date and time." };
      scheduleMeeting({
        application_id: app.id,
        starts_at: parseLocalDateTime(when).toISOString(),
        duration_minutes: Number(fd.get("duration")) || 60,
        location: text(fd, "location"),
        notes: text(fd, "notes"),
      });
      return { ok: true, message: `Meet & greet scheduled.${fd.get("send_email") === "on" ? EMAIL_NOTE : ""}` };
    },
  };
}

export const DemoApplication = suspended(function DemoApplication({ id: routeId }: { id: string }) {
  const id = useRecordId(routeId);
  const router = useRouter();
  const db = useDemoDB();
  const now = useNow();
  if (!db) return <Loading />;
  const app = db.applications.find((a) => a.id === id);
  if (!app) return <Empty>That application doesn&apos;t exist (it may have been deleted).</Empty>;
  const cat = db.cats.find((c) => c.id === app.cat_id);
  const meetings = meetingRows(db)
    .filter((m) => m.application_id === app.id)
    .sort((a, b) => b.starts_at.localeCompare(a.starts_at));
  const defaultWhen = `${toLocalInputValue(new Date(now + 2 * 86_400_000).toISOString()).slice(0, 10)}T18:00`;

  return (
    <>
      <PageHeader
        title={app.name}
        back={{ href: applicationListMeta[app.type].href, label: applicationListMeta[app.type].title }}
        description={`${applicationTypeLabel[app.type]} application · received ${formatDate(app.created_at)}`}
        actions={<ApplicationStatusBadge status={app.status} />}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Card title="Next step">
            <ApplicationActions
              id={app.id}
              firstName={app.name.split(" ")[0]}
              catName={cat?.name ?? null}
              catAvailable={cat?.status === "available"}
              type={app.type}
              defaultWhen={defaultWhen}
              actions={decisionActions(app, db)}
            />
            {(app.status === "approved" || app.status === "rejected") && (
              <button
                className="mt-4 block border-t border-line pt-4 text-sm text-muted underline underline-offset-2 hover:text-ink"
                onClick={() => updateApplication(app.id, { status: "new", decided_at: null })}
              >
                Move back to New
              </button>
            )}
            {app.status === "approved" && cat && cat.status !== "adopted" && (
              <Link href={links.adoptCat(cat.id, app.id)} className="btn-primary mt-4">
                Finalise adoption of {cat.name} →
              </Link>
            )}
          </Card>
          {meetings.length > 0 && (
            <Card title="Meet & greets">
              <MeetingList meetings={meetings} showApplicant={false} setStatus={setMeetingStatusAction} icsHref={icsHref} />
            </Card>
          )}
          <Card title="Their answers">
            <dl className="space-y-5">
              {applicationFields[app.type]
                .filter((f) => app.answers[f.name] !== undefined)
                .map((f) => {
                  const v = app.answers[f.name];
                  return (
                    <div key={f.name}>
                      <dt className="text-xs text-muted">{f.label}</dt>
                      <dd className="mt-0.5 whitespace-pre-wrap text-[15px]">{(Array.isArray(v) ? v.join(", ") : v) || "—"}</dd>
                    </div>
                  );
                })}
            </dl>
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="Contact">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-muted">Email</dt>
                <dd>
                  <a href={`mailto:${app.email}`} className="underline underline-offset-2">
                    {app.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Phone</dt>
                <dd>
                  <a href={`tel:${app.phone}`} className="underline underline-offset-2">
                    {app.phone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Town or city</dt>
                <dd>{app.city}</dd>
              </div>
              {app.type === "adopt" && (
                <div>
                  <dt className="text-xs text-muted">Cat</dt>
                  <dd>
                    {cat ? (
                      <Link href={links.cat(cat.id)} className="underline underline-offset-2">
                        {cat.name}
                      </Link>
                    ) : (
                      "No specific cat"
                    )}
                  </dd>
                </div>
              )}
            </dl>
          </Card>
          <Card title="Private notes">
            <ActionForm
              action={async (_p, fd) => {
                updateApplication(app.id, { admin_notes: String(fd.get("notes") ?? "").trim() });
                return { message: "Notes saved." };
              }}
            >
              <textarea name="notes" rows={6} className="field" defaultValue={app.admin_notes} placeholder="Only visible to rescue staff." />
              <SubmitButton className="btn-outline">Save notes</SubmitButton>
            </ActionForm>
          </Card>
          <button
            className="text-sm text-danger underline underline-offset-2"
            onClick={() => {
              if (window.confirm("Delete this application permanently?")) {
                deleteApplication(app.id);
                router.push(applicationListMeta[app.type].href);
              }
            }}
          >
            Delete application
          </button>
        </div>
      </div>
    </>
  );
});

/* ----------------------------------------------------------------- meetings */

export function DemoMeetings() {
  const db = useDemoDB();
  const now = useNow();
  if (!db) return <Loading />;
  const since = now - 3 * 3600_000;
  const rows = meetingRows(db);
  const upcoming = rows
    .filter((m) => m.status === "scheduled" && new Date(m.starts_at).getTime() >= since)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const past = rows
    .filter((m) => !upcoming.includes(m))
    .sort((a, b) => b.starts_at.localeCompare(a.starts_at));

  return (
    <>
      <PageHeader
        title="Meet & greets"
        description="Schedule them from an application. Each one has calendar links for you and an emailed invite for the applicant."
      />
      <div className="space-y-6">
        <Card title="Upcoming">
          {upcoming.length ? (
            <MeetingList meetings={upcoming} setStatus={setMeetingStatusAction} icsHref={icsHref} />
          ) : (
            <Empty>Nothing scheduled.</Empty>
          )}
        </Card>
        <Card title="Past & cancelled">
          {past.length ? (
            <MeetingList meetings={past} setStatus={setMeetingStatusAction} icsHref={icsHref} />
          ) : (
            <p className="text-sm text-muted">None yet.</p>
          )}
        </Card>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ adopted */

export const DemoAdopted = suspended(function DemoAdopted() {
  const router = useRouter();
  const q = useQuery("q");
  const db = useDemoDB();
  const now = useNow();
  if (!db) return <Loading />;
  const search = (q ?? "").trim().toLowerCase();
  const today = new Date(now).toISOString().slice(0, 10);
  const rows = db.cats
    .filter((c) => c.status === "adopted")
    .map((c) => ({ cat: c, adoption: db.adoptions.find((a) => a.cat_id === c.id) as Adoption | undefined }))
    .filter(
      ({ cat, adoption }) =>
        !search ||
        cat.name.toLowerCase().includes(search) ||
        adoption?.adopter_name.toLowerCase().includes(search) ||
        adoption?.adopter_email.toLowerCase().includes(search),
    )
    .sort((a, b) => (b.adoption?.adopted_on ?? "").localeCompare(a.adoption?.adopted_on ?? ""));

  return (
    <>
      <PageHeader title="Adopted" description="Every cat that has found a home, with who adopted them." />
      <form
        className="mb-6 flex max-w-md gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const value = String(new FormData(e.currentTarget).get("q") ?? "").trim();
          router.push(value ? `/admin/adopted?q=${encodeURIComponent(value)}` : "/admin/adopted");
        }}
      >
        <input type="search" name="q" defaultValue={search} placeholder="Search cat or adopter" className="field" aria-label="Search" />
        <button className="btn-outline">Search</button>
      </form>
      {rows.length === 0 ? (
        <Empty>{search ? "No matches." : "No adoptions recorded yet. Use “Mark adopted” on a cat when they go home."}</Empty>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ cat, adoption }) => {
            const cover = [...cat.cat_photos].sort((a, b) => a.position - b.position)[0];
            const followUpDue = adoption?.follow_up_on && adoption.follow_up_on <= today;
            return (
              <li key={cat.id}>
                <Link href={links.adopted(cat.id)} className="flex gap-4 rounded-2xl border border-line bg-white p-4 hover:border-ink">
                  <Thumb url={cover ? photoUrl(cover.path) : undefined} size={72} />
                  <div className="min-w-0">
                    <p className="font-serif text-xl leading-tight">{cat.name}</p>
                    <p className="truncate text-sm">{adoption?.adopter_name ?? "No adopter recorded"}</p>
                    <p className="text-xs text-muted">{adoption ? `Adopted ${formatDate(adoption.adopted_on)}` : ""}</p>
                    {followUpDue && <p className="mt-1 text-xs font-medium text-amber-700">Follow-up due</p>}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
});

export const DemoAdoptedCat = suspended(function DemoAdoptedCat({ id: routeId }: { id: string }) {
  const id = useRecordId(routeId) ?? "";
  const router = useRouter();
  const db = useDemoDB();
  if (!db) return <Loading />;
  const raw = db.cats.find((c) => c.id === id);
  if (!raw) return <Empty>That cat doesn&apos;t exist.</Empty>;
  const cat = toCatView(raw);
  const adoption = db.adoptions.find((a) => a.cat_id === id) ?? null;

  return (
    <>
      <PageHeader
        title={cat.name}
        description={catSummary(cat)}
        back={{ href: "/admin/adopted", label: "Adopted" }}
        actions={
          <Link href={links.cat(cat.id)} className="btn-outline">
            Edit cat details
          </Link>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <AdoptionForm
            catId={cat.id}
            catName={cat.name}
            record={adoption}
            applicants={applicantOptions(db, cat.id)}
            defaultFee={cat.adoption_fee}
            isNew={false}
            action={adoptionAction(cat.id)}
          />
        </div>
        <div className="space-y-6">
          <Card title="Photos">
            {cat.photos.length ? (
              <div className="grid grid-cols-3 gap-2">
                {cat.photos.map((p) => (
                  <a key={p.url} href={p.url} target="_blank" rel="noopener">
                    <Thumb url={p.url} alt={p.alt} size={88} />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">No photos.</p>
            )}
          </Card>
          <Card title="Cat details">
            <dl className="space-y-2 text-sm">
              {[
                ["Breed", cat.breed],
                ["Spayed / neutered", cat.spayed_neutered ? "Yes" : "No"],
                ["Vaccinated", cat.vaccinated ? "Yes" : "No"],
                ["Microchipped", cat.microchipped ? "Yes" : "No"],
                ...(cat.special_needs ? [["Special care", cat.special_needs_notes || "Yes"]] : []),
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-muted">{label}</dt>
                  <dd className="text-right">{value}</dd>
                </div>
              ))}
            </dl>
            {cat.description && <p className="mt-4 text-sm text-muted">{cat.description}</p>}
          </Card>
          {adoption?.application_id && (
            <Link href={links.application(adoption.application_id)} className="btn-outline w-full">
              View their application
            </Link>
          )}
          <button
            className="text-sm text-danger underline underline-offset-2"
            onClick={() => {
              if (window.confirm(`Put ${cat.name} back on the website as available? The adoption record will be deleted.`)) {
                returnToAvailable(cat.id);
                router.push(links.cat(cat.id));
              }
            }}
          >
            Adoption fell through? Return to available
          </button>
        </div>
      </div>
    </>
  );
});

/* ------------------------------------------------------------------ account */

export function DemoAccount() {
  return (
    <>
      <PageHeader title="Account" description="Logged in as brittany (demo)" />
      <Card title="Change password" className="max-w-md">
        <p className="text-sm text-muted">
          In the real site, you can change your password here, or reset it from the login page if you forget it. That
          isn&apos;t switched on in this demo.
        </p>
      </Card>
    </>
  );
}
