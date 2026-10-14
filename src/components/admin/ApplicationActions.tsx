"use client";

import { useActionState, useState } from "react";
import { approveApplication, rejectApplication, scheduleMeeting } from "@/lib/admin/application-actions";
import type { FormState } from "@/lib/admin/auth-actions";
import { StatusMessage, SubmitButton } from "./Forms";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

type Props = {
  id: string;
  firstName: string;
  catName: string | null;
  catAvailable: boolean;
  type: "adopt" | "foster";
  defaultWhen: string;
  /** Defaults to the real server actions. */
  actions?: { approve: Action; reject: Action; schedule: Action };
};

const serverActions = { approve: approveApplication, reject: rejectApplication, schedule: scheduleMeeting };

export function ApplicationActions(props: Props) {
  const [tab, setTab] = useState<"meet" | "approve" | "reject" | null>(null);
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={tab === "meet" ? "btn-primary" : "btn-outline"} onClick={() => setTab(tab === "meet" ? null : "meet")}>
          Schedule meet &amp; greet
        </button>
        <button type="button" className={tab === "approve" ? "btn-primary" : "btn-outline"} onClick={() => setTab(tab === "approve" ? null : "approve")}>
          Approve
        </button>
        <button type="button" className={tab === "reject" ? "btn-primary" : "btn-outline"} onClick={() => setTab(tab === "reject" ? null : "reject")}>
          Reject
        </button>
      </div>
      <div className="mt-5">
        {tab === "meet" && <MeetForm {...props} />}
        {tab === "approve" && <DecisionForm kind="approve" {...props} />}
        {tab === "reject" && <DecisionForm kind="reject" {...props} />}
      </div>
    </div>
  );
}

function MeetForm({ id, defaultWhen, actions = serverActions }: Props) {
  const [state, action] = useActionState<FormState, FormData>(actions.schedule, {});
  return (
    <form action={action} className="space-y-4 rounded-xl bg-card p-4" onReset={(e) => !state.ok && e.preventDefault()}>
      <input type="hidden" name="id" value={id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="field-label">Date &amp; time (Moose Jaw time)</span>
          <input type="datetime-local" name="when" required defaultValue={defaultWhen} className="field" />
        </label>
        <label className="block">
          <span className="field-label">Length</span>
          <select name="duration" defaultValue="60" className="field">
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">1 hour</option>
            <option value="90">1.5 hours</option>
          </select>
        </label>
      </div>
      <label className="block">
        <span className="field-label">Where</span>
        <input name="location" className="field" placeholder="Foster home address, or a video call link" />
      </label>
      <label className="block">
        <span className="field-label">Note for the applicant (optional)</span>
        <textarea name="notes" rows={2} className="field" placeholder="e.g. Please bring a carrier if you plan to take them home." />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="send_email" defaultChecked className="h-4 w-4 accent-ink" />
        Email the applicant an invite with calendar links
      </label>
      <SubmitButton pendingText="Scheduling…">Schedule</SubmitButton>
      <StatusMessage state={state} />
    </form>
  );
}

function DecisionForm({
  kind,
  id,
  firstName,
  catName,
  catAvailable,
  type,
  actions = serverActions,
}: Props & { kind: "approve" | "reject" }) {
  const [state, action] = useActionState<FormState, FormData>(kind === "approve" ? actions.approve : actions.reject, {});
  const defaultMessage =
    kind === "approve"
      ? type === "adopt"
        ? `Great news: we'd love for ${catName ?? "one of our cats"} to join your family! We'll be in touch shortly to arrange the adoption agreement and pick-up.`
        : "Thank you for opening your home! We'd love to have you on the foster team. We'll be in touch soon about next steps."
      : `Thank you so much for your interest${catName ? ` in ${catName}` : ""} and for taking the time to apply. After careful thought, we don't think this is quite the right match right now. We really appreciate you choosing rescue, and we hope you'll keep an eye on our other cats.`;

  return (
    <form action={action} className="space-y-4 rounded-xl bg-card p-4" onReset={(e) => e.preventDefault()}>
      <input type="hidden" name="id" value={id} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="send_email" defaultChecked className="h-4 w-4 accent-ink" />
        Email {firstName}
      </label>
      <label className="block">
        <span className="field-label">Message</span>
        <textarea name="message" rows={5} className="field" defaultValue={defaultMessage} />
      </label>
      {kind === "approve" && type === "adopt" && catName && catAvailable && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="mark_pending" defaultChecked className="h-4 w-4 accent-ink" />
          Mark {catName} as &ldquo;adoption pending&rdquo; on the website
        </label>
      )}
      <SubmitButton className={kind === "approve" ? "btn-primary" : "btn-danger"} pendingText="Saving…">
        {kind === "approve" ? "Approve" : "Reject"}
      </SubmitButton>
      <StatusMessage state={state} />
    </form>
  );
}
