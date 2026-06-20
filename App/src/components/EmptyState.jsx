import { Inbox } from 'lucide-react';
import { motion } from 'motion/react';

export function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white border border-[#e2e8f0] p-12 text-center"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <Inbox className="w-20 h-20 text-[#cbd5e1] mx-auto mb-4" />
      <h3 className="font-bold text-[#1e2937] mb-2" style={{ fontFamily: 'Merriweather, serif', fontSize: '18px' }}>
        No tasks assigned
      </h3>
      <p className="text-[#94a3b8] mb-6" style={{ fontSize: '14px' }}>
        You have no pending tasks. Check back later.
      </p>
      <button 
        className="px-6 py-2 bg-[#1e3a5f] text-white hover:bg-[#2d4a6f] transition-colors"
        style={{ fontSize: '14px', fontWeight: 500 }}
      >
        Refresh
      </button>
    </motion.div>
  );
}
