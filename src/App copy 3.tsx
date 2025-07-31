//App.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Eye, Plus, Clock, Calendar, UploadCloud, DownloadCloud } from 'lucide-react';
import MedicationList from './components/MedicationList';
import AddMedicationModal from './components/AddMedicationModal';
import TodayReminders from './components/TodayReminders';
import Statistics from './components/Statistics';
import { Medication, Reminder } from './types';
import { storageService } from './services/storageService';
import { notificationService } from './services/notificationService';

function App() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'medications' | 'statistics'>('today');

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadedMedications = storageService.getMedications();
    const loadedReminders = storageService.getReminders();
    setMedications(loadedMedications);
    setReminders(loadedReminders);
    notificationService.requestPermission().then(granted => {
      if (!granted) {
        console.warn("🔕 Notification permission not granted");
      }
    });
  }, []);

  useEffect(() => {
    const now = new Date();
    const delayUntilNextMinute = 60000 - (now.getSeconds() * 1000 + now.getMilliseconds());

    const timeout = setTimeout(() => {
      checkPendingReminders(medications);
      const interval = setInterval(() => {
        checkPendingReminders(medications);
      }, 60000);
      intervalRef.current = interval;
    }, delayUntilNextMinute);

    timeoutRef.current = timeout;

    return () => {
      clearTimeout(timeoutRef.current!);
      clearInterval(intervalRef.current!);
    };
  }, [medications]);

  const checkPendingReminders = (meds: Medication[]) => {
    const now = new Date();
    const nowStr = now.toTimeString().slice(0, 5);
    console.log("⏰ Checking reminders at", nowStr);

    meds.forEach(medication => {
      if (!medication.isActive) return;

      const todayReminders = generateTodayReminders(medication);
      todayReminders.forEach(reminder => {
        if (shouldShowReminder(reminder, now)) {
          const message = `Take ${medication.dropsPerDose} drop(s) of ${medication.name} now`;

          if (reminder.completed) {
            console.log("⚠️ Reminder already completed:", reminder.id);
            return;
          }

          notificationService.showNotification(
            `Time for ${medication.name}`,
            `Take ${medication.dropsPerDose} drop(s) now`
          );

          notificationService.showPopupAlert(message, () => {
            console.log("📴 Alarm popup dismissed");
          });
        }
      });
    });
  };

  const generateTodayReminders = (medication: Medication): Reminder[] => {
    const today = new Date();
    const todayStr = today.toDateString();

    const currentSchedule = getCurrentSchedule(medication, today);
    if (!currentSchedule) return [];

    return currentSchedule.times.map((time, index) => ({
      id: `${medication.id}-${todayStr}-${index}`,
      medicationId: medication.id,
      scheduledTime: new Date(`${todayStr} ${time}`),
      completed: false,
      completedAt: null
    }));
  };

  const getCurrentSchedule = (medication: Medication, date: Date) => {
    const daysSinceStart = Math.floor((date.getTime() - medication.startDate.getTime()) / (1000 * 60 * 60 * 24));
    let totalDays = 0;
    for (const schedule of medication.schedules) {
      if (daysSinceStart < totalDays + schedule.duration) {
        return schedule;
      }
      totalDays += schedule.duration;
    }
    return null;
  };

  const shouldShowReminder = (reminder: Reminder, now: Date): boolean => {
    const timeDiff = now.getTime() - reminder.scheduledTime.getTime();
    return timeDiff >= 0 && timeDiff < 60000 && !reminder.completed;
  };

  const addMedication = (medication: Omit<Medication, 'id' | 'createdAt'>) => {
    const newMedication: Medication = {
      ...medication,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    const updatedMedications = [...medications, newMedication];
    setMedications(updatedMedications);
    storageService.saveMedications(updatedMedications);
    setShowAddModal(false);
  };

  const toggleMedication = (id: string) => {
    const updatedMedications = medications.map(med =>
      med.id === id ? { ...med, isActive: !med.isActive } : med
    );
    setMedications(updatedMedications);
    storageService.saveMedications(updatedMedications);
  };

  const deleteMedication = (id: string) => {
    const updatedMedications = medications.filter(med => med.id !== id);
    const updatedReminders = reminders.filter(rem => rem.medicationId !== id);
    setMedications(updatedMedications);
    setReminders(updatedReminders);
    storageService.saveMedications(updatedMedications);
    storageService.saveReminders(updatedReminders);
  };

  const markReminderComplete = (reminderId: string, completed: boolean) => {
    const existingReminder = reminders.find(rem => rem.id === reminderId);
    const now = new Date();
    let updatedReminders: Reminder[];

    if (existingReminder) {
      updatedReminders = reminders.map(rem =>
        rem.id === reminderId ? { ...rem, completed, completedAt: completed ? now : null } : rem
      );
    } else {
      const parts = reminderId.split("-");
      const medicationId = parts[0];
      updatedReminders = [
        ...reminders,
        {
          id: reminderId,
          medicationId,
          scheduledTime: now,
          completed,
          completedAt: completed ? now : null
        }
      ];
    }

    setReminders(updatedReminders);
    storageService.saveReminders(updatedReminders);
  };

  const backupMedications = () => {
    const dataStr = JSON.stringify(medications, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'eyecare-medications-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const restoreMedications = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        if (Array.isArray(importedData)) {
          setMedications(importedData);
          storageService.saveMedications(importedData);
          alert('✅ Medications restored successfully!');
        } else {
          alert('❌ Invalid file format.');
        }
      } catch {
        alert('❌ Failed to parse the file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="max-w-6xl px-4 py-6 mx-auto">
        <div className="flex flex-col mb-8 space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-500 rounded-full">
              <Eye className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">EyeCare</h1>
              <p className="text-sm text-gray-600 sm:text-base">Your eye drop reminder companion</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={backupMedications}
              className="flex items-center justify-center w-full px-4 py-2 space-x-2 text-white bg-yellow-500 rounded-full sm:w-auto hover:bg-yellow-600"
            >
              <DownloadCloud className="w-4 h-4" />
              <span className="text-sm">Backup</span>
            </button>
            <label className="flex items-center justify-center w-full px-4 py-2 space-x-2 text-white bg-green-500 rounded-full cursor-pointer sm:w-auto hover:bg-green-600">
              <UploadCloud className="w-4 h-4" />
              <span className="text-sm">Restore</span>
              <input type="file" accept=".json" onChange={restoreMedications} hidden />
            </label>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center w-full px-5 py-3 space-x-2 text-white transition-colors duration-200 bg-blue-500 rounded-full shadow-md sm:w-auto hover:bg-blue-600 hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              <span className="text-sm font-medium">Add Medication</span>
            </button>
          </div>
        </div>

        <div className="flex p-1 mb-6 overflow-x-auto bg-white shadow-md flex-nowrap rounded-xl">
          {[
            { id: 'today', label: 'Today', icon: Clock },
            { id: 'medications', label: 'Medications', icon: Eye },
            { id: 'statistics', label: 'Statistics', icon: Calendar }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg flex-1 min-w-max transition-all duration-200 ${
                activeTab === id
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {activeTab === 'today' && (
            <TodayReminders
              medications={medications}
              reminders={reminders}
              onMarkComplete={markReminderComplete}
              getCurrentSchedule={getCurrentSchedule}
            />
          )}

          {activeTab === 'medications' && (
            <MedicationList
              medications={medications}
              onToggle={toggleMedication}
              onDelete={deleteMedication}
              getCurrentSchedule={getCurrentSchedule}
            />
          )}

          {activeTab === 'statistics' && (
            <Statistics medications={medications} reminders={reminders} />
          )}
        </div>

        {showAddModal && (
          <AddMedicationModal
            onClose={() => setShowAddModal(false)}
            onAdd={addMedication}
          />
        )}
      </div>
    </div>
  );
}

export default App;
