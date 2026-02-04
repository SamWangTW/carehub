export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  mrn: string;
  status: "active" | "inactive" | "deceased";
  riskLevel: "low" | "medium" | "high" | "critical";
  primaryProviderId: string;
  createdAt: string;
}
