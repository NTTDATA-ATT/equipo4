import request from "supertest";
import { createApp } from "../src/app";

describe("mini backend", () => {
  const app = createApp();

  test("GET /health", async () => {
    const r = await request(app).get("/health");
    expect(r.status).toBe(200);
    expect(r.body.status).toBe("ok");
  });

  test("GET /api/invoices", async () => {
    const r = await request(app).get("/api/invoices");
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body)).toBe(true);
  });

  test("POST /api/payments validates request", async () => {
    const r = await request(app).post("/api/payments").send({});
    expect(r.status).toBe(400);
  });

  test("POST /api/payments pays invoice", async () => {
    const r = await request(app).post("/api/payments").send({
      invoiceId: "INV-001",
      msisdn: "5512345678",
      amount: 199
    });
    expect([201, 409]).toContain(r.status); // 409 si ya lo pagó otro test run
  });
});
