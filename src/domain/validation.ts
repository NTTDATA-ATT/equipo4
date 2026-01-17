import type { PaymentMethod } from "./types";
import { Errors } from "./errors";

export function isMsisdnValid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9]{10,15}$/.test(value);
}

export function parsePaymentMethod(value: unknown): PaymentMethod {
  if (value === "CARD" || value === "CASH" || value === "TRANSFER") return value;
  throw Errors.invalidPaymentMethod();
}
