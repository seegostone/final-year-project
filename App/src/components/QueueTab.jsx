import React from 'react';
import { motion } from 'motion/react';
import { Card } from './ui/card';
import FilterBar from './FilterBar';
import ComplaintTable from './ComplaintTable';
import PaginationControls from './PaginationControls';

function QueueTab(props) {
  const {
    search, setSearch,
    statusFilter, setStatusFilter,
    priorityFilter, setPriorityFilter,
    categoryFilter, setCategoryFilter,
    STATUSES, PRIO_OPTIONS, CATEGORIES,
    clearFilters,
    queueError,
    complaints, loading, onRowClick,
    page, setPage, totalPages, totalComplaints,
    STATUS_BADGE, statusLabel,
  } = props;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="border-slate-200 shadow-none rounded-none">
        <FilterBar
        search={search} setSearch={setSearch}
        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
        priorityFilter={priorityFilter} setPriorityFilter={setPriorityFilter}
        categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter}
        STATUSES={STATUSES} PRIO_OPTIONS={PRIO_OPTIONS} CATEGORIES={CATEGORIES}
        clearFilters={clearFilters}
        queueError={queueError}
      />

      <ComplaintTable complaints={complaints} loading={loading} onRowClick={onRowClick} STATUS_BADGE={STATUS_BADGE} statusLabel={statusLabel} />

      <PaginationControls page={page} setPage={setPage} totalPages={totalPages} totalComplaints={totalComplaints} loading={loading} />
    </Card>
    </motion.div>
  );
}

export default React.memo(QueueTab);
