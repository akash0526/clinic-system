# API Testing Guide & Known Pitfalls

Target: `https://clinic-system-3iuu.onrender.com` (the Render service runs the
Express backend directly, so the API root is `/api/...`).

Everything below is derived from the code in `backend/src`. Sections marked ✅
were fixed in this pass — the behavior described is what the code does **now**.

---

## 1. Response envelope

All responses are JSON:

- Success: `{ "success": true, "message": "...", "data": ..., "meta"?: {...} }`
  (`meta` only on list endpoints: `{ total, page, limit, totalPages, hasNext, hasPrev }`)
- Error: `{ "success": false, "message": "...", "errors"?: [{ field, message }] }`
- List endpoints accept `?page=` and `?limit=` (default 20, max 100).
- `Decimal` DB fields (bill/payment amounts, item prices) are returned as
  **JSON strings** (e.g. `"totalAmount": "500.00"`), not numbers. `Int`/`Float`
  fields are real numbers. Dates are ISO strings.

## 2. Authentication (the #1 blocker)

Only two routes are public:

| Route | Notes |
|---|---|
| `GET /api/health` | Liveness: `{success:true, message:"Clinic API running ✓", timestamp}` |
| `POST /api/auth/login` | Body `{"email":"...","password":"..."}` (JSON!) |

Everything else returns `401 {"success":false,"message":"Authentication required"}`
without a valid JWT. Send the token **one of**:

1. Header: `Authorization: Bearer <token>` (easiest for a test client), or
2. Cookie: `clinic_token=<token>` (set automatically by login; `HttpOnly`,
   `Secure`, `SameSite=None` — so it only works over HTTPS, and browser clients
   must send credentials).

Login returns `200 {success:true, data:{ user, token }}` **and** a
`Set-Cookie: clinic_token=...` header. Use `data.token` as the Bearer token.

Seeded accounts (if `prisma/seed.js` ran on the deployed DB):

| Email | Password | Role |
|---|---|---|
| `admin@clinic.com` | `Admin@12345` | ADMIN |
| `doctor1@clinic.com` | `Doctor@12345` | DOCTOR |
| `reception@clinic.com` | `Staff@12345` | RECEPTIONIST |
| `labtech@clinic.com` | `Lab@12345` | LAB_TECH |

Pitfalls:

- `POST /api/auth/register` is **NOT public** — it requires an ADMIN token.
  A test client cannot self-register; use a seeded account or ask an admin to
  create one via `POST /api/users`.
- Wrong password or deactivated account → `401 "Invalid credentials"`.
- Expired token → `401 "Token expired"`; malformed token → `401 "Invalid token"`.
- ✅ Token lifetime is `JWT_EXPIRES_IN` (default `1d`) and the cookie `maxAge`
  is derived from the same value (`JWT_EXPIRES_MS`), so they stay in sync.
  Still prefer the Bearer header for scripted clients.
- `GET /api/auth/me` verifies a token works.

## 3. Role matrix (403s)

Roles: `ADMIN`, `DOCTOR`, `RECEPTIONIST`, `LAB_TECH`. Wrong role →
`403 {"success":false,"message":"Access denied. Required role: ..."}`.

| Endpoint | Allowed roles |
|---|---|
| `/api/billing/*`, `/api/inventory/*` | ADMIN, DOCTOR, RECEPTIONIST |
| `/api/patients` GET/POST/PUT | ADMIN, DOCTOR, RECEPTIONIST |
| `/api/patients/:id` DELETE | ADMIN only |
| `/api/appointments*` | ADMIN, DOCTOR, RECEPTIONIST |
| `/api/encounters` GET | ADMIN, DOCTOR, RECEPTIONIST |
| `/api/encounters` POST/PUT | ADMIN, DOCTOR only |
| `/api/prescriptions` GET | ADMIN, DOCTOR, RECEPTIONIST |
| `/api/prescriptions` POST/PUT | ADMIN, DOCTOR only |
| `/api/prescriptions/:id/dispense` | ADMIN, DOCTOR, RECEPTIONIST |
| `/api/lab/tests` (catalogue) | ADMIN, DOCTOR, RECEPTIONIST |
| `/api/lab/results*` | ADMIN, DOCTOR, LAB_TECH |
| `/api/users/*` | ADMIN only |
| `/api/settings` GET | ADMIN, DOCTOR, RECEPTIONIST |
| `/api/settings` PUT | ADMIN only |
| `/api/dashboard/stats` | any authenticated user |

✅ `GET /api/lab/tests` is open to all staff because the billing UI calls it
when adding lab items to a bill (previously RECEPTIONIST got 403 there).
Lab **results** remain lab-staff-only.

## 4. Request format rules

