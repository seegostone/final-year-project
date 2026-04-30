// components/ComplaintSubmission/FormActions.jsx
import { Send, Loader } from 'lucide-react';

export default function FormActions({ isSubmitting, onClear, onSubmit }) {
  return (
    <div className="bg-gray-50 px-6 md:px-8 py-4 border-t border-gray-100">
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onClear}
          className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-colors"
        >
          Clear Form
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          onClick={onSubmit}
          className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <Loader size={20} className="animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send size={20} />
              Submit Complaint
            </>
          )}
        </button>
      </div>
      <p className="text-center text-xs text-gray-400 mt-3">
        You will receive a confirmation email with your tracking ID
      </p>
    </div>
  );
};