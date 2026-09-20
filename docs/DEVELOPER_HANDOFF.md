# SmartGov Hospital — Deep-Dive Developer Handoff Manual

> **Comprehensive Developer Handoff Document**  
> *Targeted at engineers inheriting, maintaining, and scaling the SmartGov Hospital platform.*

---

## 1. Project Context & Engineering Principles

### Purpose
SmartGov Hospital is a full-stack, graduation-grade health informatics web system built to modernize outpatient clinic reservations and queue management for the Egyptian Ministry of Health and Population (MoHP) and Universal Health Insurance System (UHIS / التأمين الصحي الشامل).

### Engineering Non-Negotiables
1. **Explainable Intelligence:** The system uses 100% deterministic, rule-based algorithmic intelligence (`lib/smart/`). There are zero black-box third-party ML/AI API dependencies.
2. **Arabic-First Design:** Arabic (`ar`) is the primary language and RTL is the default layout. English (`en`, LTR) is supported with 100% string dictionary parity in `messages/`.
3. **Zero Double-Booking Guarantee:** All appointment slot bookings are guarded by PostgreSQL row-level locks (`SELECT ... FOR UPDATE`) in serializable atomic transactions.
4. **Strict TypeScript & Safety:** Strict type checking (`strict: true`) with no unchecked `any` compromises across the codebase.
5. **Role-Based Access Control (RBAC):** Five clear actor roles (`PATIENT`, `RECEPTION`, `DOCTOR`, `HOSPITAL_ADMIN`, `MINISTRY_ADMIN`) enforced at middleware, server actions, and UI layers.

---

## 2. Quick Local Environment Setup

### Prerequisites
- **Node.js:** v18.18+ or v20+ (Node 22 LTS recommended)
- **Package Manager:** `pnpm` (`npm install -g pnpm`)
- **Docker:** Docker Desktop or Docker Engine (for PostgreSQL 16)
- **Git:** Configured with your SSH or HTTPS credentials

### Step-by-Step Setup Guide

```bash
# 1. Clone repository
git clone https://github.com/mohammednagi/hospital_project.git
cd hospital_project

# 2. Install dependencies
pnpm install

# 3. Environment Variables
copy .env.example .env     # Windows
# or: cp .env.example .env # macOS / Linux

# 4. Spin up PostgreSQL 16
docker compose up -d

# 5. Apply database migrations
pnpm prisma migrate deploy

# 6. Seed demo data (Egyptian governorates, hospitals, doctors, demo accounts)
pnpm db:seed

# 7. Run automated test suites
pnpm test

# 8. Start development server
pnpm dev
```

Visit `http://localhost:3000` (defaults to Arabic RTL: `http://localhost:3000/ar`).

---

## 3. Demo Credentials Reference

All seeded accounts share the default password: **`GovEgypt@2026`**.

| Role | National ID | Full Name | Governorate | Role Responsibilities |
| :--- | :--- | :--- | :--- | :--- |
| `PATIENT` | `29501010101234` | أحمد محمود إبراهيم | القاهرة | Outpatient booking, symptom triage, QR ticket, appointment cancellation/reschedule |
| `RECEPTION` | `28805050105678` | فاطمة حسن رضوان | القاهرة | Kasr El-Aini reception desk: Live Kanban board, walk-in reservations, check-ins |
| `DOCTOR` | `28003030109012` | د. حازم عبد الله الجزار | القاهرة | Internal Medicine clinic: Live queue, call next, diagnosis notes, no-show marking |
| `HOSPITAL_ADMIN` | `27511110103456` | د. مروان فتحي البهنساوي | القاهرة | Kasr El-Aini Hospital Director: Schedule templates, 14-day slot generator, blackouts |
| `MINISTRY_ADMIN` | `27008080107890` | د. طارق شوقي عبد السلام | جمهورية مصر | MoHP Undersecretary: National telemetry KPIs, governorate heatmaps, CSV exports |

---

## 4. Key Subsystems & Source Code Layout

