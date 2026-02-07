import type { Appointment } from "../../types/appointment";
import { appointments as seed } from "../../mocks/appointments";
import { patients } from "../../mocks/patients";
import { providers } from "../../mocks/providers";

let counter = 1;
let store: Appointment[] = seed.map((a) => ({ ...a }));

function nextId() {
  const id = `appt_${Date.now()}_${counter.toString().padStart(4, "0")}`;
  counter += 1;
  return id;
}

export function list(): Appointment[] {
  ensureSeeded();
  return [...store];
}

export function getById(id: string): Appointment | undefined {
  ensureSeeded();
  return store.find((a) => a.id === id);
}

export function create(input: Omit<Appointment, "id" | "createdAt">) {
  const createdAt = new Date().toISOString();
  const appointment: Appointment = {
    ...input,
    id: nextId(),
    createdAt,
  };
  store = [appointment, ...store];
  return appointment;
}

export function update(id: string, updates: Partial<Appointment>) {
  ensureSeeded();
  const index = store.findIndex((a) => a.id === id);
  if (index === -1) return null;

  const updated: Appointment = { ...store[index], ...updates };
  store[index] = updated;
  return updated;
}

export function remove(id: string): boolean {
  ensureSeeded();
  const before = store.length;
  store = store.filter((a) => a.id !== id);
  return store.length < before;
}

export function ensureSeeded() {
  if (store.length >= seed.length) return;
  const existing = new Set(store.map((a) => a.id));
  seed.forEach((appt) => {
    if (!existing.has(appt.id)) {
      store.push({ ...appt });
    }
  });
}

export function patientExists(id: string): boolean {
  return patients.some((p) => p.id === id);
}

export function providerExists(id: string): boolean {
  return providers.some((p) => p.id === id);
}
