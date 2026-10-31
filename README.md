# Clinic System

Open-source clinic management system for small clinics in Nepal.

## Current date model
This codebase now uses **AD-only dates** across the application and database.

Examples:
- patient DOB: `dobAD`
- appointment date: `appointmentDateAD`
- encounter date: `visitDateAD`
- follow-up date: `followUpDateAD`
- bill date: `billDateAD`
- inventory expiry date: `expiryDateAD`

## Tech stack
- **Frontend:** React + Vite + Tailwind
- **Backend:** Node.js + Express
- **Database:** PostgreSQL
- **ORM:** Prisma

## Main modules
- Authentication and roles
- Patient management
- Appointment scheduling
- Encounters / SOAP notes
- Billing
- Inventory
- Lab
- Settings and dashboard

## Local setup

### 1) Backend
```bash
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npx prisma generate
node prisma/seed.js
npm run dev
```

### 2) Frontend
```bash
cd ../frontend
npm install
npm run dev
```

## Production build
### Frontend
```bash
cd frontend
npm run build
```

### Backend
```bash
cd backend
npm start
```

## Prisma migration state
The repository migration history has been cleaned to match the current AD-only schema.

If you have an older local database from a previous schema version, the safest option is to:
1. back up your data
2. reset or recreate the database in development
3. run the current Prisma migrations again

## Seed users
Example users are created by `backend/prisma/seed.js`.
Update or remove them before real deployment.

## Notes
- Frontend build has been verified after the AD-only cleanup.
- Backend app load and Prisma schema validation have also been verified.

## Frontend design system

The UI uses a small, shared design system so every screen looks and behaves the same.

- **Theme tokens** live in `frontend/tailwind.config.js`
  - `brand` / `primary`: clinical teal scale (`brand-600` is the main action colour)
  - `gray` is mapped to Tailwind `slate` for cooler, cleaner neutrals
  - `shadow-soft`, `shadow-card`, `shadow-lift`, `shadow-pop` for depth
  - `animate-fade-in`, `animate-fade-in-up`, `animate-scale-in` for smooth motion
- **Global element styles** live in `frontend/src/index.css`
  - consistent fields, focus rings, scrollbars and page/surface helpers
  - motion is disabled automatically for `prefers-reduced-motion`
- **Shared components** live in `frontend/src/components/ui`
  - `Button`, `Input` / `Select` / `Textarea` / `SearchInput`, `Card`,
    `Badge` / `StatusBadge`, `Table`, `Modal`, `Pagination`, `PageHeader`,
    `EmptyState`, `Avatar`, `Skeleton`
- **Layout** (`components/layout`)
  - sticky blurred top bar, grouped collapsible sidebar (persisted), mobile drawer
- **UX conventions**
  - every list screen has search, filters, skeleton loading and a friendly empty state
  - destructive or long actions show inline loading states
  - pages are responsive from ~360px upwards; tables collapse less important columns

When adding a screen, start from `<div className="page">`, a `PageHeader`, and the
shared `Card` + `Table` primitives instead of hand-rolling new classes.
