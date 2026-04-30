// EmptyState.jsx
import { CheckCircle } from 'lucide-react';

export default function EmptyState() {
  return (
    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
      <CheckCircle size={48} className="mx-auto text-gray-300 mb-3" />
      <h3 className="text-lg font-medium text-gray-600">All caught up!</h3>
      <p className="text-gray-400">No pending complaints match your filters</p>
    </div>
  );
};