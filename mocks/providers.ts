import type { Provider } from "@/types/provider";

export const providers: Provider[] = [
  // Mon-Fri, 08:00-16:00
  {
    id: "prov-001",
    name: "Dr. Maya Chen",
    specialty: "Internal Medicine",
    workDays: [1, 2, 3, 4, 5],
    startHour: 8,
    endHour: 16,
  },
  // Tue-Sat, 10:00-18:00
  {
    id: "prov-002",
    name: "Dr. Lucas Ramirez",
    specialty: "Pediatrics",
    workDays: [2, 3, 4, 5, 6],
    startHour: 10,
    endHour: 18,
  },
  // Mon, Wed, Fri, 12:00-20:00
  {
    id: "prov-003",
    name: "Dr. Aisha Patel",
    specialty: "Cardiology",
    workDays: [1, 3, 5],
    startHour: 12,
    endHour: 20,
  },
  // Tue, Thu, 07:00-15:00
  {
    id: "prov-004",
    name: "Dr. Owen Brooks",
    specialty: "Orthopedics",
    workDays: [2, 4],
    startHour: 7,
    endHour: 15,
  },
  // Sat-Sun, 09:00-17:00
  {
    id: "prov-005",
    name: "Dr. Sofia Alvarez",
    specialty: "Family Medicine",
    workDays: [6, 7],
    startHour: 9,
    endHour: 17,
  },
];
