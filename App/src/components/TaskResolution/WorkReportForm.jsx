// components/TaskResolution/WorkReportForm.jsx
import React, { useState } from 'react';
import { Plus, Trash2, Clock, Package, FileText } from 'lucide-react';
import { MATERIAL_TYPES, WORK_CATEGORIES } from '../../constants/taskConstants';

const WorkReportForm = ({ initialData, onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState({
    status: initialData?.status || 'in-progress',
    actionsTaken: initialData?.actionsTaken || '',
    materialsUsed: initialData?.materialsUsed || [{ name: '', quantity: 1, cost: 0 }],
    hoursSpent: initialData?.hoursSpent || '',
    notes: initialData?.notes || '',
    category: initialData?.category || 'Repair'
  });

  const addMaterial = () => {
    setFormData(prev => ({
      ...prev,
      materialsUsed: [...prev.materialsUsed, { name: '', quantity: 1, cost: 0 }]
    }));
  };

  const removeMaterial = (index) => {
    setFormData(prev => ({
      ...prev,
      materialsUsed: prev.materialsUsed.filter((_, i) => i !== index)
    }));
  };

  const updateMaterial = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      materialsUsed: prev.materialsUsed.map((mat, i) => 
        i === index ? { ...mat, [field]: value } : mat
      )
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Status Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Update Status <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, status: 'in-progress' }))}
            className={`py-2.5 px-4 rounded-lg border-2 transition-all ${
              formData.status === 'in-progress'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            In Progress
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, status: 'resolved' }))}
            className={`py-2.5 px-4 rounded-lg border-2 transition-all ${
              formData.status === 'resolved'
                ? 'border-[#006837] bg-[#E8F5E9] text-[#006837]'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            Resolved
          </button>
        </div>
      </div>

      {/* Work Category */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Work Category
        </label>
        <select
          value={formData.category}
          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#006837] focus:border-transparent outline-none"
        >
          {WORK_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Actions Taken */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Actions Taken <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.actionsTaken}
          onChange={(e) => setFormData(prev => ({ ...prev, actionsTaken: e.target.value }))}
          rows={3}
          placeholder="Describe what work was done..."
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#006837] focus:border-transparent outline-none resize-none"
          required
        />
      </div>

      {/* Hours Spent */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          <div className="flex items-center gap-2">
            <Clock size={16} />
            Hours Spent <span className="text-red-500">*</span>
          </div>
        </label>
        <input
          type="number"
          step="0.5"
          value={formData.hoursSpent}
          onChange={(e) => setFormData(prev => ({ ...prev, hoursSpent: parseFloat(e.target.value) }))}
          placeholder="e.g., 2.5"
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#006837] focus:border-transparent outline-none"
          required
        />
      </div>

      {/* Materials Used */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          <div className="flex items-center gap-2">
            <Package size={16} />
            Materials Used
          </div>
        </label>
        <div className="space-y-3">
          {formData.materialsUsed.map((material, index) => (
            <div key={index} className="flex gap-2 items-center">
              <select
                value={material.name}
                onChange={(e) => updateMaterial(index, 'name', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#006837] outline-none text-sm"
              >
                <option value="">Select material</option>
                {MATERIAL_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Qty"
                value={material.quantity}
                onChange={(e) => updateMaterial(index, 'quantity', parseInt(e.target.value))}
                className="w-20 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#006837] outline-none text-sm"
              />
              <input
                type="number"
                placeholder="Cost (UGX)"
                value={material.cost}
                onChange={(e) => updateMaterial(index, 'cost', parseFloat(e.target.value))}
                className="w-28 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#006837] outline-none text-sm"
              />
              {formData.materialsUsed.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMaterial(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addMaterial}
            className="flex items-center gap-2 text-sm text-[#006837] hover:text-[#005630] transition-colors"
          >
            <Plus size={16} />
            Add Material
          </button>
        </div>
      </div>

      {/* Additional Notes */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Additional Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={2}
          placeholder="Any additional information or recommendations..."
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#006837] focus:border-transparent outline-none resize-none"
        />
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-3 bg-[#006837] text-white rounded-lg font-semibold hover:bg-[#005630] transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <FileText size={18} />
              Submit Work Report
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default WorkReportForm;