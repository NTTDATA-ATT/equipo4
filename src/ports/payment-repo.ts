import type { Payment } from "../domain/types";

export interface PaymentRepository {
  create(payment: Payment): Promise<void>;
  getById(id: string): Promise<Payment | null>;
}
