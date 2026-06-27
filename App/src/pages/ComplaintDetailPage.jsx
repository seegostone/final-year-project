import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import complaintService from '../services/complaintsApi';
import managementService from '../services/managementApi';
import authService from '../services/api';

export function ComplaintDetailPage() {
  const { complaintId } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [approvalStatus, setApprovalStatus] = useState('ACCEPTED');
  const [satisfactionRating, setSatisfactionRating] = useState(5);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitStatus, setSubmitStatus] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login', { replace: true });
      return;
    }

    const fetchComplaint = async () => {
      try {
        setLoading(true);
        const result = await complaintService.getComplaintById(complaintId);
        if (result.success) {
          setComplaint(result.data);
        } else {
          setError(result.error || 'Failed to load complaint');
        }
      } catch (err) {
        console.error('Error fetching complaint:', err);
        setError('Error loading complaint details');
      } finally {
        setLoading(false);
      }
    };

    fetchComplaint();
  }, [complaintId, navigate]);

  const currentUser = authService.getCurrentUserFromStorage();
  const isSubmitter = currentUser && complaint?.userId?.toString() === currentUser._id?.toString();
  const residentValidation = complaint?.residentValidation || {};
  const canRespond = isSubmitter && residentValidation.isPending && !residentValidation.status;

  const handleBack = () => {
    navigate(-1);
  };

  const handleSubmitResidentApproval = async () => {
    setSubmitError(null);
    setSubmitStatus(null);

    if (approvalStatus === 'REJECTED' && !rejectionReason.trim()) {
      setSubmitError('Please provide a reason for rejection.');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        approvalStatus,
        satisfactionRating: Number(satisfactionRating),
        feedback: feedbackText.trim(),
        rejectionReason: approvalStatus === 'REJECTED' ? rejectionReason.trim() : undefined,
        approvedBy: currentUser?._id,
        approvedByName: currentUser?.name,
      };

      const response = await managementService.recordResidentApproval(complaintId, payload);
      if (response.success) {
        setSubmitStatus('Your response has been recorded.');
        setFeedbackText('');
        setRejectionReason('');
        setApprovalStatus('ACCEPTED');
        const refreshed = await complaintService.getComplaintById(complaintId);
        if (refreshed.success) {
          setComplaint(refreshed.data);
        }
      } else {
        setSubmitError(response.error || 'Unable to submit your response.');
      }
    } catch (err) {
      console.error('Resident approval submit error:', err);
      setSubmitError('Unable to submit your response.');
    } finally {
      setActionLoading(false);
    }
  };

  const renderStatus = () => {
    const statusLabel = complaint?.status?.replace(/_/g, ' ') || 'Unknown';
    return (
      <div className="rounded-none border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">Current complaint status</p>
        <p className="mt-2 text-sm font-semibold text-slate-900">{statusLabel}</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header showAuth={true} />
        <div className="mx-auto max-w-7xl p-6 md:p-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mb-4 inline-block">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"></div>
              </div>
              <p className="text-sm text-slate-600">Loading complaint details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !complaint) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header showAuth={true} />
        <div className="mx-auto max-w-7xl p-6 md:p-8">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">{error}</p>
            <button
              onClick={handleBack}
              className="mt-3 inline-flex items-center gap-2 border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!complaint) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header showAuth={true} />
      <div className="mx-auto max-w-6xl p-6 md:p-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Complaint Reference</p>
            <h1 className="text-2xl font-semibold text-slate-900">{complaint.complaintId || complaint.title}</h1>
            <p className="mt-1 text-sm text-slate-600">{complaint.title}</p>
          </div>
          <button
            onClick={handleBack}
            className="inline-flex items-center rounded-none border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Back
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-none border border-slate-200 bg-white p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Category</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{complaint.category}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Urgency</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{complaint.urgency}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Location</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{complaint.location}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Submitted</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{new Date(complaint.createdAt).toLocaleDateString('en-GB')}</p>
                </div>
              </div>
              <div className="mt-6">
                <p className="text-xs uppercase tracking-wide text-slate-500">Description</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-700">{complaint.description}</p>
              </div>
            </div>

            {complaint.attachments?.[0]?.url && (
              <div className="rounded-none border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-3">Attachment</p>
                <img
                  src={complaint.attachments[0].url}
                  alt="Complaint attachment"
                  className="w-full max-h-96 object-contain"
                />
              </div>
            )}

            {complaint.tasks?.length > 0 && (
              <div className="rounded-none border border-slate-200 bg-white p-6">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-4">Tasks</p>
                <div className="space-y-4">
                  {complaint.tasks.map((task) => (
                    <div key={task._id} className="rounded-none border border-slate-100 p-4">
                      <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                      <p className="mt-1 text-xs text-slate-500">Status: {task.status.replace(/_/g, ' ')}</p>
                      {task.description && <p className="mt-2 text-sm text-slate-700">{task.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {renderStatus()}

            <div className="rounded-none border border-slate-200 bg-white p-6">
              <p className="text-sm font-semibold text-slate-900 mb-3">Approval request</p>
              {residentValidation.isPending && !residentValidation.status ? (
                <div className="space-y-4">
                  <div className="rounded-none border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Requested at</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{new Date(residentValidation.requestedAt).toLocaleString('en-GB')}</p>
                  </div>
                  {residentValidation.requestMessage && (
                    <div className="rounded-none border border-slate-100 bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Message</p>
                      <p className="mt-2 text-sm text-slate-700 whitespace-pre-line">{residentValidation.requestMessage}</p>
                    </div>
                  )}
                  {canRespond ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700">Decision</label>
                        <select
                          value={approvalStatus}
                          onChange={(e) => setApprovalStatus(e.target.value)}
                          className="mt-2 block w-full rounded-none border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                        >
                          <option value="ACCEPTED">Accept</option>
                          <option value="REJECTED">Request Rework</option>
                          <option value="PARTIAL">Partial Acceptance</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-slate-700">Satisfaction rating</label>
                        <select
                          value={satisfactionRating}
                          onChange={(e) => setSatisfactionRating(Number(e.target.value))}
                          className="mt-2 block w-full rounded-none border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                        >
                          {[5, 4, 3, 2, 1].map((value) => (
                            <option key={value} value={value}>{value} / 5</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-slate-700">Comments</label>
                        <textarea
                          rows={4}
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                          className="mt-2 block w-full rounded-none border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                          placeholder="Optional comments about the completed work"
                        />
                      </div>

                      {approvalStatus === 'REJECTED' && (
                        <div>
                          <label className="text-sm font-medium text-slate-700">Why do you need rework?</label>
                          <textarea
                            rows={3}
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="mt-2 block w-full rounded-none border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                            placeholder="Please describe the issue so work can be corrected"
                          />
                        </div>
                      )}

                      {submitError && <p className="text-sm text-rose-600">{submitError}</p>}
                      {submitStatus && <p className="text-sm text-emerald-700">{submitStatus}</p>}

                      <button
                        type="button"
                        onClick={handleSubmitResidentApproval}
                        disabled={actionLoading}
                        className="mt-3 inline-flex w-full items-center justify-center rounded-none bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#16304f] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {actionLoading ? 'Submitting...' : 'Submit response'}
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-none border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
                      {isSubmitter ? (
                        <p>Only the original submitter can respond to this approval request.</p>
                      ) : (
                        <p>You do not have permission to respond to this request.</p>
                      )}
                    </div>
                  )}
                </div>
              ) : residentValidation.status ? (
                <div className="space-y-4">
                  <div className="rounded-none border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Response status</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{residentValidation.status}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-none border border-slate-100 bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Rating</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{residentValidation.satisfactionRating}/5</p>
                    </div>
                    <div className="rounded-none border border-slate-100 bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Submitted</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{new Date(residentValidation.completedAt).toLocaleString('en-GB')}</p>
                    </div>
                  </div>
                  {residentValidation.feedback && (
                    <div className="rounded-none border border-slate-100 bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Comments</p>
                      <p className="mt-2 text-sm text-slate-700 whitespace-pre-line">{residentValidation.feedback}</p>
                    </div>
                  )}
                  {residentValidation.status === 'REJECTED' && residentValidation.rejectionReason && (
                    <div className="rounded-none border border-rose-100 bg-rose-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-rose-700">Rejection reason</p>
                      <p className="mt-2 text-sm text-rose-800">{residentValidation.rejectionReason}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-none border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
                  No resident approval request is currently pending for this complaint.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
