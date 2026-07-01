import { useState, useMemo, useEffect, useRef } from 'react';
import { X, Plus, ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function WorkReportModal({ isOpen, onClose, onSubmit, submitting = false, taskId, taskTitle }) {
  const [actionsTaken, setActionsTaken] = useState('');
  const [materialsUsed, setMaterialsUsed] = useState([]);
  const [currentMaterial, setCurrentMaterial] = useState('');
  const [hoursSpent, setHoursSpent] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [images, setImages] = useState([]);
  const formRef = useRef(null);

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

  // Smooth scroll to top when modal opens
  useEffect(() => {
    if (isOpen && formRef.current) {
      formRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-950/40 z-50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ 
              duration: 0.25,
              ease: [0.25, 0.1, 0.25, 1],
              opacity: { duration: 0.2 }
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white w-full max-w-[900px] h-[90vh] overflow-hidden border border-slate-200 shadow-2xl" style={{ borderRadius: 0 }}>
              <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-6 py-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <motion.p 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500"
                  >
                    Work Report
                  </motion.p>
                  <motion.h2 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                    className="text-2xl font-semibold text-slate-900" 
                    style={{ fontFamily: 'Merriweather, serif' }}
                  >
                    {taskId}
                  </motion.h2>
                  <motion.p 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm text-slate-600"
                  >
                    {taskTitle}
                  </motion.p>
                </div>
                <motion.button
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  transition={{ delay: 0.15 }}
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-11 w-11 items-center justify-center border border-slate-200 bg-slate-50 text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-300 active:scale-95"
                  aria-label="Close work report modal"
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </div>

              <form 
                ref={formRef}
                onSubmit={handleSubmit} 
                className="h-[calc(100%-120px)] overflow-y-auto px-6 py-6 space-y-6 scroll-smooth"
                style={{
                  scrollBehavior: 'smooth',
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#cbd5e1 #f1f5f9'
                }}
              >
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="border-t border-slate-200 bg-white pt-5"
                >
                  <p className="text-sm text-slate-600">
                    Add a summary of the work performed, note materials used, and attach up to 5 images. Required fields are marked with <span className="font-semibold">*</span>.
                  </p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="grid gap-3"
                >
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
                    className="w-full border border-slate-200 bg-white p-4 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-300 hover:border-slate-300"
                    placeholder="Describe the work performed..."
                  />
                  <div className="text-right text-xs text-slate-500">{actionsTaken.length}/500</div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="grid gap-3"
                >
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
                      className="flex-1 border border-slate-200 bg-white p-4 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-300 hover:border-slate-300"
                      placeholder="Enter material name"
                    />
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={addMaterial}
                      className="inline-flex items-center justify-center bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-slate-800 active:scale-95"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add
                    </motion.button>
                  </div>
                  <AnimatePresence>
                    <div className="flex flex-wrap gap-2 min-h-[40px]">
                      {materialsUsed.map((material, index) => (
                        <motion.button
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.15 }}
                          type="button"
                          onClick={() => removeMaterial(index)}
                          className="inline-flex items-center gap-2 border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-slate-200 active:scale-95"
                        >
                          <span>{material}</span>
                          <X className="h-3.5 w-3.5 text-slate-500 transition-colors duration-200 hover:text-slate-700" />
                        </motion.button>
                      ))}
                      {materialsUsed.length === 0 && (
                        <motion.span 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-sm text-slate-400 italic"
                        >
                          No materials added yet
                        </motion.span>
                      )}
                    </div>
                  </AnimatePresence>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="grid gap-3 sm:grid-cols-[1fr_0.6fr]"
                >
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
                      className="w-full border border-slate-200 bg-white p-4 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-300 hover:border-slate-300"
                      placeholder="0.0 hours"
                    />
                  </div>
                  <div className="grid gap-3">
                    <label className="text-sm font-medium text-slate-900">Status</label>
                    <div className="border border-slate-200 bg-slate-100 px-4 py-4 text-sm text-slate-700">
                      {materialsUsed.length > 0 ? '✅ Ready to resolve' : '⚠️ Add materials to proceed'}
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="grid gap-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-medium text-slate-900">Attach Images (optional)</label>
                    <motion.span 
                      key={uploadHint}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-slate-500"
                    >
                      {uploadHint}
                    </motion.span>
                  </div>
                  <motion.div 
                    whileHover={{ borderColor: '#94a3b8' }}
                    className="border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-center transition-all duration-200 hover:bg-slate-100"
                  >
                    <label
                      htmlFor="taskImages"
                      className="inline-flex cursor-pointer items-center justify-center gap-2 border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-100 hover:border-slate-400 active:scale-95"
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
                  </motion.div>
                  <AnimatePresence>
                    {images.length > 0 ? (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="grid grid-cols-3 gap-3 overflow-hidden"
                      >
                        {imagePreviews.map((item, index) => (
                          <motion.div 
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: index * 0.05 }}
                            className="relative overflow-hidden border border-slate-200 bg-slate-100 group"
                          >
                            <img src={item.preview} alt={`Preview ${index + 1}`} className="h-28 w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center bg-white/90 text-slate-600 transition-all duration-200 hover:bg-white hover:text-slate-900 opacity-0 group-hover:opacity-100"
                              aria-label={`Remove image ${index + 1}`}
                            >
                              <X className="h-4 w-4" />
                            </motion.button>
                          </motion.div>
                        ))}
                      </motion.div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border border-slate-200 bg-white p-4 text-sm text-slate-600"
                      >
                        No images attached yet.
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="grid gap-3"
                >
                  <label htmlFor="additionalNotes" className="text-sm font-medium text-slate-900">
                    Additional Notes (optional)
                  </label>
                  <textarea
                    id="additionalNotes"
                    name="additionalNotes"
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    rows={3}
                    className="w-full border border-slate-200 bg-white p-4 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-300 hover:border-slate-300"
                    placeholder="Any additional information..."
                  />
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="sticky bottom-0 left-0 z-10 bg-white border-t border-slate-200 -mx-6 px-6 py-4 backdrop-blur-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={onClose}
                      disabled={submitting}
                      className="border border-slate-200 bg-white px-6 py-4 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={!submitting && !isSubmitDisabled ? { scale: 1.02 } : {}}
                      whileTap={!submitting && !isSubmitDisabled ? { scale: 0.98 } : {}}
                      type="submit"
                      disabled={submitting || isSubmitDisabled}
                      className="flex-1 bg-slate-900 px-6 py-4 text-sm font-semibold text-white transition-all duration-200 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed active:scale-95"
                    >
                      {submitting ? (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center justify-center gap-2"
                        >
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Resolving...
                        </motion.span>
                      ) : (
                        'Resolve Task'
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}