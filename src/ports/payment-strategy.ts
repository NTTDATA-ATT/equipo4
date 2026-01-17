import type { PaymentMethod } from "../domain/types";

export interface PaymentStrategy {
  supports(method: PaymentMethod): boolean;
  charge(amountCents: number): Promise<{ ok: boolean }>;
}
