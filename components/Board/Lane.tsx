import styles from './Board.module.css';
import { TaskCard } from './TaskCard';

export function Lane({ title, tasks, members, canEdit, onDragStart, onDrop, onTaskClick, onNewTask, matchedTaskIds, isFilteringActive }: any) {
  
  const sortedTasks = [...tasks].sort((a, b) => {
    if (!a.end_date && !b.end_date) {
      return a.name.localeCompare(b.name);
    }
    if (!a.end_date) return -1;
    if (!b.end_date) return 1;
    return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
  });

  return (
    <div 
      className={styles.laneWrapper}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
      onDrop={(e) => { e.preventDefault(); onDrop(); }}
    >
      <div className={styles.laneHeader}>
        <div className={styles.laneTitleGroup}>
          <div className={styles.statusDot} data-status={title} />
          <h3 className={styles.laneTitle}>{title.toUpperCase()}</h3>
        </div>
        <div className={styles.counter}>{tasks.length}</div>
      </div>
      
      <div className={styles.laneCards}>
        {onNewTask && canEdit && (
          <button className={styles.addTaskBtn} onClick={onNewTask}>
             <span className={styles.plusIcon}>+</span> Add new task
          </button>
        )}
        
        {sortedTasks.map(task => (
           <TaskCard 
             key={task.id} 
             task={task} 
             members={members} 
             canEdit={canEdit}
             onDragStart={() => onDragStart(task.id)}
             onClick={() => onTaskClick(task)}
             isDimmed={isFilteringActive && !matchedTaskIds.has(task.id)}
           />
        ))}
      </div>
    </div>
  );
}
