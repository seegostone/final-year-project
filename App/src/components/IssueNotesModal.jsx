import { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function IssueNotesModal({ isOpen, onClose, onSubmit, taskId, taskTitle }) {
  const [partsNeeded, setPartsNeeded] = useState('');
  const [delayReason, setDelayReason] = useState('');
  const [estimatedDays, setEstimatedDays] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      partsNeeded,
      delayReason,
      estimatedDays: estimatedDays ? parseInt(estimatedDays) : undefined,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <div className="bg-white w-full max-w-2xl">
              <div className="bg-white border-b border-[#e2e8f0] p-6 flex items-start justify-between">
                <div>
                  <h2 className="font-bold text-[#1e2937]" style={{ fontFamily: 'Merriweather, serif', fontSize: '24px' }}>
                    Issue Notes - {taskId}
                  </h2>
                  <p className="text-[#475569] mt-1" style={{ fontSize: '14px' }}>
                    {taskTitle}
                  </p>
                </div>
                <button onClick={onClose} className="text-[#94a3b8] hover:text-[#475569]">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-[#1e2937] mb-2" style={{ fontSize: '14px', fontWeight: 500 }}>
                    Parts Needed <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    id="partsNeeded"
                    name="partsNeeded"
                    required
                    value={partsNeeded}
                    onChange={(e) => setPartsNeeded(e.target.value)}
                    rows={2}
                    className="w-full border border-[#e2e8f0] p-3 focus:outline-none focus:ring-2 focus:ring-[#d97706]"
                    placeholder="List the parts required..."
                    style={{ fontSize: '14px' }}
                  />
                </div>

                <div>
                  <label className="block text-[#1e2937] mb-2" style={{ fontSize: '14px', fontWeight: 500 }}>
                    Delay Reason <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    id="delayReason"
                    name="delayReason"
                    required
                    value={delayReason}
                    onChange={(e) => setDelayReason(e.target.value)}
                    rows={2}
                    className="w-full border border-[#e2e8f0] p-3 focus:outline-none focus:ring-2 focus:ring-[#d97706]"
                    placeholder="Explain why the task cannot be completed..."
                    style={{ fontSize: '14px' }}
                  />
                </div>

                <div>
                  <label className="block text-[#1e2937] mb-2" style={{ fontSize: '14px', fontWeight: 500 }}>
                    Estimated Resolution Time (optional)
                  </label>
                  <input
                    id="estimatedDays"
                    name="estimatedDays"
                    type="number"
                    min="1"
                    value={estimatedDays}
                    onChange={(e) => setEstimatedDays(e.target.value)}
                    className="w-full border border-[#e2e8f0] p-3 focus:outline-none focus:ring-2 focus:ring-[#d97706]"
                    placeholder="Days needed"
                    style={{ fontSize: '14px' }}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={!partsNeeded || !delayReason}
                    className="flex-1 px-6 py-3 bg-[#d97706] text-white hover:bg-[#b45309] disabled:bg-[#cbd5e1] disabled:cursor-not-allowed transition-colors"
                    style={{ fontSize: '14px', fontWeight: 500 }}
                  >
                    Mark Pending
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 border border-[#e2e8f0] text-[#475569] hover:bg-[#f8fafc] transition-colors"
                    style={{ fontSize: '14px', fontWeight: 500 }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
