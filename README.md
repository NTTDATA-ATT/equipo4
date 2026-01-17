# archivos-capacitacion-fullstack
Repositorio para archivos a usar durante la capacitación full stack

Objetivo del proyecto

Demostrar, de forma sencilla:

Diseño de una API REST

Flujo de facturación → pago

Manejo de estados (PENDING → PAID)

Uso de idempotencia en pagos (Idempotency-Key)

Tipado fuerte con TypeScript

Arquitectura monolito simple (ideal para capacitación)

Arquitectura
Tipo

Monolito

Single service

REST API

Capas (en un solo archivo)

API / Controller – Express routes

Lógica de negocio – validaciones, reglas, estados

Persistencia (mock) – almacenamiento en memoria (Map)

No hay base de datos ni mensajería: es intencional para facilitar la práctica.

Flujo de negocio

El cliente consulta paquetes disponibles

Crea una factura (PENDING)

Paga la factura

La factura cambia a estado PAID

El pago es idempotente (no se duplica)

Cliente
  ↓
API REST
  ↓
Factura (PENDING)
  ↓
Pago
  ↓
Factura (PAID)

Estructura del proyecto
name-project/
├── src/
│   └── index.ts        
├── .env.example       
├── package.json
├── tsconfig.json
└── README.md

Requisitos

Node.js 20+

npm

Levantar el proyecto en local
npm install
cp .env.example .env
npm run dev


El servicio queda disponible en:

http://localhost:8080

Endpoints disponibles
Health check
GET /health

Paquetes
Listar paquetes
GET /packages

Obtener paquete por ID
GET /packages/{packageId}


Ejemplos de packageId:

PKG-5GB

PKG-10GB

PKG-UNL

Facturas
Crear factura
POST /invoices


Body:

{
  "msisdn": "521234567890",
  "packageId": "PKG-10GB"
}


Respuesta:

{
  "id": "INV-000001",
  "status": "PENDING"
}

Consultar factura
GET /invoices/{invoiceId}

Pagos
Pagar factura (idempotente)
POST /payments


Headers:

Idempotency-Key: pago-001


Body:

{
  "invoiceId": "INV-000001",
  "method": "CARD"
}


Si ejecutas el mismo request con el mismo Idempotency-Key, no se crea un pago duplicado.

Consultar pago
GET /payments/{paymentId}
