import { motion } from 'motion/react';

export function StatCard({ icon: Icon, iconBg, iconColor, count, label, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white border border-[#e2e8f0] p-5 hover:shadow-lg transition-shadow"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div>
          <div className="text-2xl font-bold text-[#1e2937]" style={{ fontFamily: 'Merriweather, serif' }}>
            {count}
          </div>
          <div className="text-[#475569]" style={{ fontSize: '14px' }}>
            {label}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
