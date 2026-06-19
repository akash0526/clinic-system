# Step 1 backend test plan: prescriptions + pharmacy foundation

## Deploy notes
After pulling this change:

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

## Required existing data before testing
You need:
- one doctor user
- one patient
- one encounter for that patient
- one or more inventory items with `category = MEDICINE`

## Suggested test flow

### 1. Login
`POST /api/auth/login`

### 2. Create prescription
`POST /api/prescriptions`

Example body:
```json
{
  "patientId": "PATIENT_ID",
  "encounterId": "ENCOUNTER_ID",
  "notes": "Take after meals.",
  "items": [
    {
      "inventoryItemId": "MEDICINE_ITEM_ID",
      "dose": "500 mg",
      "frequency": "TDS",
      "duration": "5 days",
      "route": "Oral",
      "instructions": "After food",
      "quantityPrescribed": 15
    }
  ]
}
```

### 3. List prescriptions
`GET /api/prescriptions`

### 4. View one prescription
`GET /api/prescriptions/:id`

### 5. Update prescription before dispensing
`PUT /api/prescriptions/:id`

Example body:
```json
{
  "notes": "Updated instructions",
  "items": [
    {
      "inventoryItemId": "MEDICINE_ITEM_ID",
      "dose": "500 mg",
      "frequency": "BD",
      "duration": "7 days",
      "route": "Oral",
      "instructions": "After dinner",
      "quantityPrescribed": 14
    }
  ]
}
```

### 6. Dispense medicine
`POST /api/prescriptions/:id/dispense`

Example body:
```json
{
  "items": [
    {
      "prescriptionItemId": "PRESCRIPTION_ITEM_ID",
      "quantity": 10,
      "notes": "Partial dispense"
    }
  ]
}
```

### 7. Verify effects
Check:
- prescription item `quantityDispensed` updated
- prescription item status becomes `PARTIAL` or `DISPENSED`
- prescription overall status becomes `PARTIAL` or `DISPENSED`
- inventory `currentStock` is reduced
- stock transaction is created with type `DISPENSED`
- dispense record is created
