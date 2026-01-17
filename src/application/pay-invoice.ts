import type { InvoiceRepository } from "../ports/invoice-repo";
import type { PaymentRepository } from "../ports/payment-repo";
import type { PaymentStrategy } from "../ports/payment-strategy";
import type { IdGenerator } from "../ports/id-generator";
import type { Payment, PaymentMethod } from "../domain/types";
import { Errors } from "../domain/errors";

export class PayInvoice {
  constructor(
    private readonly invoices: InvoiceRepository,
    private readonly payments: PaymentRepository,
    private readonly strategies: PaymentStrategy[],
    private readonly paymentIds: IdGenerator
  ) {}

  private strategyFor(method: PaymentMethod): PaymentStrategy {
    const s = this.strategies.find(x => x.supports(method));
    if (!s) throw Errors.invalidPaymentMethod();
    return s;
  }

  async execute(input: { invoiceId: string; method: PaymentMethod }): Promise<{ payment: Payment }> {
    const inv = await this.invoices.getById(input.invoiceId);
    if (!inv) throw Errors.invoiceNotFound();
    if (inv.status === "PAID") throw Errors.invoiceAlreadyPaid();

    const result = await this.strategyFor(input.method).charge(inv.amountCents);

    const payment: Payment = {
      id: this.paymentIds.next(),
      invoiceId: inv.id,
      method: input.method,
      status: result.ok ? "OK" : "FAIL",
    };

    await this.payments.create(payment);

    if (payment.status === "OK") {
      inv.status = "PAID";
      inv.paymentId = payment.id;
      await this.invoices.update(inv);
    }

    return { payment };
  }
}
