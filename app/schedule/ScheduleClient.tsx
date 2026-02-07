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

export default function ScheduleClient() {
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

    const newProviderId = viewBy === "provider" ? columnId : appt.providerId;
    const newRoom =
      viewBy === "room" ? (columnId === "Unassigned" ? undefined : columnId) : appt.room;

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

  const totalSlots = days.length * slotsPerDay;

  void [
    weekStart,
    columns,
    visibleAppointments,
    today,
    updateUrl,
    navigate,
    openCreate,
    confirmMove,
    handleDrop,
    createAppointment,
    formatDateLabel,
    formatTimeLabel,
    formatTimeLocal,
    formatDateTimeLocal,
    getPatientName,
    totalSlots,
    gridRef,
    selectedApptId,
    isCreateOpen,
  ];

  if (!hydrated) {
    return (
      <div className="h-[calc(100vh-64px)] overflow-hidden bg-background text-foreground">
        <div className="px-4 py-6 text-sm text-muted-foreground">
          Loading schedule...
        </div>
      </div>
    );
  }
}
