// frontend/src/hooks/useFormValidation.js
import { useState, useCallback } from 'react';

export const useFormValidation = (initialValues, validateFn) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((field, value) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const handleBlur = useCallback((field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validate on blur
    if (validateFn) {
      const validationErrors = validateFn(values);
      if (validationErrors[field]) {
        setErrors(prev => ({ ...prev, [field]: validationErrors[field] }));
      }
    }
  }, [values, validateFn]);

  const validateForm = useCallback(() => {
    if (validateFn) {
      const validationErrors = validateFn(values);
      setErrors(validationErrors);
      return Object.keys(validationErrors).length === 0;
    }
    return true;
  }, [values, validateFn]);

  // ✅ UPDATED: Handles both array (from backend) and object formats
  const setServerErrors = useCallback((serverErrors) => {
    if (!serverErrors) return;
    
    // Handle array format from backend validation
    if (Array.isArray(serverErrors)) {
      const fieldErrors = {};
      serverErrors.forEach(err => {
        // Map backend field names to frontend field names
        const fieldMap = {
          'name': 'fullName',
          'email': 'email',
          'password': 'password',
          'role': 'role',
          'phoneNumber': 'phoneNumber'
        };
        const frontendField = fieldMap[err.path] || err.path;
        fieldErrors[frontendField] = err.msg;
      });
      setErrors(prev => ({ ...prev, ...fieldErrors }));
    } 
    // Handle object format
    else if (typeof serverErrors === 'object') {
      setErrors(prev => ({ ...prev, ...serverErrors }));
    }
  }, []);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    setIsSubmitting,
    handleChange,
    handleBlur,
    validateForm,
    setServerErrors,
    resetForm,
  };
};