import { useEffect, useState } from 'react';
import complaintService from '../services/complaintsApi';
import AssignModal from './management/modals/AssignModal';

export default function TasksPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showAssign, setShowAssign] = useState(false);
  const [tasksMap, setTasksMap] = useState({}); // complaintId -> array of tasks
  const [newTaskText, setNewTaskText] = useState('');

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    setLoading(true);
    try {
      const result = await complaintService.getMyComplaints({ page: 1, limit: 50 });
      if (result.success) {
        setComplaints(result.data || []);
      } else {
        setComplaints([]);
      }
    } catch (err) {
      console.error('Failed to load complaints for tasks view', err);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  }

  function openAssign(complaint) {
    setSelectedComplaint(complaint);
    setShowAssign(true);
  }

  function closeAssign() {
    setSelectedComplaint(null);
    setShowAssign(false);
  }

  function addTask(complaintId) {
    if (!newTaskText.trim()) return;
    setTasksMap((m) => {
      const prev = m[complaintId] || [];
      return { ...m, [complaintId]: [...prev, { id: Date.now(), text: newTaskText.trim(), status: 'open' }] };
    });
    setNewTaskText('');
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Tasks — Complaints</h2>
        <p className="text-sm text-slate-600">List of complaints shown as parent items with task actions.</p>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-4">
          {complaints.length === 0 && <div className="text-sm text-slate-500">No complaints found.</div>}

          {complaints.map((c) => (
            <div key={c.id || c.complaintId} className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-slate-50 rounded-md flex items-center justify-center overflow-hidden">
                  {c.image || c.imageUrl ? (
                    <img src={c.imageUrl || c.image} alt="complaint" className="object-cover w-full h-full" />
                  ) : (
                    <div className="text-xs text-slate-400">No image</div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">{c.title || c.subject || 'Untitled'}</div>
                      <div className="text-xs text-slate-500">ID: {c.complaintId || c.id}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button onClick={() => openAssign(c)} className="px-3 py-1 text-sm rounded-lg border border-slate-200 bg-white hover:bg-slate-50">Assign Technician</button>

                      <div className="relative">
                        <details className="text-sm">
                          <summary className="list-none cursor-pointer px-3 py-1 rounded-lg border border-slate-200 bg-white">Actions ▾</summary>
                          <div className="mt-2 p-3 bg-slate-50 rounded-md">
                            <button className="w-full text-left text-sm px-2 py-1 hover:bg-white rounded" onClick={() => { alert('Analyze action - open analyzer (TBD)'); }}>
                              Analyze Complaint
                            </button>
                            <button className="w-full text-left text-sm px-2 py-1 hover:bg-white rounded" onClick={() => { const id = c.complaintId || c.id; const taskText = prompt('Enter task description'); if (taskText) { setTasksMap((m) => ({ ...m, [id]: [...(m[id]||[]), { id: Date.now(), text: taskText, status: 'open' }] })); } }}>
                              Create Task from Complaint
                            </button>
                          </div>
                        </details>
                      </div>
                    </div>
                  </div>

                  {/* Tasks list for this complaint */}
                  <div className="mt-3 border-t pt-3">
                    <div className="text-xs text-slate-600 mb-2">Tasks for this complaint</div>
                    {(tasksMap[c.complaintId || c.id] || []).length === 0 ? (
                      <div className="text-sm text-slate-500">No tasks yet — create one below.</div>
                    ) : (
                      <ul className="space-y-2">
                        {(tasksMap[c.complaintId || c.id] || []).map((t) => (
                          <li key={t.id} className="flex items-center justify-between bg-white border border-slate-100 rounded p-2">
                            <div className="text-sm">{t.text}</div>
                            <div className="text-xs text-slate-500">{t.status}</div>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="mt-3 flex gap-2">
                      <input value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} placeholder="New task description" className="flex-1 px-3 py-2 border border-slate-200 rounded" />
                      <button onClick={() => addTask(c.complaintId || c.id)} className="px-3 py-2 bg-blue-600 text-white rounded">Add</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAssign && selectedComplaint && (
        <AssignModal complaint={selectedComplaint} onClose={closeAssign} onSuccess={() => { closeAssign(); refresh(); }} />
      )}
    </div>
  );
}
