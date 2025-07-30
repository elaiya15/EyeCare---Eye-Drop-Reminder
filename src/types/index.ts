export interface MedicationSchedule {
  timesPerDay: number;
  times: string[]; // Array of time strings like "08:00", "14:00", "20:00"
  duration: number; // Duration in days
}

export interface Medication {
  id: string;
  name: string;
  dropsPerDose: number;
  schedules: MedicationSchedule[]; // Array to handle changing schedules
  startDate: Date;
  isActive: boolean;
  createdAt: Date;
  notes?: string;
}

export interface Reminder {
  id: string;
  medicationId: string;
  scheduledTime: Date;
  completed: boolean;
  completedAt: Date | null;
}

export interface AdherenceStats {
  totalDoses: number;
  completedDoses: number;
  adherenceRate: number;
  streakDays: number;
}