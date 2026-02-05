export interface VitalReading {
  id: string;
  patientId: string;
  recordedAt: string;
  systolic: number;
  diastolic: number;
  heartRate: number;
}
