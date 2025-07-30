import { Medication, Reminder } from '../types';

class StorageService {
  private readonly MEDICATIONS_KEY = 'eyecare_medications';
  private readonly REMINDERS_KEY = 'eyecare_reminders';

  saveMedications(medications: Medication[]): void {
    try {
      localStorage.setItem(this.MEDICATIONS_KEY, JSON.stringify(medications));
    } catch (error) {
      console.error('Failed to save medications:', error);
    }
  }

  getMedications(): Medication[] {
    try {
      const data = localStorage.getItem(this.MEDICATIONS_KEY);
      if (!data) return [];
      
      const medications = JSON.parse(data);
      return medications.map((med: any) => ({
        ...med,
        startDate: new Date(med.startDate),
        createdAt: new Date(med.createdAt)
      }));
    } catch (error) {
      console.error('Failed to load medications:', error);
      return [];
    }
  }

  saveReminders(reminders: Reminder[]): void {
    try {
      // Filter out old retroactive entries to prevent storage bloat
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const filteredReminders = reminders.filter(reminder => 
        reminder.scheduledTime >= oneWeekAgo || !reminder.id.includes('retroactive')
      );
      localStorage.setItem(this.REMINDERS_KEY, JSON.stringify(reminders));
    } catch (error) {
      console.error('Failed to save reminders:', error);
    }
  }

  getReminders(): Reminder[] {
    try {
      const data = localStorage.getItem(this.REMINDERS_KEY);
      if (!data) return [];
      
      const reminders = JSON.parse(data);
      return reminders.map((rem: any) => ({
        ...rem,
        scheduledTime: new Date(rem.scheduledTime),
        completedAt: rem.completedAt ? new Date(rem.completedAt) : null
      }));
    } catch (error) {
      console.error('Failed to load reminders:', error);
      return [];
    }
  }

  clearAllData(): void {
    try {
      localStorage.removeItem(this.MEDICATIONS_KEY);
      localStorage.removeItem(this.REMINDERS_KEY);
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  }
}

export const storageService = new StorageService();