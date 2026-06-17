import React, { useEffect } from 'react';
import { useSimulator } from '../context/SimulatorContext';
import type { ToastMessage } from '../context/SimulatorContext';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

interface ToastItemProps {
  toast: ToastMessage;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 4000); // Auto close after 4s
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 size={18} style={{ color: 'var(--accent-green)' }} />;
      case 'warning':
        return <AlertTriangle size={18} style={{ color: 'var(--accent-red)' }} />;
      case 'info':
      default:
        return <Info size={18} style={{ color: 'var(--accent-blue)' }} />;
    }
  };

  const getTypeClass = () => {
    switch (toast.type) {
      case 'success':
        return 'toast-success';
      case 'warning':
        return 'toast-warning';
      case 'info':
      default:
        return 'toast-info';
    }
  };

  return (
    <div className={`toast ${getTypeClass()}`}>
      {getIcon()}
      <span style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
      <button 
        onClick={() => onRemove(toast.id)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          padding: '2px'
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useSimulator();

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};
