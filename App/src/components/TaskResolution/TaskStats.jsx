// components/TaskResolution/TaskStats.jsx
import React from 'react';
import { Clock, AlertCircle, CheckCircle, PlayCircle, Wrench } from 'lucide-react';
import { MAKERERE_COLORS } from '../../constants/taskConstants';

const TaskStats = ({ tasks, filteredCount }) => {
  const urgentTasks = tasks.filter(t => t.urgency === 'critical' && t.status !== 'resolved');
  const overdueTasks = tasks.filter(t => new Date(t.deadline) < new Date() && t.status !== 'resolved');
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-xl p-4 border border-[#D4C4A8] shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Assigned</p>
            <p className="text-2xl font-bold text-[#006837]">{filteredCount}</p>
          </div>
          <div className="w-10 h-10 bg-[#E8F5E9] rounded-full flex items-center justify-center">
            <Wrench size={20} className="text-[#006837]" />
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl p-4 border border-[#D4C4A8] shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Urgent Tasks</p>
            <p className="text-2xl font-bold text-[#CE1126]">{urgentTasks.length}</p>
          </div>
          <div className="w-10 h-10 bg-[#FFEBEE] rounded-full flex items-center justify-center">
            <AlertCircle size={20} className="text-[#CE1126]" />
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl p-4 border border-[#D4C4A8] shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">In Progress</p>
            <p className="text-2xl font-bold text-blue-600">{tasks.filter(t => t.status === 'in-progress').length}</p>
          </div>
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
            <PlayCircle size={20} className="text-blue-600" />
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl p-4 border border-[#D4C4A8] shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Overdue</p>
            <p className="text-2xl font-bold text-[#CE1126]">{overdueTasks.length}</p>
          </div>
          <div className="w-10 h-10 bg-[#FFEBEE] rounded-full flex items-center justify-center">
            <Clock size={20} className="text-[#CE1126]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskStats;