import { applicationFields, keyAnswers } from "@/lib/forms";
import type { Application } from "@/lib/types";
import { Modal } from "./Modal";
import { Card, rowButton } from "./ui";

const answer = (v: string | string[] | undefined) => (Array.isArray(v) ? v.join(", ") : v) || "";

/** Contact details and the key answers at a glance, with every answer one click away. */
export function ApplicationSummary({ app, cat }: { app: Application; cat: React.ReactNode }) {
  const keys = keyAnswers[app.type].filter((k) => answer(app.answers[k.name]));
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Summary</h2>
        <Modal title={`${app.name}'s answers`} buttonLabel="All answers" buttonClassName={rowButton}>
          <dl className="space-y-5">
            {applicationFields[app.type]
              .filter((f) => app.answers[f.name] !== undefined)
              .map((f) => (
                <div key={f.name}>
                  <dt className="text-xs text-muted">{f.label}</dt>
                  <dd className="mt-0.5 whitespace-pre-wrap text-[15px]">{answer(app.answers[f.name]) || "—"}</dd>
                </div>
              ))}
          </dl>
        </Modal>
      </div>
      <dl className="space-y-3 text-sm">
        <Item label="Email">
          <a href={`mailto:${app.email}`} className="underline underline-offset-2">
            {app.email}
          </a>
        </Item>
        <Item label="Phone">
          <a href={`tel:${app.phone}`} className="underline underline-offset-2">
            {app.phone}
          </a>
        </Item>
        <Item label="Town or city">{app.city}</Item>
        <Item label="Cat">{cat}</Item>
      </dl>
      {keys.length > 0 && (
        <dl className="mt-4 space-y-3 border-t border-line pt-4 text-sm">
          {keys.map((k) => (
            <Item key={k.name} label={k.label}>
              <span className="whitespace-pre-wrap">{answer(app.answers[k.name])}</span>
            </Item>
          ))}
        </dl>
      )}
    </Card>
  );
}

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3">
      <dt className="text-xs leading-5 text-muted">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}
