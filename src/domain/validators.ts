export function isValidMsisdn(v: string): boolean {
  // simple MX example: 10 digits
  return /^\d{10}$/.test(v);
}

export function assertPositiveAmount(v: number) {
  if (!Number.isFinite(v) || v <= 0) {
    throw new Error("INVALID_AMOUNT");
  }
}
