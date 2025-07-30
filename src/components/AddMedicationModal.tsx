import React, { useState } from 'react';
import { X, Plus, Minus, Clock } from 'lucide-react';
import { Medication, MedicationSchedule } from '../types';

interface AddMedicationModalProps {
  onClose: () => void;
  onAdd: (medication: Omit<Medication, 'id' | 'createdAt'>) => void;
}

const AddMedicationModal: React.FC<AddMedicationModalProps> = ({ onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [dropsPerDose, setDropsPerDose] = useState(1);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([
    {
      timesPerDay: 3,
      times: ['08:00', '14:00', '20:00'],
      duration: 7
    }
  ]);

  const presetTimes = {
    1: ['12:00'],
    2: ['08:00', '20:00'],
    3: ['08:00', '14:00', '20:00'],
    4: ['08:00', '12:00', '16:00', '20:00'],
    5: ['06:00', '10:00', '14:00', '18:00', '22:00'],
    6: ['06:00', '10:00', '12:00', '16:00', '20:00', '24:00']
  };

  const updateScheduleTimesPerDay = (scheduleIndex: number, timesPerDay: number) => {
    const newSchedules = [...schedules];
    newSchedules[scheduleIndex] = {
      ...newSchedules[scheduleIndex],
      timesPerDay,
      times: presetTimes[timesPerDay as keyof typeof presetTimes] || []
    };
    setSchedules(newSchedules);
  };

  const updateScheduleTime = (scheduleIndex: number, timeIndex: number, time: string) => {
    const newSchedules = [...schedules];
    newSchedules[scheduleIndex].times[timeIndex] = time;
    setSchedules(newSchedules);
  };

  const updateScheduleDuration = (scheduleIndex: number, duration: number) => {
    const newSchedules = [...schedules];
    newSchedules[scheduleIndex].duration = Math.max(1, duration);
    setSchedules(newSchedules);
  };

  const addSchedule = () => {
    setSchedules([
      ...schedules,
      {
        timesPerDay: 3,
        times: ['08:00', '14:00', '20:00'],
        duration: 7
      }
    ]);
  };

  const removeSchedule = (index: number) => {
    if (schedules.length > 1) {
      setSchedules(schedules.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;

    const medication: Omit<Medication, 'id' | 'createdAt'> = {
      name: name.trim(),
      dropsPerDose,
      schedules,
      startDate: new Date(startDate),
      isActive: true,
      notes: notes.trim() || undefined
    };

    onAdd(medication);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Add New Medication</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Medication Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Refresh Eye Drops"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Drops per dose
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={dropsPerDose}
                  onChange={(e) => setDropsPerDose(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Schedules */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Treatment Schedule</h3>
              <button
                type="button"
                onClick={addSchedule}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors duration-200"
              >
                <Plus className="h-4 w-4" />
                <span>Add Phase</span>
              </button>
            </div>

            {schedules.map((schedule, scheduleIndex) => (
              <div key={scheduleIndex} className="border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-700">Phase {scheduleIndex + 1}</h4>
                  {schedules.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSchedule(scheduleIndex)}
                      className="text-red-600 hover:text-red-700 transition-colors duration-200"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Times per day
                    </label>
                    <select
                      value={schedule.timesPerDay}
                      onChange={(e) => updateScheduleTimesPerDay(scheduleIndex, parseInt(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {[1, 2, 3, 4, 5, 6].map(num => (
                        <option key={num} value={num}>{num} time{num > 1 ? 's' : ''} per day</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={schedule.duration}
                      onChange={(e) => updateScheduleDuration(scheduleIndex, parseInt(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Reminder Times
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {schedule.times.map((time, timeIndex) => (
                      <input
                        key={timeIndex}
                        type="time"
                        value={time}
                        onChange={(e) => updateScheduleTime(scheduleIndex, timeIndex, e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional instructions or reminders..."
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200"
            >
              Add Medication
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMedicationModal;