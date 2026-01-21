import React, { createContext, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationContextType {
  showToast: (type: NotificationType, message: string) => void;
  confirm: (title: string, message: string) => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<{ type: NotificationType; message: string } | null>(null);
  const [confirmation, setConfirmation] = useState<{ title: string; message: string; resolve: (val: boolean) => void } | null>(null);

  const showToast = (type: NotificationType, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const confirm = (title: string, message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmation({ title, message, resolve });
    });
  };

  const handleConfirmAction = (val: boolean) => {
    confirmation?.resolve(val);
    setConfirmation(null);
  };

  return (
    <NotificationContext.Provider value={{ showToast, confirm }}>
      {children}
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom duration-300">
          <div className={`flex items-center gap-3 px-6 py-3 rounded-lg shadow-xl border ${
            toast.type === 'success' ? 'bg-white border-green-100 text-green-600' :
            toast.type === 'error' ? 'bg-white border-red-100 text-red-600' :
            toast.type === 'warning' ? 'bg-white border-orange-100 text-orange-600' : 'bg-white border-blue-100 text-blue-600'
          }`}>
            <div className="shrink-0">
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
              {toast.type === 'error' && <XCircle className="w-5 h-5" />}
              {toast.type === 'warning' && <AlertCircle className="w-5 h-5" />}
              {toast.type === 'info' && <Info className="w-5 h-5" />}
            </div>
            <p className="font-semibold text-sm tracking-tight">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmation && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-gray-900">{confirmation.title}</h3>
              <button onClick={() => handleConfirmAction(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              {confirmation.message}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => handleConfirmAction(false)}
                className="flex-1 px-4 py-2.5 rounded-lg font-bold text-xs text-gray-500 uppercase tracking-wider hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleConfirmAction(true)}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};