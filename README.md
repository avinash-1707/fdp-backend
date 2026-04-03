# Finance Dashboard API

A production-grade backend for a finance dashboard system with role-based access control, financial record management, and analytics endpoints.

---

## Architecture

This project follows a **Modular Monolith** pattern — one deployable process internally divided into self-contained feature modules. Each module owns its routes, controller, service, and repository. Cross-cutting concerns live in dedicated middleware and utility layers.

```
Request
  └─> Router
        └─> Middleware stack (auth → rbac → validate)
              └─> Controller   (parse request, call service, send response)
                    └─> Service      (all business logic and rules)
                          └─> Repository  (all Prisma/database calls)
                                └─> PostgreSQL
```

**Key rule:** Services never import Prisma directly. Repositories never contain business logic. Controllers never talk to repositories. This keeps every layer independently testable and replaceable.

---

## Setup

### Prerequisites

- Node.js 20+
- A PostgreSQL database (Neon recommended)

### Installation

```bash
# 1. Clone and install dependencies
bun install

# 2. Create your environment file
cp .env.example .env
```

Edit `.env` and fill in:

```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
JWT_SECRET=your_super_secret_at_least_32_chars_long
```

Generate a strong secret:

```bash
openssl rand -hex 32
```

### Database setup

```bash
# Generate Prisma client
bunx prisma generate

# Push schema to your database (dev / first run)
bunx prisma db push

# OR use migrations for production
bunx prisma migrate dev --name init

# Seed database
bun run db:seed
```

### Running the server

```bash
# Development (hot reload)
bun dev

# Production
bun build && bun start
```

Server starts at: `http://localhost:3000`
Health check: `http://localhost:3000/health`

---

## Seeded Test Users

All have password: **`Admin1234`**

| Email               | Role    |
| ------------------- | ------- |
| admin@example.com   | ADMIN   |
| analyst@example.com | ANALYST |
| viewer@example.com  | VIEWER  |

---

## Role Permissions

| Action                          | VIEWER   | ANALYST  | ADMIN |
| ------------------------------- | -------- | -------- | ----- |
| Login / view own profile        | ✅       | ✅       | ✅    |
| View dashboard data             | ✅       | ✅       | ✅    |
| View financial records          | Own only | All      | All   |
| Create financial records        | ❌       | ✅       | ✅    |
| Update financial records        | ❌       | Own only | All   |
| Delete financial records (soft) | ❌       | ❌       | ✅    |
| List / manage users             | ❌       | ❌       | ✅    |
| Assign roles / toggle status    | ❌       | ❌       | ✅    |

---

## API Reference

All endpoints are prefixed with `/api/v1`. Protected routes require:

```
Authorization: Bearer <token>
```

### Auth

#### `POST /api/v1/auth/register`

```json
// Body
{ "name": "Alice", "email": "alice@example.com", "password": "Alice1234" }

// Response 201
{ "success": true, "message": "Account created successfully", "data": { "user": {...}, "token": "..." } }
```

#### `POST /api/v1/auth/login`

```json
// Body
{ "email": "admin@example.com", "password": "Admin1234" }

// Response 200
{ "success": true, "message": "Login successful", "data": { "user": {...}, "token": "..." } }
```

#### `GET /api/v1/auth/me` 🔒

```json
// Response 200
{
  "success": true,
  "data": { "id": "...", "name": "...", "email": "...", "role": "ADMIN" }
}
```

---

### Users (ADMIN only)

#### `GET /api/v1/users` 🔒 ADMIN

Query params: `?page=1&limit=20&role=ANALYST&isActive=true&search=alice`

#### `GET /api/v1/users/:id` 🔒 ADMIN

#### `PATCH /api/v1/users/:id/role` 🔒 ADMIN

```json
{ "role": "ANALYST" }
```

#### `PATCH /api/v1/users/:id/status` 🔒 ADMIN

```json
{ "isActive": false }
```

---

### Financial Records

#### `POST /api/v1/records` 🔒 ANALYST, ADMIN

```json
{
  "amount": 5000.0,
  "type": "INCOME",
  "category": "Salary",
  "date": "2024-01-01",
  "notes": "January salary"
}
```

#### `GET /api/v1/records` 🔒 All roles

Query params:

