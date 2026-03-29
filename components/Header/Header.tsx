import Link from 'next/link';
import styles from './Header.module.css';
import { Filter, HelpCircle, Info, UserPlus, Users } from 'lucide-react';

interface HeaderProps {
  boardName: string;
  hash: string;
  onSearch: (q: string) => void;
  onFilterToggle: () => void;
  isAdmin: boolean;
  onNameChange: (n: string) => void;
  identityName: string;
  identityColor: string;
  filtersActive: boolean;
  onHelpToggle: () => void;
  onBoardSettingsToggle: () => void;
  onAddMemberToggle: () => void;
  onMembersListToggle: () => void;
}

export function Header({ 
  boardName, 
  hash, 
  onSearch, 
  onFilterToggle, 
  isAdmin, 
  onNameChange, 
  identityName, 
  identityColor, 
  filtersActive, 
  onHelpToggle, 
  onBoardSettingsToggle,
  onAddMemberToggle, 
  onMembersListToggle 
}: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Link href="/" style={{ textDecoration: 'none' }}>
           <div className={`${styles.logo} page-module__E0kJGG__logo`}>K4nb4n</div>
        </Link>
        <button className={styles.iconBtn} onClick={onHelpToggle} title="How to use K4nb4n">
           <HelpCircle size={18} />
        </button>
        
        {isAdmin ? (
          <input 
            className={styles.titleInput} 
            value={boardName} 
            onChange={e => onNameChange(e.target.value)} 
          />
        ) : (
           <div className={styles.titleDisplay}>{boardName}</div>
        )}
        
        <button className={styles.iconBtn} onClick={onBoardSettingsToggle} title="Board Info & Settings">
           <Info size={18} />
        </button>
      </div>
      
      <div className={styles.center}>
        <div className={styles.searchGroup}>
          <div className={styles.searchBar}>
            <input 
              placeholder="Search tasks or assignees..." 
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
          <button 
             className={styles.filterBtn} 
             onClick={onFilterToggle} 
             style={{ borderColor: filtersActive ? '#38bdf8' : '' }}
          >
            <Filter size={18} color={filtersActive ? '#38bdf8' : 'white'}/>
          </button>
        </div>
      </div>

      <div className={styles.right}>
         <button className={styles.actionBtn} onClick={onMembersListToggle} title="View Team">
           <Users size={16} style={{marginRight: '6px'}} /> Team
         </button>
         {isAdmin && (
           <button className={styles.actionBtn} onClick={onAddMemberToggle} title="Add Member">
             <UserPlus size={16} style={{marginRight: '6px'}} /> Add Member
           </button>
         )}
         <div className={styles.user}>
           {identityName}
           <span className={styles.avatar} style={{ backgroundColor: identityColor }} />
         </div>
      </div>
    </header>
  );
}
