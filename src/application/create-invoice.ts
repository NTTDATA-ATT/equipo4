import type { PackageRepository } from "../ports/package-repo";
import type { InvoiceRepository } from "../ports/invoice-repo";
import type { IdGenerator } from "../ports/id-generator";
import type { Invoice } from "../domain/types";
import { Errors } from "../domain/errors";
import { isMsisdnValid } from "../domain/validation";

export class CreateInvoice {
  constructor(
    private readonly packages: PackageRepository,
    private readonly invoices: InvoiceRepository,
    private readonly invoiceIds: IdGenerator
  ) {}

  async execute(input: { msisdn: unknown; packageId: unknown }): Promise<Invoice> {
    if (!isMsisdnValid(input.msisdn)) throw Errors.invalidMsisdn();
    if (typeof input.packageId !== "string" || !input.packageId.trim()) throw Errors.invalidPackageId();

    const pkg = await this.packages.getById(input.packageId);
    if (!pkg) throw Errors.packageNotFound();

    const invoice: Invoice = {
      id: this.invoiceIds.next(),
      msisdn: input.msisdn,
      packageId: pkg.id,
      amountCents: pkg.priceCents,
      currency: pkg.currency,
      status: "PENDING",
      paymentId: null,
    };

    await this.invoices.create(invoice);
    return invoice;
  }
}
