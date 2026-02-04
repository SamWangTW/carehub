export interface Appointment {
  id: string;

  patientId: string;

  providerId: string;

  startTime: string;

  endTime: string;

  status: "scheduled" | "completed" | "canceled";

  room?: string;

  createdAt: string;
}