- **Always send `Content-Type: application/json`** with a JSON body on
  POST/PUT/PATCH. If you omit it, the body parses as empty and you get a 422
  listing every field as missing. Body limit is 10 MB (larger → 413).
- IDs in path/body are **CUIDs** on all endpoints (e.g. `clx…`) → a non-CUID
  string fails zod with **422** (including `POST /api/billing`'s `patientId`,
  which previously only required a non-empty string and failed later as a 500).
- **Dates are AD-only, format `YYYY-MM-DD`** (`dobAD`, `appointmentDateAD`,
  `followUpDateAD`). Bikram Sambat dates are rejected. ✅ Impossible calendar
  dates like `2026-02-30` / `2026-13-01` are now rejected with **422
  `"Invalid calendar date"`** — they previously passed the regex and crashed
  as a 500.
- Patient `phone` must be exactly 10 digits (`^[0-9]{10}$`); `""` allowed.
- Enums are **case-sensitive exact strings**:
  - gender: `MALE|FEMALE|OTHER`; blood group: `A+|A-|B+|B-|O+|O-|AB+|AB-`
  - appointment status: `SCHEDULED|CONFIRMED|IN_PROGRESS|COMPLETED|CANCELLED|NO_SHOW`
  - bill status (filter): `DRAFT|PENDING|PAID|PARTIAL|CANCELLED|REFUNDED`
  - payment method: `CASH|ESEWA|KHALTI|BANK_TRANSFER|INSURANCE|OTHER`
  - stock movement type: `PURCHASE|DISPENSED|ADJUSTMENT|EXPIRED|RETURNED`
  - lab status: `PENDING|IN_PROGRESS|COMPLETED|CANCELLED`
  - inventory category: `MEDICINE|CONSUMABLE|EQUIPMENT`
  - user role: `ADMIN|DOCTOR|RECEPTIONIST|LAB_TECH`
- Numbers: billing/inventory schemas use `z.coerce.number()` so `"100"` works;
  but `duration` (appointments) and `quantityPrescribed`/`quantity` (prescriptions)
  must be real JSON numbers.
- Validation errors come back as **422** by default with
  `{success:false, message:"Validation failed", errors:[{field,message}]}` —
  **but 400 on some routes**: `PATCH /api/appointments/:id/status`,
  `PUT /api/encounters/:id`, `POST/PUT /api/lab/results*`, `PUT /api/users/:id`.
  Accept both.
- Unknown JSON keys are silently stripped by most schemas, EXCEPT
  `PUT /api/users/:id` which is `.strict()` → unknown keys (e.g. `passwordHash`)
  → 422. Use `password` for password changes.

## 5. Endpoint map

```
GET    /api/health                          (public)
POST   /api/auth/login                      (public)  {email,password}
POST   /api/auth/register                   ADMIN       {email,password>=8,fullName,role,...}
GET    /api/auth/me                         auth
POST   /api/auth/logout                     auth

GET    /api/patients?page&limit&search&gender&province
GET    /api/patients/:id
POST   /api/patients                        {fullName>=2, gender, phone?, dobAD?, ...}
PUT    /api/patients/:id                    (partial)
DELETE /api/patients/:id                    ADMIN only (soft delete)

GET    /api/appointments?page&limit&search&doctorId&status&today&date(AD)
GET    /api/appointments/doctors
GET    /api/appointments/:id
POST   /api/appointments                    {patientId,doctorId,appointmentDateAD,appointmentTime,type?,duration?}
PATCH  /api/appointments/:id/status         {status}   (400 on validation error)

GET    /api/encounters?patientId&doctorId&search&page&limit
GET    /api/encounters/:id
POST   /api/encounters                      DOCTOR+  {patientId, appointmentId?, vitals..., SOAP...}
PUT    /api/encounters/:id                  DOCTOR+  (partial; empty body → 400)

GET    /api/billing?search&status&patientId&page&limit
GET    /api/billing/:id
POST   /api/billing                         {patientId, items:[{description,quantity,unitPrice,category?}], discountType?,discountValue?,taxPercent?,paidAmount?,paymentMethod?,encounterId?,notes?}
POST   /api/billing/:id/payment             {amount>0, method?, reference?}

GET    /api/prescriptions?...               GET: staff
GET    /api/prescriptions/:id
POST   /api/prescriptions                   DOCTOR+  {patientId, encounterId, items:[{drugName|inventoryItemId, quantityPrescribed, ...}]}
PUT    /api/prescriptions/:id               DOCTOR+
POST   /api/prescriptions/:id/dispense      staff    {items:[{prescriptionItemId, quantity}]}

GET    /api/inventory?search&category&page&limit
GET    /api/inventory/low-stock
POST   /api/inventory                       {name, category, unit, purchasePrice, sellingPrice, ...}  (itemCode auto: MED/CON/EQP-###)
PUT    /api/inventory/:id                   (partial)
POST   /api/inventory/:id/stock             {type, quantity>0, notes?, reference?}

GET    /api/lab/tests                       staff (catalogue; needed by billing UI)
GET    /api/lab/results?status&patientId&search&page&limit
POST   /api/lab/results                     {patientId, testId, encounterId?}
PUT    /api/lab/results/:id                 {resultData?, interpretation?, notes?, status?}  (empty body → 400)

GET    /api/users                           ADMIN
POST   /api/users                           ADMIN    {email, password>=8, fullName, role, ...}
PUT    /api/users/:id                       ADMIN    (strict schema; empty → 400)
PATCH  /api/users/:id/toggle-active         ADMIN

GET    /api/settings                        staff
PUT    /api/settings                        ADMIN    {key: string|number|boolean, ...} (validated, non-empty)

GET    /api/dashboard/stats                 any auth
```

