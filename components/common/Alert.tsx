import React from 'react';

type AlertType = 'error' | 'success' | 'info' | 'warning';

interface AlertProps {
  type?: AlertType;
  title: string;
  message?: string;
  onClose?: () => void;
}

const ICONS: Record<AlertType, JSX.Element> = {
  error: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  success: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  warning: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  info: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
};

const STYLES: Record<AlertType, { bg: string; text: string; border: string }> = {
  error: { bg: 'bg-red-900/20', text: 'text-red-400', border: 'border-red-500/50' },
  success: { bg: 'bg-green-900/20', text: 'text-green-400', border: 'border-green-500/50' },
  warning: { bg: 'bg-yellow-900/20', text: 'text-yellow-400', border: 'border-yellow-500/50' },
  info: { bg: 'bg-blue-900/20', text: 'text-blue-400', border: 'border-blue-500/50' },
};

const Alert: React.FC<AlertProps> = ({ type = 'info', title, message, onClose }) => {
  const styles = STYLES[type];

  return (
    <div className={`rounded-md ${styles.bg} p-4 border ${styles.border}`} role="alert">
      <div className="flex">
        <div className={`flex-shrink-0 ${styles.text}`}>
          {ICONS[type]}
        </div>
        <div className="ml-3">
          <h3 className={`text-sm font-medium ${styles.text}`}>{title}</h3>
          {message && <div className="mt-2 text-sm text-on-surface-variant">{message}</div>}
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={onClose}
                className={`inline-flex rounded-md p-1.5 ${styles.text} hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-primary`}
              >
                <span className="sr-only">Dismiss</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alert;
