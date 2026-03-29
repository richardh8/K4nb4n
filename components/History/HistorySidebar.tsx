'use client';
import { useEffect, useState, useRef } from 'react';
import { ChevronsRight, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import styles from '../../app/board/[hash]/page.module.css';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  boardHash: string;
}

export function HistorySidebar({ isOpen, onClose, boardHash }: HistorySidebarProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  const fetchHistory = (silent = false) => {
    if (!silent) setLoading(true);
    fetch(`/api/boards/${boardHash}/history`)
      .then(res => res.json())
      .then(data => {
        setHistory(data.history || []);
      })
      .catch(console.error)
      .finally(() => {
        if (!silent) setLoading(false);
      });
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
      pollInterval.current = setInterval(() => {
        fetchHistory(true);
      }, 3000);
    } else {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
        pollInterval.current = null;
      }
    }

    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, [isOpen, boardHash]);

  const renderValue = (val: any) => {
    if (Array.isArray(val)) {
      if (val.length === 0) return 'empty';
      // Handle links specially
      if (val[0] && typeof val[0] === 'object' && 'url' in val[0]) {
        return val.map((l: any, i: number) => (
          <div key={i} className="mt-1 flex flex-col pl-2 border-l border-white/10">
            <span className="text-white/80">{l.title || 'Untitled'}</span>
            <span className="text-sky-500/60 text-[10px] truncate">{l.url}</span>
          </div>
        ));
      }
      return val.join(', ');
    }
    return String(val);
  };

  const renderDetails = (details: string | null) => {
    if (!details) return null;
    try {
      const diffs = JSON.parse(details);
      return (
        <div className={styles.historyDetails}>
          {diffs.map((diff: any, index: number) => (
            <div key={index} className={styles.diffItem}>
              {diff.taskName && (
                <div className="text-white/30 text-[9px] uppercase tracking-tighter mb-1 font-mono">
                   {diff.field.includes('todo') ? 'Task' : 'Source'}: {diff.taskName}
                   {diff.todoName && <span className="text-white/10"> / {diff.todoName}</span>}
                </div>
              )}
              <div className="flex flex-wrap items-baseline gap-x-1">
                <span className={styles.diffField}>{diff.field}</span>:
                {diff.old !== undefined && (
                  <>
                    <span className={styles.diffOld}>{renderValue(diff.old)}</span>
                    <span className="text-white/20">→</span>
                  </>
                )}
                <span className={styles.diffNew}>{renderValue(diff.new)}</span>
              </div>
            </div>
          ))}
        </div>
      );
    } catch (e) {
      return <div className={styles.diffItem}>{details}</div>;
    }
  };

  return (
    <div className={`${styles.historySidebar} ${isOpen ? styles.historySidebarOpen : ''}`}>
      <div className={styles.historyHeader}>
        <h2>History</h2>
        <button className={styles.closeHistoryBtn} onClick={onClose} title="Close History">
          <ChevronsRight size={24} />
        </button>
      </div>

      <div className={styles.historyContent}>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-sky-400">
            <Loader2 className="animate-spin" size={32} />
            <span className="text-xs uppercase tracking-widest font-bold">Scanning Archive...</span>
          </div>
        ) : history.length === 0 ? (
          <div className={styles.historyEmpty}>No records found.</div>
        ) : (
          <div className={styles.historyTable}>
            {history.map((item) => (
              <div key={item.id} className={styles.historyRow}>
                <div className={styles.historyRowHeader}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={styles.historyEvent}>{item.event_name}</span>
                    <span className="text-white/10 font-bold shrink-0">&gt;</span>
                    <span 
                        className={styles.historyUser} 
                        style={{ color: item.user_color || '#38bdf8' }}
                    >
                      {item.user_name}
                    </span>
                  </div>
                  <span className={styles.historyTime}>
                    {format(new Date(item.created_at), 'HH:mm:ss')}
                  </span>
                </div>
                {renderDetails(item.details)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
