export type Currency = "MXN";

export type TelcoPackage = {
  id: string;
  name: string;
  priceCents: number;
  currency: Currency;
  validityDays: number;
};

export type InvoiceStatus = "PENDING" | "PAID";

export type Invoice = {
  id: string;
  msisdn: string;
  packageId: string;
  amountCents: number;
  currency: Currency;
  status: InvoiceStatus;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  paymentId: string | null;
};

export type PaymentMethod = "CARD" | "CASH" | "TRANSFER";
export type PaymentStatus = "SUCCEEDED";

export type Payment = {
  id: string;
  invoiceId: string;
  amountCents: number;
  currency: Currency;
  method: PaymentMethod;
  status: PaymentStatus;
  createdAt: string;
};
