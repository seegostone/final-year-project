import { CheckCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export function ConfirmationModal({ isOpen, type, taskId, taskTitle, data }) {
  const navigate = useNavigate();

  // Use provided data or default values
  const displayTaskId = taskId || 'TASK-' + Date.now();
  const displayTaskTitle = taskTitle || 'Task';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <div className="bg-white w-full max-w-lg p-8">
              <div className="text-center mb-6">
                {type === 'resolved' ? (
                  <CheckCircle className="w-20 h-20 text-[#059669] mx-auto mb-4" />
                ) : (
                  <Clock className="w-20 h-20 text-[#d97706] mx-auto mb-4" />
                )}
                <h2 className="font-bold text-[#1e2937] mb-2" style={{ fontFamily: 'Merriweather, serif', fontSize: '24px' }}>
                  {type === 'resolved' ? 'Task Marked as RESOLVED' : 'Task Marked as PENDING'}
                </h2>
                <p className="text-[#475569]" style={{ fontSize: '14px' }}>
                  {displayTaskId} - {displayTaskTitle}
                </p>
              </div>

              <div className="bg-[#f8fafc] p-4 mb-6">
                {type === 'resolved' && 'actionsTaken' in data && (
                  <>
                    <div className="mb-3">
                      <span className="text-[#94a3b8] block mb-1" style={{ fontSize: '12px', fontWeight: 500 }}>
                        ACTIONS TAKEN
                      </span>
                      <p className="text-[#1e2937]" style={{ fontSize: '14px' }}>
                        {data.actionsTaken}
                      </p>
                    </div>
                    <div className="mb-3">
                      <span className="text-[#94a3b8] block mb-1" style={{ fontSize: '12px', fontWeight: 500 }}>
                        MATERIALS USED
                      </span>
                      <p className="text-[#1e2937]" style={{ fontSize: '14px' }}>
                        {data.materialsUsed.join(', ')}
                      </p>
                    </div>
                    <div>
                      <span className="text-[#94a3b8] block mb-1" style={{ fontSize: '12px', fontWeight: 500 }}>
                        HOURS SPENT
                      </span>
                      <p className="text-[#1e2937]" style={{ fontSize: '14px' }}>
                        {data.hoursSpent} hours
                      </p>
                    </div>
                  </>
                )}
                {type === 'pending' && 'partsNeeded' in data && (
                  <>
                    <div className="mb-3">
                      <span className="text-[#94a3b8] block mb-1" style={{ fontSize: '12px', fontWeight: 500 }}>
                        PARTS NEEDED
                      </span>
                      <p className="text-[#1e2937]" style={{ fontSize: '14px' }}>
                        {data.partsNeeded}
                      </p>
                    </div>
                    <div>
                      <span className="text-[#94a3b8] block mb-1" style={{ fontSize: '12px', fontWeight: 500 }}>
                        DELAY REASON
                      </span>
                      <p className="text-[#1e2937]" style={{ fontSize: '14px' }}>
                        {data.delayReason}
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-[#059669]" style={{ fontSize: '14px' }}>
                  <span>☑</span>
                  <span>Notification sent to Estates Officer</span>
                </div>
                {type === 'resolved' && (
                  <div className="flex items-center gap-2 text-[#059669]" style={{ fontSize: '14px' }}>
                    <span>☑</span>
                    <span>Notification sent to Complaint Submitter</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-[#059669]" style={{ fontSize: '14px' }}>
                  <span>☑</span>
                  <span>{type === 'resolved' ? 'Resolution' : 'Pending status'} logged to system</span>
                </div>
                <div className="flex items-center gap-2 text-[#059669]" style={{ fontSize: '14px' }}>
                  <span>☑</span>
                  <span>{new Date().toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/')}
                className="w-full px-6 py-3 bg-[#1e3a5f] text-white hover:bg-[#2d4a6f] transition-colors"
                style={{ fontSize: '14px', fontWeight: 500 }}
              >
                Back to Dashboard
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
