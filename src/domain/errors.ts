export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message?: string
  ) {
    super(message ?? code);
  }
}

export const Errors = {
  invalidMsisdn: () => new AppError("INVALID_MSISDN", 400, "Use 10-15 digits"),
  invalidPackageId: () => new AppError("INVALID_PACKAGE_ID", 400),
  packageNotFound: () => new AppError("PACKAGE_NOT_FOUND", 404),
  invoiceNotFound: () => new AppError("INVOICE_NOT_FOUND", 404),
  invoiceAlreadyPaid: () => new AppError("INVOICE_ALREADY_PAID", 409),
  missingInvoiceId: () => new AppError("INVOICE_ID_REQUIRED", 400),
};
