"use client";

import Link from "next/link";
import { useState } from "react";
import { meetingGoogleUrl, type MeetingRow } from "@/lib/admin/meetings";
import { formatDateTime } from "@/lib/calendar";
import { links } from "@/lib/links";

type Props = {
  meetings: MeetingRow[];
  showApplicant?: boolean;
  /** Form action that receives id, status and application_id. */
  setStatus: (formData: FormData) => void | Promise<void>;
  /** Link for the Apple/Outlook (.ics) download. Defaults to the server route. */
  icsHref?: (m: MeetingRow) => string;
};

const serverIcs = (m: MeetingRow) => `/admin/meetings/${m.id}/ics`;

export function MeetingList({ meetings, showApplicant = true, setStatus, icsHref = serverIcs }: Props) {
  const [now] = useState(() => Date.now());
  return (
    <ul className="divide-y divide-line">
      {meetings.map((m) => {
        const past = new Date(m.starts_at).getTime() < now;
        return (
          <li key={m.id} className="flex flex-wrap items-start justify-between gap-3 py-4 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <p className={`font-medium ${m.status === "cancelled" ? "text-muted line-through" : ""}`}>
                {formatDateTime(m.starts_at)} <span className="font-normal text-muted">· {m.duration_minutes} min</span>
              </p>
              {showApplicant && m.applications && (
                <p className="text-sm">
                  <Link href={links.application(m.applications.id)} className="underline underline-offset-2">
                    {m.applications.name}
                  </Link>
                  {m.applications.cats && <span className="text-muted"> for {m.applications.cats.name}</span>}
                </p>
              )}
              {m.location && <p className="text-sm text-muted">{m.location}</p>}
              {m.notes && <p className="mt-1 text-sm text-muted">{m.notes}</p>}
              {m.status !== "scheduled" && (
                <p className="mt-1 text-xs uppercase tracking-wide text-muted">{m.status === "completed" ? "Happened" : "Cancelled"}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {m.status === "scheduled" && (
                <>
                  <a href={meetingGoogleUrl(m)} target="_blank" rel="noopener" className="btn-ghost px-3 py-1.5 text-xs">
                    + Google Calendar
                  </a>
                  <a href={icsHref(m)} download="meet-and-greet.ics" className="btn-ghost px-3 py-1.5 text-xs">
                    + Apple / Outlook
                  </a>
                </>
              )}
              {m.status === "scheduled" && past && <StatusButton m={m} status="completed" label="Mark as happened" setStatus={setStatus} />}
              {m.status === "scheduled" && <StatusButton m={m} status="cancelled" label="Cancel" setStatus={setStatus} />}
              {m.status !== "scheduled" && <StatusButton m={m} status="scheduled" label="Undo" setStatus={setStatus} />}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function StatusButton({
  m,
  status,
  label,
  setStatus,
}: {
  m: MeetingRow;
  status: string;
  label: string;
  setStatus: Props["setStatus"];
}) {
  return (
    <form action={setStatus}>
      <input type="hidden" name="id" value={m.id} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="application_id" value={m.application_id} />
      <button className="btn-outline px-3 py-1.5 text-xs">{label}</button>
    </form>
  );
}
