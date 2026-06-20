// frontend/src/utils/validation.js
export const validateEmail = (email) => {
  return email.endsWith('@mak.ac.ug') && email.includes('@');
};

export const calculatePasswordStrength = (password) => {
  if (!password || password.length === 0) return 'Weak';
  
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
  
  if (strength >= 4) return 'Strong';
  if (strength >= 2) return 'Medium';
  return 'Weak';
};

export const validatePassword = (password) => {
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return {
    isValid: hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar,
    criteria: {
      minLength: hasMinLength,
      upperCase: hasUpperCase,
      lowerCase: hasLowerCase,
      number: hasNumber,
      specialChar: hasSpecialChar,
    }
  };
};

export const validateRegistrationForm = (values) => {
  const errors = {};

  if (!values.fullName?.trim()) {
    errors.fullName = 'Full name is required';
  } else if (values.fullName.length < 2 || values.fullName.length > 50) {
    errors.fullName = 'Name must be between 2 and 50 characters';
  } else if (!/^[a-zA-Z\s]+$/.test(values.fullName)) {
    errors.fullName = 'Name can only contain letters and spaces';
  }

  if (!values.email) {
    errors.email = 'Email is required';
  } else if (!validateEmail(values.email)) {
    errors.email = 'Email must be a valid @mak.ac.ug address';
  }

  if (!values.role) {
    errors.role = 'Please select a role';
  }

  if (values.role === 'Technician') {
    if (!values.specialization?.trim()) {
      errors.specialization = 'Specialization is required for technicians';
    }
    if (!values.zone?.trim()) {
      errors.zone = 'Zone is required for technicians';
    }
  }

  if (!values.phoneNumber) {
    errors.phoneNumber = 'Phone number is required';
  } else if (!/^07\d{8}$/.test(values.phoneNumber.replace(/\s/g, ''))) {
    errors.phoneNumber = 'Phone number must start with 07 and be 10 digits';
  }

  if (!values.password) {
    errors.password = 'Password is required';
  } else {
    const passwordValidation = validatePassword(values.password);
    if (!passwordValidation.isValid) {
      if (!passwordValidation.criteria.minLength) {
        errors.password = 'Password must be at least 8 characters';
      } else if (!passwordValidation.criteria.upperCase) {
        errors.password = 'Password must contain at least one uppercase letter';
      } else if (!passwordValidation.criteria.number) {
        errors.password = 'Password must contain at least one number';
      } else if (!passwordValidation.criteria.specialChar) {
        errors.password = 'Password must contain at least one special character';
      } else {
        errors.password = 'Password must meet all requirements';
      }
    }
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
};