// utils/constants.js

export const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'electrical', label: 'Electrical', icon: 'Zap' },
  { value: 'plumbing', label: 'Plumbing', icon: 'Droplet' },
  { value: 'structural', label: 'Structural', icon: 'HardHat' },
  { value: 'mechanical', label: 'Mechanical', icon: 'Cpu' },
  { value: 'civil', label: 'Civil', icon: 'Building' },
];

export const URGENCIES = [
  { value: 'all', label: 'All Urgencies' },
  { value: 'low', label: 'Low', color: 'green' },
  { value: 'medium', label: 'Medium', color: 'yellow' },
  { value: 'high', label: 'High', color: 'orange' },
  { value: 'critical', label: 'Critical', color: 'red' },
];

export const ZONES = ['Main Campus', 'East Campus', 'North Campus', 'West Campus'];

export const TRADES = {
  electrical: { label: 'Electrical', icon: 'Zap', color: 'yellow' },
  plumbing: { label: 'Plumbing', icon: 'Droplet', color: 'blue' },
  carpentry: { label: 'Carpentry', icon: 'Wrench', color: 'amber' },
  masonry: { label: 'Masonry', icon: 'HardHat', color: 'orange' },
  hvac: { label: 'HVAC', icon: 'Cpu', color: 'purple' },
  general: { label: 'General', icon: 'Briefcase', color: 'gray' },
};