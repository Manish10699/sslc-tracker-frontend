import { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

function Toast({ message, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-lg whitespace-nowrap">
        <CheckCircle2 size={18} className="text-emerald-400" />
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}

export default Toast;