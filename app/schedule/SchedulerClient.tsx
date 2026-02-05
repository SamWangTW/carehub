"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Appointment } from "../../types/appointment";
import type { Provider } from "../../types/provider";
import type { Patient } from "../../types/patient";
import { appointments as mockAppointments } from "../../mocks/appointments";
import { providers as mockProviders } from "../../mocks/providers";
import { patients as mockPatients } from "../../mocks/patients";

type ViewMode = "week" | "day";
type ViewBy = "provider" | "room";

const startHour = 8;
const endHour = 18;
const slotMinutes = 30;
const slotsPerDay = ((endHour - startHour) * 60) / slotMinutes;
const rowHeight = 32;

const roomPool = ["Room 101", "Room 202", "Room 305", "Telehealth", "Lab A"];

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDateLabel(date: Date) {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTimeLocal(date: Date) {
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateTimeLocal(date: Date) {
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTimeLabel(hours: number, minutes: number) {
  const h = hours % 12 || 12;
  const m = String(minutes).padStart(2, "0");
  const ampm = hours < 12 ? "AM" : "PM";
  return `${h}:${m} ${ampm}`;
}

function timeFromSlot(slot: number) {
  const totalMinutes = slot * slotMinutes;
  const hours = startHour + Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return { hours, minutes };
}

function combineDateTime(date: Date, hours: number, minutes: number) {
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function getDurationMinutes(appt: Appointment) {
  return (
    (new Date(appt.endTime).getTime() - new Date(appt.startTime).getTime()) /
    60000
  );
}

function isOverlapping(a: Appointment, b: Appointment) {
  const aStart = new Date(a.startTime).getTime();
  const aEnd = new Date(a.endTime).getTime();
  const bStart = new Date(b.startTime).getTime();
  const bEnd = new Date(b.endTime).getTime();
  return aStart < bEnd && aEnd > bStart;
}

function getPatientName(patients: Patient[], patientId: string) {
  const patient = patients.find((p) => p.id === patientId);
  if (!patient) return "Unknown patient";
  return `${patient.firstName} ${patient.lastName}`.trim();
}

export default function SchedulerClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hydrated, setHydrated] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [viewBy, setViewBy] = useState<ViewBy>("provider");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appointments, setAppointments] =
    useState<Appointment[]>(mockAppointments);
  const [selectedApptId, setSelectedApptId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [draft, setDraft] = useState<{
    patientId: string;
    providerId: string;
    room: string;
    date: string;
    time: string;
  } | null>(null);
  const [pendingMove, setPendingMove] = useState<{
    apptId: string;
    newStart: Date;
    newEnd: Date;
    newProviderId: string;
    newRoom?: string;
    conflict: boolean;
  } | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    const viewParam = searchParams.get("view");
    const nextView: ViewMode = viewParam === "day" ? "day" : "week";
    if (nextView !== viewMode) setViewMode(nextView);

    const groupParam = searchParams.get("groupBy");
    const nextGroup: ViewBy = groupParam === "room" ? "room" : "provider";
    if (nextGroup !== viewBy) setViewBy(nextGroup);

    const dateParam = searchParams.get("date");
    if (dateParam) {
      const parsed = new Date(dateParam);
      if (!Number.isNaN(parsed.getTime())) {
        setSelectedDate(parsed);
      }
    }
  }, [searchParams, viewMode, viewBy]);

  const providers = mockProviders as Provider[];
  const patients = mockPatients as Patient[];

  const weekStart = useMemo(() => startOfWeek(selectedDate), [selectedDate]);
  const days = useMemo(() => {
    if (viewMode === "day") return [selectedDate];
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [viewMode, selectedDate, weekStart]);

  const columns = useMemo(() => {
    if (viewBy === "provider") {
      return providers.map((p) => ({ id: p.id, label: p.name }));
    }
    const rooms = new Set<string>(roomPool);
    appointments.forEach((a) => {
      if (a.room) rooms.add(a.room);
    });
    rooms.add("Unassigned");
    return Array.from(rooms).map((r) => ({ id: r, label: r }));
  }, [viewBy, appointments, providers]);

  const visibleAppointments = useMemo(() => {
    return appointments.filter((a) =>
      days.some((d) => sameDay(new Date(a.startTime), d))
    );
  }, [appointments, days]);

  const today = new Date();

  function updateUrl(nextView: ViewMode, nextDate: Date, nextGroup: ViewBy) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", nextView);
    params.set("date", nextDate.toISOString().slice(0, 10));
    params.set("groupBy", nextGroup);
    router.push(`/schedule?${params.toString()}`);
  }

  function navigate(offset: number) {
    const nextDate =
      viewMode === "week"
        ? addDays(selectedDate, offset * 7)
        : addDays(selectedDate, offset);
    setSelectedDate(nextDate);
    updateUrl(viewMode, nextDate, viewBy);
  }

  function openCreate(date: Date, slot: number, columnId: string) {
    const { hours, minutes } = timeFromSlot(slot);
    const d = combineDateTime(date, hours, minutes);
    const patientId = patients[0]?.id ?? "pat-001";
    const providerId =
      viewBy === "provider" ? columnId : providers[0]?.id ?? "prov-001";
    const room = viewBy === "room" ? columnId : roomPool[0];

    setDraft({
      patientId,
      providerId,
      room: room === "Unassigned" ? "" : room,
      date: d.toISOString().slice(0, 10),
      time: d.toTimeString().slice(0, 5),
    });
    setIsCreateOpen(true);
  }

  function checkConflict(candidate: Appointment, ignoreId?: string) {
    return appointments.some((a) => {
      if (a.id === ignoreId) return false;
      if (a.status === "canceled") return false;
      const providerConflict = a.providerId === candidate.providerId;
      const roomConflict = a.room && candidate.room && a.room === candidate.room;
      if (!providerConflict && !roomConflict) return false;
      return isOverlapping(a, candidate);
    });
  }

  function confirmMove() {
    if (!pendingMove) return;
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === pendingMove.apptId
          ? {
              ...a,
              startTime: pendingMove.newStart.toISOString(),
              endTime: pendingMove.newEnd.toISOString(),
              providerId: pendingMove.newProviderId,
              room: pendingMove.newRoom,
            }
          : a
      )
    );
    setPendingMove(null);
  }

  function getAbsoluteSlotFromClientY(clientY: number) {
    if (!gridRef.current) return null;
    const rect = gridRef.current.getBoundingClientRect();
    const scrollTop = gridRef.current.scrollTop;
    const y = clientY - rect.top + scrollTop;
    const rawSlot = y / rowHeight;
    const snapped = Math.round(rawSlot);
    const clamped = Math.max(0, Math.min(totalSlots - 1, snapped));
    return clamped;
  }

  function handleDrop(apptId: string, clientY: number, columnId: string) {
    const appt = appointments.find((a) => a.id === apptId);
    if (!appt) return;

    const absoluteSlot = getAbsoluteSlotFromClientY(clientY);
    if (absoluteSlot === null) return;

    const dayIndex = Math.min(
      days.length - 1,
      Math.max(0, Math.floor(absoluteSlot / slotsPerDay))
    );
    const slot = absoluteSlot - dayIndex * slotsPerDay;
    const date = days[dayIndex];

    const duration = getDurationMinutes(appt);
    const { hours, minutes } = timeFromSlot(slot);
    const newStart = combineDateTime(date, hours, minutes);
    const newEnd = new Date(newStart.getTime() + duration * 60000);

    const newProviderId =
      viewBy === "provider" ? columnId : appt.providerId;
    const newRoom = viewBy === "room" ? (columnId === "Unassigned" ? undefined : columnId) : appt.room;

    const candidate: Appointment = {
      ...appt,
      startTime: newStart.toISOString(),
      endTime: newEnd.toISOString(),
      providerId: newProviderId,
      room: newRoom,
    };

    const conflict = checkConflict(candidate, appt.id);
    setPendingMove({
      apptId,
      newStart,
      newEnd,
      newProviderId,
      newRoom,
      conflict,
    });
  }

  function createAppointment() {
    if (!draft) return;
    const date = new Date(`${draft.date}T${draft.time}:00`);
    const end = new Date(date.getTime() + slotMinutes * 60000);
    const newAppt: Appointment = {
      id: `appt-${String(appointments.length + 1).padStart(4, "0")}`,
      patientId: draft.patientId,
      providerId: draft.providerId,
      startTime: date.toISOString(),
      endTime: end.toISOString(),
      status: "scheduled",
      room: draft.room || undefined,
      createdAt: new Date().toISOString(),
    };

    const conflict = checkConflict(newAppt);
    if (conflict) {
      setPendingMove({
        apptId: newAppt.id,
        newStart: date,
        newEnd: end,
        newProviderId: newAppt.providerId,
        newRoom: newAppt.room,
        conflict: true,
      });
      return;
    }

    setAppointments((prev) => [newAppt, ...prev]);
    setIsCreateOpen(false);
    setDraft(null);
  }

  const gridColumns = `120px repeat(${columns.length}, minmax(320px, 1fr))`;
  const totalSlots = days.length * slotsPerDay;

  const nowLine =
    days.some((d) => sameDay(d, today)) &&
    today.getHours() >= startHour &&
    today.getHours() < endHour
      ? ((today.getHours() - startHour) * 60 + today.getMinutes()) / slotMinutes
      : null;

  if (!hydrated) {
    return (
      <div style={{ marginTop: 16, color: "#9aa0a6" }}>
        Loading scheduleâ€¦
      </div>
    );
  }

  return (
    <div style={{ marginTop: 16 }}>
      {/* Controls */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => {
              setViewMode("week");
              updateUrl("week", selectedDate, viewBy);
            }}
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid #2a2a2a",
              background: viewMode === "week" ? "#2d2d2d" : "transparent",
              color: "#e6e6e6",
              cursor: "pointer",
            }}
          >
            Week
          </button>
          <button
            onClick={() => {
              setViewMode("day");
              updateUrl("day", selectedDate, viewBy);
            }}
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid #2a2a2a",
              background: viewMode === "day" ? "#2d2d2d" : "transparent",
              color: "#e6e6e6",
              cursor: "pointer",
            }}
          >
            Day
          </button>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid #2a2a2a",
              background: "transparent",
              color: "#e6e6e6",
              cursor: "pointer",
            }}
          >
            Prev
          </button>
          <button
            onClick={() => {
              const nextDate = new Date();
              setSelectedDate(nextDate);
              updateUrl(viewMode, nextDate, viewBy);
            }}
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid #2a2a2a",
              background: "transparent",
              color: "#e6e6e6",
              cursor: "pointer",
            }}
          >
            Today
          </button>
          <button
            onClick={() => navigate(1)}
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid #2a2a2a",
              background: "transparent",
              color: "#e6e6e6",
              cursor: "pointer",
            }}
          >
            Next
          </button>
        </div>

        <div>
          <select
            value={viewBy}
            onChange={(e) => {
              const nextGroup = e.target.value as ViewBy;
              setViewBy(nextGroup);
              updateUrl(viewMode, selectedDate, nextGroup);
            }}
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid #2a2a2a",
              background: "transparent",
              color: "#e6e6e6",
              cursor: "pointer",
            }}
          >
            <option value="provider">View by Provider</option>
            <option value="room">View by Room</option>
          </select>
        </div>

        <div style={{ color: "#cfcfcf" }}>
          {viewMode === "week"
            ? `Week of ${weekStart.toLocaleDateString()}`
            : formatDateLabel(selectedDate)}
        </div>
      </div>

      <div className="overflow-x-auto">
        {/* Header row */}
        <div
          className="grid gap-0 pb-2 border-b border-neutral-600 min-w-full"
          style={{ gridTemplateColumns: gridColumns }}
        >
          <div className="sticky left-0 z-30 bg-neutral-950 border-r border-neutral-700/70" />
          {columns.map((c) => (
            <div
              key={c.id}
              className="px-2 py-1 text-sm text-neutral-200 border-l border-neutral-700/70"
            >
              {c.label}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div
          ref={gridRef}
          className="relative grid border border-neutral-700/80 rounded-lg overflow-hidden min-w-full"
          style={{
            gridTemplateColumns: gridColumns,
            gridTemplateRows: `repeat(${totalSlots}, ${rowHeight}px)`,
          }}
        >
        {/* Time gutter */}
        {Array.from({ length: totalSlots }).map((_, index) => {
          const dayIndex = Math.floor(index / slotsPerDay);
          const slotInDay = index % slotsPerDay;
          const { hours, minutes } = timeFromSlot(slotInDay);
          const showTime = minutes === 0;
          const isDayStart = slotInDay === 0;
          const day = days[dayIndex];
          const isToday = sameDay(day, today);

          const todayHeader =
            viewMode === "week" && isToday && isDayStart
              ? "bg-emerald-500/10 text-emerald-200 font-semibold border-l-4 border-emerald-400/60"
              : "";
          return (
            <div
              key={`time-${index}`}
              className={`sticky left-0 z-20 flex items-center justify-between px-2 text-xs text-neutral-400 border-b border-neutral-700/70 bg-neutral-900/60 ${
                viewMode === "week" && isToday ? "bg-emerald-500/5" : ""
              } ${todayHeader}`}
              style={{
                gridColumn: 1,
                gridRow: index + 1,
              }}
            >
              {showTime ? formatTimeLabel(hours, minutes) : ""}
              {isDayStart ? (
                <span className="flex items-center gap-2">
                  {formatDateLabel(day)}
                  {viewMode === "week" && isToday && (
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-400/30 text-emerald-200">
                      Today
                    </span>
                  )}
                </span>
              ) : (
                ""
              )}
            </div>
          );
        })}

        {/* Slot cells */}
        {Array.from({ length: totalSlots }).map((_, index) => {
          const dayIndex = Math.floor(index / slotsPerDay);
          const slotInDay = index % slotsPerDay;
          const day = days[dayIndex];

          return columns.map((c, colIndex) => (
            <div
              key={`cell-${index}-${c.id}`}
              className={`border-b border-neutral-700/70 border-l border-neutral-700/70 transition-colors cursor-pointer hover:bg-white/5 hover:ring-1 hover:ring-neutral-600/40 ${
                slotInDay % 2 === 0 ? "bg-white/5" : "bg-transparent"
              } ${
                viewMode === "week" && sameDay(day, today)
                  ? "bg-emerald-500/5"
                  : ""
              }`}
              style={{
                gridColumn: colIndex + 2,
                gridRow: index + 1,
              }}
              onClick={() => openCreate(day, slotInDay, c.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const apptId = e.dataTransfer.getData("text/plain");
                if (apptId) handleDrop(apptId, e.clientY, c.id);
              }}
            />
          ));
        })}

        {/* Current time line */}
        {nowLine !== null && (
          <div
            style={{
              position: "absolute",
              left: 120,
              right: 0,
              top: nowLine * rowHeight,
              height: 2,
              background: "#ff6b6b",
              zIndex: 2,
            }}
          />
        )}

        {/* Appointment blocks */}
        {visibleAppointments.map((appt) => {
          const apptDate = new Date(appt.startTime);
          const dayIndex = days.findIndex((d) => sameDay(d, apptDate));
          if (dayIndex === -1) return null;
          const slotInDay =
            ((apptDate.getHours() - startHour) * 60 + apptDate.getMinutes()) /
            slotMinutes;
          if (slotInDay < 0 || slotInDay >= slotsPerDay) return null;

          const durationSlots = Math.max(
            1,
            Math.round(getDurationMinutes(appt) / slotMinutes)
          );

          const columnKey =
            viewBy === "provider"
              ? appt.providerId
              : appt.room ?? "Unassigned";
          const colIndex = columns.findIndex((c) => c.id === columnKey);
          if (colIndex === -1) return null;

          const rowStart = dayIndex * slotsPerDay + slotInDay + 1;

          const patientName = getPatientName(patients, appt.patientId);

          return (
            <div
              key={appt.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("text/plain", appt.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedApptId(appt.id);
                  setIsCreateOpen(false);
                }}
                className="text-xs text-white cursor-grab z-10 overflow-hidden"
                style={{
                gridColumn: colIndex + 2,
                gridRow: `${rowStart} / span ${durationSlots}`,
                background:
                  appt.status === "canceled"
                    ? "rgba(255,107,107,0.2)"
                    : "rgba(45,108,223,0.6)",
                border: "1px solid #2a2a2a",
                borderRadius: 6,
                padding: 6,
              }}
              title="Drag to reschedule"
            >
              <div className="font-semibold truncate">{patientName}</div>
              <div className="opacity-90 text-xs whitespace-nowrap">
                {formatTimeLocal(new Date(appt.startTime))} -{" "}
                {formatTimeLocal(new Date(appt.endTime))}
              </div>
              <div className="opacity-80 text-xs truncate">
                {viewBy === "provider"
                  ? appt.room ?? "—"
                  : providers.find((p) => p.id === appt.providerId)?.name ??
                    appt.providerId}
              </div>
            </div>
          );
        })}
      </div>
      </div>

      {/* Detail panel */}
      {selectedApptId && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            height: "100vh",
            width: 320,
            background: "#141414",
            borderLeft: "1px solid #2a2a2a",
            padding: 16,
            color: "#e6e6e6",
            zIndex: 10,
          }}
        >
          {(() => {
            const appt = appointments.find((a) => a.id === selectedApptId);
            if (!appt) return null;
            const patient = getPatientName(patients, appt.patientId);
            const provider =
              providers.find((p) => p.id === appt.providerId)?.name ??
              appt.providerId;
            return (
              <>
                <h3 style={{ marginTop: 0 }}>Appointment</h3>
                <p>
                  <strong>Patient:</strong> {patient}
                </p>
                <p>
                  <strong>Provider:</strong> {provider}
                </p>
                <p>
                  <strong>Time:</strong>{" "}
                  {formatDateTimeLocal(new Date(appt.startTime))} -{" "}
                  {formatTimeLocal(new Date(appt.endTime))}
                </p>
                <p>
                  <strong>Status:</strong> {appt.status}
                </p>
                <p>
                  <strong>Room:</strong> {appt.room ?? "—"}
                </p>
                <button
                  onClick={() => setSelectedApptId(null)}
                  style={{
                    marginTop: 12,
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: "1px solid #2a2a2a",
                    background: "transparent",
                    color: "#e6e6e6",
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </>
            );
          })()}
        </div>
      )}

      {/* Create panel */}
      {isCreateOpen && draft && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            height: "100vh",
            width: 360,
            background: "#141414",
            borderLeft: "1px solid #2a2a2a",
            padding: 16,
            color: "#e6e6e6",
            zIndex: 10,
          }}
        >
          <h3 style={{ marginTop: 0 }}>New Appointment</h3>
          <label>
            Patient
            <select
              value={draft.patientId}
              onChange={(e) =>
                setDraft((prev) =>
                  prev ? { ...prev, patientId: e.target.value } : prev
                )
              }
              style={{ width: "100%", padding: 8, marginTop: 4 }}
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </select>
          </label>

          <label>
            Provider
            <select
              value={draft.providerId}
              onChange={(e) =>
                setDraft((prev) =>
                  prev ? { ...prev, providerId: e.target.value } : prev
                )
              }
              style={{ width: "100%", padding: 8, marginTop: 4 }}
            >
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Room
            <select
              value={draft.room}
              onChange={(e) =>
                setDraft((prev) =>
                  prev ? { ...prev, room: e.target.value } : prev
                )
              }
              style={{ width: "100%", padding: 8, marginTop: 4 }}
            >
              {roomPool.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
              <option value="">Unassigned</option>
            </select>
          </label>

          <label>
            Date
            <input
              type="date"
              value={draft.date}
              onChange={(e) =>
                setDraft((prev) =>
                  prev ? { ...prev, date: e.target.value } : prev
                )
              }
              style={{ width: "100%", padding: 8, marginTop: 4 }}
            />
          </label>

          <label>
            Time
            <input
              type="time"
              value={draft.time}
              onChange={(e) =>
                setDraft((prev) =>
                  prev ? { ...prev, time: e.target.value } : prev
                )
              }
              style={{ width: "100%", padding: 8, marginTop: 4 }}
            />
          </label>

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              onClick={() => {
                setIsCreateOpen(false);
                setDraft(null);
              }}
              style={{
                padding: "6px 10px",
                borderRadius: 6,
                border: "1px solid #2a2a2a",
                background: "transparent",
                color: "#e6e6e6",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={createAppointment}
              style={{
                padding: "6px 10px",
                borderRadius: 6,
                border: "1px solid #1f56b3",
                background: "#2d6cdf",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Create
            </button>
          </div>
        </div>
      )}

      {/* Confirm modal */}
      {pendingMove && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 20,
          }}
        >
          <div
            style={{
              background: "#1b1b1b",
              border: "1px solid #2a2a2a",
              borderRadius: 8,
              padding: 16,
              width: 360,
              color: "#e6e6e6",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Confirm Reschedule</h3>
            <p>
              Move appointment to{" "}
              {formatDateTimeLocal(pendingMove.newStart)}
              ?
            </p>
            {pendingMove.conflict && (
              <p style={{ color: "#ff6b6b" }}>
                Conflict detected (provider or room already booked).
              </p>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => setPendingMove(null)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "1px solid #2a2a2a",
                  background: "transparent",
                  color: "#e6e6e6",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmMove}
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "1px solid #1f56b3",
                  background: "#2d6cdf",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                {pendingMove.conflict ? "Confirm Anyway" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
