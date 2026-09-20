# SmartGov Hospital — Design System Handoff & Redesign Specification

> **Engineering-Grade Design Handoff Document for Visual Language & Motion Redesign.**  
> *Targeted for a Designer-Engineer pair executing an Apple-inspired visual and tactile redesign without needing to read application backend or business logic code.*

---

## 1. Screen Inventory (15 Application Screens)

| Route | Role | Purpose | Primary Action | Secondary Actions | Screenshot Paths |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/[locale]` | Public | MoHP portal welcome, UHIS announcements, high-level queue transparency, and role gateway | "Book Outpatient Appointment" (`/book`) | Language toggle, login link, direct role workspace shortcuts | `docs/screens/public/landing-ar-375.png`<br/>`docs/screens/public/landing-en-1440.png` |
| `/[locale]/login` | Public | National ID & password authentication; quick one-click demo credential injectors | "Sign In" (تسجيل الدخول) | One-click demo role fill buttons (Citizen, Reception, Doctor, Hospital Admin, Ministry Admin), citizen registration link | `docs/screens/public/login-ar-375.png`<br/>`docs/screens/public/login-en-1440.png` |
| `/[locale]/register` | Public | Citizen registration with real-time 14-digit National ID decoding (century, birthdate, governorate, gender) and mock SMS OTP | "Proceed to OTP" / "Complete Registration" | Governorate override dropdown, return to sign-in | `docs/screens/public/register-ar-375.png`<br/>`docs/screens/public/register-en-1440.png` |
| `/[locale]/dashboard` | `PATIENT` | Citizen home base displaying active/upcoming appointment, quick rebook of past clinics, and notification overview | "Book New Appointment" | View ticket (`/appointments/[id]/ticket`), quick rebook past visit, open notification center | `docs/screens/patient/dashboard-ar-375.png`<br/>`docs/screens/patient/dashboard-en-1440.png` |
| `/[locale]/book` | `PATIENT` | Step 1: Free-text symptom input with real-time rule-based specialty triage and confidence ratings | Select suggested specialty card | Common symptom chips (Chest pain, Headache, Abdominal pain), review medical disclaimer | `docs/screens/patient/book-ar-375.png`<br/>`docs/screens/patient/book-en-1440.png` |
| `/[locale]/book/hospital` | `PATIENT` | Step 2: Map-free hospital proximity list showing distance in kilometers, hospital tier, and opening availability | "Select Hospital" (اختيار المستشفى) | Governorate filter selector, back to symptom input | `docs/screens/patient/book-hospital-ar-375.png`<br/>`docs/screens/patient/book-hospital-en-1440.png` |
| `/[locale]/book/slot` | `PATIENT` | Step 3: Top-5 algorithmically ranked time slots with explainable smart badges (doctor seniority, proximity, queue load) | "Select Slot" (اختيار هذا الموعد) | Switch between "Smart Recommended" and "Full Calendar Grid", "Join Smart Waitlist" | `docs/screens/patient/book-slot-ar-375.png`<br/>`docs/screens/patient/book-slot-en-1440.png` |
| `/[locale]/book/confirm` | `PATIENT` | Step 4: Pre-booking review, UHIS insurance coverage check, optional clinical notes, and atomic booking submission | "Confirm & Issue Official Ticket" (تأكيد الحجز) | Cancel / return to slot selection | `docs/screens/patient/book-confirm-ar-375.png`<br/>`docs/screens/patient/book-confirm-en-1440.png` |
| `/[locale]/appointments` | `PATIENT` | Citizen appointment center with categorized views for active visits and historical records | "View Official Ticket" | Toggle Upcoming vs Past tabs, open cancellation dialog with reason selection, reschedule visit | `docs/screens/patient/appointments-ar-375.png`<br/>`docs/screens/patient/appointments-en-1440.png` |
| `/[locale]/appointments/[id]/ticket` | `PATIENT` / `RECEPTION` | Official digital boarding ticket with dynamic QR code canvas, queue code (`A-01`), and clinic routing | "Print Ticket" (طباعة التذكرة) | Download `.ics` calendar sync file, return to appointments dashboard | `docs/screens/patient/ticket-ar-375.png`<br/>`docs/screens/patient/ticket-en-1440.png` |
| `/[locale]/notifications` | `PATIENT` | SMS simulator stream and administrative notifications (booking confirmation, waitlist promotions) | Review message details | Dismiss alert, open associated appointment/ticket | `docs/screens/patient/notifications-ar-375.png`<br/>`docs/screens/patient/notifications-en-1440.png` |
| `/[locale]/reception/board` | `RECEPTION` | Real-time 4-column clinic Kanban queue board (`محجوز`, `حاضر بالعيادة`, `جاري الكشف`, `تم الكشف / غياب`) | Quick check-in by National ID or ticket search | Open Walk-In registration modal, filter board by clinic/room, print today's board summary | `docs/screens/reception/board-ar-375.png`<br/>`docs/screens/reception/board-en-1440.png` |
| `/[locale]/doctor/queue` | `DOCTOR` | Outpatient consultation workstation with priority-sorted waiting line (elderly and priority lanes first) | "Call Next Patient" (نداء على المريض التالي) | Complete consultation with 280-char diagnosis note, mark No-Show (enabled after 15-min grace timer) | `docs/screens/doctor/queue-ar-375.png`<br/>`docs/screens/doctor/queue-en-1440.png` |
| `/[locale]/hospital-admin/clinics` | `HOSPITAL_ADMIN` | Hospital operational dashboard for monitoring clinic utilization and generating schedules | "Generate Next 14 Days Slots" | Schedule hospital/doctor blackout date modal, filter clinic utilization matrix | `docs/screens/hospital-admin/clinics-ar-375.png`<br/>`docs/screens/hospital-admin/clinics-en-1440.png` |
| `/[locale]/ministry/dashboard` | `MINISTRY_ADMIN` | MoHP National Central Command telemetry: 4 KPIs, governorate bar chart, 30-day trend lines, overloaded clinics, and heat table | "Export Appointments (CSV)" | Open "Onboard New Hospital" modal, filter telemetry by governorate, apply date-range filters | `docs/screens/ministry/dashboard-ar-375.png`<br/>`docs/screens/ministry/dashboard-en-1440.png` |

---

## 2. Component Inventory (`components/`)

| Component | File Path | Props (Name, Type, Required) | Consuming Screens & Context |
| :--- | :--- | :--- | :--- |
| **`TopNav`** | `components/chrome/top-nav.tsx` | • `user`: `{ id: string; role: string; fullNameAr: string; fullNameEn: string; } \| null` (Optional) | Universal sticky header across all 15 screens. Provides MoHP branding, UHIS badge, active role badge pill, `LanguageToggle`, and sign-out button. |
| **`MobileBottomBar`** | `components/chrome/mobile-bottom-bar.tsx` | • None (`{}`) | Mounted on mobile viewports ($< 768\text{ px}$) across patient screens: Landing (`/`), Dashboard (`/dashboard`), Book (`/book`, `/book/confirm`), Appointments (`/appointments`), Ticket (`/ticket`), and Notifications (`/notifications`). Contains 44px touch-target icons. |
| **`LanguageToggle`** | `components/chrome/language-toggle.tsx` | • None (`{}`) | Rendered inside `TopNav` on all screens. Handles locale switching between Arabic (`ar` RTL) and English (`en` LTR) using `next-intl` router navigation. |
| **`Providers`** | `components/providers.tsx` | • `children`: `React.ReactNode` (Required) | Root layout provider in `app/[locale]/layout.tsx`. Configures `QueryClientProvider` with 60s stale time and disabled window-focus refetching. |
| **`GovernorateBarChart`** | `components/charts/governorate-bar-chart.tsx` | • `data`: `{ code: string; nameAr: string; nameEn: string; appointmentsCount: number; }[]` (Required) | Ministry Dashboard (`/ministry/dashboard`). Renders an accessible Recharts bar chart showing appointment volumes across Egyptian governorates with reversed X-axis in RTL. |
| **`TrendLineChart`** | `components/charts/trend-line-chart.tsx` | • `data`: `{ date: string; booked: number; completed: number; noShow: number; }[]` (Required) | Ministry Dashboard (`/ministry/dashboard`). Visualizes 30-day longitudinal curves comparing total bookings, completed consultations, and no-show absences. |
| **`HeatTable`** | `components/charts/heat-table.tsx` | • `data`: `{ specialtyCode: string; specialtyNameAr: string; specialtyNameEn: string; governorates: { governorateCode: string; nameAr: string; nameEn: string; waitDays: number; }[]; }[]` (Required) | Ministry Dashboard (`/ministry/dashboard`). Renders a matrix of Medical Specialties $\times$ Top Governorates displaying average wait days in color-coded pills (Green $\le 2\text{d}$, Yellow $\le 4\text{d}$, Red $> 4\text{d}$). |

---

## 3. Verbatim Token Sheet

### 3.1 Design System Tokens (`app/globals.css`)
```css
:root {
  --background: 210 20% 98%;
  --foreground: 222 47% 11%;
  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;
  --popover: 0 0% 100%;
  --popover-foreground: 222 47% 11%;
  --primary: 217 91% 40%; /* Egypt Gov Blue */
  --primary-foreground: 210 40% 98%;
  --secondary: 215 25% 93%;
  --secondary-foreground: 222 47% 11%;
  --muted: 215 20% 95%;
  --muted-foreground: 215 16% 47%;
  --accent: 173 80% 36%; /* Medical Mint */
  --accent-foreground: 210 40% 98%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 210 40% 98%;
  --border: 214 32% 91%;
  --input: 214 32% 91%;
  --ring: 217 91% 40%;
  --radius: 0.75rem;

  /* Semantic Health & Status Tokens */
  --status-booked: 217 91% 60%;
  --status-checkedin: 173 80% 36%;
  --status-inprogress: 38 92% 50%;
  --status-completed: 142 76% 36%;
  --status-noshow: 0 84% 60%;
  --status-cancelled: 215 16% 47%;

  /* Translucent Chrome Backgrounds */
  --chrome-bg: rgba(255, 255, 255, 0.82);
  --chrome-border: rgba(226, 232, 240, 0.7);

  /* Fonts & Typography */
  --font-system: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Naskh Arabic", sans-serif;
}