`/api/reports` does **not** exist (empty module, not mounted) → 404.
Unknown routes → `404 {"success":false,"message":"Route not found: METHOD /path"}`.

## 6. Error catalog & formerly-500 traps

Expected, well-formed errors:

| Status | When | Body |
|---|---|---|
| 401 | no token | `"Authentication required"` |
| 401 | bad/expired token | `"Invalid token"` / `"Token expired"` |
| 401 | wrong login | `"Invalid credentials"` |
| 401 | deactivated account | `"Account not found or deactivated"` |
| 403 | wrong role | `"Access denied. Required role: ..."` |
| 404 | unknown route | `"Route not found: ..."` |
| 404 | ID lookup miss, or bill/appointment referencing a missing patient/doctor/encounter | `"Record not found"` / `"Patient not found"` etc. |
| 409 | duplicate (email, patientCode, itemCode, billNumber) | `"<field> already exists"` |
| 400/422 | zod validation | `"Validation failed"` + `errors[]` |
| 400 | business rule (see §7) | specific message |
| 400 | malformed cuid in `:id`, bad enum in a query filter, FK reference to a missing row | `"Invalid request parameters"` / `"Related record not found: <field>"` |
| 429 | rate limit | see §8 |

✅ **Former 500 traps — now clean 4xx** (the global error handler maps Prisma
errors by `name`):

1. Non-CUID in a `:id` path param (`GET /api/billing/abc`) → Prisma
   `PrismaClientValidationError` → **400** `"Invalid request parameters"`
   (production; raw Prisma message in dev).
2. Valid-CUID but non-existent FK in a POST body (unknown `patientId`,
   `doctorId`, `testId`, `encounterId`) → Prisma P2003 → **400**
   `"Related record not found: <field>"`. Bill/appointment creation
   additionally check explicitly → **404** `"Patient not found"` /
   `"Doctor not found"` / `"Encounter not found"`.
3. Impossible dates (`2026-02-30`) → **422** `"Invalid calendar date"` (§4).
4. Invalid enum in a *query* filter (`?status=FOO` on `/api/billing`,
   `?gender=X` on `/api/patients`, `?category=X` on `/api/inventory`) →
   **400** `"Invalid request parameters"`.

The only remaining 500s are genuine server faults (e.g. DB connection dropped
at runtime) — in production the message is masked to `"Internal server error"`;
check Render logs for details.

## 7. Business rules that reject requests with 400

- `POST /api/billing/:id/payment`: amount must not exceed amount due
  (`"Payment exceeds the amount due"`); cannot pay a `CANCELLED`/`REFUNDED`
  bill.
- ✅ `POST /api/billing` (create) also rejects `paidAmount > totalAmount` with
  **400** `"Paid amount exceeds the total amount"` — consistent with
  `addPayment` (previously it silently capped due at 0 and marked `PAID`).
- ✅ `POST /api/appointments`: `doctorId` must reference an **active user with
  role DOCTOR** (else 400 `"doctorId must reference an active user with role
  DOCTOR"`); missing patient/doctor → 404. Past dates are still allowed
  (intentional, for back-dated records).
- `POST /api/inventory/:id/stock`: `DISPENSED`/`EXPIRED` with insufficient
  stock → 400 `"Insufficient stock for this movement"`. (On a non-existent item
  the same 400 appears — misleading; IN-type movements on a missing item → 404.)
- Prescriptions: create requires the encounter to belong to the patient
  (400 `"Encounter does not belong to the selected patient"`); each item needs
  `drugName` or a linked `inventoryItemId` (else 422); dispense requires a
  linked inventory item (400), quantity ≤ remaining (400), and rejects
  cancelled prescriptions/items (400).
- `PUT /api/encounters/:id`, `PUT /api/lab/results/:id`, `PUT /api/users/:id`
  with an empty body → 400 `"No fields to update"`.
