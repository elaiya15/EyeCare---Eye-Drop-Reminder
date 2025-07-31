import React from 'react';
import { Eye, Play, Pause, Trash2, Calendar, Clock } from 'lucide-react';
import { Medication, MedicationSchedule } from '../types';

interface MedicationListProps {
  medications: Medication[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  getCurrentSchedule: (medication: Medication, date: Date) => MedicationSchedule | null;
}

const MedicationList: React.FC<MedicationListProps> = ({
  medications,
  onToggle,
  onDelete,
  getCurrentSchedule
}) => {
  const formatScheduleInfo = (medication: Medication) => {
    const today = new Date();
    const currentSchedule = getCurrentSchedule(medication, today);
    const daysSinceStart = Math.floor(
      (today.getTime() - new Date(medication.startDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (!currentSchedule) {
      return 'Treatment completed';
    }

    const totalDuration = medication.schedules.reduce((sum, s) => sum + s.duration, 0);
    const remainingDays = Math.max(totalDuration - daysSinceStart, 0);

    return `${currentSchedule.timesPerDay}x daily • ${remainingDays} days left`;
  };

  const getProgressPercentage = (medication: Medication) => {
    const today = new Date();
    const daysSinceStart = Math.floor(
      (today.getTime() - new Date(medication.startDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    const totalDuration = medication.schedules.reduce((sum, s) => sum + s.duration, 0);

    return Math.min((daysSinceStart / totalDuration) * 100, 100);
  };

  if (medications.length === 0) {
    return (
      <div className="py-12 text-center bg-white shadow-md rounded-xl">
        <Eye className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="mb-2 text-xl font-semibold text-gray-600">No medications added</h3>
        <p className="text-gray-500">Click "Add Medication" to create your first eye drop reminder</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="mb-6 text-2xl font-bold text-gray-800">Your Medications</h2>

      {medications.map((medication) => {
        const progress = Math.round(getProgressPercentage(medication));
        return (
          <div
            key={medication.id}
            className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-6 ${
              !medication.isActive ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-3 space-x-3">
                  <div className={`p-2 rounded-lg ${medication.isActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <Eye className={`h-6 w-6 ${medication.isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">{medication.name}</h3>
                    <p className="text-gray-600">{medication.dropsPerDose} drop(s) per dose</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Started:{' '}
                      {new Date(medication.startDate).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{formatScheduleInfo(medication)}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between mb-1 text-sm text-gray-600">
                    <span>Treatment Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-2 transition-all duration-300 rounded-full bg-gradient-to-r from-blue-500 to-green-500"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="mt-4 mb-2 font-medium text-gray-700">Schedule</h4>
                  {medication.schedules.map((schedule, index) => (
                    <div key={index} className="p-3 text-sm text-gray-600 rounded-lg bg-gray-50">
                      <span className="font-medium">Phase {index + 1}:</span> {schedule.timesPerDay} times daily for {schedule.duration} days
                      <div className="flex flex-wrap gap-2 mt-1">
                        {schedule.times.map((time, timeIndex) => (
                          <span key={timeIndex} className="px-2 py-1 text-xs text-blue-800 bg-blue-100 rounded">
                            {time}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {medication.notes && (
                  <div className="p-3 mt-3 rounded-lg bg-yellow-50">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Notes:</span> {medication.notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col ml-4 space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
                <button
                  onClick={() => onToggle(medication.id)}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    medication.isActive
                      ? 'bg-green-100 hover:bg-green-200 text-green-600'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                  }`}
                  title={medication.isActive ? 'Pause medication' : 'Resume medication'}
                >
                  {medication.isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>

                <button
                  onClick={() => {
                    if (confirm(`Delete "${medication.name}"?`)) {
                      onDelete(medication.id);
                    }
                  }}
                  className="p-2 text-red-600 transition-colors duration-200 bg-red-100 rounded-lg hover:bg-red-200"
                  title="Delete medication"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MedicationList;