.dark {
  --background: 224 71% 4%;
  --foreground: 213 31% 91%;
  --card: 224 71% 7%;
  --card-foreground: 213 31% 91%;
  --popover: 224 71% 7%;
  --popover-foreground: 213 31% 91%;
  --primary: 217 91% 60%;
  --primary-foreground: 222 47% 11%;
  --secondary: 215 28% 17%;
  --secondary-foreground: 210 40% 98%;
  --muted: 215 28% 17%;
  --muted-foreground: 215 20% 65%;
  --accent: 173 80% 40%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 63% 31%;
  --destructive-foreground: 210 40% 98%;
  --border: 215 28% 17%;
  --input: 215 28% 17%;
  --ring: 217 91% 60%;

  --chrome-bg: rgba(15, 23, 42, 0.82);
  --chrome-border: rgba(30, 41, 59, 0.7);
}

[dir="rtl"] {
  direction: rtl;
  text-align: right;
}

[dir="ltr"] {
  direction: ltr;
  text-align: left;
}

/* Arabic body line-height 1.6, 0 letter-spacing */
[dir="rtl"] body,
[dir="rtl"] p,
[dir="rtl"] span,
[dir="rtl"] button,
[dir="rtl"] input,
[dir="rtl"] select,
[dir="rtl"] textarea {
  line-height: 1.6;
  letter-spacing: 0;
}
```

### 3.2 Motion Presets (`lib/motion.ts`)
```typescript
import { Transition } from "motion/react";
import { useEffect, useState } from "react";

