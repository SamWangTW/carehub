# CareHub - Full-Stack Healthcare Provider Dashboard

CareHub is a Next.js App Router project for managing patient workflows: patient search/filtering, patient detail views, scheduling, and notifications.

## Setup Instructions

### Prerequisites
- Node.js 20+
- npm 10+

### Install
npm install

### Environment Variables
Create .env.local:
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_FAKE_LATENCY=0
NEXT_PUBLIC_FAKE_ERROR_RATE=0

### Run Locally
npm run dev
Open http://localhost:3000

### Production Build
npm run build
npm run start

### Test
npm run test:unit
npm run test:api
npm run test:e2e

### Architecture Decisions
1. Next.js App Router + Server Components for data-first pages
Patient list (/patients) and patient detail (/patients/[id]) are server-rendered with Suspense fallbacks.
This keeps initial page load deterministic and makes filter/tab URL state easy to support.
2. URL is the source of truth for UI state
/patients: search, filters, sorting, pagination are stored in query params.
/patients/[id]: active tab is stored in ?tab=....
/schedule: view mode/date/grouping are stored in query params.
Result: state is shareable, reload-safe, and back/forward friendly.
3. Mock API routes + in-memory data
Implemented APIs for patients, appointments, providers, notifications under app/api/**.
Data comes from deterministic mock generators (mocks/*) and in-memory stores (lib/mock-db/*).
Latency and failure simulation are controllable via env flags.
4. Client interactivity where needed
Scheduler UI is highly interactive (drag/drop, conflict detection, create/cancel flows), so it runs as a client component.
Notes support optimistic updates with rollback behavior.
Notifications use SWR polling with local read-state persistence.
5. Reliability layer
Global and route-level error boundaries (global-error.tsx, error.tsx).
Per-section boundary on patient detail tabs.
Structured error reporting via reportError.ts.
Shared fetch retry utility (http.ts) for transient API errors.
6. Validation strategy
Zod is used for runtime validation/parsing of notification payloads.
Route handlers perform explicit input checks for IDs, enum fields, dates, and required payload fields.
7. Testing strategy
API tests (Playwright API mode) cover route behavior and appointments lifecycle.
E2E tests cover critical flows (patient edit/notes, scheduler drag-drop, notification toasts).
Component tests (Vitest + Testing Library) cover complex UI pieces (NotificationBell, EditPatientModal).

### What I’d Improve With More Time
1. Fully connect Scheduler to API for all CRUD operations (create, move/reschedule, update, delete), not just partial server sync.
2. Align notification mutation methods with stricter REST semantics (e.g., PUT /read) and document versioned contracts.
3. Add richer notes editor UX and sanitization strategy for formatted note content.
4. Add stronger accessibility passes (keyboard drag/drop alternatives, ARIA audit, focus traps).
5. Replace remaining inline styles with consistent design-system primitives (Tailwind or CSS modules end-to-end).
6. Add stronger test depth: contract tests for all API query permutations, more scheduler edge-case tests, and visual regression checks.
7. Add observability hooks beyond console logging (trace IDs, request correlation, pluggable logger).
8. Improve deployment-readiness: seed reset endpoint for dev/test, env validation at startup, and CI gates for lint/type/test.

### API Surface (Implemented)
Patients
- GET /api/patients
- GET /api/patients/:id
- PUT /api/patients/:id
- GET /api/patients/:id/appointments
- GET /api/patients/:id/vitals
- GET /api/patients/:id/notes
- POST /api/patients/:id/notes
Appointments
- GET /api/appointments (range + optional provider/room filters)
- POST /api/appointments
- PUT /api/appointments/:id
- DELETE /api/appointments/:id
Providers
- GET /api/providers
- GET /api/providers/:id/schedule
Notifications
- GET /api/notifications
- POST /api/notifications/:id/read
- POST /api/notifications/mark-all-read
- POST /api/notifications/debug/emit (test/e2e helper)
