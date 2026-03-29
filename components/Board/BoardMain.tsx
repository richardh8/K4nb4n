'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getLocalIdentity, LocalIdentity } from '@/lib/identity';
import { Header } from '@/components/Header/Header';
import { AdvancedFilters } from '@/components/Header/AdvancedFilters';
import { Board } from '@/components/Board/Board';
import { Timeline } from '@/components/Timeline/Timeline';
import { TaskModal } from '@/components/TaskModal/TaskModal';
import { BoardInfoModal, TeamModal, AddMemberModal, BoardSettingsModal } from '@/components/Modals/BoardModals';
import { HistorySidebar } from '@/components/History/HistorySidebar';
import { Footer } from '@/components/Footer/Footer';
import { Clock } from 'lucide-react';
import styles from '../../app/board/[hash]/page.module.css';

interface BoardMainProps {
  taskNum?: string;
}

export default function BoardMain({ taskNum }: BoardMainProps) {
  const params = useParams();
  const hash = params?.hash as string;
  const router = useRouter();

  const [identity, setIdentity] = useState<LocalIdentity | null>(null);
  const [board, setBoard] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [advFilters, setAdvFilters] = useState<any>({});
  const [viewMode, setViewMode] = useState<'BOARD' | 'TIMELINE'>('BOARD');
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showBoardSettingsModal, setShowBoardSettingsModal] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const fetchBoard = () => {
    fetch(`/api/boards/${hash}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
           router.push('/?error=board_not_found');
        } else {
           setBoard(data.board);
           setMembers(data.members);
           setTasks(data.tasks);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const id = getLocalIdentity();
    setIdentity(id); 
    fetchBoard();
  }, [hash]);

  useEffect(() => {
    if (taskNum && tasks.length > 0 && !selectedTask) {
      const task = tasks.find(t => t.task_num?.toString() === taskNum);
      if (task) {
        setSelectedTask(task);
      } else {
        router.push('/?error=task_not_found');
      }
    }
  }, [taskNum, tasks]);

  const currentMember = identity ? members.find(m => m.id === identity.userId) : null;
  const isAdmin = currentMember?.role === 'ADMIN';
  const isMember = currentMember?.role === 'MEMBER';
  const canEdit = isAdmin || isMember;

  const handleNameChange = async (newName: string) => {
    if (!isAdmin) return;
    setBoard({ ...board, name: newName });
    await fetch(`/api/boards/${hash}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, userId: identity?.userId })
    });
  };

  const handleSaveBoardSettings = async (description: string) => {
    if (!isAdmin) return;
    setBoard({ ...board, description });
    await fetch(`/api/boards/${hash}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, userId: identity?.userId })
    });
    fetchBoard();
  };

  const handleDeleteBoard = async () => {
    if (!isAdmin) return;
    const res = await fetch(`/api/boards/${hash}?userId=${identity?.userId}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      router.push('/');
    }
  };

  const handleTaskUpdate = async (taskId: string, updates: any) => {
    if (!canEdit) return;
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    await fetch('/api/tasks', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, boardHash: hash, requesterId: identity?.userId, ...updates })
    });
    fetchBoard();
  };

  const handleNewTask = async () => {
    if (!canEdit || !identity) return;
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        boardHash: hash,
        requesterId: identity.userId,
        name: 'New Assigned Mission',
        description: '',
        priority: 'MEDIUM',
        assigneeId: identity.userId
      })
    });
    fetchBoard();
  };

  // Memoize search/filter logic based on constraints provided
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { matchedTaskIds, isFilteringActive } = useMemo(() => {
     let isFilteringActive = searchQuery.trim().length > 0 || Object.keys(advFilters).length > 0;
     const matched = new Set<string>();

     if (!isFilteringActive) {
        tasks.forEach(t => matched.add(t.id));
        return { matchedTaskIds: matched, isFilteringActive };
     }

     const lowerQ = searchQuery.toLowerCase();
     
     tasks.forEach(t => {
         let match = true;
         // Search Quick Text
         if (lowerQ) {
            const nameMatch = t.name.toLowerCase().includes(lowerQ);
            const assignee = members.find(m => m.id === t.assignee_id);
            const assigneeMatch = assignee && assignee.name.toLowerCase().includes(lowerQ);
            if (!nameMatch && !assigneeMatch) match = false;
         }

         // Advanced Filters
         if (match && advFilters.owners && advFilters.owners.length > 0) {
            if (!advFilters.owners.includes(t.assignee_id)) match = false;
         }
         if (match && advFilters.priority && t.priority !== advFilters.priority) match = false;
          if (match && advFilters.tags && advFilters.tags.length > 0) {
              const tagList = t.tags ? (typeof t.tags === 'string' ? JSON.parse(t.tags) : t.tags) : [];
              if (!advFilters.tags.some((tag: string) => tagList.includes(tag))) match = false;
          }
         if (match && advFilters.fromDate) {
             if (!t.start_date || new Date(t.start_date) < new Date(advFilters.fromDate)) match = false;
         }
         if (match && advFilters.toDate) {
             if (!t.end_date || new Date(t.end_date) > new Date(advFilters.toDate)) match = false;
         }
         
         if (match) matched.add(t.id);
     });

     return { matchedTaskIds: matched, isFilteringActive };
  }, [tasks, searchQuery, advFilters, members]);

  const allTags = useMemo(() => {
     const tagSet = new Set<string>();
     tasks.forEach(t => {
       if (t.tags) {
          const list = typeof t.tags === 'string' ? JSON.parse(t.tags) : t.tags;
          list.forEach((tag: string) => tagSet.add(tag));
       }
     });
     return Array.from(tagSet);
  }, [tasks]);

  if (loading) return <div className={styles.loading}>Decrypting Holonet Link...</div>;

  return (
    <div className={styles.layout}>
      <Header 
        boardName={board?.name || 'Loading...'}
        hash={hash}
        onSearch={setSearchQuery}
        onFilterToggle={() => setShowFilters(!showFilters)}
        isAdmin={isAdmin}
        onNameChange={handleNameChange}
        identityName={identity?.name || 'Guest Reader'}
        identityColor={identity?.color || '#333'}
        filtersActive={showFilters || Object.keys(advFilters).length > 0}
        onHelpToggle={() => setShowInfoModal(true)}
        onBoardSettingsToggle={() => setShowBoardSettingsModal(true)}
        onAddMemberToggle={() => setShowAddMember(true)}
        onMembersListToggle={() => setShowTeamModal(true)}
      />

      {showFilters && (
         <AdvancedFilters 
           members={members}
           filters={advFilters}
           allTags={allTags}
           onApply={(f: any) => {
              setAdvFilters(Object.fromEntries(Object.entries(f).filter(([_, v]) => v !== '')));
              setShowFilters(false);
           }}
           onClear={() => {
              setAdvFilters({});
              setShowFilters(false);
           }}
         />
      )}

      <div className={styles.viewToggleContainer}>
        <div className={styles.viewTabs}>
           <button 
             className={`${styles.tabBtn} ${viewMode === 'BOARD' ? styles.activeTab : ''}`}
             onClick={() => setViewMode('BOARD')}
           >Board View</button>
           <button 
             className={`${styles.tabBtn} ${viewMode === 'TIMELINE' ? styles.activeTab : ''}`}
             onClick={() => setViewMode('TIMELINE')}
           >Timeline View</button>
        </div>
        <button 
          className={styles.historyBtn} 
          onClick={() => setShowHistory(true)}
          title="Board History"
        >
          <Clock size={20} />
        </button>
      </div>

      <main className={styles.boardArea}>
        {viewMode === 'BOARD' ? (
          <Board 
            tasks={tasks} // ALWAYS PASS ALL TASKS
            members={members}
            canEdit={canEdit}
            onTaskUpdate={handleTaskUpdate}
            onTaskClick={setSelectedTask}
            onNewTask={handleNewTask}
            matchedTaskIds={matchedTaskIds}
            isFilteringActive={isFilteringActive}
          />
        ) : (
          <Timeline 
            tasks={tasks}
            members={members}
            onTaskClick={setSelectedTask}
            matchedTaskIds={matchedTaskIds}
            isFilteringActive={isFilteringActive}
          />
        )}
      </main>

      {selectedTask && (
        <TaskModal 
          task={tasks.find(t => t.id === selectedTask.id) || selectedTask}
          boardHash={hash}
          members={members}
          canEdit={canEdit}
          identityId={identity?.userId}
          refetchBoard={fetchBoard}
          onUpdate={handleTaskUpdate}
          onClose={() => setSelectedTask(null)}
          allTags={allTags}
        />
      )}

      {showInfoModal && <BoardInfoModal onClose={() => setShowInfoModal(false)} />}
      {showBoardSettingsModal && (
        <BoardSettingsModal 
          board={board} 
          isAdmin={isAdmin} 
          identityId={identity?.userId}
          onClose={() => setShowBoardSettingsModal(false)}
          onSave={handleSaveBoardSettings}
          onDelete={handleDeleteBoard}
        />
      )}
      {showAddMember && <AddMemberModal boardHash={hash} adminId={identity?.userId} onClose={() => setShowAddMember(false)} onAdded={() => { setShowAddMember(false); fetchBoard(); }} />}
      {showTeamModal && (
        <TeamModal 
          members={members} 
          isAdmin={isAdmin}
          adminId={identity?.userId}
          boardHash={hash}
          onClose={() => setShowTeamModal(false)} 
          onUpdated={fetchBoard}
        />
      )}

      <HistorySidebar 
        isOpen={showHistory} 
        onClose={() => setShowHistory(false)} 
        boardHash={hash} 
      />

      <Footer />
    </div>
  );
}
