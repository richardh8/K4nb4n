import { format } from 'date-fns';
import styles from './Board.module.css';

export function TaskCard({ task, members, canEdit, onDragStart, onClick, isDimmed }: any) {
  const assignee = members.find((m: any) => m.id === task.assignee_id);
  
  const formatDateRange = () => {
     if (task.start_date && task.end_date) {
        return `${format(new Date(task.start_date), 'MMM d')} - ${format(new Date(task.end_date), 'MMM d')}`;
     }
     if (task.end_date) return `Due ${format(new Date(task.end_date), 'MMM d')}`;
     if (task.start_date) return `Starts ${format(new Date(task.start_date), 'MMM d')}`;
     return null;
  };

  const datesStr = formatDateRange();

  return (
    <div 
      className={`${styles.card} ${isDimmed ? styles.dimmedCard : ''}`}
      draggable={canEdit}
      onDragStart={(e) => {
         e.dataTransfer.effectAllowed = 'move';
         onDragStart();
      }}
      onClick={onClick}
    >
      <div className={styles.cardTop}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
           <span className={styles.taskIdLabel}>
             TASK-ID-{task.task_num?.toString().padStart(6, '0')}
           </span>
           <span className={styles.priorityLabel} data-priority={task.priority}>
             {task.priority}
           </span>
         </div>
         {datesStr && <span className={styles.dateLabel}>⏱ {datesStr}</span>}
      </div>
      
      <h4 className={styles.cardTitle}>{task.name}</h4>
      
      {task.tags && task.tags.length > 0 && (
        <div className={styles.tagList}>
          {task.tags.map((tag: string) => (
             <span key={tag} className={styles.tagBadge}>#{tag.replace(/_/g, ' ')}</span>
          ))}
        </div>
      )}

      {assignee && (
         <div className={styles.assignee}>
            <div className={styles.avatarSmall} style={{ backgroundColor: assignee.color }}>
              {assignee.name.charAt(0)}
            </div>
            <span className={styles.assigneeName}>{assignee.name}</span>
         </div>
      )}
    </div>
  );
}
