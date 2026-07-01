import { useState, useMemo, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function WorkReportModal({ isOpen, onClose, onSubmit, taskId, taskTitle }) {
  const [actionsTaken, setActionsTaken] = useState('');
  const [materialsUsed, setMaterialsUsed] = useState([]);
  const [currentMaterial, setCurrentMaterial] = useState('');
  const [hoursSpent, setHoursSpent] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [images, setImages] = useState([]);

  const imagePreviews = useMemo(
    () => images.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    [images]
  );

  useEffect(() => {
    return () => {
      imagePreviews.forEach(({ preview }) => URL.revokeObjectURL(preview));
    };
  }, [imagePreviews]);

  const addMaterial = () => {
    if (currentMaterial.trim()) {
      setMaterialsUsed([...materialsUsed, currentMaterial.trim()]);
      setCurrentMaterial('');
    }
  };

  const removeMaterial = (index) => {
    setMaterialsUsed(materialsUsed.filter((_, i) => i !== index));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) {
      setImages((prev) => [...prev, ...files].slice(0, 5));
    }
    e.target.value = null;
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      actionsTaken,
      materialsUsed,
      hoursSpent: parseFloat(hoursSpent),
      additionalNotes,
      images,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-[#e2e8f0] p-6 flex items-start justify-between">
                <div>
                  <h2 className="font-bold text-[#1e2937]" style={{ fontFamily: 'Merriweather, serif', fontSize: '24px' }}>
                    Work Report - {taskId}
                  </h2>
                  <p className="text-[#475569] mt-1" style={{ fontSize: '14px' }}>
                    {taskTitle}
                  </p>
                </div>
                <button onClick={onClose} className="text-[#94a3b8] hover:text-[#475569]">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-[#1e2937] mb-2" style={{ fontSize: '14px', fontWeight: 500 }}>
                    Actions Taken <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    id="actionsTaken"
                    name="actionsTaken"
                    required
                    value={actionsTaken}
                    onChange={(e) => setActionsTaken(e.target.value)}
                    maxLength={500}
                    rows={4}
                    className="w-full border border-[#e2e8f0] p-3 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                    placeholder="Describe the work performed..."
                    style={{ fontSize: '14px' }}
                  />
                  <div className="text-right text-[#94a3b8] mt-1" style={{ fontSize: '12px' }}>
                    {actionsTaken.length}/500
                  </div>
                </div>

                <div>
                  <label className="block text-[#1e2937] mb-2" style={{ fontSize: '14px', fontWeight: 500 }}>
                    Materials Used <span className="text-red-600">*</span>
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      id="currentMaterial"
                      name="currentMaterial"
                      type="text"
                      value={currentMaterial}
                      onChange={(e) => setCurrentMaterial(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMaterial())}
                      className="flex-1 border border-[#e2e8f0] p-3 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                      placeholder="Enter material name"
                      style={{ fontSize: '14px' }}
                    />
                    <button
                      type="button"
                      onClick={addMaterial}
                      className="px-4 bg-[#1e3a5f] text-white hover:bg-[#2d4a6f] transition-colors flex items-center gap-2"
                      style={{ fontSize: '14px' }}
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {materialsUsed.map((material, index) => (
                      <span
                        key={index}
                        className="bg-[#eef2f7] text-[#1e3a5f] px-3 py-1 flex items-center gap-2"
                        style={{ fontSize: '14px' }}
                      >
                        {material}
                        <button
                          type="button"
                          onClick={() => removeMaterial(index)}
                          className="text-[#475569] hover:text-[#1e2937]"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[#1e2937] mb-2" style={{ fontSize: '14px', fontWeight: 500 }}>
                    Hours Spent <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="hoursSpent"
                    name="hoursSpent"
                    type="number"
                    required
                    step="0.5"
                    min="0"
                    value={hoursSpent}
                    onChange={(e) => setHoursSpent(e.target.value)}
                    className="w-full border border-[#e2e8f0] p-3 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                    placeholder="0.0 hours"
                    style={{ fontSize: '14px' }}
                  />
                </div>

                <div>
                  <label className="block text-[#1e2937] mb-2" style={{ fontSize: '14px', fontWeight: 500 }}>
                    Attach Images (optional)
                  </label>
                  <input
                    id="taskImages"
                    name="taskImages"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="w-full text-sm text-slate-600"
                    style={{ fontSize: '14px' }}
                  />
                  {images.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      {imagePreviews.map((item, index) => (
                        <div key={index} className="relative border border-[#e2e8f0] rounded overflow-hidden">
                          <img
                            src={item.preview}
                            alt={`Preview ${index + 1}`}
                            className="h-24 w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 rounded-full bg-white/90 p-1 text-[#475569] hover:text-[#1e2937]"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[#1e2937] mb-2" style={{ fontSize: '14px', fontWeight: 500 }}>
                    Additional Notes (optional)
                  </label>
                  <textarea
                    id="additionalNotes"
                    name="additionalNotes"
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    rows={2}
                    className="w-full border border-[#e2e8f0] p-3 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                    placeholder="Any additional information..."
                    style={{ fontSize: '14px' }}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={!actionsTaken || materialsUsed.length === 0 || !hoursSpent}
                    className="flex-1 px-6 py-3 bg-[#059669] text-white hover:bg-[#047857] disabled:bg-[#cbd5e1] disabled:cursor-not-allowed transition-colors"
                    style={{ fontSize: '14px', fontWeight: 500 }}
                  >
                    Resolve Task
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 border border-[#e2e8f0] text-[#475569] hover:bg-[#f8fafc] transition-colors"
                    style={{ fontSize: '14px', fontWeight: 500 }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
