import { useState, useEffect } from 'react';

export function useLiteMode() {
  const [isLiteMode, setIsLiteMode] = useState<boolean>(() => {
    try {
      const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (conn) {
        if (conn.saveData || ['slow-2g', '2g', '3g'].includes(conn.effectiveType) || conn.rtt > 500 || conn.downlink < 1.5) {
          return true;
        }
      }
    } catch (e) {}
    return false;
  });

  useEffect(() => {
    try {
      const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (conn) {
        const updateConnectionStatus = () => {
          const isSlow = conn.saveData || ['slow-2g', '2g', '3g'].includes(conn.effectiveType) || conn.rtt > 500 || conn.downlink < 1.5;
          setIsLiteMode(!!isSlow);
        };
        conn.addEventListener('change', updateConnectionStatus);
        return () => conn.removeEventListener('change', updateConnectionStatus);
      }
    } catch (e) {}
  }, []);

  return { isLiteMode };
}
