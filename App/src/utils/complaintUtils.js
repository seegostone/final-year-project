// utils/complaintUtils.js
export const generateTrackingId = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CMS-${year}-${random}`;
};

export const validateComplaintForm = (formData) => {
  const errors = {};
  
  if (!formData.title?.trim()) {
    errors.title = 'Please enter a complaint title';
  } else if (formData.title.trim().length < 5) {
    errors.title = 'Title must be at least 5 characters';
  }
  
  if (!formData.description?.trim()) {
    errors.description = 'Please describe the issue';
  } else if (formData.description.trim().length < 10) {
    errors.description = 'Please provide more details (min 10 characters)';
  }
  
  if (!formData.locationCategory) {
    errors.locationCategory = 'Please select a location type';
  }
  
  if (!formData.specificLocation?.trim()) {
    errors.specificLocation = 'Please specify the exact location';
  }
  
  if (!formData.category) {
    errors.category = 'Please select an issue category';
  }
  
  if (!formData.urgency) {
    errors.urgency = 'Please select urgency level';
  }
  
  return errors;
};