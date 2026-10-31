# Marketing kit — Clinic MS

Everything here was made for running a Facebook / Instagram video campaign for the
clinic management system in this repo. Two kinds of assets:

- **`app-screenshots/`** — *real* screenshots of this application. No mockups, no
  redrawn UI: the actual React app was run locally and captured at 2× resolution.
- **`ai-scenes/` + `social/`** — generated photography and finished, ready-to-post
  creatives (copy baked in) built around those real screenshots.

---

## 1. Real app screenshots — `app-screenshots/`

Captured from the running app (Vite build, 1440×900 CSS px at `deviceScaleFactor: 2`,
so every file is 2880×1800 and stays sharp when a video editor pans or zooms).

| File | Screen | Best used for |
| --- | --- | --- |
| `01-login.png` | Sign-in (brand panel + form) | Opening frame, "secure access" |
| `02-dashboard.png` | Dashboard: patients, today's appointments, revenue, pending labs | Hero shot — most persuasive single frame |
| `03-patients.png` | Patient registry with Nepali names, codes, ages, districts | "Records" beat |
| `04-patient-detail.png` | Patient profile, address, medical alerts, insurance | Depth / trust beat |
| `05-appointments.png` | Daily queue with tokens, doctor, status | "No more chaos" beat |
| `06-encounters.png` | SOAP consultation list with vitals | Doctor-facing beat |
| `07-billing.png` | Bills, paid / due / status | Money beat |
| `08-inventory.png` | Pharmacy stock, batch, expiry, low stock | Pharmacy beat |
| `09-lab.png` | Lab orders and results with statuses | Lab beat |
| `10-users.png` | Staff accounts and roles | Team / access control beat |
| `11-settings.png` | Clinic profile, NPR, invoice prefix, working hours | Setup beat |
| `12-register-patient.png` | Add-patient form (English + Nepali labels) | "Onboarding is quick" beat |
| `13-new-bill-modal.png` | Composing a bill (line items, VAT, payment) | Close-up insert |
| `14-new-appointment-modal.png` | Booking an appointment | Close-up insert |
| `15-mobile-dashboard.png` | Dashboard on a phone (414×896 @3×) | "Works on any device" |
| `16-mobile-login.png` | Mobile sign-in | Reels opener |
| `17-mobile-patients.png` | Patient list on a phone | Mobile beat |

**About the data in these screenshots:** it is realistic **demo data** — a fictional
clinic ("Sagarmatha Polyclinic", Butwal), Nepali patient names in English and
Devanagari, NPR amounts, eSewa / Khalti payments, AD dates. No real patient data is
shown. If you would rather show your own clinic name, patients or pricing, re-shoot
the screens after seeding your database — the layout needs no changes.

---

## 2. AI-generated scene photography — `ai-scenes/`

Photorealistic, Nepal-specific stock for cuts, backgrounds and B-roll stills
(9:16 unless noted). No logos, no readable brand names, no text to fight with.

| File | Scene |
| --- | --- |
| `scene-01-consultation.jpg` | Female doctor consulting a patient across the desk (has a monitor — pairs well with a UI inset) |
| `scene-02-reception.jpg` | Receptionist at the front desk, patients waiting |
| `scene-03-pharmacy.jpg` | Pharmacist handing medicine to a mother and child |
| `scene-04-lab.jpg` | Lab technician at the microscope |
| `scene-05-clinic-exterior.jpg` | Small clinic building on a Nepali street (16:9) |
| `scene-06-phone-in-hand.jpg` | Hand holding a phone with a **blank white screen** — drop a screenshot onto it |
| `scene-07-doctor-portrait.jpg` | Doctor portrait on a plain teal backdrop — great for lower-thirds / cut-outs |
| `scene-08-happy-patient.jpg` | Relieved elderly patient shaking the doctor's hand |
| `scene-09-waiting-area.jpg` | Calm waiting area with a father and child |

These are generated images, not photos of real people or of your clinic — say so
if a reviewer asks, and prefer them as background/B-roll rather than as the claim.

