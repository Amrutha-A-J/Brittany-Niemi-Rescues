"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { submitApplication, type ApplyState } from "@/lib/application-actions";
import { applicationFields, contactFields, type FieldDef } from "@/lib/forms";
import type { ApplicationType } from "@/lib/types";

export function ApplicationForm({
  type,
  cats = [],
  defaultCat = "",
  submit = submitApplication,
}: {
  type: ApplicationType;
  cats?: { slug: string; name: string; status: string }[];
  defaultCat?: string;
  /** Defaults to the real server action; demo mode passes a browser-only one. */
  submit?: (prev: ApplyState, formData: FormData) => Promise<ApplyState>;
}) {
  const [state, action, pending] = useActionState<ApplyState, FormData>(submit, {});
  const [values, setValues] = useState<Record<string, string>>({ cat: defaultCat });
  const [started] = useState(() => Date.now());
  const errors = state.fieldErrors ?? {};

  if (state.ok) {
    const cat = cats.find((c) => c.slug === values.cat);
    return (
      <div className="rounded-2xl bg-card px-6 py-12 text-center sm:px-12">
        <p className="font-serif text-[32px] leading-tight">Thank you{values.name ? `, ${values.name.split(" ")[0]}` : ""}!</p>
        <p className="mx-auto mt-3 max-w-[420px] text-[15px] leading-relaxed text-muted">
          {type === "adopt"
            ? `Your application${cat ? ` for ${cat.name}` : ""} is on its way to us.`
            : "Your foster application is on its way to us."}{" "}
          We read every one personally and will be in touch within a few days. Check your inbox for a confirmation email.
        </p>
        <Link href="/adopt" className="btn-outline mt-8">
          Back to the cats
        </Link>
      </div>
    );
  }

  const set = (name: string, value: string) => setValues((v) => ({ ...v, [name]: value }));

  return (
    <form action={action} className="space-y-10" noValidate>
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="started" value={started} />
      <div aria-hidden className="absolute -left-[9999px]">
        <label>
          Website <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {type === "adopt" && (
        <fieldset>
          <legend className="font-serif text-2xl">Which cat?</legend>
          <label className="mt-4 block">
            <span className="field-label">The cat you&apos;d like to adopt</span>
            <select name="cat" className="field" value={values.cat ?? ""} onChange={(e) => set("cat", e.target.value)}>
              <option value="">Not sure yet, open to suggestions</option>
              {cats.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                  {c.status === "pending" ? " (adoption pending)" : ""}
                </option>
              ))}
            </select>
          </label>
        </fieldset>
      )}

      <fieldset>
        <legend className="font-serif text-2xl">About you</legend>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {contactFields.map((f) => (
            <Field key={f.name} field={f} value={values[f.name] ?? ""} onChange={set} error={errors[f.name]} />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-serif text-2xl">{type === "adopt" ? "Your home" : "Your home & fostering"}</legend>
        <div className="mt-4 space-y-6">
          {applicationFields[type]
            .filter((f) => !f.showIf || f.showIf.values.includes(values[f.showIf.field] ?? ""))
            .map((f) => (
              <Field key={f.name} field={f} value={values[f.name] ?? ""} onChange={set} error={errors[f.name]} />
            ))}
        </div>
      </fieldset>

      {state.error && (
        <p role="alert" className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">We only use your details to process this application.</p>
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Sending…" : "Send application"}
        </button>
      </div>
    </form>
  );
}

function Field({
  field: f,
  value,
  onChange,
  error,
}: {
  field: FieldDef;
  value: string;
  onChange: (name: string, value: string) => void;
  error?: string;
}) {
  const id = `f-${f.name}`;
  const label = (
    <>
      {f.label}
      {f.required && <span className="text-muted"> *</span>}
    </>
  );
  const describedBy = error ? `${id}-error` : f.hint ? `${id}-hint` : undefined;
  const common = {
    id,
    name: f.name,
    required: f.required,
    "aria-invalid": Boolean(error) || undefined,
    "aria-describedby": describedBy,
  };
  const footer = (
    <>
      {f.hint && !error && (
        <p id={`${id}-hint`} className="field-hint">
          {f.hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-danger">
          {error}
        </p>
      )}
    </>
  );
  const fieldClass = `field ${error ? "border-danger" : ""}`;

  if (f.type === "radio" || f.type === "checkboxes") {
    const selected = value ? value.split("|") : [];
    return (
      <fieldset aria-describedby={describedBy}>
        <legend className="field-label">{label}</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {f.options!.map((o) => (
            <label
              key={o}
              className="flex cursor-pointer items-center gap-2 rounded-full border border-line px-4 py-2 text-sm has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-white"
            >
              <input
                type={f.type === "radio" ? "radio" : "checkbox"}
                name={f.name}
                value={o}
                className="sr-only"
                checked={f.type === "radio" ? value === o : selected.includes(o)}
                onChange={(e) => {
                  if (f.type === "radio") onChange(f.name, o);
                  else
                    onChange(
                      f.name,
                      (e.target.checked ? [...selected, o] : selected.filter((s) => s !== o)).join("|"),
                    );
                }}
              />
              {o}
            </label>
          ))}
        </div>
        {footer}
      </fieldset>
    );
  }

  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {f.type === "textarea" ? (
        <textarea {...common} rows={3} className={fieldClass} value={value} onChange={(e) => onChange(f.name, e.target.value)} />
      ) : f.type === "select" ? (
        <select {...common} className={fieldClass} value={value} onChange={(e) => onChange(f.name, e.target.value)}>
          <option value="" disabled>
            Choose…
          </option>
          {f.options!.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      ) : (
        <input
          {...common}
          type={f.type}
          placeholder={f.placeholder}
          autoComplete={f.name === "name" ? "name" : f.name === "email" ? "email" : f.name === "phone" ? "tel" : f.name === "city" ? "address-level2" : undefined}
          className={fieldClass}
          value={value}
          onChange={(e) => onChange(f.name, e.target.value)}
        />
      )}
      {footer}
    </div>
  );
}
