import type { Note } from "../types/note";
import { patients } from "./patients";

const authors = [
  "Dr. Chen",
  "Nurse Patel",
  "Dr. Ramirez",
  "Dr. Brooks",
  "Nurse Alvarez",
];

let seed = 43210;
const nextRandom = () => {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
};

const randomInt = (min: number, max: number) =>
  Math.floor(nextRandom() * (max - min + 1)) + min;

const pickOne = <T,>(items: T[]) => items[randomInt(0, items.length - 1)];

const sampleTexts = [
  "Reviewed labs; stable with current regimen.",
  "Discussed lifestyle adjustments and follow-up plan.",
  "Patient reports improved symptoms since last visit.",
  "Medication adherence confirmed; no adverse effects.",
  "Care plan updated; monitor vitals weekly.",
];

export const notes: Note[] = [];

const now = new Date();
let noteIndex = 1;

for (const patient of patients) {
  const count = randomInt(1, 4);

  for (let i = 0; i < count; i += 1) {
    const createdAt = new Date(now);
    createdAt.setDate(now.getDate() - randomInt(1, 90));

    notes.push({
      id: `note-${String(noteIndex).padStart(4, "0")}`,
      patientId: patient.id,
      author: pickOne(authors),
      text: pickOne(sampleTexts),
      createdAt: createdAt.toISOString(),
    });

    noteIndex += 1;
  }
}