### 1. `lib/smart/` — The Smart Decision Engine
All algorithms are self-contained, pure, and thoroughly covered by unit tests in `tests/smart/`:
- **`national-id.ts`:** Decodes 14-digit Egyptian National ID. Extracts century (`2` for 1900s, `3` for 2000s), birth date, governorate code (`01`–`88`), and gender.
- **`specialty-suggest.ts`:** Symptom complaints parser. Matches Arabic/English medical keywords with weighted confidence scoring.
- **`priority-lane.ts`:** Assigns priority lane (`PRIORITY_ELDERLY` for age $\ge 65$, `PRIORITY_SPECIAL_NEEDS` for UHIS card holders, `NORMAL`).
- **`no-show-risk.ts`:** Predicts no-show risk based on patient attendance history and computes dynamic clinic overbooking allowance ($+1$ or $+2$).
- **`slot-ranking.ts`:** Ranks bookable slots by combining proximity ($40\%$), earliest time ($35\%$), and clinic utilization ($25\%$).
- **`waitlist.ts`:** Evaluates waitlisted patients when a booking is canceled and promotes the oldest candidate (FIFO) with a 30-minute reservation offer.

### 2. `server/` — Server Actions & Atomic Transactions
- Handles all server mutations using Prisma client inside transactions (`prisma.$transaction`).
- Enforces strict row locking on slots to prevent race-condition double bookings.
- Automatically inserts an `AuditLog` row for every critical state change.

### 3. `components/chrome/` — Navigation Chrome
- **`top-nav.tsx`:** Floating navigation bar with role-aware links, notification popover, user avatar, and instant locale switcher (`ar` $\leftrightarrow$ `en`).
- **`mobile-bottom-bar.tsx`:** Apple-style bottom tab bar for mobile viewports ($<768\text{px}$) with active spring pill indicator.

### 4. `lib/motion.ts` — Apple-Inspired Motion Physics
- Fluid spring transitions using `motion/react`:
  - `springSubtle` (`{ stiffness: 400, damping: 30 }`)
  - `springCard` (`{ stiffness: 280, damping: 25 }`)
  - Directional transitions automatically mirror when in RTL (`isRTL ? -1 : 1`).

---

## 5. Developer Guide: Extending the System

### Adding a New Specialty or Hospital
1. Open `prisma/seed.ts`.
2. Add the new record to the `specialties` or `hospitals` array.
3. If adding a specialty, provide both Arabic and English names and keyword arrays:
   ```typescript
   {
     code: "DERMATOLOGY",
     nameAr: "الجلدية والتناسلية",
     nameEn: "Dermatology & Venereology",
     keywordsAr: ["حكة", "طفح جلدي", "حب شباب", "أكزيما"],
     keywordsEn: ["rash", "itching", "acne", "eczema"]
   }
   ```
4. Run `pnpm db:seed` to update the local database.

### Adding New UI Translations
1. In `messages/ar.json`, add your keys under the appropriate namespace.
2. In `messages/en.json`, add the exact identical key structure in English.
3. Use the `useTranslations` hook in client or server components:
   ```tsx
   import { useTranslations } from "next-intl";
   
   export function MyComponent() {
     const t = useTranslations("common");
     return <button>{t("save")}</button>;
   }
   ```

### Adding a Database Migration
When modifying `prisma/schema.prisma`:
```bash
# 1. Update schema.prisma
# 2. Run migration dev command:
pnpm prisma migrate dev --name your_feature_name
# 3. Prisma client will regenerate automatically
```

---

## 6. Automated Testing & Verification

```bash
# Run all unit tests
pnpm test

# Run tests with branch coverage report
pnpm test:coverage

# Run concurrency stress test (20 parallel requests against capacity-2 slot)
pnpm test tests/concurrency/booking-concurrency.test.ts

# Run Playwright end-to-end browser tests
pnpm test:e2e
```

---

## 7. Recommended Future Roadmap

For developers looking to take this graduation-grade prototype to a live MoHP pilot:
1. **SMS / WhatsApp Gateway:** Connect `lib/notifications.ts` to Twilio or a local Egyptian SMS gateway (e.g., Vodafone SMS API).
2. **UHIS National API Integration:** Connect citizen verification to the live Universal Health Insurance System API.
3. **Waiting Room Live Display:** Build a real-time WebSocket or Server-Sent Events (SSE) display board route (`/[locale]/display/[clinicId]`) for public waiting room monitors.
4. **Payment Gateway:** Integrate with **Fawry** or **Meeza** for nominal outpatient ticket fees (5–10 EGP).
5. **Radiology & Lab Attachments:** Expand the Doctor workspace to upload prescriptions and view laboratory test results.

---

## 8. License & Maintainer

- **Developer:** Ahmed Hossam
- **Target Organization:** Graduation Project from Sherouck Academy
- **Repository:** [https://github.com/mohammednagi/hospital_project](https://github.com/mohammednagi/hospital_project)

