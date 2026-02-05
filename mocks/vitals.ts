import type { VitalReading } from "../types/vital";
import { patients } from "./patients";

let seed = 97531;
const nextRandom = () => {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
};

const randomInt = (min: number, max: number) =>
  Math.floor(nextRandom() * (max - min + 1)) + min;

function generateVitalsForPatient(patientId: string, count: number) {
  const readings: VitalReading[] = [];
  const now = new Date();

  for (let i = 0; i < count; i += 1) {
    const daysAgo = (count - i) * 3;
    const recordedAt = new Date(now);
    recordedAt.setDate(now.getDate() - daysAgo);

    const systolic = randomInt(110, 150);
    const diastolic = randomInt(70, 95);
    const heartRate = randomInt(60, 95);

    readings.push({
      id: `vital-${patientId}-${String(i + 1).padStart(2, "0")}`,
      patientId,
      recordedAt: recordedAt.toISOString(),
      systolic,
      diastolic,
      heartRate,
    });
  }

  return readings;
}

export const vitalsByPatient: Record<string, VitalReading[]> = {};

for (const patient of patients) {
  vitalsByPatient[patient.id] = generateVitalsForPatient(patient.id, 8);
}
