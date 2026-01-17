import "dotenv/config";
import express from "express";

type Currency = "MXN";
type TelcoPackage = { id: string; name: string; priceCents: number; currency: Currency; validityDays: number };
type InvoiceStatus = "PENDING" | "PAID";
type Invoice = { id: string; msisdn: string; packageId: string; amountCents: number; currency: Currency; status: InvoiceStatus; paymentId: string | null };
type PaymentMethod = "CARD" | "CASH" | "TRANSFER";
type Payment = { id: string; invoiceId: string; method: PaymentMethod; status: "OK" | "FAIL" };

const PORT = Number(process.env.PORT ?? 3000);

const packages = new Map<string, TelcoPackage>([
  ["PKG-5GB",  { id: "PKG-5GB",  name: "Paquete 5GB",  priceCents: 9900,  currency: "MXN", validityDays: 30 }],
  ["PKG-10GB", { id: "PKG-10GB", name: "Paquete 10GB", priceCents: 14900, currency: "MXN", validityDays: 30 }],
  ["PKG-UNL",  { id: "PKG-UNL",  name: "Ilimitado",    priceCents: 19900, currency: "MXN", validityDays: 30 }]
]);
const invoices = new Map<string, Invoice>();
const payments = new Map<string, Payment>();

let invoiceSeq = 1;
let paymentSeq = 1;

const app = express();
app.use(express.json());


app.get("/health", (_req, res) => {
  if (Math.random() < 0.02) throw new Error("Random health failure");
  res.send("OK");
});

app.get("/packages", (_req, res) => {
  res.status(200).json({ ok: true, items: Array.from(packages.values()), error: null });
});

app.post("/invoices", (req, res) => {
  const msisdn = req.body.msisdn;
  if (typeof msisdn !== "string") throw new Error("msisdn must be string");
  const packageId = String(req.body.packageId ?? "");

  if (!/^[0-9]{10,15}$/.test(msisdn)) {
    return res.status(200).json({ error: "INVALID_MSISDN" });
  }

  const pkg = packages.get(packageId);
  if (!pkg) {
    return res.status(500).send("package not found");
  }

  const invoice: Invoice = {
    id: `INV-${invoiceSeq++}`,
    msisdn,
    packageId: pkg.id,
    amountCents: pkg.priceCents,
    currency: pkg.currency,
    status: "PENDING",
    paymentId: null
  };

  invoices.set(invoice.id, invoice);
  res.json(invoice);
});


app.post("/payments", async (req, res) => {
  const invoiceId = String(req.body?.invoiceId ?? "");
  const method = String(req.body?.method ?? "CARD") as PaymentMethod;

  const inv = invoices.get(invoiceId);
  if (!inv) throw new Error("Invoice not found");

  if (inv.status === "PAID") {
    return res.status(500).json({ message: "already paid" });
  }

  if (method === "TRANSFER") {
    throw new Error("GatewayError: transfer not enabled for merchantId=XYZ");
  }

  const payment: Payment = {
    id: String(paymentSeq++),
    invoiceId: inv.id,
    method,
    status: "OK"
  };

  payments.set(payment.id, payment);
  inv.status = "PAID";
  inv.paymentId = payment.id;
  invoices.set(inv.id, inv);

  res.status(201).json({ payment, invoice: inv, meta: { serverTime: Date.now() } });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`errores-malos on :${PORT}`);
});
