import React, { useState, useMemo } from 'react';
import { Calendar, TrendingUp, Award, Clock, Eye } from 'lucide-react';
import { Medication, Reminder } from '../types';

interface StatisticsProps {
  medications: Medication[];
  reminders: Reminder[];
}

const Statistics: React.FC<StatisticsProps> = ({ medications, reminders }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week');

  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let startDate: Date;
    switch (selectedPeriod) {
      case 'week':
        startDate = weekAgo;
        break;
      case 'month':
        startDate = monthAgo;
        break;
      default:
        startDate = new Date(0);
    }

    const periodReminders = reminders.filter(r => r.scheduledTime >= startDate);
    const completedReminders = periodReminders.filter(r => r.completed);
    
    const adherenceRate = periodReminders.length > 0 
      ? (completedReminders.length / periodReminders.length) * 100 
      : 0;

    // Calculate streak
    const today = new Date();
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStr = checkDate.toDateString();
      
      const dayReminders = reminders.filter(r => 
        r.scheduledTime.toDateString() === dayStr
      );
      
      if (dayReminders.length === 0) continue;
      
      const dayCompleted = dayReminders.every(r => r.completed);
      if (dayCompleted) {
        streak++;
      } else {
        break;
      }
    }

    // Daily adherence for the period
    const dailyAdherence: { [key: string]: { total: number; completed: number } } = {};
    
    periodReminders.forEach(reminder => {
      const dayKey = reminder.scheduledTime.toDateString();
      if (!dailyAdherence[dayKey]) {
        dailyAdherence[dayKey] = { total: 0, completed: 0 };
      }
      dailyAdherence[dayKey].total++;
      if (reminder.completed) {
        dailyAdherence[dayKey].completed++;
      }
    });

    return {
      totalMedications: medications.length,
      activeMedications: medications.filter(m => m.isActive).length,
      totalReminders: periodReminders.length,
      completedReminders: completedReminders.length,
      adherenceRate,
      streak,
      dailyAdherence
    };
  }, [medications, reminders, selectedPeriod]);

  const getAdherenceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600 bg-green-100';
    if (rate >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const renderDailyChart = () => {
    const days = Object.keys(stats.dailyAdherence).sort().slice(-14); // Last 14 days
    
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Adherence</h3>
        <div className="space-y-2">
          {days.map(day => {
            const data = stats.dailyAdherence[day];
            const rate = data.total > 0 ? (data.completed / data.total) * 100 : 0;
            const date = new Date(day);
            
            return (
              <div key={day} className="flex items-center space-x-3">
                <div className="w-16 text-sm text-gray-600">
                  {date.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                  <div
                    className={`h-4 rounded-full transition-all duration-300 ${
                      rate >= 90 ? 'bg-green-500' :
                      rate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${rate}%` }}
                  ></div>
                </div>
                <div className="w-12 text-sm text-gray-600 text-right">
                  {Math.round(rate)}%
                </div>
                <div className="w-16 text-sm text-gray-500 text-right">
                  {data.completed}/{data.total}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (medications.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-md">
        <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">No statistics available</h3>
        <p className="text-gray-500">Add medications and start tracking to see your progress</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Statistics</h2>
        <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-md">
          {[
            { key: 'week', label: '7 Days' },
            { key: 'month', label: '30 Days' },
            { key: 'all', label: 'All Time' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSelectedPeriod(key as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                selectedPeriod === key
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Eye className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{stats.activeMedications}</div>
              <div className="text-sm text-gray-600">Active Medications</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-lg ${getAdherenceColor(stats.adherenceRate)}`}>
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{Math.round(stats.adherenceRate)}%</div>
              <div className="text-sm text-gray-600">Adherence Rate</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <Award className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{stats.streak}</div>
              <div className="text-sm text-gray-600">Day Streak</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{stats.completedReminders}</div>
              <div className="text-sm text-gray-600">Doses Taken</div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Chart */}
      {renderDailyChart()}

      {/* Medication Breakdown */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Medication Overview</h3>
        <div className="space-y-4">
          {medications.map(medication => {
            const medReminders = reminders.filter(r => r.medicationId === medication.id);
            const medCompleted = medReminders.filter(r => r.completed);
            const medRate = medReminders.length > 0 ? (medCompleted.length / medReminders.length) * 100 : 0;
            
            return (
              <div key={medication.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-800">{medication.name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    medication.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {medication.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>{medCompleted.length}/{medReminders.length} doses</span>
                  <span>{Math.round(medRate)}% adherence</span>
                  <span>Started {medication.startDate.toLocaleDateString()}</span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      medRate >= 90 ? 'bg-green-500' :
                      medRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${medRate}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Statistics;