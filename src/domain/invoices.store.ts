export type InvoiceStatus = "PENDING" | "PAID";

export type Invoice = {
  id: string;
  msisdn: string;
  amount: number;
  status: InvoiceStatus;
  createdAt: string;
};

const now = () => new Date().toISOString();

const invoices: Invoice[] = [
  { id: "INV-001", msisdn: "5512345678", amount: 199, status: "PENDING", createdAt: now() },
  { id: "INV-002", msisdn: "5598765432", amount: 299, status: "PENDING", createdAt: now() }
];

export const InvoicesStore = {
  list(): Invoice[] {
    return invoices;
  },
  findById(id: string): Invoice | undefined {
    return invoices.find((i) => i.id === id);
  },
  pay(id: string): { paymentId: string; invoice: Invoice } {
    const inv = invoices.find((i) => i.id === id);
    if (!inv) throw new Error("INVOICE_NOT_FOUND");
    if (inv.status === "PAID") throw new Error("INVOICE_ALREADY_PAID");
    inv.status = "PAID";
    return { paymentId: `PAY-${id}-${Date.now()}`, invoice: inv };
  }
};
