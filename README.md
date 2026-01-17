# Mini backend (SOLID roto) - Telco Billing

Este proyecto está intencionalmente mal diseñado para una práctica.
Contexto: pago de facturas de paquetes telefónicos.

## Ejecutar
```bash
npm i
cp .env.example .env
npm run dev
```

Servicio: http://localhost:3000

## Endpoints
- GET /health
- GET /packages
- POST /invoice   { "msisdn": "521234567890", "packageId": "PKG-10GB" }
- POST /pay       { "invoiceId": "INV-1", "method": "CARD" | "CASH" | "TRANSFER" }

## Nota para facilitador
Lee el archivo `src/index.ts` y usa los comentarios `SOLID-BREAK:` para guiar la sesión.