/**
 * Shared motion configuration for SmartGov Hospital.
 * All animations MUST use these presets to allow clean visual redesign passes.
 */

// Critically damped spring for standard UI interactions (dialogs, sheets, menus)
export const springDefault: Transition = {
  type: "spring",
  bounce: 0,
  duration: 0.35,
};

// Momentum spring for playful or expressive highlights (drawers, success toasts)
export const springMomentum: Transition = {
  type: "spring",
  bounce: 0.2,
  duration: 0.4,
};

// Fallback linear transition for reduced motion preference
export const reducedMotionTransition: Transition = {
  duration: 0.15,
  ease: "linear",
};

/**
 * Hook to detect if user has requested reduced motion.
 * When enabled, components swap physical spring animations to a 150ms opacity fade.
 */
export function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mediaQuery.matches);

    const listener = (event: MediaQueryListEvent) => {
      setPrefersReduced(event.matches);
    };

    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  return prefersReduced;
}

/**
 * Helper to retrieve the active transition based on reduced motion setting.
 */
export function getTransition(
  preset: "default" | "momentum" = "default",
  isReduced = false
): Transition {
  if (isReduced) return reducedMotionTransition;
  return preset === "momentum" ? springMomentum : springDefault;
}

export const fadeInVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const modalVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export const sheetVariants = {
  initial: { opacity: 0, y: "100%" },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: "100%" },
};
```

---

## 4. Interaction Inventory

| Interactive Element | Owning File | User Trigger | Enter / Exit Vector | Current Implementation (Spring vs CSS) | Redesign Opportunity |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Walk-In Modal** | `app/[locale]/(reception)/reception/board/page.tsx` | Click "+ Walk-In" button | Center scale $0.95 \rightarrow 1.0$, opacity $0 \rightarrow 1$ | CSS transition (`animate-in fade-in-0 zoom-in-95`) | Replace with `modalVariants` + `springDefault` spring physics. |
| **Cancel Appointment Dialog** | `app/[locale]/(patient)/appointments/page.tsx` | Click "Cancel" button on card | Center scale $0.95 \rightarrow 1.0$, backdrop blur | CSS transition | Upgrade to bottom sheet on mobile ($375\text{ px}$) with swipe-to-dismiss gesture. |
| **Onboard Hospital Modal** | `app/[locale]/(ministry)/ministry/dashboard/page.tsx` | Click "+ Onboard New Hospital" | Center scale $0.95 \rightarrow 1.0$, backdrop blur | CSS transition | Modal task with translucent background scrim and spring physics. |
| **Blackout Date Scheduler Modal** | `app/[locale]/(hospital-admin)/hospital-admin/clinics/page.tsx` | Click "Schedule Blackout" | Center scale $0.95 \rightarrow 1.0$ | CSS transition | Convert to slide-over drawer or critically damped modal dialog. |
| **Reception Check-in Toast** | `app/[locale]/(reception)/reception/board/page.tsx` | Submission of check-in / search | Drops from top ($y: -10 \rightarrow 0$) | Conditional render + CSS transition | Replace with `springMomentum` bounce toast with auto-dismiss progress timer. |
| **Doctor Grace Timer Gauge** | `app/[locale]/(doctor)/doctor/queue/page.tsx` | Active consultation start | 1-second interval state update | Plain text countdown clock | Convert to Apple Watch-style circular ring progress gauge with smooth fill animation. |
| **Upcoming / Past Tabs** | `app/[locale]/(patient)/appointments/page.tsx` | Click tab pill | Immediate DOM swap | CSS background transition | Add an animated layout pill indicator (`layoutId="tabPill"`) sliding smoothly beneath active tab. |
| **Slot Recommendation Tabs** | `app/[locale]/(patient)/book/slot/page.tsx` | Click "Smart" vs "Full Grid" | Immediate DOM swap | CSS background transition | Sliding segment control with tactile pointer-down feedback. |
| **Common Symptom Chips** | `app/[locale]/(patient)/book/page.tsx` | Click symptom chip | Pointer down | CSS transform (`active:scale-[0.97]`) | Add subtle haptic spring deflection and instantaneous highlight. |
| **Tactile Buttons & Links** | `app/globals.css` | Universal pointer-down | Deflects to `scale(0.97)` on `:active` | CSS cubic-bezier transition ($0.12\text{ s}$) | Maintain 44px min touch target; bind with pointer-down listeners to remove 300ms tap delay. |

---

## 5. UX Rough Edges Observed During Implementation

1. **`/[locale]/book/slot` (Slot Selection on Mobile):**  
   *Observation:* On a 375px mobile viewport, the slot cards stack in a long vertical scroll requiring extensive finger travel.  
   *Redesign Direction:* Implement an interactive Apple Maps-style bottom sheet (`sheetVariants`) with $1:1$ touch drag tracking, rubber-banding at the upper limit, velocity handoff, and snap points ($30\%$ preview, $60\%$ selection, $90\%$ full calendar).
2. **`/[locale]/reception/board` (Kanban Board Density):**  
   *Observation:* Columns on desktop use horizontal scrolling if all 4 categories are loaded with patients. Card check-in relies on a small text button.  
   *Redesign Direction:* Support direct tactile drag-and-drop between columns with spring release into the "Checked-in" lane, paired with accessible keyboard shortcuts (`Space` to check-in).
3. **`/[locale]/doctor/queue` (Grace Period Countdown):**  
   *Observation:* The 15-minute countdown is currently plain text (`الوقت المتبقي: 14:32`). When expired, it abruptly replaces text with an alert.  
   *Redesign Direction:* Render a physical countdown ring with color graduation (Mint $\rightarrow$ Amber $\rightarrow$ Rose) that springs into an enabled "Mark No-Show" button when time reaches zero.
4. **`/[locale]/appointments` (Cancellation Friction):**  
   *Observation:* Canceling an appointment requires opening a standard modal and clicking confirm.  
   *Redesign Direction:* Introduce an iOS Mail-style swipe-to-reveal destructive action on appointment cards with momentum spring snap.
5. **`TopNav` & `MobileBottomBar` (Frosted Materials):**  
   *Observation:* Both navigation chrome bars use a hard $1\text{ px}$ border line (`border-b border-border`).  
   *Redesign Direction:* Remove hard border lines in favor of an organic scroll-edge mask / subtle gradient drop shadow so content smoothly blurs and scrolls underneath the translucent material.

---

## 6. Constraints the Redesign Must Preserve

1. **RTL Directional Motion Mirroring:**  
   Under `[dir="rtl"]`, all horizontal transitions must invert their signs ($+x \leftrightarrow -x$). Drawers and sheets must enter from the logical start edge (right in Arabic, left in English).
2. **Accessibility & Preference Queries:**  
   - `@media (prefers-reduced-motion: reduce)`: All spring animations must immediately degrade to a $150\text{ ms}$ linear opacity cross-fade.  
   - `@media (prefers-reduced-transparency: reduce)`: All `.chrome-translucent` materials must become solid opaque surfaces (`hsl(var(--background))`).  
   - `prefers-contrast: more`: Borders must double in weight to maintain WCAG AA compliance.
3. **Physical Touch Boundaries:**  
   Every button, interactive chip, and navigation item must maintain a minimum bounding box of **$44 \times 44\text{ px}$** (`min-height: 2.75rem`).
4. **Strict Architectural Scope Lock:**  
   The redesign pass is strictly restricted to `app/**/*.tsx`, `components/**`, `app/globals.css`, and `lib/motion.ts`.  
   **Forbidden Modifications:** Do not touch `server/actions/`, `lib/smart/`, `prisma/schema.prisma`, `lib/auth.ts`, or any API route under `app/api/`. Business logic, validation rules, and database models are frozen.

---

## 7. Run Instructions & Demo Accounts

### 7.1 Setup Commands
```bash
# 1. Install dependencies
pnpm install

# 2. Verify database connection & seed data
docker compose up -d || pnpm db:start
pnpm prisma db seed

# 3. Start local development server
pnpm dev
```
Access the application at `http://localhost:3000` (defaults to Arabic RTL: `http://localhost:3000/ar`).

### 7.2 Demo Accounts (Password: `SEED_DEFAULT_PASSWORD`)
*Note: The password string is stored in the project environment variables (`SEED_DEFAULT_PASSWORD`). Quick-fill injector buttons are available on the login page.*

| System Role | Demo National ID | Persona & Governorate | Direct Application Workspace |
| :--- | :--- | :--- | :--- |
| **PATIENT** | `29501010101234` | أحمد محمود إبراهيم — القاهرة | `http://localhost:3000/ar/dashboard` |
| **RECEPTION** | `28805050105678` | فاطمة حسن رضوان — قصر العيني | `http://localhost:3000/ar/reception/board` |
| **DOCTOR** | `28003030109012` | د. حازم عبد الله الجزار — عيادة باطنة | `http://localhost:3000/ar/doctor/queue` |
| **HOSPITAL_ADMIN** | `27511110103456` | د. مروان فتحي البهنساوي — مدير مستشفى | `http://localhost:3000/ar/hospital-admin/clinics` |
| **MINISTRY_ADMIN** | `27008080107890` | د. طارق شوقي عبد السلام — قيادة الوزارة | `http://localhost:3000/ar/ministry/dashboard` |
