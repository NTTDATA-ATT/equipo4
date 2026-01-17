import type { PaymentStrategy } from "../../ports/payment-strategy";
import type { PaymentMethod } from "../../domain/types";

class CardStrategy implements PaymentStrategy {
  supports(method: PaymentMethod): boolean { return method === "CARD"; }
  async charge(_amountCents: number): Promise<{ ok: boolean }> { return { ok: true }; }
}

class CashStrategy implements PaymentStrategy {
  supports(method: PaymentMethod): boolean { return method === "CASH"; }
  async charge(_amountCents: number): Promise<{ ok: boolean }> { return { ok: true }; }
}

class TransferStrategy implements PaymentStrategy {
  supports(method: PaymentMethod): boolean { return method === "TRANSFER"; }
  async charge(_amountCents: number): Promise<{ ok: boolean }> {
    // Contrato estable: no lanzar excepciones sorpresa
    return { ok: false };
  }
}

export function defaultPaymentStrategies(): PaymentStrategy[] {
  return [new CardStrategy(), new CashStrategy(), new TransferStrategy()];
}
