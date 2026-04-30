// hooks/useComplaintSubmission.js
import { useState } from 'react';
import { validateComplaintForm } from '../utils/complaintUtils';
import { submitComplaint } from '../services/complaintServices';

export const useComplaintSubmission = (user) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    locationCategory: '',
    specificLocation: '',
    category: '',
    urgency: '',
  });
  
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedComplaint, setSubmittedComplaint] = useState(null);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleLocationCategoryChange = (value) => {
    setFormData(prev => ({ ...prev, locationCategory: value }));
    if (errors.locationCategory) {
      setErrors(prev => ({ ...prev, locationCategory: '' }));
    }
  };

  const handleImagesChange = (files, previews) => {
    setImageFiles(files);
    setImagePreviews(previews);
  };

  const handleRemoveImage = (index) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const handleClearForm = () => {
    setFormData({
      title: '',
      description: '',
      locationCategory: '',
      specificLocation: '',
      category: '',
      urgency: '',
    });
    setImageFiles([]);
    setImagePreviews([]);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateComplaintForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const complaint = await submitComplaint(formData, imageFiles, user);
      setSubmittedComplaint(complaint);
      handleClearForm();
    } catch (error) {
      console.error('Submission error:', error);
      setErrors({ submit: 'Failed to submit complaint. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetSubmission = () => {
    setSubmittedComplaint(null);
  };

  return {
    formData,
    imageFiles,
    imagePreviews,
    errors,
    isSubmitting,
    submittedComplaint,
    handleInputChange,
    handleLocationCategoryChange,
    handleImagesChange,
    handleRemoveImage,
    handleClearForm,
    handleSubmit,
    resetSubmission,
  };
};