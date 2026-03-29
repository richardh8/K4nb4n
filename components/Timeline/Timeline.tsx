import { useState, useMemo } from 'react';
import { format, differenceInDays, addDays, startOfDay } from 'date-fns';
import styles from './Timeline.module.css';

export function Timeline({ tasks, members, onTaskClick, matchedTaskIds, isFilteringActive }: any) {
  const [scale, setScale] = useState<'DAY' | 'WEEK' | 'MONTH'>('WEEK');

  const { minDate, maxDate, dateColumns } = useMemo(() => {
    let min = new Date();
    let max = new Date();

    tasks.forEach((t: any) => {
       if (t.start_date) {
         const sd = new Date(t.start_date);
         if (sd < min) min = sd;
       }
       if (t.end_date) {
         const ed = new Date(t.end_date);
         if (ed > max) max = ed;
       }
    });

    // Add padding to margins
    min = addDays(min, -7);
    max = addDays(max, 14);

    const cols = [];
    let curr = startOfDay(min);
    
    const step = scale === 'DAY' ? 1 : scale === 'WEEK' ? 7 : 30; 
    
    while (curr <= max) {
       cols.push(new Date(curr));
       curr = addDays(curr, step);
    }
    
    return { minDate: startOfDay(min), maxDate: startOfDay(max), dateColumns: cols };
  }, [tasks, scale]);

  const totalDays = Math.max(1, differenceInDays(maxDate, minDate));

  return (
    <div className={styles.timelineContainer}>
      <div className={styles.toolbar}>
         <div className={styles.scaleTabs}>
            {['DAY', 'WEEK', 'MONTH'].map((s: any) => (
              <button 
                key={s} 
                className={`${styles.scaleBtn} ${scale === s ? styles.scaleActive : ''}`}
                onClick={() => setScale(s)}
              >
                {s}
              </button>
            ))}
         </div>
      </div>

      <div className={styles.tableWrapper}>
         <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.frozenCol}>Task Information</th>
                {dateColumns.map((d, i) => (
                  <th key={i} className={styles.dateCol}>
                     {format(d, scale === 'MONTH' ? 'MMM yyyy' : scale === 'WEEK' ? "'W' MMM d" : 'MMM d')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.map((task: any) => {
                 const isDimmed = isFilteringActive && !matchedTaskIds.has(task.id);
                 const assignee = members.find((m: any) => m.id === task.assignee_id);
                 
                 let hasLine = false;
                 let leftPercent = 0;
                 let widthPercent = 0;
                 
                 if (task.start_date && task.end_date) {
                    hasLine = true;
                    const sd = new Date(task.start_date);
                    const ed = new Date(task.end_date);
                    const diffStart = differenceInDays(sd, minDate);
                    const diffLen = differenceInDays(ed, sd);
                    
                    leftPercent = Math.max(0, (diffStart / totalDays) * 100);
                    widthPercent = Math.min(100 - leftPercent, (Math.max(1, diffLen) / totalDays) * 100);
                 } else if (task.end_date) {
                    hasLine = true;
                    const ed = new Date(task.end_date);
                    const diffStart = differenceInDays(ed, minDate);
                    leftPercent = Math.max(0, (diffStart / totalDays) * 100);
                    widthPercent = 0; // Dot
                 } else if (task.start_date) {
                    hasLine = true;
                    const sd = new Date(task.start_date);
                    const diffStart = differenceInDays(sd, minDate);
                    leftPercent = Math.max(0, (diffStart / totalDays) * 100);
                    widthPercent = 0; // Dot
                 }

                 return (
                   <tr 
                     key={task.id} 
                     className={`${styles.row} ${isDimmed ? styles.dimmedRow : ''}`}
                     onClick={() => onTaskClick(task)}
                   >
                     <td className={styles.frozenCol}>
                        <div className={styles.taskInfo}>
                          <div className={styles.taskHeader}>
                            <span className={styles.statusBadge} data-status={task.status}>{task.status}</span>
                            <span className={styles.priorityBadge} data-priority={task.priority}>{task.priority}</span>
                          </div>
                          <div className={styles.taskName}>{task.name}</div>
                          <div className={styles.taskMeta}>
                             {assignee ? <span className={styles.assignee} style={{ color: assignee.color }}>{assignee.name}</span> : <span className={styles.unassigned}>Unassigned</span>}
                             
                             <div className={styles.tags}>
                                {(() => {
                                  const tagList = task.tags ? (typeof task.tags === 'string' ? JSON.parse(task.tags) : task.tags) : [];
                                  return tagList.map((tag: string) => (
                                    <span key={tag} className={styles.tag}>#{tag.replace(/_/g, ' ')}</span>
                                  ));
                                })()}
                             </div>
                          </div>
                        </div>
                     </td>
                     <td colSpan={dateColumns.length} className={styles.timelineArea}>
                        {hasLine ? (
                           <div className={styles.timelineTrack}>
                              <div 
                                className={styles.timelineLine} 
                                style={{ left: `${leftPercent}%`, width: widthPercent === 0 ? '12px' : `calc(${widthPercent}% + 12px)` }}
                                data-status={task.status}
                              >
                                 <div className={styles.dotLeft} />
                                 {widthPercent > 0 && <div className={styles.dotRight} />}
                              </div>
                           </div>
                        ) : (
                           <span className={styles.noDateText}>Unscheduled</span>
                        )}
                     </td>
                   </tr>
                 );
              })}
            </tbody>
         </table>
      </div>
    </div>
  );
}
