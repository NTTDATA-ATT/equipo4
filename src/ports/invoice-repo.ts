import type { Invoice } from "../domain/types";

export interface InvoiceRepository {
  create(invoice: Invoice): Promise<void>;
  getById(id: string): Promise<Invoice | null>;
  update(invoice: Invoice): Promise<void>;
}
