// Header.jsx

export default function Header({ pendingCount, availableTechsCount }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
            Task Assignment Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Estates Officers — Assign pending complaints to technicians based on trade specialization and zone
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white rounded-xl px-4 py-2 shadow-sm border border-gray-100">
            <span className="text-sm text-gray-500">Pending</span>
            <p className="text-2xl font-bold text-indigo-600">{pendingCount}</p>
          </div>
          <div className="bg-white rounded-xl px-4 py-2 shadow-sm border border-gray-100">
            <span className="text-sm text-gray-500">Available Techs</span>
            <p className="text-2xl font-bold text-green-600">{availableTechsCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
};