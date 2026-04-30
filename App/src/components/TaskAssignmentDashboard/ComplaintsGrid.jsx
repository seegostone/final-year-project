// ComplaintsGrid.jsx
import ComplaintCard from './ComplaintCard';
import EmptyState from './EmptyState';

export default function ComplaintsGrid({ complaints, onAssign }) {
  if (complaints.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {complaints.map((complaint) => (
        <ComplaintCard
          key={complaint._id}
          complaint={complaint}
          onAssign={onAssign}
        />
      ))}
    </div>
  );
};