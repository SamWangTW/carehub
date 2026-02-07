# CareHub  
**Full-Stack Healthcare Provider Dashboard**

CareHub is a **Next.js App Router** application for managing healthcare workflows, including patient search and filtering, patient detail views, appointment scheduling, and real-time notifications.

---

##  Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State & Data:** Server Components, URL-driven state
- **Testing:** Playwright (API + E2E), Vitest + Testing Library

---

##  Setup Instructions

### Prerequisites

- Node.js 20+
- npm 10+

---

### Installation

```bash
npm install
```

---

### Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_FAKE_LATENCY=0
NEXT_PUBLIC_FAKE_ERROR_RATE=0
```

---

### Run Locally

```bash
npm run dev
```

Open: http://localhost:3000

---

### Production Build

```bash
npm run build
npm run start
```

---

##  Testing

```bash
npm run test:unit
npm run test:api
npm run test:e2e
```

---

##  Architecture Decisions

### 1. Server-First Rendering (Next.js App Router)

- Patient list (`/patients`) and patient detail (`/patients/[id]`) pages are server-rendered.
- Uses Suspense fallbacks for predictable loading behavior.
- Enables clean URL-based filtering and tab state.

---

### 2. URL as the Source of Truth

UI state is stored entirely in query parameters:

- `/patients`: search, filters, sorting, pagination
- `/patients/[id]`: active tab via `?tab=`
- `/schedule`: view mode, date, grouping

Result: shareable links, reload-safe state, and native back/forward navigation.

---

### 3. Mock API Routes with Deterministic Data

- APIs implemented under `app/api/**`
- Backed by deterministic mock generators (`mocks/*`) and in-memory stores (`lib/mock-db/*`)
- Latency and failure simulation controlled via environment flags

---

### 4. Client Interactivity Where Needed

- Scheduler runs as a client component (drag-and-drop, conflict detection)
- Notes support optimistic updates with rollback
- Notifications use SWR polling with local read-state persistence

---

### 5. Reliability & Error Handling

- Global and route-level error boundaries
- Per-section error boundaries on patient detail tabs
- Centralized error reporting and shared retry logic

---

### 6. Validation Strategy

- Zod for runtime validation
- Route handlers validate IDs, enums, dates, and required payloads

---

### 7. Testing Strategy

- API tests (Playwright API mode)
- End-to-end tests for critical user flows
- Component tests for complex UI components

---

## 🔌 API Surface (Implemented)

### Patients
- GET `/api/patients`
- GET `/api/patients/:id`
- PUT `/api/patients/:id`
- GET `/api/patients/:id/appointments`
- GET `/api/patients/:id/vitals`
- GET `/api/patients/:id/notes`
- POST `/api/patients/:id/notes`

### Appointments
- GET `/api/appointments`
- POST `/api/appointments`
- PUT `/api/appointments/:id`
- DELETE `/api/appointments/:id`

### Providers
- GET `/api/providers`
- GET `/api/providers/:id/schedule`

### Notifications
- GET `/api/notifications`
- POST `/api/notifications/:id/read`
- POST `/api/notifications/mark-all-read`
- POST `/api/notifications/debug/emit`

---

## What I’d Improve With More Time

- Complete Scheduler CRUD API integration
- Stricter REST semantics for notifications
- Richer notes editor with sanitization
- Improved accessibility (keyboard + ARIA)
- Expanded test coverage and observability
- Deployment hardening (env validation, CI gates)
