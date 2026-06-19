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
