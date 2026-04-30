// components/TaskResolution/EmptyTasksState.jsx
import React from 'react';
import { CheckCircle } from 'lucide-react';

const EmptyTasksState = () => {
  return (
    <div className="text-center py-16 bg-white rounded-2xl border border-[#D4C4A8]">
      <div className="w-20 h-20 bg-[#E8F5E9] rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle size={40} className="text-[#006837]" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800">All tasks completed!</h3>
      <p className="text-gray-400 mt-1">Great job! No pending tasks match your filters</p>
    </div>
  );
};

export default EmptyTasksState;