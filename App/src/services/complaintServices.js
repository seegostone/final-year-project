// services/complaintService.js
import { generateTrackingId } from '../utils/complaintUtils';

// Mock API call - Replace with actual API endpoint
export const submitComplaint = async (formData, imageFiles, user) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const trackingId = generateTrackingId();
  
  // Create complaint object
  const complaint = {
    id: trackingId,
    trackingId,
    ...formData,
    status: 'pending',
    submittedAt: new Date().toISOString(),
    submittedBy: {
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
  
  // In real implementation, you would:
  // 1. Upload images to cloud storage (Cloudinary, AWS S3)
  // 2. Send POST request to your backend API
  // 3. Return the response from server
  
  return complaint;
};