"use client";

import { forwardRef, useId } from "react";
import type {
  AnchorHTMLAttributes, ButtonHTMLAttributes, HTMLAttributes,
  InputHTMLAttributes, ReactNode,
} from "react";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";
export type Tone = "info" | "authority" | "warning" | "danger";
const cx = (...values: (string | undefined)[]) => values.filter(Boolean).join(" ");

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Keep action text meaningful: e.g. "Saving your choice…" */
  busy?: boolean;
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", busy = false, disabled, className, type = "button", children, ...props }, ref,
) {
  return <button {...props} ref={ref} type={type} className={cx("ma-button", className)} data-variant={variant} disabled={disabled || busy} aria-busy={busy || undefined}>{children}</button>;
});

/** Real anchor; Next Link may wrap with legacyBehavior/passHref or replace it with these classes. */
export const ActionLink = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: ButtonVariant }>(
  function ActionLink({ className, variant = "primary", ...props }, ref) {
    return <a {...props} ref={ref} className={cx("ma-button", className)} data-variant={variant} />;
  },
);

export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cx("ma-panel", className)} />;
}
export function Badge({ tone = "info", className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return <span {...props} className={cx("ma-badge", className)} data-tone={tone} />;
}
export function Notice({ tone = "info", title, children, className, ...props }: Omit<HTMLAttributes<HTMLDivElement>, "title"> & { tone?: Exclude<Tone, "authority">; title: string }) {
  return <div {...props} className={cx("ma-notice", className)} data-tone={tone}><strong>{title}</strong>{children && <div>{children}</div>}</div>;
}

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label: string;
  hint?: string;
  error?: string;
}
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, id, className, "aria-describedby": describedBy, ...props }, ref,
) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const descriptions = [describedBy, hint ? `${fieldId}-hint` : "", error ? `${fieldId}-error` : ""].filter(Boolean).join(" ");
  return <div className="ma-field">
    <label className="ma-label" htmlFor={fieldId}>{label}{props.required ? " (required)" : ""}</label>
    {hint && <p id={`${fieldId}-hint`} className="ma-help">{hint}</p>}
    <input {...props} ref={ref} id={fieldId} className={cx("ma-input", className)} aria-invalid={error ? true : props["aria-invalid"]} aria-describedby={descriptions || undefined} />
    {error && <p id={`${fieldId}-error`} className="ma-error">Error: {error}</p>}
  </div>;
});

export interface ConsentChoiceProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "children"> {
  label: string;
  description: string;
}
/** Unchecked unless a host supplies a stored choice. No inferred consent. */
export const ConsentChoice = forwardRef<HTMLInputElement, ConsentChoiceProps>(function ConsentChoice(
  { label, description, id, className, "aria-describedby": describedBy, ...props }, ref,
) {
  const generatedId = useId();
  const choiceId = id || generatedId;
  return <label className={cx("ma-choice", className)} htmlFor={choiceId}>
    <input {...props} id={choiceId} ref={ref} type="checkbox" aria-describedby={[describedBy, `${choiceId}-description`].filter(Boolean).join(" ")} />
    <span><strong>{label}</strong><small id={`${choiceId}-description`}>{description}</small></span>
  </label>;
});

export function LoadingState({ label = "Loading details" }: { label?: string }) {
  return <div className="ma-stack" role="status"><span className="ma-visually-hidden">{label}</span><div className="ma-skeleton" aria-hidden="true" /><div className="ma-skeleton" style={{ width: "70%" }} aria-hidden="true" /><div className="ma-skeleton" style={{ width: "45%" }} aria-hidden="true" /></div>;
}
export function EmptyState({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return <Panel className="ma-stack"><h3>{title}</h3><div className="ma-muted">{children}</div>{action && <div>{action}</div>}</Panel>;
}
/** Host owns the retry operation; this primitive does not invent a network request. */
export function ErrorState({ title = "We couldn’t load these details", children, onRetry, busy = false }: { title?: string; children: ReactNode; onRetry: () => void; busy?: boolean }) {
  return <Notice title={title} tone="danger" role="alert"><div className="ma-stack"><p>{children}</p><div><Button variant="secondary" onClick={onRetry} busy={busy}>{busy ? "Trying again…" : "Try again"}</Button></div></div></Notice>;
}
