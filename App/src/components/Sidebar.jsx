import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, BarChart2, Users } from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path);

  return (
    <div className="h-full min-h-[60vh] w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-green-50">
          <span className="text-green-700 font-bold">E</span>
        </div>
        <div className="text-sm">
          <h2 className="text-sm font-semibold m-0">EstatesComplaint</h2>
          <p className="text-xs text-slate-500 m-0">Makerere University Estates</p>
        </div>
        <div className="ml-auto lg:hidden">
          <button onClick={onClose} className="text-sm text-slate-600">Close</button>
        </div>
      </div>

      <nav className="space-y-1">
        <Link to="/dashboard" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${isActive('/dashboard') ? 'bg-slate-100 text-slate-900' : 'text-slate-700 hover:bg-slate-50'}`}>
          <Home className="h-4 w-4" />
          <span>Dashboard</span>
        </Link>

        <div>
          <Link to="/complaints" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${isActive('/complaints') ? 'bg-slate-100 text-slate-900' : 'text-slate-700 hover:bg-slate-50'}`}>
            <FileText className="h-4 w-4" />
            <span>Complaints</span>
          </Link>

          <div className="ml-6 mt-1 space-y-1">
            <Link to="/complaints/tasks" className="block text-sm px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50">Tasks</Link>
          </div>
        </div>

        <Link to="/stats" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${isActive('/stats') ? 'bg-slate-100 text-slate-900' : 'text-slate-700 hover:bg-slate-50'}`}>
          <BarChart2 className="h-4 w-4" />
          <span>Stats</span>
        </Link>

        <Link to="/users" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${isActive('/users') ? 'bg-slate-100 text-slate-900' : 'text-slate-700 hover:bg-slate-50'}`}>
          <Users className="h-4 w-4" />
          <span>Users</span>
        </Link>
      </nav>
    </div>
  );
}
