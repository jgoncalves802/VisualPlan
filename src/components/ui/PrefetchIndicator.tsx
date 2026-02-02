import React, { useEffect, useState } from 'react';
import { subscribeToPrefetchStatus } from '../../services/prefetchService';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface PrefetchStatus {
  isLoading: boolean;
  progress: number;
  message: string;
  error: string | null;
}

export const PrefetchIndicator: React.FC = () => {
  const [status, setStatus] = useState<PrefetchStatus>({
    isLoading: false,
    progress: 0,
    message: '',
    error: null,
  });
  const [visible, setVisible] = useState(false);
  const [shouldHide, setShouldHide] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToPrefetchStatus((newStatus) => {
      setStatus(newStatus);
      
      if (newStatus.isLoading) {
        setVisible(true);
        setShouldHide(false);
      } else if (newStatus.progress === 100) {
        setTimeout(() => setShouldHide(true), 2000);
        setTimeout(() => setVisible(false), 2500);
      }
    });
    
    return () => { unsubscribe(); };
  }, []);

  if (!visible) return null;

  return (
    <div 
      className={`fixed bottom-4 right-4 rounded-lg shadow-lg p-4 min-w-[280px] z-50 transition-all duration-500 ${
        shouldHide ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
      }`}
      style={{ backgroundColor: 'var(--color-surface)' }}
    >
      <div className="flex items-center gap-3">
        {status.isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
        ) : status.error ? (
          <XCircle className="w-5 h-5 text-red-500" />
        ) : (
          <CheckCircle className="w-5 h-5 text-green-500" />
        )}
        
        <div className="flex-1">
          <p className="text-sm font-medium theme-text">{status.message}</p>
          
          {status.isLoading && (
            <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
              <div 
                className="h-full bg-blue-500 transition-all duration-300 ease-out"
                style={{ width: `${status.progress}%` }}
              />
            </div>
          )}
          
          {status.error && (
            <p className="text-xs text-red-500 mt-1">{status.error}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrefetchIndicator;
