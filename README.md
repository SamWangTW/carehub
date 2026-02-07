# CareHub – Full-Stack Healthcare Dashboard (Assignment 2)

CareHub
CareHub is a healthcare scheduling and patient management web app built as a recruiter take‑home assessment. This repo implements a patient list and patient detail page, a full scheduling UI, and a notification system with toasts and read state.

Demo 

Tech Stack
Next.js (App Router)
React 19
TypeScript
Tailwind CSS v4
SWR (client data polling)
Zod (runtime validation for notifications)
Playwright (E2E)
Key Features
Patients list with filtering, sorting, pagination, and server‑rendered data.
Patient detail page with tabbed sections (Overview, Appointments, Vitals, Notes), edit patient modal, and optimistic note creation.
Schedule page with week/day views, provider/room grouping, drag‑and‑drop rescheduling, conflict detection, and detail panels.
Notifications system with bell, unread count, dropdown, toasts, and persisted read state.
Requirements Checklist
Requirement	Status	Where in Code	Notes
Feature 2: Patient Detail Page			
Header: demographics, photo, quick actions	Partial	page.tsx	Demographics + avatar initials + optional photo; quick action is “Edit Patient” only.
Tabs: Overview, Appointments, Vitals, Notes	Implemented	page.tsx	Tab state via ?tab= URL param.
Overview summary cards	Implemented	page.tsx	Last visit, next appt, meds, alerts.
Appointments past/upcoming w/ status	Partial	page.tsx	Status shown; no explicit past/upcoming grouping in the table.
Vitals history charts	Implemented	VitalsChart.tsx	SVG chart of readings.
Notes (rich text)	Not implemented	NotesSectionClient.tsx	Plain text input only.
Parallel data fetching	Partial	page.tsx	Promise.all used in Overview; other tabs fetch only when active.
Tab state in URL	Implemented	page.tsx	`?tab=overview
Edit patient modal + validation	Implemented	EditPatientModal.tsx	Client‑side validation + API PUT.
Optimistic updates for notes	Implemented	NotesSectionClient.tsx	Optimistic insert + rollback on error.
Per‑section error boundaries	Implemented	SectionErrorBoundary.tsx	Wrapped around each tab section.
Feature 3: Appointment Scheduler (/schedule)			
Weekly calendar (current week default)	Implemented	SchedulerClient.tsx	Default viewMode="week".
Day view option	Implemented	SchedulerClient.tsx	Toggle Week/Day.
Filter/view by provider or room	Implemented	SchedulerClient.tsx	viewBy toggle.
Drag‑and‑drop reschedule (confirmation)	Implemented	SchedulerClient.tsx	Drag + confirm modal.
Click slot to create appointment	Implemented	SchedulerClient.tsx	openCreate on grid cell.
Side panel details	Implemented	SchedulerClient.tsx	Right‑side details panel.
Conflict detection warning	Implemented	SchedulerClient.tsx	Conflict checks + warning.
Today indicator	Implemented	SchedulerClient.tsx	“Today” highlight.
Navigate weeks	Implemented	SchedulerClient.tsx	Prev/Today/Next.
Feature 4: Real‑time Notifications			
Bell + unread count	Implemented	NotificationBell.tsx	Unread badge.
Dropdown recent	Implemented	NotificationsDropdown.tsx	Sorted list.
Mark as read	Implemented	NotificationBell.tsx	Per‑item read.
Mark all as read	Implemented	NotificationBell.tsx	Bulk read.
Types: appointment, patient alerts, messages	Implemented	notification.ts + mocks	Types shown and rendered.
Toasts for new arrivals	Implemented	ToastProvider.tsx	Toasts on new notifications.
Persist read state	Implemented	NotificationBell.tsx	Uses localStorage.
API Design (mock routes)			
Patients APIs listed	Partial	app/api/patients/**	All listed patient endpoints exist.
Appointments APIs listed	Not implemented	—	No /api/appointments routes.
Providers APIs listed	Not implemented	—	No /api/providers routes.
Notifications APIs listed	Implemented	app/api/notifications/**	GET, mark‑all, mark‑read exist.
Mock Data Requirements			
50+ patients realistic	Implemented	patients.ts	Generates 50 patients.
100+ appointments across 2 weeks	Implemented	appointments.ts	Generates 120 over 14 days.
5 providers w/ schedules	Implemented	providers.ts	5 providers + work days/hours.
Simulate latency 200–500ms	Implemented	fakeNetwork.ts	Controlled by NEXT_PUBLIC_FAKE_LATENCY.
5% failure on ONE endpoint	Partial	fakeNetwork.ts + API routes	Failure rate applies to multiple endpoints via env var.
Technical Requirements			
Global error boundary	Not implemented	—	No error.tsx found.
Per‑section error boundaries	Implemented	SectionErrorBoundary.tsx	Used on patient detail tabs.
API retry	Not implemented	—	No retry logic observed.
Friendly errors	Partial	Various	Some sections show friendly text; not consistent globally.
Structured error reporting hook	Not implemented	—	No hook found.
Skeleton loaders	Implemented	page.tsx, page.tsx	Skeletons in Suspense fallbacks.
Streaming / Suspense boundaries	Implemented	app/patients/**	Suspense used for data sections.
CLS=0	Not verified	—	Not measured in code.
Prefetch on hover	Not implemented	—	No explicit prefetch.
Debounce/throttle	Not implemented	—	No debounce utilities found.
Memoization	Implemented	SchedulerClient.tsx	useMemo used for computed data.
API route tests	Not implemented	—	No API tests.
E2E tests	Implemented	notifications-toast.spec.ts	Playwright tests for notifications toasts.
Component tests	Not implemented	—	No component/unit tests.
API Endpoints Implemented
Patients

GET /api/patients → paginated, filtered list
File: route.ts
GET /api/patients/:id → single patient
File: route.ts
PUT /api/patients/:id → update patient
File: route.ts
GET /api/patients/:id/appointments → patient appointments
File: route.ts
GET /api/patients/:id/vitals → vitals history
File: route.ts
GET /api/patients/:id/notes → notes
File: route.ts
POST /api/patients/:id/notes → create note
File: route.ts
Notifications

GET /api/notifications → list notifications
File: route.ts
POST /api/notifications/:id/read → mark read
File: route.ts
POST /api/notifications/mark-all-read → mark all
File: route.ts
POST /api/notifications/debug/emit → test helper
File: route.ts
Not implemented

/api/appointments (GET/POST/PUT/DELETE)
/api/providers (GET, schedules)
Mock Data + Simulation
Patients: 50 generated records
File: patients.ts
Appointments: 120 over 14 days
File: appointments.ts
Providers: 5 with work schedules
File: providers.ts
Notifications seed data
File: notifications.ts
Latency: 200–500ms simulated via withLatency()
File: fakeNetwork.ts
Enable with NEXT_PUBLIC_FAKE_LATENCY=1
Error simulation: maybeFail(rate) applied across multiple endpoints
File: fakeNetwork.ts
Configure with NEXT_PUBLIC_FAKE_ERROR_RATE (e.g., 0.05)
Architecture / Data Flow
Patients list is server‑rendered in page.tsx with Suspense for loading state.
Patient detail uses server components + Suspense for sections, with SectionErrorBoundary per tab section.
Notes use optimistic UI in NotesSectionClient.
Notifications use SWR polling and localStorage for read state.
Performance Notes
useMemo used in the scheduler for computed lists.
File: SchedulerClient.tsx
SWR polling interval for notifications configurable via NEXT_PUBLIC_NOTIF_POLL_MS.
File: NotificationBell.tsx
Error Handling Notes
Per‑section error boundaries on patient detail tabs.
File: SectionErrorBoundary.tsx
No global error boundary or structured error reporting hook found.
Testing
E2E
npm run test:e2e
Covers notifications toasts (initial load, new toast on emit, dedupe).
File: notifications-toast.spec.ts
Unit / Component
Not implemented.

API Route Tests
Not implemented.

Setup / Running Locally
Prerequisites
Node.js (version not pinned in repo)
Install
npm install
Dev Server
npm run dev
Build + Start
npm run build
npm run start
Known Issues / Limitations
Schedule page is implemented in SchedulerClient.tsx with inline styles and dark‑theme classes.
No /api/appointments or /api/providers endpoints.
No global error boundary or structured error reporting.
No unit/component/API tests.
Future Improvements
Implement missing appointment/provider APIs and wire scheduler to server data.
Add global error boundary and consistent error handling hooks.
Add component and API tests (in addition to existing E2E).
Implement rich‑text notes editor and more complete “quick actions” in patient header.

## Getting Started

Install dependencies and start the dev server:

```bash
npm install
npm run dev
