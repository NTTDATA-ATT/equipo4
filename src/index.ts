import "dotenv/config";
import express from "express";
import { errorMiddleware } from "./http/error-middleware";
import { buildRoutes } from "./http/routes";

import { InMemoryPackageRepo, InMemoryInvoiceRepo, InMemoryPaymentRepo } from "./adapters/inmemory/repos";
import { SequentialId } from "./adapters/ids/sequential";
import { defaultPaymentStrategies } from "./adapters/payments/strategies";

import { ListPackages } from "./application/list-packages";
import { CreateInvoice } from "./application/create-invoice";
import { PayInvoice } from "./application/pay-invoice";

const PORT = Number(process.env.PORT ?? 3000);

// Composition root (DIP)
const packageRepo = new InMemoryPackageRepo();
const invoiceRepo = new InMemoryInvoiceRepo();
const paymentRepo = new InMemoryPaymentRepo();

const listPackages = new ListPackages(packageRepo);
const createInvoice = new CreateInvoice(packageRepo, invoiceRepo, new SequentialId("INV"));
const payInvoice = new PayInvoice(invoiceRepo, paymentRepo, defaultPaymentStrategies(), new SequentialId("PAY"));

const app = express();
app.use(express.json());
app.use(buildRoutes({ listPackages, createInvoice, payInvoice }));
app.use(errorMiddleware);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`solid-fixed listening on :${PORT}`);
});
