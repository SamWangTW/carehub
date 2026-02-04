import type { Appointment } from "../types/appointment";
import { providers } from "./providers";
import { patients } from "./patients";

/**
 * Helper: random integer between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Helper: pick a random element from an array
 */
function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate all available appointment slots for a provider
 * over the next N days, based on provider schedule.
 */
function generateSlotsForProvider(
  providerId: string,
  workDays: number[],
  startHour: number,
  endHour: number,
  days: number
) {
  const slots: { providerId: string; start: Date; end: Date }[] = [];
  const now = new Date();

  for (let d = 0; d < days; d++) {
    const date = new Date(now);
    date.setDate(now.getDate() + d);

    // JS: 0=Sun, 1=Mon ... 6=Sat → convert to 1–7
    const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay();

    if (!workDays.includes(dayOfWeek)) continue;

    for (let hour = startHour; hour < endHour; hour++) {
      const start = new Date(date);
      start.setHours(hour, 0, 0, 0);

      const end = new Date(start);
      end.setMinutes(start.getMinutes() + 30);

      slots.push({ providerId, start, end });
    }
  }

  return slots;
}

/**
 * Build a pool of all available slots across providers
 */
const slotPool: { providerId: string; start: Date; end: Date }[] = [];

for (const provider of providers) {
  slotPool.push(
    ...generateSlotsForProvider(
      provider.id,
      provider.workDays,
      provider.startHour,
      provider.endHour,
      14
    )
  );
}

/**
 * Shuffle slots so appointments are spread naturally
 */
slotPool.sort(() => Math.random() - 0.5);

/**
 * Generate appointments
 */
export const appointments: Appointment[] = [];

const TOTAL_APPOINTMENTS = 120;

for (let i = 0; i < TOTAL_APPOINTMENTS && slotPool.length > 0; i++) {
  const slot = slotPool.pop();
  if (!slot) break;

  const patient = pickOne(patients);

  // Do not create future appointments for deceased patients
  if (patient.status === "deceased") {
    i--;
    continue;
  }

  const now = new Date();
  let status: Appointment["status"] = "scheduled";

  if (slot.end < now) {
    status = Math.random() < 0.9 ? "completed" : "canceled";
  } else {
    status = Math.random() < 0.1 ? "canceled" : "scheduled";
  }

  appointments.push({
    id: `appt-${String(i + 1).padStart(4, "0")}`,
    patientId: patient.id,
    providerId: slot.providerId,
    startTime: slot.start.toISOString(),
    endTime: slot.end.toISOString(),
    status,
    createdAt: new Date(
      slot.start.getTime() - randomInt(1, 14) * 24 * 60 * 60 * 1000
    ).toISOString(),
  });
}
