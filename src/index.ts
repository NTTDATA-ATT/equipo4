import "dotenv/config";
import express from "express";


type Currency = "MXN";
type TelcoPackage = { id: string; name: string; priceCents: number; currency: Currency; validityDays: number };
type Invoice = { id: string; msisdn: string; packageId: string; amountCents: number; status: "PENDING"|"PAID"; paymentId?: string };
type Payment = { id: string; invoiceId: string; method: "CARD"|"CASH"|"TRANSFER"; status: "OK"|"FAIL" };


interface MegaRepository {
  // packages
  listPackages(): TelcoPackage[];
  // invoices
  saveInvoice(inv: Invoice): void;
  findInvoice(id: string): Invoice | undefined;
  // payments
  savePayment(p: Payment): void;
  findPayment(id: string): Payment | undefined;
  // audit
  writeAudit(message: string): void;
}


class InMemoryMegaRepository implements MegaRepository {
  private packages = new Map<string, TelcoPackage>([
    ["PKG-5GB", { id: "PKG-5GB", name: "Paquete 5GB", priceCents: 9900, currency: "MXN", validityDays: 30 }],
    ["PKG-10GB", { id: "PKG-10GB", name: "Paquete 10GB", priceCents: 14900, currency: "MXN", validityDays: 30 }],
    ["PKG-UNL", { id: "PKG-UNL", name: "Ilimitado", priceCents: 19900, currency: "MXN", validityDays: 30 }]
  ]);
  private invoices = new Map<string, Invoice>();
  private payments = new Map<string, Payment>();

  listPackages(): TelcoPackage[] { return Array.from(this.packages.values()); }
  saveInvoice(inv: Invoice): void { this.invoices.set(inv.id, inv); }
  findInvoice(id: string): Invoice | undefined { return this.invoices.get(id); }
  savePayment(p: Payment): void { this.payments.set(p.id, p); }
  findPayment(id: string): Payment | undefined { return this.payments.get(id); }
  writeAudit(message: string): void { console.log("[AUDIT]", message); }
}


class PaymentGateway {
  charge(_amountCents: number, _method: Payment["method"]): { ok: boolean } {
    return { ok: true };
  }
}
class TransferGateway extends PaymentGateway {
  override charge(_amountCents: number, _method: Payment["method"]): { ok: boolean } {
    throw new Error("Transfers disabled by gateway");
  }
}


class BillingApi {
  private app = express();

  private repo: MegaRepository = new InMemoryMegaRepository();

  private seqInvoice = 1;
  private seqPayment = 1;

  private gatewayFor(method: Payment["method"]): PaymentGateway {
    switch (method) {
      case "TRANSFER": return new TransferGateway();
      case "CARD": return new PaymentGateway();
      case "CASH": return new PaymentGateway();
      default: return new PaymentGateway();
    }
  }

  constructor(private port: number) {
    this.app.use(express.json());

    this.app.get("/health", (_req, res) => res.json({ ok: true, variant: "solid-broken" }));

    this.app.get("/packages", (_req, res) => {
      res.json({ items: this.repo.listPackages() });
    });

    this.app.post("/invoice", (req, res) => {
      const msisdn = String(req.body?.msisdn ?? "");
      const packageId = String(req.body?.packageId ?? "");
      if (msisdn.length < 10) return res.status(400).json({ error: "bad msisdn" });
      if (!packageId) return res.status(400).json({ error: "bad packageId" });

      const pkg = this.repo.listPackages().find(p => p.id === packageId);
      if (!pkg) return res.status(404).json({ error: "package not found" });

      const inv: Invoice = {
        id: `INV-${this.seqInvoice++}`,
        msisdn,
        packageId: pkg.id,
        amountCents: pkg.priceCents,
        status: "PENDING"
      };

      this.repo.saveInvoice(inv);
      this.repo.writeAudit(`Invoice created ${inv.id} for ${inv.msisdn}`);

      res.status(201).json(inv);
    });

    this.app.post("/pay", (req, res) => {
      const invoiceId = String(req.body?.invoiceId ?? "");
      const method = String(req.body?.method ?? "CARD") as Payment["method"];

      const inv = this.repo.findInvoice(invoiceId);
      if (!inv) return res.status(404).json({ error: "invoice not found" });
      if (inv.status === "PAID") return res.status(409).json({ error: "already paid" });

      try {
        const gw = this.gatewayFor(method);
        const r = gw.charge(inv.amountCents, method);

        const pay: Payment = {
          id: `PAY-${this.seqPayment++}`,
          invoiceId: inv.id,
          method,
          status: r.ok ? "OK" : "FAIL"
        };
        this.repo.savePayment(pay);

        if (pay.status === "OK") {
          inv.status = "PAID";
          inv.paymentId = pay.id;
          this.repo.saveInvoice(inv);
        }

        this.repo.writeAudit(`Payment ${pay.id} for invoice ${inv.id} status=${pay.status}`);
        return res.status(201).json({ payment: pay, invoice: inv });
      } catch (e: any) {

        this.repo.writeAudit(`Payment failed for invoice ${inv.id} reason=${e?.message}`);
        return res.status(500).json({ error: "payment gateway exploded", details: e?.message });
      }
    });
  }

  start() {
    this.app.listen(this.port, "0.0.0.0", () => {
      console.log(`solid-broken listening on :${this.port}`);
    });
  }
}

const port = Number(process.env.PORT ?? 3000);
new BillingApi(port).start();
