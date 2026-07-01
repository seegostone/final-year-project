import { useState, useMemo, useEffect } from 'react';
import { X, Plus, ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function WorkReportModal({ isOpen, onClose, onSubmit, submitting = false, taskId, taskTitle }) {
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

  const isSubmitDisabled = !actionsTaken.trim() || materialsUsed.length === 0 || !hoursSpent;
  const uploadHint = images.length >= 5 ? 'Maximum 5 images attached' : `${5 - images.length} image(s) left`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/40 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 rounded-none"
          >
            <div className="bg-white w-full max-w-[900px] h-[90vh] overflow-hidden border border-slate-200 shadow-none rounded-none"
                 style={{ borderRadius: 0 }}>
              <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-6 py-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Work Report</p>
                  <h2 className="text-2xl font-semibold text-slate-900" style={{ fontFamily: 'Merriweather, serif' }}>
                    {taskId}
                  </h2>
                  <p className="text-sm text-slate-600">{taskTitle}</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-none border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                  aria-label="Close work report modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
                <div className="border-t border-slate-200 bg-white p-5">
                  <p className="text-sm text-slate-600">
                    Add a summary of the work performed, note materials used, and attach up to 5 images. Required fields are marked with <span className="font-semibold">*</span>.
                  </p>
                </div>

                <div className="grid gap-6">
                  <div className="grid gap-3">
                    <label htmlFor="actionsTaken" className="text-sm font-medium text-slate-900">
                      Actions Taken <span className="text-rose-600">*</span>
                    </label>
                    <textarea
                      id="actionsTaken"
                      name="actionsTaken"
                      required
                      value={actionsTaken}
                      onChange={(e) => setActionsTaken(e.target.value)}
                      maxLength={500}
                      rows={5}
                      className="w-full rounded-none border border-slate-200 bg-white p-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-300"
                      placeholder="Describe the work performed..."
                    />
                    <div className="text-right text-xs text-slate-500">{actionsTaken.length}/500</div>
                  </div>

                  <div className="grid gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <label htmlFor="currentMaterial" className="text-sm font-medium text-slate-900">
                        Materials Used <span className="text-rose-600">*</span>
                      </label>
                      <span className="text-xs text-slate-500">Press Enter or Add</span>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <input
                        id="currentMaterial"
                        name="currentMaterial"
                        type="text"
                        value={currentMaterial}
                        onChange={(e) => setCurrentMaterial(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMaterial())}
                        className="flex-1 rounded-none border border-slate-200 bg-white p-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-300"
                        placeholder="Enter material name"
                      />
                      <button
                        type="button"
                        onClick={addMaterial}
                        className="inline-flex items-center justify-center rounded-none bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {materialsUsed.map((material, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => removeMaterial(index)}
                          className="inline-flex items-center gap-2 rounded-none border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700 transition hover:border-slate-300"
                        >
                          <span>{material}</span>
                          <X className="h-3.5 w-3.5 text-slate-500" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-sm font-medium text-slate-900">Attach Images (optional)</label>
                      <span className="text-xs text-slate-500">{uploadHint}</span>
                    </div>
                    <div className="border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-center">
                      <label
                        htmlFor="taskImages"
                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-none border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        <ImageIcon className="h-4 w-4" />
                        Choose images
                      </label>
                      <input
                        id="taskImages"
                        name="taskImages"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <p className="mt-3 text-sm text-slate-500">
                        Drag and drop or click to select up to 5 photos for task evidence.
                      </p>
                    </div>
                    {images.length > 0 ? (
                      <div className="grid grid-cols-3 gap-3">
                        {imagePreviews.map((item, index) => (
                          <div key={index} className="relative overflow-hidden border border-slate-200 bg-slate-100">
                            <img src={item.preview} alt={`Preview ${index + 1}`} className="h-28 w-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-none bg-white/90 text-slate-600 transition hover:bg-white"
                              aria-label={`Remove image ${index + 1}`}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-none border border-slate-200 bg-white p-4 text-sm text-slate-600">
                        No images attached yet.
                      </div>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[1fr_0.6fr]">
                    <div className="grid gap-3">
                      <label htmlFor="hoursSpent" className="text-sm font-medium text-slate-900">
                        Hours Spent <span className="text-rose-600">*</span>
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
                        className="w-full rounded-none border border-slate-200 bg-white p-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-300"
                        placeholder="0.0 hours"
                      />
                    </div>
                    <div className="grid gap-3">
                      <label className="text-sm font-medium text-slate-900">Status</label>
                      <div className="border border-slate-200 bg-slate-100 px-4 py-4 text-sm text-slate-700">
                        {materialsUsed.length > 0 ? 'Ready to resolve' : 'Add materials to proceed'}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <label htmlFor="additionalNotes" className="text-sm font-medium text-slate-900">
                      Additional Notes (optional)
                    </label>
                    <textarea
                      id="additionalNotes"
                      name="additionalNotes"
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      rows={3}
                      className="w-full rounded-none border border-slate-200 bg-white p-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-300"
                      placeholder="Any additional information..."
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="submit"
                    disabled={submitting || isSubmitDisabled}
                    className="flex-1 rounded-none bg-slate-900 px-6 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Resolving...' : 'Resolve Task'}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={submitting}
                    className="rounded-none border border-slate-200 bg-white px-6 py-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed"
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
