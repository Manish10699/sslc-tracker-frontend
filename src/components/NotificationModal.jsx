import { Bell } from 'lucide-react';

function NotificationModal({ message, onDismiss }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-2xl shadow-lg max-w-sm w-full p-6">

        <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
          <Bell className="text-indigo-600" size={22} />
        </div>

        <h2 className="text-lg font-bold text-gray-900">
          Reminder
        </h2>

        <p className="text-gray-600 text-sm mt-2">
          {message}
        </p>

        <button
          onClick={onDismiss}
          className="w-full mt-6 bg-indigo-600 text-white font-semibold py-2.5 rounded-xl hover:bg-indigo-700"
        >
          OK
        </button>

      </div>
    </div>
  );
}

export default NotificationModal;