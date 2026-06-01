import Header from './Header';

export default function Dashboard() {
  return (
    <div>
      <Header showAuth={true} />
      <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p>
        Welcome to the Dashboard! Here you can view your tasks, manage your profile, and access resources relevant to your role.
      </p>
    </div>
    </div>
  );
}
