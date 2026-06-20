import { Building2, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';

export function Header() {
  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#e2e8f0] px-6 py-4"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <div className="max-w-[1400px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <div className="font-semibold text-[#1e2937]" style={{ fontSize: '14px' }}>
              EstatesComplaint
            </div>
            <div className="text-[#94a3b8]" style={{ fontSize: '12px' }}>
              Makerere University Estates Department
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 cursor-pointer hover:bg-[#f8fafc] px-3 py-2 transition-colors">
          <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center font-medium" style={{ fontSize: '14px' }}>
            JD
          </div>
          <span className="text-[#1e2937]" style={{ fontSize: '14px' }}>John Doe</span>
          <ChevronDown className="w-4 h-4 text-[#94a3b8]" />
        </div>
      </div>
    </motion.header>
  );
}
