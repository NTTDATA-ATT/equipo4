### `src/app.ts`
- Crea la aplicación Express.
- Configura middlewares:
  - `helmet()` para cabeceras de seguridad básicas.
  - `express.json()` para parsear JSON.
- Registra rutas:
  - `/health`
  - `/api/invoices`
  - `/api/payments`
  - `/api/version`
- Incluye:
  - handler 404
  - handler global de errores

**Por qué existe**: separa la configuración del `listen()`, facilita testing con Supertest.

---

### `src/server.ts`
- Arranca el servidor con `app.listen(PORT)`.
- Incluye **graceful shutdown** para `SIGTERM/SIGINT`:
  - importante en Docker/EC2 cuando reinicias contenedores.

**Por qué existe**: en producción (Docker) el proceso debe terminar limpio.

---

### `src/routes/health.ts`
- Endpoint de salud:
  - `GET /health` → `{ status: "ok" }`

**Por qué existe**:
- Para validar rápidamente que el deploy funciona.
- Útil para health checks.

---

### `src/routes/invoices.ts`
- Maneja facturas en memoria (sin DB):
  - `GET /api/invoices` → lista de facturas
  - `GET /api/invoices/:id` → detalle de factura

**Por qué existe**:
- Provee datos simples para prácticas (queries, cambios, tests).

---

### `src/routes/payments.ts`
- Simula un pago de factura:
  - `POST /api/payments`

Valida:
- `invoiceId` obligatorio
- `msisdn` (teléfono) válido (10 dígitos en ejemplo)
- `amount` positivo
- que `msisdn` y `amount` coincidan con la factura

Respuestas típicas:
- `201` si paga correctamente
- `400` si falta/está mal un campo
- `404` si no existe la factura
- `409` si hay mismatch o ya está pagada

**Por qué existe**:
- Es un endpoint con reglas de negocio mínimas para practicar:
  - refactor
  - tests
  - manejo de errores
  - cambios versionados por PR

---

### `src/domain/store.ts`
- “Persistencia” en memoria:
  - Lista de facturas inicial
  - Métodos:
    - `list()`
    - `find(id)`
    - `pay(id)`

**Por qué existe**:
- Separa lógica de negocio/datos de las rutas.
- Facilita refactor y testing.

---

### `src/domain/validators.ts`
- Validadores pequeños y reutilizables:
  - `isValidMsisdn()`
  - `isPositiveNumber()`

**Por qué existe**:
- Buen ejemplo de separación de responsabilidades.
- Cambios aquí impactan el API → ideal para pruebas.

---

### `test/app.test.ts`
Tests con **Jest + Supertest**:
- `GET /health`
- `GET /api/invoices`
- `POST /api/payments` valida errores básicos

**Por qué existe**:
- CI debe fallar si rompes comportamiento.
- Los alumnos deben arreglar tests con PR.

---

## 3) Endpoints del API

### Health
- `GET /health`
```json
{ "status": "ok" }