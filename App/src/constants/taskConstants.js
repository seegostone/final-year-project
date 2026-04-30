// constants/taskConstants.js
import { Clock, CheckCircle, AlertCircle, XCircle, PlayCircle } from 'lucide-react';

// Makerere University Colors
export const MAKERERE_COLORS = {
  green: {
    primary: '#006837', // Makerere Green
    light: '#E8F5E9',
    border: '#A5D6A7',
    text: '#1B5E20',
  },
  red: {
    primary: '#CE1126', // Makerere Red
    light: '#FFEBEE',
    border: '#EF9A9A',
    text: '#C62828',
  },
  beige: {
    primary: '#D4C4A8', // Makerere Beige
    light: '#FAF8F2',
    border: '#E0D6C0',
    text: '#5D4E37',
  },
  gold: {
    primary: '#F5A623',
    light: '#FFF8E7',
    border: '#FFE0A3',
    text: '#B76E00',
  }
};

export const TASK_STATUS = {
  pending: {
    value: 'pending',
    label: 'Pending',
    icon: Clock,
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    badgeClass: 'bg-amber-100 text-amber-800'
  },
  in_progress: {
    value: 'in-progress',
    label: 'In Progress',
    icon: PlayCircle,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    badgeClass: 'bg-blue-100 text-blue-800'
  },
  resolved: {
    value: 'resolved',
    label: 'Resolved',
    icon: CheckCircle,
    color: `bg-[#E8F5E9] text-[#1B5E20] border-[#A5D6A7]`,
    badgeClass: `bg-[#006837] text-white`
  },
  rejected: {
    value: 'rejected',
    label: 'Rejected',
    icon: XCircle,
    color: `bg-[#FFEBEE] text-[#C62828] border-[#EF9A9A]`,
    badgeClass: `bg-[#CE1126] text-white`
  }
};

export const MATERIAL_TYPES = [
  'Electrical Cables',
  'Light Bulbs',
  'Pipes & Fittings',
  'Cement & Concrete',
  'Paint',
  'Wood & Timber',
  'Tools & Equipment',
  'Plumbing Fixtures',
  'HVAC Parts',
  'Other Materials'
];

export const WORK_CATEGORIES = [
  'Repair',
  'Replacement',
  'Maintenance',
  'Inspection',
  'Installation',
  'Emergency Fix'
];