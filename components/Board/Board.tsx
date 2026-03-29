import { useState } from 'react';
import styles from './Board.module.css';
import { Lane } from './Lane';

const LANES = ['Backlog', 'To Do', 'Doing', 'Done'];

export function Board({ tasks, members, canEdit, onTaskUpdate, onTaskClick, onNewTask, matchedTaskIds, isFilteringActive }: any) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const handleDragStart = (id: string) => {
    if (!canEdit) return;
    setDraggedTaskId(id);
  };

  const handleDrop = (status: string) => {
    if (!draggedTaskId || !canEdit) return;
    const task = tasks.find((t: any) => t.id === draggedTaskId);
    if (task && task.status !== status) {
      onTaskUpdate(draggedTaskId, { status });
    }
    setDraggedTaskId(null);
  };

  return (
    <div className={styles.boardContainer}>
       {LANES.map(lane => (
         <Lane 
           key={lane} 
           title={lane} 
           tasks={tasks.filter((t: any) => t.status === lane)} 
           members={members}
           canEdit={canEdit}
           onDragStart={handleDragStart}
           onDrop={() => handleDrop(lane)}
           onTaskClick={onTaskClick}
           onNewTask={lane === 'Backlog' ? onNewTask : undefined}
           matchedTaskIds={matchedTaskIds}
           isFilteringActive={isFilteringActive}
         />
       ))}
    </div>
  );
}
