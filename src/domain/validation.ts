import type { PaymentMethod } from "./types";

export function nowIso(): string {
  return new Date().toISOString();
}

export function isMsisdnValid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9]{10,15}$/.test(value);
}

export function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export function parsePaymentMethod(value: unknown): PaymentMethod {
  return value === "CASH" || value === "TRANSFER" || value === "CARD"
    ? value
    : "CARD";
}
