import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { ComplaintDetailDrawer } from '../components/estates/ComplaintDetailDrawer';
import complaintService from '../services/complaintsApi';
import managementService from '../services/managementApi';
import authService from '../services/api';

export function ComplaintDetailPage() {
  const { complaintId } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const normalizeRole = (role = '') =>
    String(role).trim().toLowerCase().replace(/\s+/g, '_');

  const canFetchTechnicians = ['admin', 'estates_officer', 'technician'].includes(
    normalizeRole(authService.getUserRole())
  );

  // Fetch complaint details
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

  // Fetch technicians list only when current role can access it
  useEffect(() => {
    if (!canFetchTechnicians) {
      return;
    }

    const fetchTechnicians = async () => {
      try {
        const result = await managementService.getTechnicians();
        if (result.success) {
          setTechnicians(result.data || []);
        }
      } catch (err) {
        console.error('Error fetching technicians:', err);
      }
    };

    fetchTechnicians();
  }, [canFetchTechnicians]);

  const handleClose = () => {
    navigate(-1);
  };

  const handleRefresh = (complaintId, updatedComplaint) => {
    setComplaint(updatedComplaint);
  };

  if (!complaint && loading) {
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
              onClick={handleClose}
              className="mt-3 inline-flex items-center gap-2 border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header showAuth={true} />
      <div className="mx-auto max-w-7xl p-6 md:p-8">
        {complaint && (
          <ComplaintDetailDrawer
            complaint={complaint}
            technicians={technicians}
            onClose={handleClose}
            onRefresh={handleRefresh}
          />
        )}
      </div>
    </div>
  );
}