- `PUT /api/prescriptions/:id` on a DISPENSED/CANCELLED prescription → 400.

## 8. Rate limits

- `POST /api/auth/login`: **20 requests / 15 min / IP** → 429 with JSON
  `{"success":false,"message":"Too many login attempts. Try again later."}`.
  Repeated failed-login testing will trip this.
- All `/api/*`: **500 requests / 60 s / IP** → 429 with the standard JSON
  envelope `{"success":false,"message":"Too many requests. Try again later."}`
  (✅ previously a plain-text body).
- `trust proxy = 1` is set, so limits key on the real client IP behind Render.

## 9. Render / deployment-specific gotchas

- **Cold starts**: Render free-tier services sleep after ~15 min idle; the
  first request can take 30–60 s. Warm up with `GET /api/health` and use a
  generous client timeout (≥ 60 s) on the first call.
- **CORS**: only the exact origin in env `FRONTEND_URL` is allowed, with
  credentials. Postman/curl send no `Origin` header and are unaffected, but any
  **browser-based** client on another origin will be blocked. If `FRONTEND_URL`
  isn't set on Render, it defaults to `http://localhost:5173` (only a log
  warning) — make sure it's set to the real frontend origin.
- **Cookie** is `Secure; SameSite=None` → HTTPS only. Over plain HTTP, clients
  reject it; use the Bearer token instead. ✅ Cookie `maxAge` now tracks
  `JWT_EXPIRES_IN` automatically.
- **Server timezone is UTC** (Render). "Today" filters (`?today`, dashboard
  stats) use server-local (UTC) days, which can differ from Nepal time
  (UTC+5:45) near midnight.
- Helmet/CSP are on in production — irrelevant for a JSON API client.
- `POST`/`PUT` bodies must be JSON; there are no file-upload routes (multer is
  a dependency but unused).

## 10. Suggested smoke-test sequence

```bash
BASE=https://clinic-system-3iuu.onrender.com

# 0. Warm up (cold start!) and check liveness — public
curl $BASE/api/health

# 1. Login — note data.token AND the Set-Cookie header
curl -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@clinic.com","password":"Admin@12345"}'

# 2. Use the token (Bearer) — e.g. verify session
TOKEN=<data.token from step 1>
curl $BASE/api/auth/me -H "Authorization: Bearer $TOKEN"

# 3. Staff list endpoints (cookie alternative: -b "clinic_token=$TOKEN")
curl "$BASE/api/patients?page=1&limit=10" -H "Authorization: Bearer $TOKEN"
curl "$BASE/api/billing?status=PENDING"  -H "Authorization: Bearer $TOKEN"
curl "$BASE/api/inventory/low-stock"      -H "Authorization: Bearer $TOKEN"
curl "$BASE/api/lab/tests"                -H "Authorization: Bearer $TOKEN"
curl "$BASE/api/appointments/doctors"     -H "Authorization: Bearer $TOKEN"
curl "$BASE/api/dashboard/stats"          -H "Authorization: Bearer $TOKEN"

# 4. Create chain: patient → appointment → bill → payment
curl -X POST $BASE/api/patients -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test Patient","gender":"MALE","phone":"9800000000","dobAD":"1990-01-01"}'
# ... use returned id as patientId, a doctor id from /api/appointments/doctors
curl -X POST $BASE/api/billing -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"patientId":"<pid>","items":[{"description":"Consultation","quantity":1,"unitPrice":500}],"taxPercent":0}'
curl -X POST $BASE/api/billing/<billId>/payment -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"amount":500,"method":"CASH"}'
```

## 11. Repo-side issues — status after the fix pass

- ✅ `frontend/.env.production` now points at
  `https://clinic-system-3iuu.onrender.com/api` (was `http://localhost:5000/api`,
  which would have made a production frontend build call localhost).
- ✅ `PUT /api/settings` is validated: non-empty object, string keys, scalar
  values only (422 otherwise) — no more `"[object Object]"` stored.
- ✅ `createAppointment` verifies `doctorId` is an active DOCTOR and that
  patient/doctor exist.
- ✅ Patient codes (`P-YYYY-#####`) and inventory item codes (`MED/CON/EQP-###`)
  retry on unique-constraint conflict (P2002), so concurrent creates no longer
  fail with 409. (Bills/prescriptions already used atomic counter tables.)
- ✅ Prisma errors are mapped by `name` in the global error handler, so bad
  cuids / FK misses / bad query enums return 400 instead of 500, even if the
  generated client changes.
- ⚠️ Still open: `docker-compose.yml` references a `frontend` build context but
  there is no `frontend/Dockerfile`; root `nginx.conf` is empty. Only affects
  local Docker runs, not Render.
- ⚠️ Seed credentials above are committed in `prisma/seed.js` — fine for a
  demo, but change them for anything real.
