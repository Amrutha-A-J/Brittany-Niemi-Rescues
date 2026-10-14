"use client";

/** Fosters screens for demo mode, backed by the browser-only demo store. */
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { FormState } from "@/lib/admin/auth-actions";
import {
  addPlacement,
  deleteFoster,
  endPlacement,
  getDemoDB,
  removePlacement,
  saveFoster,
  useDemoDB,
  type DemoFosterInput,
} from "@/lib/demo/store";
import { FOSTER_KINDS } from "@/lib/fosters";
import { links } from "@/lib/links";
import { FosterDetail, FosterDetailsForm, FosterList } from "../admin/Fosters";
import { Card, Empty, PageHeader } from "../admin/ui";

const loading = <div className="h-64 animate-pulse rounded-2xl bg-card" />;

function readFoster(fd: FormData): DemoFosterInput {
  const text = (n: string) => String(fd.get(n) ?? "").trim();
  return {
    name: text("name"),
    email: text("email"),
    phone: text("phone"),
    city: text("city"),
    can_foster: fd.getAll("can_foster").map(String).filter((k) => FOSTER_KINDS.includes(k)),
    notes: text("notes"),
    on_break: fd.get("on_break") === "on",
  };
}

export function DemoFosters() {
  const db = useDemoDB();
  return (
    <>
      <PageHeader
        title="Fosters"
        description="Everyone who fosters for the rescue, and every cat they've taken in."
        actions={
          <Link href="/admin/fosters/new" className="btn-primary">
            + Add a foster
          </Link>
        }
      />
      {db ? (
        <FosterList
          fosters={db.fosters.map((f) => ({ ...f, foster_placements: db.foster_placements.filter((p) => p.foster_id === f.id) }))}
        />
      ) : (
        loading
      )}
    </>
  );
}

export function DemoNewFoster() {
  const router = useRouter();
  return (
    <>
      <PageHeader
        title="Add a foster"
        description="For someone who has fostered before, or who you've arranged with directly."
        back={{ href: "/admin/fosters", label: "Fosters" }}
      />
      <Card className="max-w-xl">
        <FosterDetailsForm
          submitLabel="Add foster"
          action={async (_prev: FormState, fd: FormData): Promise<FormState> => {
            const input = readFoster(fd);
            if (!input.name) return { error: "Add their name." };
            router.push(links.foster(saveFoster(input)));
            return {};
          }}
        />
      </Card>
    </>
  );
}

export function DemoFoster({ id }: { id: string }) {
  return (
    <Suspense fallback={loading}>
      <DemoFosterInner routeId={id} />
    </Suspense>
  );
}

function DemoFosterInner({ routeId }: { routeId: string }) {
  const router = useRouter();
  const queryId = useSearchParams().get("id");
  const id = routeId === "_" ? queryId : routeId;
  const db = useDemoDB();
  if (!db) return loading;
  const foster = db.fosters.find((f) => f.id === id);
  if (!foster) return <Empty>That foster doesn&apos;t exist (they may have been removed).</Empty>;

  const text = (fd: FormData, n: string) => String(fd.get(n) ?? "").trim();
  return (
    <FosterDetail
      foster={{ ...foster, foster_placements: db.foster_placements.filter((p) => p.foster_id === foster.id) }}
      cats={db.cats.filter((c) => c.status !== "adopted").map((c) => ({ id: c.id, name: c.name }))}
      actions={{
        save: async (_p, fd) => {
          const input = readFoster(fd);
          if (!input.name) return { error: "Add their name." };
          saveFoster({ ...input, id: foster.id });
          return { message: "Saved." };
        },
        addPlacement: async (_p, fd) => {
          const catId = text(fd, "cat_id");
          const catName = catId ? (getDemoDB().cats.find((c) => c.id === catId)?.name ?? "") : text(fd, "cat_name");
          if (!catName) return { error: "Choose a cat, or type the name of a cat from before the website." };
          const startedOn = text(fd, "started_on");
          if (!startedOn) return { error: "Add the date they started fostering." };
          addPlacement({
            foster_id: foster.id,
            cat_id: catId || null,
            cat_name: catName,
            started_on: startedOn,
            ended_on: text(fd, "ended_on") || null,
            notes: text(fd, "notes"),
          });
          return { ok: true, message: `Added ${catName}.` };
        },
        endPlacement: (fd) => endPlacement(text(fd, "id"), text(fd, "ended_on")),
        removePlacement: (fd) => removePlacement(text(fd, "id")),
        remove: (fd) => {
          deleteFoster(text(fd, "id"));
          router.push("/admin/fosters");
        },
      }}
    />
  );
}
