"use client";

import { useActionState, useState } from "react";
import { saveAdoption } from "@/lib/admin/adoption-actions";
import type { FormState } from "@/lib/admin/auth-actions";
import type { Adoption } from "@/lib/types";
import { StatusMessage, SubmitButton } from "./Forms";

export type ApplicantOption = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  label: string;
};

export function AdoptionForm({
  catId,
  catName,
  record,
  applicants,
  defaultApplication,
  defaultFee,
  isNew,
}: {
  catId: string;
  catName: string;
  record?: Adoption | null;
  applicants: ApplicantOption[];
  defaultApplication?: string;
  defaultFee?: number | null;
  isNew: boolean;
}) {
  const [state, action] = useActionState<FormState, FormData>(saveAdoption, {});
  const initialApp = applicants.find((a) => a.id === (record?.application_id ?? defaultApplication));
  const [{ today, in2Weeks }] = useState(() => {
    const now = new Date();
    return {
      today: now.toISOString().slice(0, 10),
      in2Weeks: new Date(now.getTime() + 14 * 86_400_000).toISOString().slice(0, 10),
    };
  });

  const [v, setV] = useState({
    application_id: initialApp?.id ?? "",
    adopter_name: record?.adopter_name ?? initialApp?.name ?? "",
    adopter_email: record?.adopter_email ?? initialApp?.email ?? "",
    adopter_phone: record?.adopter_phone ?? initialApp?.phone ?? "",
    adopter_address: record?.adopter_address ?? initialApp?.city ?? "",
  });
  const set = (k: keyof typeof v, value: string) => setV((s) => ({ ...s, [k]: value }));

  return (
    <form action={action} className="space-y-6" onReset={(e) => e.preventDefault()}>
      <input type="hidden" name="cat_id" value={catId} />
      <input type="hidden" name="redirect" value={isNew ? "1" : "0"} />

      <section className="space-y-4 rounded-2xl border border-line bg-white p-5 sm:p-6">
        <h2 className="text-sm font-semibold">Adopter</h2>
        <label className="block">
          <span className="field-label">From an application</span>
          <select
            name="application_id"
            className="field"
            value={v.application_id}
            onChange={(e) => {
              const a = applicants.find((x) => x.id === e.target.value);
              setV(
                a
                  ? { application_id: a.id, adopter_name: a.name, adopter_email: a.email, adopter_phone: a.phone, adopter_address: a.city }
                  : { ...v, application_id: "" },
              );
            }}
          >
            <option value="">None, I&apos;ll type their details</option>
            {applicants.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
          <span className="field-hint">Choosing an application fills in their details below.</span>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="field-label">Name *</span>
            <input name="adopter_name" required className="field" value={v.adopter_name} onChange={(e) => set("adopter_name", e.target.value)} />
          </label>
          <label className="block">
            <span className="field-label">Email</span>
            <input name="adopter_email" type="email" className="field" value={v.adopter_email} onChange={(e) => set("adopter_email", e.target.value)} />
          </label>
          <label className="block">
            <span className="field-label">Phone</span>
            <input name="adopter_phone" className="field" value={v.adopter_phone} onChange={(e) => set("adopter_phone", e.target.value)} />
          </label>
          <label className="block">
            <span className="field-label">Address</span>
            <input name="adopter_address" className="field" value={v.adopter_address} onChange={(e) => set("adopter_address", e.target.value)} />
          </label>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-line bg-white p-5 sm:p-6">
        <h2 className="text-sm font-semibold">Adoption details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="field-label">Adoption date</span>
            <input name="adopted_on" type="date" className="field" defaultValue={record?.adopted_on ?? today} />
          </label>
          <label className="block">
            <span className="field-label">Fee paid ($)</span>
            <input name="fee_paid" inputMode="decimal" className="field" defaultValue={record?.fee_paid ?? defaultFee ?? ""} />
          </label>
          <label className="block">
            <span className="field-label">Microchip number</span>
            <input name="microchip_number" className="field" defaultValue={record?.microchip_number ?? ""} />
          </label>
          <label className="block">
            <span className="field-label">Follow up on</span>
            <input name="follow_up_on" type="date" className="field" defaultValue={record?.follow_up_on ?? (isNew ? in2Weeks : "")} />
          </label>
        </div>
        <label className="block">
          <span className="field-label">Notes</span>
          <textarea name="notes" rows={4} className="field" defaultValue={record?.notes ?? ""} placeholder="Contract signed, food sent home, etc." />
        </label>
      </section>

      <div className="flex items-center gap-3">
        <SubmitButton>{isNew ? `Mark ${catName} as adopted 🎉` : "Save changes"}</SubmitButton>
      </div>
      <StatusMessage state={state} />
    </form>
  );
}
