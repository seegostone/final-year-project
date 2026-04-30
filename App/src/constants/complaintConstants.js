// constants/complaintConstants.js
import { Zap, Droplet, HardHat, Wrench, Building, Home, School, MapPin } from 'lucide-react';

export const CATEGORIES = [
  { value: 'electrical', label: 'Electrical', icon: Zap, color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: 'plumbing', label: 'Plumbing', icon: Droplet, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'structural', label: 'Structural', icon: HardHat, color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'mechanical', label: 'Mechanical', icon: Wrench, color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'civil', label: 'Civil Works', icon: Building, color: 'bg-gray-100 text-gray-700 border-gray-200' },
];

export const LOCATIONS = [
  { value: 'halls', label: 'Halls of Residence', icon: Home },
  { value: 'academic', label: 'Academic Buildings', icon: School },
  { value: 'staff', label: 'Staff Residences', icon: Building },
  { value: 'administrative', label: 'Administrative Blocks', icon: Building },
  { value: 'other', label: 'Other Facilities', icon: MapPin },
];

export const URGENCY_LEVELS = [
  { value: 'low', label: 'Low', description: 'Non-urgent, routine maintenance', color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'medium', label: 'Medium', description: 'Should be addressed within 48 hours', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: 'high', label: 'High', description: 'Affects daily operations', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'critical', label: 'Critical', description: 'Emergency - immediate attention required', color: 'bg-red-100 text-red-700 border-red-200' },
];

export const MAX_IMAGES = 5;
export const MIN_TITLE_LENGTH = 5;
export const MIN_DESCRIPTION_LENGTH = 10;