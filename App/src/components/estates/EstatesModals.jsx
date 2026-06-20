import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../ui/dialog.jsx';
import { Button } from '../ui/button.jsx';
import { Input } from '../ui/input.jsx';
import { Label } from '../ui/label.jsx';
import { Textarea } from '../ui/textarea.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select.jsx';
import { Alert, AlertDescription } from '../ui/alert.jsx';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

// ─── Shared helpers ───────────────────────────────────────────────────────────

function formatTechnicianDisplay(technician) {
  const spec = technician.specialization || technician.trade || 'N/A';
  const zone = technician.zone || 'N/A';
  const skills = Array.isArray(technician.skills)
    ? technician.skills.join(', ')
    : (technician.skills || 'N/A');

  return {
    label: technician.name,
    detail: `🔧 ${spec} • 📍 ${zone}`,
    skills: `Skills: ${skills}`,
  };
}

function remainingDays(complaint) {
  const total = complaint.scopeDefinition?.estimatedDuration ?? 0;
  const used = (complaint.tasks ?? []).reduce((s, t) => s + (t.estimatedDurationDays ?? 0), 0);
  return Math.max(0, total - used);
}

// ─── Define Scope Modal ───────────────────────────────────────────────────────

export function DefineScopeModal({ open, complaint, onClose, onSubmit }) {
  const [scopeDescription, setScopeDescription] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!scopeDescription.trim() || !estimatedDuration) {
      setError('Scope description and estimated duration are required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSubmit(complaint._id, {
        scopeDescription: scopeDescription.trim(),
        estimatedDuration: parseFloat(estimatedDuration),
        requiredSkills: requiredSkills.split(',').map((s) => s.trim()).filter(Boolean),
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : 0,
      });
      onClose();
    } catch {
      setError('Failed to define scope. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg bg-white border border-slate-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-600">
            Define Scope — {complaint.complaintId}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {error && (
            <Alert className="border-rose-200 bg-rose-50">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              <AlertDescription className="text-rose-800 text-sm">{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-1.5">
            <Label>Scope Description <span className="text-rose-500">*</span></Label>
            <Textarea
              placeholder="Describe the full scope of work required..."
              rows={3}
              value={scopeDescription}
              onChange={(e) => setScopeDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Total Duration (days) <span className="text-rose-500">*</span></Label>
              <Input
                type="number"
                min="0.5"
                step="0.5"
                placeholder="e.g. 5"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Estimated Cost (UGX)</Label>
              <Input
                type="number"
                min="0"
                placeholder="e.g. 500000"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Required Skills (comma-separated)</Label>
            <Input
              placeholder="e.g. Plumbing, Electrical"
              value={requiredSkills}
              onChange={(e) => setRequiredSkills(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading} className="text-slate-700">Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {loading ? 'Saving...' : 'Define Scope'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Create Task Modal ────────────────────────────────────────────────────────

export function CreateTaskModal({ open, complaint, technicians, onClose, onSubmit }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [durationDays, setDurationDays] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [assigneeId, setAssigneeId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const remaining = remainingDays(complaint);
  const durationNum = parseFloat(durationDays) || 0;
  const exceedsScope = complaint.scopeDefinition && durationNum > remaining;

  const handleSubmit = async () => {
    if (!title.trim()) { setError('Task title is required.'); return; }
    if (!durationDays || durationNum <= 0) { setError('Duration must be greater than 0.'); return; }
    if (exceedsScope) { setError(`Duration exceeds remaining scope capacity (${remaining} day(s) available).`); return; }
    setLoading(true);
    setError(null);
    const startDateObj = new Date(startDate);
    const deadline = new Date(startDateObj.getTime() + durationNum * 86400000).toISOString();
    try {
      await onSubmit(complaint._id, {
        title: title.trim(),
        description: description.trim(),
        priority,
        estimatedDurationDays: durationNum,
        startDate: startDateObj.toISOString(),
        deadline,
        assigneeId: assigneeId || null,
        assigneeName: assigneeId ? (technicians.find((t) => t._id === assigneeId)?.name ?? null) : null,
        notes: notes.trim() || null,
      });
      setTitle(''); setDescription(''); setPriority('MEDIUM'); setDurationDays('');
      setStartDate(new Date().toISOString().split('T')[0]); setAssigneeId(''); setNotes('');
      onClose();
    } catch {
      setError('Failed to create task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[#1e3a5f]">Create Task — {complaint.complaintId}</DialogTitle>
        </DialogHeader>
        {complaint.scopeDefinition && (
          <div className="bg-[#eef2f7] rounded-md px-3 py-2 text-sm flex items-center justify-between">
            <span className="text-slate-600">Scope capacity</span>
            <span className={`font-semibold ${remaining <= 1 ? 'text-rose-600' : 'text-[#1e3a5f]'}`}>
              {remaining} day(s) remaining of {complaint.scopeDefinition.estimatedDuration}
            </span>
          </div>
        )}
        <div className="space-y-4 py-1">
          {error && (
            <Alert className="border-rose-200 bg-rose-50">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              <AlertDescription className="text-rose-800 text-sm">{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-1.5">
            <Label>Task Title <span className="text-rose-500">*</span></Label>
            <Input
              placeholder="e.g. Replace burst pipe section"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              placeholder="Detailed task description..."
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Duration (days) <span className="text-rose-500">*</span></Label>
              <Input
                type="number"
                min="0.25"
                step="0.25"
                placeholder="e.g. 1.5"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                className={`${exceedsScope ? 'border-rose-400' : 'border-slate-200'} w-full rounded-lg bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100`}
              />
              {exceedsScope && <p className="text-xs text-rose-600">Exceeds remaining scope!</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Assign to Technician</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {technicians.map((t) => {
                    const tech = formatTechnicianDisplay(t);
                    return (
                      <SelectItem
                        key={t._id}
                        value={t._id}
                        detail={`${tech.detail} · ${tech.skills}`}
                        textValue={tech.label}
                      >
                        {tech.label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Input
              placeholder="Any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading} className="text-slate-700">Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-[#7B1A1A] hover:bg-[#5A1313] text-white"
            style={{ backgroundColor: '#7B1A1A', borderColor: '#5A1313' }}
          >
            {loading ? 'Creating...' : 'Create Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Assign Task Modal ────────────────────────────────────────────────────────

export function AssignTaskModal({ open, task, complaint, technicians, onClose, onSubmit, onUnassign }) {
  const [technicianId, setTechnicianId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!task) return null;

  const handleSubmit = async () => {
    if (!technicianId) { setError('Please select a technician.'); return; }
    setLoading(true);
    setError(null);
    try {
      const tech = technicians.find((t) => t._id === technicianId);
      await onSubmit(complaint._id, task._id, { technicianId, technicianName: tech?.name ?? '' });
      setTechnicianId('');
      onClose();
    } catch {
      setError('Failed to assign task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#1e3a5f]">Assign Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-slate-600">
            Assigning: <span className="font-medium text-slate-800">{task.title}</span>
          </p>
          {error && (
            <Alert className="border-rose-200 bg-rose-50">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              <AlertDescription className="text-rose-800 text-sm">{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-1.5">
            <Label>Select Technician <span className="text-rose-500">*</span></Label>
            <Select value={technicianId} onValueChange={setTechnicianId}>
              <SelectTrigger><SelectValue placeholder="Choose a technician..." /></SelectTrigger>
              <SelectContent>
                {technicians.map((t) => {
                  const tech = formatTechnicianDisplay(t);
                  return (
                    <SelectItem
                      key={t._id}
                      value={t._id}
                      detail={`${tech.detail} · ${tech.skills}`}
                      textValue={tech.label}
                    >
                      {tech.label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading} className="text-slate-700">Cancel</Button>
          { (task.assigneeId || task.assigneeName) ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => { if (onUnassign) { onUnassign(complaint._id, task._id); onClose(); } }} disabled={loading} className="text-rose-600">Unassign</Button>
              <Button disabled className="bg-blue-600 text-white">Already assigned</Button>
            </div>
          ) : (
            <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? 'Assigning...' : 'Assign Technician'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Assign Technician Modal ─────────────────────────────────────────────────

// ─── Request Rework Modal ─────────────────────────────────────────────────────

export function RequestReworkModal({ open, complaint, onClose, onSubmit }) {
  const [reworkReason, setReworkReason] = useState('');
  const [reworkDetails, setReworkDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const reworkCount = complaint.reworkCount ?? 0;
  const canRework = reworkCount < 2;

  const handleSubmit = async () => {
    if (!reworkReason) { setError('Please select a rework reason.'); return; }
    if (!reworkDetails.trim()) { setError('Please provide rework details.'); return; }
    setLoading(true);
    setError(null);
    try {
      await onSubmit(complaint._id, { reworkReason, reworkDetails: reworkDetails.trim() });
      setReworkReason(''); setReworkDetails('');
      onClose();
    } catch {
      setError('Failed to request rework. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#1e3a5f]">Request Rework — {complaint.complaintId}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {!canRework && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800 text-sm">
                Maximum rework cycles (2) reached. This complaint must be escalated.
              </AlertDescription>
            </Alert>
          )}
          {reworkCount > 0 && canRework && (
            <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              Rework round {reworkCount + 1} of 2
            </div>
          )}
          {error && (
            <Alert className="border-rose-200 bg-rose-50">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              <AlertDescription className="text-rose-800 text-sm">{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-1.5">
            <Label>Reason for Rework <span className="text-rose-500">*</span></Label>
            <Select value={reworkReason} onValueChange={setReworkReason} disabled={!canRework}>
              <SelectTrigger><SelectValue placeholder="Select reason..." /></SelectTrigger>
              <SelectContent>
                {['INCOMPLETE', 'QUALITY_ISSUE', 'RESIDENT_REQUEST', 'OTHER'].map((r) => (
                  <SelectItem key={r} value={r}>{r.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Details <span className="text-rose-500">*</span></Label>
            <Textarea
              placeholder="Describe what needs to be redone and why..."
              rows={3}
              value={reworkDetails}
              onChange={(e) => setReworkDetails(e.target.value)}
              disabled={!canRework}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !canRework} className="bg-amber-600 hover:bg-amber-700 text-white">
            {loading ? 'Requesting...' : 'Request Rework'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Escalate Modal ───────────────────────────────────────────────────────────

export function EscalateModal({ open, complaint, onClose, onSubmit }) {
  const [escalationReason, setEscalationReason] = useState('');
  const [escalationDetails, setEscalationDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!escalationReason) { setError('Please select an escalation reason.'); return; }
    if (!escalationDetails.trim()) { setError('Please provide escalation details.'); return; }
    setLoading(true);
    setError(null);
    try {
      await onSubmit(complaint._id, { escalationReason, escalationDetails: escalationDetails.trim() });
      setEscalationReason(''); setEscalationDetails('');
      onClose();
    } catch {
      setError('Failed to escalate complaint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#1e3a5f]">Escalate — {complaint.complaintId}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800 text-sm">
              Escalation will route this complaint to senior management for oversight.
            </AlertDescription>
          </Alert>
          {error && (
            <Alert className="border-rose-200 bg-rose-50">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              <AlertDescription className="text-rose-800 text-sm">{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-1.5">
            <Label>Escalation Reason <span className="text-rose-500">*</span></Label>
            <Select value={escalationReason} onValueChange={setEscalationReason}>
              <SelectTrigger><SelectValue placeholder="Select reason..." /></SelectTrigger>
              <SelectContent>
                {[
                  { value: 'CRITICAL', label: 'Critical Safety Issue' },
                  { value: 'BUDGET_EXCEEDED', label: 'Budget Exceeded' },
                  { value: 'REWORK_FAILED', label: 'Rework Cycles Exhausted' },
                  { value: 'SAFETY_ISSUE', label: 'Safety / Health Risk' },
                  { value: 'OTHER', label: 'Other' },
                ].map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Details <span className="text-rose-500">*</span></Label>
            <Textarea
              placeholder="Provide full justification for escalation..."
              rows={3}
              value={escalationDetails}
              onChange={(e) => setEscalationDetails(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-orange-600 hover:bg-orange-700 text-white">
            {loading ? 'Escalating...' : 'Escalate Complaint'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Close Complaint Modal ────────────────────────────────────────────────────

export function CloseComplaintModal({ open, complaint, onClose, onSubmit }) {
  const [closureSummary, setClosureSummary] = useState('');
  const [costActual, setCostActual] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!closureSummary.trim()) { setError('Closure summary is required.'); return; }
    setLoading(true);
    setError(null);
    try {
      await onSubmit(complaint._id, {
        closureSummary: closureSummary.trim(),
        costActual: costActual ? parseFloat(costActual) : 0,
      });
      setSuccess(true);
      setTimeout(() => { setSuccess(false); setClosureSummary(''); setCostActual(''); onClose(); }, 1200);
    } catch {
      setError('Failed to close complaint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md bg-white border border-slate-200">
        <DialogHeader>
          <DialogTitle className="text-blue-600">Close Complaint — {complaint.complaintId}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {success ? (
            <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-3">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">Complaint closed successfully.</span>
            </div>
          ) : (
            <>
              {error && (
                <Alert className="border-rose-200 bg-rose-50">
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                  <AlertDescription className="text-rose-800 text-sm">{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-1.5">
                <Label>Closure Summary <span className="text-rose-500">*</span></Label>
                <Textarea
                  placeholder="Summarize the resolution and outcome..."
                  rows={3}
                  value={closureSummary}
                  onChange={(e) => setClosureSummary(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Actual Cost Incurred (UGX)</Label>
                <Input
                  type="number" min="0" placeholder="e.g. 450000"
                  value={costActual} onChange={(e) => setCostActual(e.target.value)}
                />
              </div>
            </>
          )}
        </div>
        {!success && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={loading} className="text-slate-700">Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {loading ? 'Closing...' : 'Close Complaint'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
