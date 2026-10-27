"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/lib/admin/auth-actions";

export function SubmitButton({
  children,
  pendingText = "Saving…",
  className = "btn-primary",
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? pendingText : children}
    </button>
  );
}

export function StatusMessage({ state }: { state: FormState }) {
  if (state.error)
    return (
      <p role="alert" className="rounded-xl border border-danger/30 bg-danger/5 px-3.5 py-2.5 text-sm text-danger">
        {state.error}
      </p>
    );
  if (state.message)
    return (
      <p role="status" className="rounded-xl border border-success/30 bg-success/5 px-3.5 py-2.5 text-sm text-success">
        {state.message}
      </p>
    );
  return null;
}

/** A password field with a Show/Hide button. */
export function PasswordInput(props: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [shown, setShown] = useState(false);
  return (
    <span className="relative block">
      <input {...props} type={shown ? "text" : "password"} className={`field pr-16 ${props.className ?? ""}`.trim()} />
      <button
        type="button"
        onClick={() => setShown((v) => !v)}
        aria-label={shown ? "Hide password" : "Show password"}
        aria-pressed={shown}
        className="absolute inset-y-0 right-0 px-3.5 text-[13px] font-medium text-muted hover:text-ink"
      >
        {shown ? "Hide" : "Show"}
      </button>
    </span>
  );
}

/** A form bound to a `(prev, formData) => FormState` server action. */
export function ActionForm({
  action,
  children,
  className = "space-y-4",
  resetOnSuccess = false,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form
      action={formAction}
      className={className}
      onReset={resetOnSuccess ? undefined : (e) => e.preventDefault()}
    >
      {children}
      <StatusMessage state={state} />
    </form>
  );
}

export function ConfirmSubmit({
  children,
  message,
  className = "btn-danger",
}: {
  children: React.ReactNode;
  message: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {pending ? "Working…" : children}
    </button>
  );
}
