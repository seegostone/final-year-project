// components/ComplaintSubmission/ComplaintSubmission.jsx
import { Building } from 'lucide-react';
import { useComplaintSubmission } from '../../hooks/useComplaintSubmission';
import ComplaintForm from './ComplaintForm';
import SubmissionSuccess from './SubmissionSuccess';

// Mock user data - This would come from your auth context
const currentUser = {
  name: 'John Doe',
  email: 'john.doe@mak.ac.ug',
  role: 'Resident Staff'
};

const ComplaintSubmission = () => {
  const {
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
  } = useComplaintSubmission(currentUser);

  // Show success screen if complaint submitted
  if (submittedComplaint) {
    return (
      <SubmissionSuccess
        complaint={submittedComplaint}
        onNewComplaint={resetSubmission}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-2xl mb-4">
            <Building size={32} className="text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Submit a Maintenance Complaint</h1>
          <p className="text-gray-500 mt-2">
            Report issues to Makerere University Estates and Works Department
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <ComplaintForm
            formData={formData}
            imageFiles={imageFiles}
            imagePreviews={imagePreviews}
            errors={errors}
            isSubmitting={isSubmitting}
            user={currentUser}
            onInputChange={handleInputChange}
            onLocationCategoryChange={handleLocationCategoryChange}
            onImagesChange={handleImagesChange}
            onRemoveImage={handleRemoveImage}
            onClear={handleClearForm}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
};

export default ComplaintSubmission;