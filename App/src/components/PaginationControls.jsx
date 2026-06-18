import React from 'react';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function PaginationControls({ page, setPage, totalPages, totalComplaints, loading }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
      <p className="text-xs text-slate-500">Page {page} of {totalPages} · {totalComplaints} complaint{totalComplaints !== 1 ? 's' : ''}</p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="h-7 px-3 text-xs" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
          <ChevronLeft className="h-3 w-3 mr-0.5" />Prev
        </Button>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((n) => (
            <button key={n} onClick={() => setPage(n)} disabled={loading} className={`h-7 w-7 text-xs rounded-md transition-colors ${n === page ? 'bg-[#1e3a5f] text-white font-semibold' : 'text-slate-500 hover:bg-slate-100'}`}>{n}</button>
          ))}
          {totalPages > 7 && <span className="text-xs text-slate-400 px-1">…{totalPages}</span>}
        </div>
        <Button variant="outline" size="sm" className="h-7 px-3 text-xs" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>
          Next<ChevronRight className="h-3 w-3 ml-0.5" />
        </Button>
      </div>
    </div>
  );
}

export default React.memo(PaginationControls);
