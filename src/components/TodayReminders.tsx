import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, Circle, AlertCircle, Eye, Plus } from 'lucide-react';
import { Medication, Reminder, MedicationSchedule } from '../types';

interface TodayRemindersProps {
  medications: Medication[];
  reminders: Reminder[];
  onMarkComplete: (reminderId: string, completed: boolean) => void;
  getCurrentSchedule: (medication: Medication, date: Date) => MedicationSchedule | null;
}

const TodayReminders: React.FC<TodayRemindersProps> = ({
  medications,
  reminders,
  onMarkComplete,
  getCurrentSchedule
}) => {
  const [todayReminders, setTodayReminders] = useState<(Reminder & { medication: Medication })[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showRetroactiveModal, setShowRetroactiveModal] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    generateTodayReminders();
  }, [medications, reminders]);

  const generateTodayReminders = () => {
    const today = new Date();
    const todayStr = today.toDateString();
    const allTodayReminders: (Reminder & { medication: Medication })[] = [];

    medications.forEach(medication => {
      if (!medication.isActive) return;

      const currentSchedule = getCurrentSchedule(medication, today);
      if (!currentSchedule) return;

      currentSchedule.times.forEach((time, index) => {
        const reminderId = `${medication.id}-${todayStr}-${index}`;
        const existingReminder = reminders.find(r => r.id === reminderId);
        
        const scheduledTime = new Date(`${todayStr} ${time}`);
        
        const reminder: Reminder & { medication: Medication } = {
          id: reminderId,
          medicationId: medication.id,
          scheduledTime,
          completed: existingReminder?.completed || false,
          completedAt: existingReminder?.completedAt || null,
          medication
        };

        allTodayReminders.push(reminder);
      });
    });

    // Sort by scheduled time
    allTodayReminders.sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
    setTodayReminders(allTodayReminders);
  };

  const getReminderStatus = (reminder: Reminder) => {
    if (reminder.completed) return 'completed';
    
    const now = currentTime;
    const timeDiff = now.getTime() - reminder.scheduledTime.getTime();
    
    if (timeDiff > 60 * 60 * 1000) return 'overdue'; // More than 1 hour late
    if (timeDiff > 0) return 'due'; // Past due time but within 1 hour
    if (timeDiff > -30 * 60 * 1000) return 'upcoming'; // Within 30 minutes
    
    return 'scheduled';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'overdue': return 'text-red-600 bg-red-50 border-red-200';
      case 'due': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'upcoming': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string, completed: boolean) => {
    if (completed) return <CheckCircle className="h-6 w-6 text-green-600" />;
    
    switch (status) {
      case 'overdue': return <AlertCircle className="h-6 w-6 text-red-600" />;
      case 'due': return <Clock className="h-6 w-6 text-orange-600" />;
      case 'upcoming': return <Clock className="h-6 w-6 text-blue-600" />;
      default: return <Circle className="h-6 w-6 text-gray-400" />;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getCompletionStats = () => {
    const completed = todayReminders.filter(r => r.completed).length;
    const total = todayReminders.length;
    return { completed, total, percentage: total > 0 ? (completed / total) * 100 : 0 };
  };

  const handleRetroactiveEntry = (medication: Medication, customTime?: string) => {
    const now = new Date();
    const today = now.toDateString();
    
    // Create a custom reminder ID for retroactive entries
    const customReminderId = `${medication.id}-${today}-retroactive-${Date.now()}`;
    
    let scheduledTime = now;
    if (customTime) {
      scheduledTime = new Date(`${today} ${customTime}`);
    }
    
    // Mark as completed immediately since it's retroactive
    onMarkComplete(customReminderId, true);
    
    // Add to today's reminders for display
    const retroactiveReminder: Reminder & { medication: Medication } = {
      id: customReminderId,
      medicationId: medication.id,
      scheduledTime,
      completed: true,
      completedAt: now,
      medication
    };
    
    setTodayReminders(prev => [...prev, retroactiveReminder].sort((a, b) => 
      a.scheduledTime.getTime() - b.scheduledTime.getTime()
    ));
    
    setShowRetroactiveModal(false);
    setSelectedMedication(null);
  };

  const stats = getCompletionStats();

  if (todayReminders.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-md">
        <Eye className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">No reminders for today</h3>
        <p className="text-gray-500">Add medications to see your daily reminders</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Today's Reminders</h2>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{stats.completed}/{stats.total}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${stats.percentage}%` }}
          ></div>
        </div>
        <div className="text-sm text-gray-600">
          {Math.round(stats.percentage)}% adherence rate for today
        </div>
      </div>

      {/* Reminders List */}
      <div className="space-y-3">
        {todayReminders.map((reminder) => {
          const status = getReminderStatus(reminder);
          const statusColor = getStatusColor(status);
          
          return (
            <div
              key={reminder.id}
              className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-6 border-l-4 ${statusColor}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => onMarkComplete(reminder.id, !reminder.completed)}
                    className="transition-transform duration-200 hover:scale-110"
                  >
                    {getStatusIcon(status, reminder.completed)}
                  </button>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {reminder.medication.name}
                    </h3>
                    <p className="text-gray-600">
                      {reminder.medication.dropsPerDose} drop(s) • {formatTime(reminder.scheduledTime)}
                    </p>
                    {reminder.completed && reminder.completedAt && (
                      <p className="text-sm text-green-600">
                        ✓ Completed at {formatTime(reminder.completedAt)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </div>
                  {!reminder.completed && status === 'overdue' && (
                    <div className="text-sm text-red-600 mt-1">
                      {Math.floor((currentTime.getTime() - reminder.scheduledTime.getTime()) / (1000 * 60))} min late
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Retroactive Entry Button */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Missed a dose?</h3>
            <p className="text-gray-600">Record medication taken outside scheduled times</p>
          </div>
          <button
            onClick={() => setShowRetroactiveModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
          >
            <Plus className="h-4 w-4" />
            <span>Add Entry</span>
          </button>
        </div>
      </div>

      {/* Retroactive Entry Modal */}
      {showRetroactiveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Record Medication</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Medication
                  </label>
                  <select
                    value={selectedMedication?.id || ''}
                    onChange={(e) => {
                      const med = medications.find(m => m.id === e.target.value);
                      setSelectedMedication(med || null);
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Choose medication...</option>
                    {medications.filter(m => m.isActive).map(med => (
                      <option key={med.id} value={med.id}>{med.name}</option>
                    ))}
                  </select>
                </div>

                {selectedMedication && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Eye className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-800">{selectedMedication.name}</span>
                    </div>
                    <p className="text-blue-700 text-sm">
                      {selectedMedication.dropsPerDose} drop(s) per dose
                    </p>
                  </div>
                )}
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowRetroactiveModal(false);
                    setSelectedMedication(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => selectedMedication && handleRetroactiveEntry(selectedMedication)}
                  disabled={!selectedMedication}
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg transition-colors duration-200"
                >
                  Record Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodayReminders;