import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { X, Shield, ShieldAlert, UserMinus, Info, Save, Trash2, Copy } from 'lucide-react';
import styles from '../TaskModal/TaskModal.module.css';

export function BoardSettingsModal({ board, isAdmin, identityId, onClose, onSave, onDelete }: any) {
  const [description, setDescription] = useState(board.description || '');
  const [isEditing, setIsEditing] = useState(false);
  const [deleteStep, setDeleteStep] = useState(0); // 0=none, 1=confirm name
  const [confirmName, setConfirmName] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSave = () => {
    onSave(description);
    setIsEditing(false);
  };

  const copyUrl = () => {
    const url = `${window.location.origin}/board/${board.hash}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = () => {
    if (confirmName === board.name) {
      onDelete();
    }
  };

  return (
    <div className={styles.overlay} onMouseDown={onClose}>
      <div className={styles.modal} onMouseDown={e => e.stopPropagation()} style={{maxWidth: '600px', padding: '2rem'}}>
        <div className={styles.headerBar} style={{padding:0, border:0, background:'transparent', marginBottom: '1.5rem', justifyContent:'space-between'}}>
           <h2 style={{color: 'white', margin: 0}}>Board settings</h2>
           <div style={{display: 'flex', gap: '0.75rem', alignItems: 'center'}}>
             {isAdmin && (
               <>
                 <button className={styles.saveBtn} onClick={handleSave} style={{height: '32px', fontSize: '0.75rem'}}>
                    <Save size={14} /> Save
                 </button>
                 <button 
                  className={styles.deleteBtn} 
                  onClick={() => setDeleteStep(1)}
                  style={{height: '32px', fontSize: '0.75rem'}}
                 >
                    <Trash2 size={14} /> Delete
                 </button>
               </>
             )}
             <button className={styles.headerCloseBtn} onClick={onClose}><X size={20} /></button>
           </div>
        </div>

        {deleteStep === 0 ? (
          <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
            <div className={styles.fieldGroup}>
              <label>Board Name</label>
              <div style={{color: 'white', fontSize: '1.1rem', fontWeight: 600, padding: '0.4rem 0'}}>{board.name}</div>
            </div>

            <div className={styles.fieldGroup}>
              <label>Board ID & Link</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.4rem 0' }}>
                <div style={{ color: '#38bdf8', fontSize: '1.2rem', fontWeight: 800, letterSpacing: '0.1em', fontFamily: 'monospace' }}>
                  {board.hash}
                </div>
                <button 
                  onClick={copyUrl} 
                  style={{ 
                    background: 'rgba(56, 189, 248, 0.1)', 
                    border: '1px solid rgba(56, 189, 248, 0.2)', 
                    color: '#38bdf8',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    transition: 'all 0.2s'
                  }}
                  title="Copy Board URL"
                >
                  <Copy size={14} /> {copied ? 'Copied!' : 'Copy URL'}
                </button>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label>Description (Markdown)</label>
              {isAdmin && isEditing ? (
                <textarea 
                  className={styles.descTextarea}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Tell us about this board..."
                  autoFocus
                  style={{ minHeight: '150px', width: '100%', padding: '0.75rem', background: '#020617', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', outline: 'none' }}
                />
              ) : (
                <div 
                  className={styles.descPreview} 
                  onClick={() => isAdmin && setIsEditing(true)}
                  style={{minHeight: '100px', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem', cursor: isAdmin ? 'pointer' : 'default'}}
                >
                  <ReactMarkdown>{description || '*Click to add board description...*'}</ReactMarkdown>
                </div>
              )}
              {isAdmin && isEditing && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button className={styles.saveBtn} onClick={() => setIsEditing(false)} style={{ background: '#334155', color: 'white', border: 'none' }}>Done Preview</button>
                </div>
              )}
            </div>

            <div style={{marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
               <div style={{fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic'}}>
                 Created on {new Date(board.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                 {board.creator_name ? ` by ${board.creator_name}` : ''}
               </div>
            </div>
          </div>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'center', padding: '1rem 0'}}>
             <div style={{color: '#ef4444', fontWeight: 700, fontSize: '1.1rem'}}>Warning: Permanent Deletion</div>
             <p style={{color: '#94a3b8'}}>This action will permanently delete the board and all its tasks, comments, and members. This cannot be undone.</p>
             
             <div className={styles.fieldGroup} style={{textAlign: 'left'}}>
               <label>To confirm deletion, please enter the name of the board: <strong>{board.name}</strong></label>
               <input 
                 className={styles.darkInput}
                 value={confirmName}
                 onChange={e => setConfirmName(e.target.value)}
                 placeholder="Type board name here..."
                 style={{marginTop: '0.5rem', width: '100%', padding: '0.75rem', background: '#020617', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem'}}
               />
             </div>

             <div style={{display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem'}}>
               <button 
                 className={styles.deleteBtn} 
                 onClick={handleDelete}
                 disabled={confirmName !== board.name}
                 style={{padding: '0.6rem 1.5rem', background: confirmName === board.name ? '#ef4444' : 'rgba(239, 68, 68, 0.1)', color: confirmName === board.name ? 'white' : '#666'}}
               >
                 Yes, I confirm
               </button>
               <button onClick={() => setDeleteStep(0)} style={{background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '0.6rem 1.5rem', borderRadius: '0.375rem', cursor: 'pointer'}}>
                 No
               </button>
               <button onClick={onClose} style={{background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer', padding: '0 1rem'}}>
                 Cancel
               </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function BoardInfoModal({ onClose }: any) {
  return (
    <div className={styles.overlay} onMouseDown={onClose}>
      <div className={styles.modal} onMouseDown={e => e.stopPropagation()} style={{maxWidth: '500px', padding: '2rem'}}>
        <div className={styles.headerBar} style={{padding:0, border:0, background:'transparent', marginBottom: '1rem', justifyContent:'space-between'}}>
           <h2 style={{color: 'white', margin: 0}}>How to use K4nb4n</h2>
           <button className={styles.headerCloseBtn} onClick={onClose}><X size={20} /></button>
        </div>
        <div style={{color: '#94a3b8', lineHeight: 1.6, overflowY: 'auto', maxHeight: '60vh'}}>
          <p>Welcome to your local-first kanban board!</p>
           <ul style={{paddingLeft: '1.2rem'}}>
             <li style={{marginBottom: '0.75rem'}}><strong>Drag & Drop:</strong> Orchestrate your workflow by moving tasks across lanes. Cards automatically sort by End Date to keep urgency visible.</li>
             <li style={{marginBottom: '0.75rem'}}><strong>Threaded Comments:</strong> Collaborate directly on tasks with **Markdown-supported comments** and threaded replies.</li>
             <li style={{marginBottom: '0.75rem'}}><strong>Creation Metadata:</strong> Every task explicitly tracks its **creation date** and **creator** for a clear audit trail.</li>
             <li style={{marginBottom: '0.75rem'}}><strong>Advanced Filtering:</strong> Drill down by priority, date range, multiple owners, or **multiple tags** with type-ahead suggestions. Unmatched cards are dimmed for focus.</li>
             <li style={{marginBottom: '0.75rem'}}><strong>Timeline View:</strong> Switch modes to see tasks plotted on a high-end timeline with support for days, weeks, and months.</li>
             <li style={{marginBottom: '0.75rem'}}><strong>Team Management:</strong> Admins can invite members via type-ahead, **toggle roles** between Member/Admin, or remove users from the board.</li>
             <li style={{marginBottom: '0.75rem'}}><strong>Sharing:</strong> Copy the board URL to share instant access. New users join as Readers until granted edit roles by an Admin.</li>
           </ul>
        </div>
      </div>
    </div>
  );
}

export function TeamModal({ members, isAdmin, adminId, boardHash, onClose, onUpdated }: any) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleToggleRole = async (targetUser: any) => {
    if (!isAdmin || targetUser.id === adminId) return;
    setLoading(targetUser.id);
    const newRole = targetUser.role === 'ADMIN' ? 'MEMBER' : 'ADMIN';
    await fetch(`/api/boards/${boardHash}/members`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, targetUserId: targetUser.id, role: newRole })
    });
    setLoading(null);
    onUpdated();
  };

  const handleRemove = async (targetUser: any) => {
    if (!isAdmin || targetUser.id === adminId) return;
    if (!confirm(`Are you sure you want to remove ${targetUser.name} from the board?`)) return;
    setLoading(targetUser.id);
    await fetch(`/api/boards/${boardHash}/members`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, targetUserId: targetUser.id })
    });
    setLoading(null);
    onUpdated();
  };

  return (
    <div className={styles.overlay} onMouseDown={onClose}>
      <div className={styles.modal} onMouseDown={e => e.stopPropagation()} style={{maxWidth: '450px', padding: '2rem'}}>
        <div className={styles.headerBar} style={{padding:0, border:0, background:'transparent', marginBottom: '1rem', justifyContent:'space-between'}}>
           <h2 style={{color: 'white', margin: 0}}>Board Team</h2>
           <button className={styles.headerCloseBtn} onClick={onClose}><X size={20} /></button>
        </div>
        
        <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '60vh', overflowY: 'auto'}}>
          {members.map((m: any) => (
             <div key={m.id} style={{display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)'}}>
                <div style={{width: 36, height: 36, borderRadius: '50%', backgroundColor: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', flexShrink: 0}}>
                  {m.role === 'ADMIN' ? <Shield size={18} /> : m.name.charAt(0)}
                </div>
                <div style={{flex: 1, minWidth: 0}}>
                  <div style={{color: 'white', fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{m.name}</div>
                  <div style={{color: '#64748b', fontSize: '0.7rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{m.id}</div>
                </div>
                
                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                  <div style={{fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '0.25rem', background: m.role === 'ADMIN' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(56, 189, 248, 0.2)', color: m.role === 'ADMIN' ? '#fdba74' : '#7dd3fc'}}>
                    {m.role}
                  </div>
                  
                  {isAdmin && m.id !== adminId && (
                    <>
                      <button 
                        onClick={() => handleToggleRole(m)}
                        className={styles.iconBtnMinimal}
                        title={m.role === 'ADMIN' ? "Make Member" : "Make Admin"}
                        disabled={!!loading}
                      >
                        {m.role === 'ADMIN' ? <ShieldAlert size={16} /> : <Shield size={16} />}
                      </button>
                      <button 
                        onClick={() => handleRemove(m)}
                        className={styles.iconBtnMinimal}
                        style={{color: '#ef4444'}}
                        title="Remove Member"
                        disabled={!!loading}
                      >
                        <UserMinus size={16} />
                      </button>
                    </>
                  )}
                </div>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AddMemberModal({ boardHash, adminId, onClose, onAdded }: any) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [role, setRole] = useState('MEMBER');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
       setResults([]);
       return;
    }
    const delay = setTimeout(() => {
       fetch(`/api/users?q=${encodeURIComponent(query)}`)
         .then(res => res.json())
         .then(data => setResults(Array.isArray(data) ? data : []));
    }, 400);
    return () => clearTimeout(delay);
  }, [query]);

  const handleAdd = async (user: any) => {
    setLoading(true);
    await fetch(`/api/boards/${boardHash}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        adminId, 
        targetUserId: user.id, 
        targetUserName: user.name, 
        targetUserColor: user.color, 
        role 
      })
    });
    setLoading(false);
    onAdded();
  };

  return (
    <div className={styles.overlay} onMouseDown={onClose}>
      <div className={styles.modal} onMouseDown={e => e.stopPropagation()} style={{maxWidth: '500px', padding: '2rem', overflow: 'visible'}}>
        <div className={styles.headerBar} style={{padding:0, border:0, background:'transparent', marginBottom: '1rem', justifyContent:'space-between'}}>
           <h2 style={{color: 'white', margin: 0}}>Add Member</h2>
           <button className={styles.headerCloseBtn} onClick={onClose}><X size={20} /></button>
        </div>
        <p style={{color: '#94a3b8', fontSize: '0.85rem'}}>Search available users by name or ID to grant them edit access to this board.</p>
        
        <div style={{display: 'flex', gap: '1rem', marginTop: '1.5rem', marginBottom: '1rem'}}>
           <div style={{flex: 1}}>
             <label style={{display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase'}}>Search User</label>
             <input 
               value={query} 
               onChange={e => setQuery(e.target.value)} 
               placeholder="Type name or ID..."
               style={{width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.625rem', borderRadius: '0.375rem', outline: 'none'}}
             />
           </div>
           <div>
             <label style={{display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase'}}>Role</label>
             <select 
               value={role} 
               onChange={e => setRole(e.target.value)}
               style={{width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.625rem', borderRadius: '0.375rem', outline: 'none'}}
             >
                <option value="MEMBER">MEMBER</option>
                <option value="ADMIN">ADMIN</option>
             </select>
           </div>
        </div>

        {results.length > 0 && (
           <div style={{background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', maxHeight: '200px', overflowY: 'auto'}}>
             {results.map(u => (
                <div key={u.id} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
                   <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                      <div style={{width: 24, height: 24, borderRadius: '50%', backgroundColor: u.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.7rem', fontWeight: 800}}>
                         {u.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{color: 'white', fontSize: '0.85rem', fontWeight: 600}}>{u.name}</div>
                        <div style={{color: '#64748b', fontSize: '0.7rem'}}>{u.id}</div>
                      </div>
                   </div>
                   <button 
                     onClick={() => handleAdd(u)}
                     disabled={loading}
                     style={{background: '#38bdf8', color: '#0f172a', border: 'none', padding: '0.4rem 0.75rem', borderRadius: '0.25rem', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', transition: 'opacity 0.2s', opacity: loading ? 0.5 : 1}}
                   >
                     Add
                   </button>
                </div>
             ))}
           </div>
        )}
      </div>
    </div>
  );
}
