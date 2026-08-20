import { AlertTriangle } from 'lucide-react';

function ConfirmDialog({ title, message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-2xl shadow-lg max-w-sm w-full p-6">
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="text-red-600" size={22} />
        </div>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <p className="text-gray-500 text-sm mt-1">{message}</p>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;