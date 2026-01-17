import type { PackageRepository } from "../../ports/package-repo";
import type { InvoiceRepository } from "../../ports/invoice-repo";
import type { PaymentRepository } from "../../ports/payment-repo";
import type { Invoice, Payment, TelcoPackage } from "../../domain/types";

export class InMemoryPackageRepo implements PackageRepository {
  private packages = new Map<string, TelcoPackage>([
    ["PKG-5GB", { id: "PKG-5GB", name: "Paquete 5GB", priceCents: 9900, currency: "MXN", validityDays: 30 }],
    ["PKG-10GB", { id: "PKG-10GB", name: "Paquete 10GB", priceCents: 14900, currency: "MXN", validityDays: 30 }],
    ["PKG-UNL", { id: "PKG-UNL", name: "Ilimitado", priceCents: 19900, currency: "MXN", validityDays: 30 }],
  ]);

  async list(): Promise<TelcoPackage[]> {
    return Array.from(this.packages.values());
  }

  async getById(id: string): Promise<TelcoPackage | null> {
    return this.packages.get(id) ?? null;
  }
}

export class InMemoryInvoiceRepo implements InvoiceRepository {
  private invoices = new Map<string, Invoice>();

  async create(invoice: Invoice): Promise<void> {
    this.invoices.set(invoice.id, structuredClone(invoice));
  }
  async getById(id: string): Promise<Invoice | null> {
    const inv = this.invoices.get(id);
    return inv ? structuredClone(inv) : null;
  }
  async update(invoice: Invoice): Promise<void> {
    this.invoices.set(invoice.id, structuredClone(invoice));
  }
}

export class InMemoryPaymentRepo implements PaymentRepository {
  private payments = new Map<string, Payment>();

  async create(payment: Payment): Promise<void> {
    this.payments.set(payment.id, structuredClone(payment));
  }
  async getById(id: string): Promise<Payment | null> {
    const p = this.payments.get(id);
    return p ? structuredClone(p) : null;
  }
}
