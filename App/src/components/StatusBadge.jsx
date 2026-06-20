const statusStyles = {
  'Assigned': 'bg-[#dbeafe] text-[#2563eb]',
  'In Progress': 'bg-[#ede9fe] text-[#7c3aed]',
  'Resolved': 'bg-[#d1fae5] text-[#059669]',
  'Pending': 'bg-[#fef3c7] text-[#d97706]',
};

export function StatusBadge({ status }) {
  return (
    <span 
      className={`px-3 py-1 ${statusStyles[status]} font-medium`}
      style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px' }}
    >
      {status}
    </span>
  );
}
