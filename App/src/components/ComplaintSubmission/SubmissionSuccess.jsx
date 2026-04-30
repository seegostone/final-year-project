// components/ComplaintSubmission/SubmissionSuccess.jsx
import { CheckCircle } from 'lucide-react';

export default function SubmissionSuccess({ complaint, onNewComplaint }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Success Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4">
            <CheckCircle size={48} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white">Complaint Submitted Successfully!</h2>
          <p className="text-green-100 mt-2">Your issue has been recorded and will be addressed shortly</p>
        </div>

        {/* Tracking ID Card */}
        <div className="p-8">
          <div className="bg-gray-50 rounded-xl p-6 text-center border-2 border-dashed border-gray-200 mb-6">
            <p className="text-sm text-gray-500 uppercase tracking-wide">Your Unique Tracking ID</p>
            <p className="text-3xl font-mono font-bold text-indigo-600 mt-2">{complaint.trackingId}</p>
            <p className="text-xs text-gray-400 mt-2">Keep this ID to track your complaint status</p>
          </div>

          {/* Complaint Summary */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Complaint Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Title:</span>
                <span className="font-medium text-gray-800">{complaint.title}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Category:</span>
                <span className="capitalize font-medium text-gray-800">{complaint.category}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Urgency:</span>
                <span className={`capitalize font-medium ${
                  complaint.urgency === 'critical' ? 'text-red-600' : 'text-gray-800'
                }`}>{complaint.urgency}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Location:</span>
                <span className="font-medium text-gray-800">{complaint.specificLocation}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onNewComplaint}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            Submit Another Complaint
          </button>

          <p className="text-center text-xs text-gray-400 mt-4">
            You will receive email notifications about your complaint status
          </p>
        </div>
      </div>
    </div>
  );
}