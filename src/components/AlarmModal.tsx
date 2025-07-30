import React from 'react';

interface AlarmModalProps {
  message: string;
  onStop: () => void;
}

const AlarmModal: React.FC<AlarmModalProps> = ({ message, onStop }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full text-center animate-pulse">
        <h2 className="text-2xl font-bold text-red-600">⏰ Medication Alert</h2>
        <p className="text-gray-800 mt-4">{message}</p>
        <button
          onClick={onStop}
          className="mt-6 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition duration-200"
        >
          Stop Alarm
        </button>
      </div>
    </div>
  );
};

export default AlarmModal;
