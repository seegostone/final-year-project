// components/ComplaintSubmission/ImageUploader.jsx
import { useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { MAX_IMAGES } from '../../constants/complaintConstants';

export default function ImageUploader({ images, previews, onImagesChange, onRemoveImage }) {
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = [...images, ...files].slice(0, MAX_IMAGES);
    
    // Create preview URLs
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    
    onImagesChange(newFiles, newPreviews);
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Attach Images (Optional)
      </label>
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-indigo-400 transition-colors">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
          id="image-upload"
        />
        <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center">
          <Upload size={40} className="text-gray-400 mb-2" />
          <span className="text-indigo-600 font-medium">Click to upload</span>
          <span className="text-xs text-gray-400 mt-1">or drag and drop (Max {MAX_IMAGES} images)</span>
        </label>
      </div>
      
      {/* Image Previews */}
      {previews.length > 0 && (
        <div className="flex gap-3 mt-4 flex-wrap">
          {previews.map((preview, index) => (
            <div key={index} className="relative group">
              <img src={preview} alt={`Preview ${index + 1}`} className="w-20 h-20 object-cover rounded-lg border" />
              <button
                type="button"
                onClick={() => onRemoveImage(index)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
