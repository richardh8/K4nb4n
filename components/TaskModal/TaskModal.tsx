import { useState, useMemo, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import DatePicker from 'react-datepicker';
import { parseISO, format as formatDate } from 'date-fns';
import { Save, HelpCircle, X, MessageSquare, Send, CornerDownRight, Trash2, Copy } from 'lucide-react';
import styles from './TaskModal.module.css';

export function TaskModal({ task, boardHash, members, canEdit, onClose, onUpdate, identityId, refetchBoard, allTags }: any) {
  // Setup isolated localized drafting bounds dropping direct binding over to explicit 'Save' state
  const [draft, setDraft] = useState({
    name: task.name,
    description: task.description || '',
    status: task.status,
    priority: task.priority,
    assignee_id: task.assignee_id || '',
    start_date: task.start_date || '',
    end_date: task.end_date || '',
    tags: task.tags || [],
    links: task.links || []
  });

  const [editingDesc, setEditingDesc] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [showTagOptions, setShowTagOptions] = useState(false);

  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [todoTitle, setTodoTitle] = useState('');
  const [showMdHelp, setShowMdHelp] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [commenting, setCommenting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const copyTaskLink = () => {
    const url = `${window.location.origin}/board/${boardHash}/${task.task_num}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchComments = async () => {
    const res = await fetch(`/api/comments?taskId=${task.id}`);
    const data = await res.json();
    if (Array.isArray(data)) setComments(data);
  };

  useMemo(() => {
    fetchComments();
  }, [task.id]);

  const handleUpdateDraft = (field: string, value: any) => {
    if (!canEdit) return;
    if (field === 'start_date' || field === 'end_date') {
      const sd = field === 'start_date' ? value : draft.start_date;
      const ed = field === 'end_date' ? value : draft.end_date;
      if (sd && ed && new Date(sd) > new Date(ed)) {
        setValidationError('Start date cannot be greater than the end date.');
        return;
      }
    }
    setDraft({ ...draft, [field]: value });
  };

  const handleSave = () => {
    if (!canEdit) return;

    // Compute diff and push
    const diff: any = {};
    Object.keys(draft).forEach(k => {
      // @ts-ignore
      if (draft[k] !== task[k] && JSON.stringify(draft[k]) !== JSON.stringify(task[k])) {
        // @ts-ignore
        diff[k] = draft[k];
      }
    });

    if (Object.keys(diff).length > 0) {
      onUpdate(task.id, diff);
    }
    onClose();
  };

  const addTag = (val: string) => {
    const newTag = val.trim().replace(/\s+/g, '_');
    if (!newTag || draft.tags.includes(newTag)) return;
    handleUpdateDraft('tags', [...draft.tags, newTag]);
    setTagInput('');
    setShowTagOptions(false);
  };

  const removeTag = (tagToRemove: string) => {
    handleUpdateDraft('tags', draft.tags.filter((t: string) => t !== tagToRemove));
  };

  const filteredTags = allTags.filter((t: string) => t.toLowerCase().includes(tagInput.toLowerCase()) && !draft.tags.includes(t));

  const addLink = () => {
    if (!canEdit || !linkTitle || !linkUrl) return;
    const newLink = { title: linkTitle, url: linkUrl };
    handleUpdateDraft('links', [...draft.links, newLink]);
    setLinkTitle('');
    setLinkUrl('');
  };

  const removeLink = (index: number) => {
    handleUpdateDraft('links', draft.links.filter((_: any, i: number) => i !== index));
  };

  // Todo fetches remain explicit 
  const handleTodoToggle = async (todo: any) => {
    if (!canEdit) return;
    await fetch('/api/todos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: todo.id, boardHash, requesterId: identityId, completed: !todo.completed })
    });
    refetchBoard();
  };

  const addTodo = async () => {
    if (!canEdit || !todoTitle.trim()) return;
    await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId: task.id, title: todoTitle.trim(), boardHash, requesterId: identityId })
    });
    setTodoTitle('');
    refetchBoard();
  };

  const deleteTodo = async (todoId: string) => {
    if (!canEdit) return;
    await fetch(`/api/todos?id=${todoId}&boardHash=${boardHash}&requesterId=${identityId}`, {
      method: 'DELETE'
    });
    refetchBoard();
  };

  const addComment = async (parentId: string | null = null) => {
    if (!canEdit || !commentText.trim()) return;
    setCommenting(true);
    await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskId: task.id,
        userId: identityId,
        content: commentText.trim(),
        parentId,
        boardHash
      })
    });
    setCommentText('');
    setReplyTo(null);
    setCommenting(false);
    fetchComments();
  };

  const deleteComment = async (commentId: string) => {
    await fetch(`/api/comments?id=${commentId}&userId=${identityId}`, {
      method: 'DELETE'
    });
    fetchComments();
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task? This cannot be undone.')) return;
    await fetch(`/api/tasks?taskId=${task.id}&boardHash=${boardHash}&requesterId=${identityId}`, {
      method: 'DELETE'
    });
    refetchBoard();
    onClose();
  };

  return (
    <div className={styles.overlay} onMouseDown={onClose}>
      <div className={styles.modal} onMouseDown={e => e.stopPropagation()}>
        {validationError && (
          <div className={styles.validationModalOverlay} onMouseDown={() => setValidationError(null)}>
            <div className={styles.validationModal} onMouseDown={e => e.stopPropagation()}>
              <span>{validationError}</span>
              <button className={styles.headerCloseBtn} onClick={() => setValidationError(null)} title="Close">
                <X size={18} />
              </button>
            </div>
          </div>
        )}
        <div className={styles.headerBar}>
          <div className={styles.modalTaskId}>
            TASK-ID-{task.task_num?.toString().padStart(6, '0')}
            <button className={styles.copyIdBtn} onClick={copyTaskLink} title="Copy Deep Link">
              <Copy size={16} /> {copied ? 'Copied!' : ''}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button className={styles.saveBtn} onClick={handleSave} disabled={!canEdit}>
              <Save size={18} /> Save
            </button>
            {canEdit && (
              <button className={styles.deleteBtn} onClick={handleDelete} title="Delete Task">
                <Trash2 size={18} /> Delete
              </button>
            )}
            <button className={styles.headerCloseBtn} onClick={onClose} title="Close without saving" style={{ marginLeft: '0.5rem' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className={styles.twoCol}>
          <div className={styles.leftCol}>
            <textarea
              className={styles.nameInput}
              value={draft.name}
              onChange={e => handleUpdateDraft('name', e.target.value)}
              readOnly={!canEdit}
              placeholder="Task Name"
              rows={1}
              onInput={(e: any) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              ref={(el) => {
                if (el) {
                  el.style.height = 'auto';
                  el.style.height = el.scrollHeight + 'px';
                }
              }}
            />

            <div className={styles.descSection}>
              <div className={styles.sectionHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Description (Markdown)
                <button className={styles.iconBtnMinimal} onClick={() => setShowMdHelp(true)} title="Markdown Help">
                  <HelpCircle size={14} />
                </button>
              </div>
              {editingDesc && canEdit ? (
                <textarea
                  className={styles.descInput}
                  value={draft.description}
                  onChange={e => handleUpdateDraft('description', e.target.value)}
                  onBlur={() => setEditingDesc(false)}
                  autoFocus
                />
              ) : (
                <div
                  className={styles.markdownDisplay}
                  onClick={() => canEdit && setEditingDesc(true)}
                >
                  <ReactMarkdown>{draft.description || '*Click to add description*...'}</ReactMarkdown>
                </div>
              )}

              <div className={styles.modalCreationFooter}>
                Created on {new Date(task.created_at).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                {task.creator_name ? ` by ${task.creator_name}` : ''}
              </div>
            </div>

            <div className={styles.sectionHeader}>To-Do List</div>
            <div className={styles.todos}>
              {(task.todos || []).map((todo: any) => (
                <div key={todo.id} className={styles.todoItem}>
                  <input
                    type="checkbox"
                    checked={!!todo.completed}
                    onChange={() => handleTodoToggle(todo)}
                    disabled={!canEdit}
                    className={styles.todoCheck}
                  />
                  <span className={todo.completed ? styles.todoDoneTitle : styles.todoTitle}>
                    {todo.title}
                  </span>
                  {canEdit && (
                    <button className={styles.deleteTodo} onClick={() => deleteTodo(todo.id)}>×</button>
                  )}
                </div>
              ))}
              {canEdit && (
                <div className={styles.addTodoInline}>
                  <input
                    value={todoTitle}
                    onChange={e => setTodoTitle(e.target.value)}
                    placeholder="+ Add to-do"
                    onKeyDown={e => { if (e.key === 'Enter') addTodo(); }}
                  />
                </div>
              )}
            </div>

            <div className={styles.sectionHeader} style={{ marginTop: '4rem' }}>
              <MessageSquare size={16} /> Comments
            </div>
            <div className={styles.commentsSection}>
              {comments.filter(c => !c.parent_id).map(comment => (
                <div key={comment.id} className={styles.commentContainer}>
                  <div className={styles.commentMain}>
                    <div className={comment.user_id === identityId ? styles.commentOwnHeader : styles.commentHeader}>
                      <span className={styles.commentUser} style={{ color: comment.user_color }}>{comment.user_name}</span>
                      <span className={styles.commentDate}>{new Date(comment.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className={styles.commentContent}>
                      <ReactMarkdown>{comment.content}</ReactMarkdown>
                    </div>
                    <div className={styles.commentActions}>
                      {canEdit && <button onClick={() => setReplyTo(comment.id === replyTo ? null : comment.id)}>Reply</button>}
                      {comment.user_id === identityId && <button onClick={() => deleteComment(comment.id)} style={{ color: '#ef4444' }}>Delete</button>}
                    </div>
                  </div>

                  {/* Replies */}
                  {comments.filter(r => r.parent_id === comment.id).map(reply => (
                    <div key={reply.id} className={styles.replyItem}>
                      <CornerDownRight size={14} className={styles.replyIcon} />
                      <div className={styles.replyContent}>
                        <div className={styles.commentHeader}>
                          <span className={styles.commentUser} style={{ color: reply.user_color }}>{reply.user_name}</span>
                          <span className={styles.commentDate}>{new Date(reply.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className={styles.commentContent}>
                          <ReactMarkdown>{reply.content}</ReactMarkdown>
                        </div>
                        {reply.user_id === identityId && (
                          <div className={styles.commentActions}>
                            <button onClick={() => deleteComment(reply.id)} style={{ color: '#ef4444' }}>Delete</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {replyTo === comment.id && (
                    <div className={styles.replyInputArea}>
                      <textarea
                        placeholder="Write a reply... (Markdown)"
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                      />
                      <button onClick={() => addComment(comment.id)} disabled={commenting}><Send size={14} /></button>
                    </div>
                  )}
                </div>
              ))}

              {canEdit && !replyTo && (
                <div className={styles.commentInputMain}>
                  <textarea
                    placeholder="+ Add a comment... (Markdown)"
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                  />
                  <button onClick={() => addComment(null)} disabled={commenting || !commentText.trim()}>
                    <Send size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className={styles.rightCol}>
            <div className={styles.fieldGroup}>
              <label>Status</label>
              <div className={styles.customSelectWrapper}>
                <div className={styles.statusDot} data-status={draft.status} />
                <select
                  value={draft.status}
                  onChange={e => handleUpdateDraft('status', e.target.value)}
                  disabled={!canEdit}
                  className={styles.darkSelect}
                  style={{ paddingLeft: '24px' }}
                >
                  {['Backlog', 'To Do', 'Doing', 'Done'].map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                </select>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label>Priority</label>
              <select
                value={draft.priority}
                onChange={e => handleUpdateDraft('priority', e.target.value)}
                disabled={!canEdit}
                className={styles.darkSelectPriority}
                data-priority={draft.priority}
              >
                {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label>Assignee</label>
              <select
                value={draft.assignee_id || ''}
                onChange={e => handleUpdateDraft('assignee_id', e.target.value || null)}
                disabled={!canEdit}
                className={styles.darkSelectAssignee}
                style={draft.assignee_id ? { color: members.find((m: any) => m.id === draft.assignee_id)?.color } : {}}
              >
                <option value="">Unassigned</option>
                {members.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label>Start Date</label>
              <DatePicker
                selected={draft.start_date ? parseISO(draft.start_date) : null}
                onChange={(date: Date | null) => handleUpdateDraft('start_date', date ? formatDate(date, 'yyyy-MM-dd') : null)}
                dateFormat="dd-MM-yyyy"
                disabled={!canEdit}
                placeholderText="Set start date"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label>End Date</label>
              <DatePicker
                selected={draft.end_date ? parseISO(draft.end_date) : null}
                onChange={(date: Date | null) => handleUpdateDraft('end_date', date ? formatDate(date, 'yyyy-MM-dd') : null)}
                dateFormat="dd-MM-yyyy"
                disabled={!canEdit}
                placeholderText="Set end date"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label>Tags</label>
              <div className={styles.tagsContainer}>
                {draft.tags.map((tag: string) => (
                  <span key={tag} className={styles.tag}>
                    {tag.replace(/_/g, ' ')}
                    {canEdit && <button onClick={() => removeTag(tag)}>×</button>}
                  </span>
                ))}
              </div>
              {canEdit && (
                <div style={{ position: 'relative' }}>
                  <input
                    placeholder="Add tag (Enter)..."
                    value={tagInput}
                    onChange={e => { setTagInput(e.target.value); setShowTagOptions(true); }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') addTag(tagInput);
                    }}
                    onFocus={() => setShowTagOptions(true)}
                    onBlur={() => setTimeout(() => setShowTagOptions(false), 200)}
                    className={styles.smallInput}
                  />
                  {showTagOptions && filteredTags.length > 0 && (
                    <div className={styles.typeaheadMenu}>
                      {filteredTags.map((ft: string) => (
                        <div key={ft} className={styles.typeaheadOption} onClick={() => addTag(ft)}>
                          #{ft.replace(/_/g, ' ')}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className={styles.fieldGroup}>
              <label>Links</label>
              <div className={styles.linksContainer}>
                {draft.links.map((link: any, i: number) => (
                  <div key={i} className={styles.linkRowItem}>
                    <div className={styles.linkBlock}>
                      <div className={styles.linkTitle}>{link.title}</div>
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className={styles.linkUrl}>{link.url}</a>
                    </div>
                    {canEdit && <button className={styles.linkDelBtn} onClick={() => removeLink(i)}>×</button>}
                  </div>
                ))}
              </div>
              {canEdit && (
                <div className={styles.addLinkRow}>
                  <input placeholder="Title" value={linkTitle} onChange={e => setLinkTitle(e.target.value)} />
                  <input placeholder="https://" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} />
                  <button onClick={addLink}>+</button>
                </div>
              )}
            </div>

          </div>
        </div>

        {showMdHelp && (
          <div className={styles.mdHelpOverlay} onMouseDown={() => setShowMdHelp(false)}>
            <div className={styles.mdHelpModal} onMouseDown={e => e.stopPropagation()}>
              <h3>Markdown Reference</h3>
              <pre>
                # Heading 1{'\n'}
                ## Heading 2{'\n'}
                **Bold Text**{'\n'}
                *Italic Text*{'\n'}
                [Link](url){'\n'}
                - Bullet Point{'\n'}
                1. Numbered List{'\n'}
                `Code block`
              </pre>
              <button
                className={styles.saveBtn}
                onClick={() => setShowMdHelp(false)}
                style={{ marginTop: '1rem', width: '100%' }}
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
