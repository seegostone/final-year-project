// components/ComplaintSubmission/UserInfoCard.jsx
import { User, Mail } from 'lucide-react';

export default function UserInfoCard({ user }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 mb-6 flex items-center gap-4">
      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
        <User size={20} className="text-indigo-600" />
      </div>
      <div>
        <p className="font-medium text-gray-800">{user.name}</p>
        <p className="text-sm text-gray-500 flex items-center gap-1">
          <Mail size={14} />
          {user.email}
        </p>
      </div>
      <div className="ml-auto text-xs text-gray-400 bg-white px-3 py-1 rounded-full">
        {user.role}
      </div>
    </div>
  );
};