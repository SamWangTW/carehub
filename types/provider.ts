export interface Provider {
  id: string;
  name: string;
  specialty: string;
  // Days of week the provider works: 1 = Monday ... 7 = Sunday
  workDays: number[];
  // Start hour in 24-hour time (0-23)
  startHour: number;
  // End hour in 24-hour time (0-23), must be greater than startHour
  endHour: number;
}
