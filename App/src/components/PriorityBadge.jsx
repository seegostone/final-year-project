const priorityStyles = {
  'CRITICAL': 'bg-[#fee2e2] text-[#dc2626]',
  'HIGH': 'bg-[#ffedd5] text-[#ea580c]',
  'MEDIUM': 'bg-[#fef3c7] text-[#d97706]',
  'LOW': 'bg-[#f1f5f9] text-[#475569]',
};

export function PriorityBadge({ priority }) {
  return (
    <span 
      className={`px-3 py-1 ${priorityStyles[priority]} font-medium`}
      style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', letterSpacing: '0.5px' }}
    >
      {priority}
    </span>
  );
}
