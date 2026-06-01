import Header from './Header';

export default function TechnicianDashboard() {
  return (
    <div>
      <Header showAuth={true} />
      <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Technician Dashboard</h1>
      <p>Welcome to the Technician Dashboard! Here you can manage your assigned tasks, view work orders, and update your profile.</p>   
    </div>
    </div>
  );
};