---

## 3. Finished creatives — `social/`

Copy is already set in Inter + Noto Sans Devanagari, so Nepali text renders
correctly (no broken conjuncts). All are PNG, sRGB, ready to upload.

### 9:16 — Reels / Stories (`1080×1920`)
Use these as video slides or story cards, in this order:

1. `story-01-hook.png` — "Your clinic, finally organised." (photo + scrim)
2. `story-02-problem.png` — "The register can't tell you who's next." (the pain)
3. `story-03-patients.png` — patient records + 3 benefit rows + real UI
4. `story-04-appointments.png` — queue and tokens + real UI
5. `story-05-billing.png` — billing in NPR + real UI
6. `story-06-lab.png` — lab results + real UI
7. `story-07-cta.png` — "Run your clinic, not the paperwork." + **Book a free demo**

### 1:1 — Feed posts / carousel (`1080×1080`)
`post-01-hero.png`, `post-02-all-in-one.png`, `post-03-nepali.png`,
`post-04-stock.png`, `post-05-team.png`

### 16:9 — In-stream, YouTube, end cards (`1920×1080`)
`wide-01-hero.png` (photo + promise), `wide-02-endcard.png` (logo + CTA + screens),
`wide-03-screens.png` (screen montage)

### Link / right-column ad (`1200×628`)
`link-ad-01.png`

### Clean mockups — no copy, edit freely
`mockup-browser-dashboard.png`, `mockup-browser-billing.png`,
`mockup-browser-lab.png` (1920×1080, screenshot inside a browser chrome on a mint
gradient), `mockup-phone-dashboard.png` (1080×1920, phone frame).

---

## 4. Suggested 30-second reel

| Time | Visual | Voice-over / on-screen |
| --- | --- | --- |
| 0–3 s | `story-01-hook.png` or `scene-01-consultation.jpg` | "Your clinic, finally organised." |
| 3–7 s | `scene-02-reception.jpg` → `story-02-problem.png` | "Registers, tokens, pending bills — who's next?" |
| 7–12 s | `02-dashboard.png` (slow push-in) | "One dashboard: patients, today's queue, revenue, lab work." |
| 12–17 s | `03-patients.png` → `05-appointments.png` | "Every patient on file. Every token in order." |
| 17–22 s | `07-billing.png` → `08-inventory.png` | "Bills in NPR, part payments, stock and expiry." |
| 22–26 s | `09-lab.png` → `15-mobile-dashboard.png` | "Lab results the moment they're ready — on any device." |
| 26–30 s | `wide-02-endcard.png` / `story-07-cta.png` | "Book a free demo." |

Safe areas: keep text inside the middle ~80% vertically for Reels/Stories (the
platform UI covers the top and bottom edges). Every 9:16 creative here already
respects that.

## 5. Before you publish

- Replace **"Message us for a free demo"** / **"Book a free demo"** with your real
  WhatsApp number, page link or website — no domain is hard-coded in the images.
- Add your own logo/colour if you have one; these use the app's own teal
  (`#0d9488`) and the "Clinic MS" mark from the product UI.
- Facebook/Instagram will re-compress uploads; keep the MP4 at 1080×1920 (9:16),
  1080×1080 (1:1) or 1920×1080 (16:9), H.264, and keep text within the safe areas.
- Suggested caption (English): *"Patient records, appointments, billing, pharmacy
  and lab — one calm workspace for Nepali clinics. Message us for a free demo.
  #clinicmanagement #Nepal #healthtech #Butwal"*
  Nepali version: *"बिरामीको रेकर्ड, अपोइन्टमेन्ट, बिल, औषधि र ल्याब — एउटै
  सफ्टवेयरमा। निःशुल्क डेमोका लागि सन्देश पठाउनुहोस्।"*

## 6. Previews

`previews/` has quick contact sheets (`ui-sheet.png`, `stories-sheet.png`,
`posts-sheet.png`, `wide-sheet.png`, `mobile-sheet.png`) if you want one glance at
everything without opening 40 files.
