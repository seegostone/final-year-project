// components/TaskResolution/TechnicianHeader.jsx
import React from 'react';
import { User, Mail, Phone, Wrench, MapPin } from 'lucide-react';
import { MAKERERE_COLORS } from '../../constants/taskConstants';

const TechnicianHeader = ({ technician, stats }) => {
  return (
    <div className="bg-gradient-to-r from-[#006837] to-[#008548] rounded-2xl p-6 mb-8 text-white">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <User size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{technician.name}</h1>
            <p className="text-green-100 flex items-center gap-2 mt-1">
              <Wrench size={16} />
              {technician.trade?.toUpperCase()} Technician
            </p>
          </div>
        </div>
        
        <div className="flex gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-green-100">Total Tasks</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-300">{stats.pending}</p>
            <p className="text-xs text-green-100">Pending</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-300">{stats.inProgress}</p>
            <p className="text-xs text-green-100">In Progress</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-300">{stats.resolved}</p>
            <p className="text-xs text-green-100">Resolved</p>
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-white/20 text-sm">
        <div className="flex items-center gap-2">
          <Mail size={14} />
          <span>{technician.email}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone size={14} />
          <span>{technician.phone}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin size={14} />
          <span>Zone: {technician.zone?.join(', ')}</span>
        </div>
      </div>
    </div>
  );
};

export default TechnicianHeader;