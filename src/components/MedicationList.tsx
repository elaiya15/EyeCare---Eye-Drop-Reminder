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
    const daysSinceStart = Math.floor((today.getTime() - medication.startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (!currentSchedule) {
      return 'Treatment completed';
    }

    const totalDuration = medication.schedules.reduce((sum, schedule) => sum + schedule.duration, 0);
    const remainingDays = totalDuration - daysSinceStart;

    return `${currentSchedule.timesPerDay}x daily • ${remainingDays} days left`;
  };

  const getProgressPercentage = (medication: Medication) => {
    const today = new Date();
    const daysSinceStart = Math.floor((today.getTime() - medication.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalDuration = medication.schedules.reduce((sum, schedule) => sum + schedule.duration, 0);
    
    return Math.min((daysSinceStart / totalDuration) * 100, 100);
  };

  if (medications.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-md">
        <Eye className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">No medications added</h3>
        <p className="text-gray-500">Click "Add Medication" to create your first eye drop reminder</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Medications</h2>
      
      {medications.map((medication) => (
        <div
          key={medication.id}
          className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-6 ${
            !medication.isActive ? 'opacity-60' : ''
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <div className={`p-2 rounded-lg ${medication.isActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <Eye className={`h-6 w-6 ${medication.isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">{medication.name}</h3>
                  <p className="text-gray-600">{medication.dropsPerDose} drop(s) per dose</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Started: {medication.startDate.toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{formatScheduleInfo(medication)}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Treatment Progress</span>
                  <span>{Math.round(getProgressPercentage(medication))}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getProgressPercentage(medication)}%` }}
                  ></div>
                </div>
              </div>

              {/* Schedule Details */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">Schedule:</h4>
                {medication.schedules.map((schedule, index) => (
                  <div key={index} className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                    <span className="font-medium">Phase {index + 1}:</span> {schedule.timesPerDay} times daily for {schedule.duration} days
                    <div className="flex flex-wrap gap-2 mt-1">
                      {schedule.times.map((time, timeIndex) => (
                        <span key={timeIndex} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {time}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {medication.notes && (
                <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-gray-700"><span className="font-medium">Notes:</span> {medication.notes}</p>
                </div>
              )}
            </div>

            <div className="flex flex-col space-y-2 ml-4">
              <button
                onClick={() => onToggle(medication.id)}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  medication.isActive
                    ? 'bg-green-100 hover:bg-green-200 text-green-600'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
                title={medication.isActive ? 'Pause medication' : 'Resume medication'}
              >
                {medication.isActive ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </button>
              
              <button
                onClick={() => onDelete(medication.id)}
                className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition-colors duration-200"
                title="Delete medication"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MedicationList;