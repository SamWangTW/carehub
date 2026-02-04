import type { Patient } from "../types/patient";
import { providers } from "./providers";

const firstNames = [
  "Aiden",
  "Bella",
  "Caleb",
  "Diana",
  "Ethan",
  "Fiona",
  "Gavin",
  "Hannah",
  "Isaac",
  "Jenna",
  "Kai",
  "Lila",
  "Mason",
  "Nora",
  "Owen",
  "Priya",
  "Quinn",
  "Rosa",
  "Samuel",
  "Tara",
];

const lastNames = [
  "Anderson",
  "Bennett",
  "Campbell",
  "Davis",
  "Edwards",
  "Foster",
  "Garcia",
  "Hughes",
  "Iverson",
  "Johnson",
  "Kim",
  "Lopez",
  "Miller",
  "Nguyen",
  "Ortiz",
  "Patel",
  "Reed",
  "Singh",
  "Turner",
  "Walker",
];

const statusPool: Patient["status"][] = [
  ...Array(40).fill("active"),
  ...Array(7).fill("inactive"),
  ...Array(3).fill("deceased"),
];

const riskPool: Patient["riskLevel"][] = [
  ...Array(22).fill("low"),
  ...Array(18).fill("medium"),
  ...Array(8).fill("high"),
  ...Array(2).fill("critical"),
];

let seed = 24681357;
const nextRandom = () => {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
};

const randomInt = (min: number, max: number) =>
  Math.floor(nextRandom() * (max - min + 1)) + min;

const pickOne = <T,>(items: T[]) => items[randomInt(0, items.length - 1)];

const shuffle = <T,>(items: T[]) => {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
};

const randomDateBetween = (start: Date, end: Date) =>
  new Date(start.getTime() + nextRandom() * (end.getTime() - start.getTime()));

const today = new Date();
const dobStart = new Date(today);
dobStart.setFullYear(today.getFullYear() - 85);
const dobEnd = new Date(today);
dobEnd.setFullYear(today.getFullYear() - 18);

const createdStart = new Date(today);
createdStart.setFullYear(today.getFullYear() - 2);

const providerIds = providers.map((provider) => provider.id);
const shuffledStatuses = shuffle([...statusPool]);
const shuffledRisks = shuffle([...riskPool]);

export const patients: Patient[] = Array.from({ length: 50 }, (_, index) => {
  const id = `pat-${String(index + 1).padStart(3, "0")}`;
  const mrn = `MRN-${String(100001 + index)}`;
  const dob = randomDateBetween(dobStart, dobEnd).toISOString().split("T")[0];
  const createdAt = randomDateBetween(createdStart, today).toISOString();

  return {
    id,
    firstName: pickOne(firstNames),
    lastName: pickOne(lastNames),
    dob,
    mrn,
    status: shuffledStatuses[index],
    riskLevel: shuffledRisks[index],
    primaryProviderId: pickOne(providerIds),
    createdAt,
  };
});
