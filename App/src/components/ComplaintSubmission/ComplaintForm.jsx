// components/ComplaintSubmission/ComplaintForm.jsx
import UserInfoCard from './UserInfoCard';
import TitleInput from './TitleInput';
import DescriptionInput from './DescriptionInput';
import LocationSelector from './LocationSelector';
import CategorySelector from './CategorySelector';
import UrgencySelector from './UrgencySelector';
import ImageUploader from './ImageUploader';
import FormActions from './FormActions';

export default function ComplaintForm({
  formData,
  imageFiles,
  imagePreviews,
  errors,
  isSubmitting,
  user,
  onInputChange,
  onLocationCategoryChange,
  onImagesChange,
  onRemoveImage,
  onClear,
  onSubmit
}) {
  return (
    <form onSubmit={onSubmit}>
      <div className="p-6 md:p-8">
        <UserInfoCard user={user} />
        
        <TitleInput
          value={formData.title}
          onChange={onInputChange}
          error={errors.title}
        />
        
        <DescriptionInput
          value={formData.description}
          onChange={onInputChange}
          error={errors.description}
        />
        
        <LocationSelector
          locationCategory={formData.locationCategory}
          specificLocation={formData.specificLocation}
          onCategoryChange={onLocationCategoryChange}
          onLocationChange={onInputChange}
          errors={errors}
        />
        
        <CategorySelector
          selectedCategory={formData.category}
          onChange={(value) => onInputChange({ target: { name: 'category', value } })}
          error={errors.category}
        />
        
        <UrgencySelector
          selectedUrgency={formData.urgency}
          onChange={(value) => onInputChange({ target: { name: 'urgency', value } })}
          error={errors.urgency}
        />
        
        <ImageUploader
          images={imageFiles}
          previews={imagePreviews}
          onImagesChange={onImagesChange}
          onRemoveImage={onRemoveImage}
        />
      </div>
      
      <FormActions
        isSubmitting={isSubmitting}
        onClear={onClear}
        onSubmit={onSubmit}
      />
    </form>
  );
};