```
?type=INCOME|EXPENSE
&category=salary
&startDate=2024-01-01
&endDate=2024-12-31
&search=freelance
&page=1
&limit=20
&sortBy=date|amount|createdAt
&sortOrder=asc|desc
```

> **Note:** VIEWER role only sees their own records. ANALYST and ADMIN see all.

#### `GET /api/v1/records/:id` 🔒 All roles

> VIEWER can only access their own records.

#### `PATCH /api/v1/records/:id` 🔒 ANALYST (own), ADMIN (any)

```json
{ "amount": 5500.0, "notes": "Updated January salary" }
```

#### `DELETE /api/v1/records/:id` 🔒 ADMIN only

Soft delete — record is marked `isDeleted: true`, never physically removed.

---

### Dashboard

All dashboard endpoints accept optional `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` filters.

#### `GET /api/v1/dashboard/summary` 🔒 All roles

```json
{
  "data": {
    "totalIncome": 15000,
    "totalExpenses": 4200,
    "netBalance": 10800,
    "incomeCount": 6,
    "expenseCount": 8,
    "totalRecords": 14
  }
}
```

#### `GET /api/v1/dashboard/category-breakdown` 🔒 All roles

```json
{
  "data": [
    { "category": "Salary", "income": 10000, "expense": 0, "count": 2 },
    { "category": "Rent", "income": 0, "expense": 2100, "count": 2 }
  ]
}
```

#### `GET /api/v1/dashboard/trends` 🔒 All roles

Monthly income vs expense (last 12 months by default):

```json
{
  "data": [
    { "month": "2024-01", "income": 5000, "expense": 1550 },
    { "month": "2024-02", "income": 7500, "expense": 600 }
  ]
}
```

#### `GET /api/v1/dashboard/recent` 🔒 All roles

Query: `?limit=10` (max 50)

---

## Error Handling

All errors follow a consistent shape:

```json
{ "success": false, "message": "Descriptive error message" }
```

| Status | Meaning                             |
| ------ | ----------------------------------- |
| 400    | Validation error or bad input       |
| 401    | Missing or invalid JWT              |
| 403    | Authenticated but insufficient role |
| 404    | Resource not found                  |
| 409    | Conflict (e.g. duplicate email)     |
| 429    | Rate limit exceeded                 |
| 500    | Internal server error               |

Prisma constraint errors (unique violations, foreign key errors) are caught and translated to clean 4xx responses — raw database errors never leak to clients.

---

## Security Measures

- **Helmet** — sets secure HTTP headers
- **CORS** — configurable allowed origins
- **Rate limiting** — 100 requests per 15-minute window per IP (configurable)
- **Payload size limit** — request bodies capped at 10kb
- **Password hashing** — bcrypt with 12 rounds
- **JWT expiry** — configurable, defaults to 7 days
- **Email enumeration prevention** — login returns the same error for wrong email and wrong password
- **Self-protection guards** — admins cannot deactivate their own account or downgrade their own role

---

## Design Decisions & Assumptions

**Soft delete over hard delete** — Financial records are soft-deleted (`isDeleted: true`) rather than physically removed. This preserves audit history and prevents accidental data loss. Hard deletes are never exposed through the API.

**VIEWER scope at service layer** — VIEWER records scoping (only seeing their own records) is enforced in the service, not just the route. This means even if someone bypasses the route-level guard, the business logic still enforces data isolation.

**Decimal for money** — `Decimal(12, 2)` is used for amounts. Using `Float` for currency is a correctness bug — floating point cannot represent most decimal values exactly.

**No soft delete for users** — Users are deactivated via `isActive: false`, not deleted. Active session tokens are invalidated on the next request because `authenticate` middleware re-checks `isActive` on every call.

**Pagination defaults** — Default page size is 20, maximum is 100. This prevents runaway queries on large datasets.

**Role assignment on first user** — All registered users default to VIEWER. An ADMIN must explicitly elevate roles. This is the safe default; a real system might use an invitation flow or environment-seeded admin.

**Raw SQL for monthly trends** — The monthly trends endpoint uses `$queryRawUnsafe` with `DATE_TRUNC` because Prisma's `groupBy` does not support date truncation natively. The query is parameterised and safe from injection.

---
