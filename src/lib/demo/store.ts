"use client";

import { useSyncExternalStore } from "react";
import { slugify } from "@/lib/cats";
import { isDemo } from "./config";
import type { Adoption, Application, Cat, CatStatus, Meeting, MeetingStatus } from "@/lib/types";
import seed from "./seed.json";

export type DemoDB = {
  cats: Cat[];
  applications: Application[];
  meetings: Meeting[];
  adoptions: Adoption[];
};

// Bump when seed.json changes so visitors get the new sample data.
const KEY = "bnr-demo-v2";
const SESSION_KEY = "bnr-demo-session";

const fresh = (): DemoDB =>
  structuredClone({
    cats: seed.cats as unknown as Cat[],
    applications: seed.applications as unknown as Application[],
    meetings: seed.meetings as unknown as Meeting[],
    adoptions: seed.adoptions as unknown as Adoption[],
  });

let db: DemoDB | null = null;
const listeners = new Set<() => void>();

function load(): DemoDB {
  if (db) return db;
  try {
    const saved = localStorage.getItem(KEY);
    db = saved ? (JSON.parse(saved) as DemoDB) : fresh();
  } catch {
    db = fresh();
  }
  return db;
}

function commit(next: DemoDB) {
  db = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    throw new Error("This browser's demo storage is full. Remove some photos or reset the demo.");
  }
  listeners.forEach((l) => l());
}

function update(fn: (d: DemoDB) => void) {
  const next = structuredClone(load());
  fn(next);
  commit(next);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      db = null;
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

const noopSubscribe = () => () => {};
const none = () => null;

/** The demo database, or null during server render, before hydration, or outside demo mode. */
export function useDemoDB(): DemoDB | null {
  return useSyncExternalStore(isDemo ? subscribe : noopSubscribe, isDemo ? load : none, none);
}

export function getDemoDB(): DemoDB {
  return load();
}

const id = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
const now = () => new Date().toISOString();

export function resetDemo() {
  commit(fresh());
}

/* ---------------------------------------------------------------- login */

export const demoLogin = {
  check(username: string, password: string) {
    const ok = username.trim().toLowerCase() === seed.login.username && password === seed.login.password;
    if (ok) localStorage.setItem(SESSION_KEY, "1");
    return ok;
  },
  isLoggedIn() {
    try {
      return localStorage.getItem(SESSION_KEY) === "1";
    } catch {
      return false;
    }
  },
  logout() {
    localStorage.removeItem(SESSION_KEY);
  },
};

/* ----------------------------------------------------------------- cats */

export type DemoCatInput = Omit<Cat, "id" | "slug" | "status" | "created_at" | "updated_at" | "cat_photos"> & {
  id?: string;
  status: Exclude<CatStatus, "adopted">;
  photos: { path: string; alt: string }[];
};

export function saveCat(input: DemoCatInput): { id: string } {
  let savedId = input.id ?? "";
  update((d) => {
    const { photos, ...fields } = input;
    const cat_photos = photos.map((p, position) => ({ id: id("photo"), path: p.path, alt: p.alt, position }));
    const existing = input.id ? d.cats.find((c) => c.id === input.id) : undefined;
    if (existing) {
      Object.assign(existing, fields, {
        status: existing.status === "adopted" ? "adopted" : fields.status,
        cat_photos,
        updated_at: now(),
      });
    } else {
      const base = slugify(fields.name) || "cat";
      let slug = base;
      for (let n = 2; d.cats.some((c) => c.slug === slug); n++) slug = `${base}-${n}`;
      savedId = id("cat");
      d.cats.unshift({ ...fields, id: savedId, slug, cat_photos, created_at: now(), updated_at: now() } as Cat);
    }
  });
  return { id: savedId };
}

export function setCatStatus(catId: string, status: CatStatus) {
  update((d) => {
    const cat = d.cats.find((c) => c.id === catId);
    if (cat) Object.assign(cat, { status, updated_at: now() });
  });
}

export function deleteCat(catId: string) {
  update((d) => {
    d.cats = d.cats.filter((c) => c.id !== catId);
    d.adoptions = d.adoptions.filter((a) => a.cat_id !== catId);
    d.applications.forEach((a) => {
      if (a.cat_id === catId) a.cat_id = null;
    });
  });
}

/* --------------------------------------------------------- applications */

export function createApplication(app: Pick<Application, "type" | "cat_id" | "name" | "email" | "phone" | "city" | "answers">) {
  update((d) => {
    d.applications.unshift({ ...app, id: id("app"), status: "new", admin_notes: "", decided_at: null, created_at: now(), updated_at: now() });
  });
}

export function updateApplication(appId: string, patch: Partial<Application>) {
  update((d) => {
    const app = d.applications.find((a) => a.id === appId);
    if (app) Object.assign(app, patch, { updated_at: now() });
  });
}

export function deleteApplication(appId: string) {
  update((d) => {
    d.applications = d.applications.filter((a) => a.id !== appId);
    d.meetings = d.meetings.filter((m) => m.application_id !== appId);
  });
}

/* ------------------------------------------------------------- meetings */

export function scheduleMeeting(m: Pick<Meeting, "application_id" | "starts_at" | "duration_minutes" | "location" | "notes">) {
  update((d) => {
    d.meetings.push({ ...m, id: id("meet"), status: "scheduled", created_at: now() });
    const app = d.applications.find((a) => a.id === m.application_id);
    if (app && app.status === "new") app.status = "meet_scheduled";
  });
}

export function setMeetingStatus(meetingId: string, status: MeetingStatus) {
  update((d) => {
    const m = d.meetings.find((x) => x.id === meetingId);
    if (m) m.status = status;
  });
}

/* ------------------------------------------------------------ adoptions */

export function saveAdoption(record: Omit<Adoption, "id" | "created_at">) {
  update((d) => {
    const existing = d.adoptions.find((a) => a.cat_id === record.cat_id);
    if (existing) Object.assign(existing, record);
    else d.adoptions.push({ ...record, id: id("adopt"), created_at: now() });
    const cat = d.cats.find((c) => c.id === record.cat_id);
    if (cat) Object.assign(cat, { status: "adopted", updated_at: now() });
    const app = record.application_id ? d.applications.find((a) => a.id === record.application_id) : undefined;
    if (app && app.status !== "approved") Object.assign(app, { status: "approved", decided_at: now() });
  });
}

export function returnToAvailable(catId: string) {
  update((d) => {
    d.adoptions = d.adoptions.filter((a) => a.cat_id !== catId);
    const cat = d.cats.find((c) => c.id === catId);
    if (cat) Object.assign(cat, { status: "available", updated_at: now() });
  });
}

/** Read a photo file as a small JPEG data URL so it fits in browser storage. */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
