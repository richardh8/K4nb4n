import { useState } from 'react';
import DatePicker from 'react-datepicker';
import { parseISO, format as formatDate } from 'date-fns';
import { X } from 'lucide-react';
import styles from './Header.module.css';

export function AdvancedFilters({ members, filters, allTags, onApply, onClear }: any) {
  const [owners, setOwners] = useState<string[]>(filters.owners || []);
  const [priority, setPriority] = useState(filters.priority || '');
  const [fromDate, setFromDate] = useState(filters.fromDate || '');
  const [toDate, setToDate] = useState(filters.toDate || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(filters.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [showTagOptions, setShowTagOptions] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const filteredTags = (allTags || []).filter((t: string) => 
    t.toLowerCase().includes(tagInput.toLowerCase()) && !selectedTags.includes(t)
  );

  const addTag = (val: string) => {
    const newTag = val.trim().replace(/\s+/g, '_');
    if (!newTag || selectedTags.includes(newTag)) return;
    setSelectedTags([...selectedTags, newTag]);
    setTagInput('');
    setShowTagOptions(false);
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter((t: string) => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      setValidationError('From date cannot be greater than the To date.');
      return;
    }
    onApply({ owners, priority, fromDate, toDate, tags: selectedTags });
  };

  return (
    <div className={styles.filtersPanel}>
      {validationError && (
        <div className={styles.validationModalOverlay} onMouseDown={() => setValidationError(null)}>
          <div className={styles.validationModal} onMouseDown={e => e.stopPropagation()}>
            <span>{validationError}</span>
            <button className={styles.closeBtn} onClick={() => setValidationError(null)} title="Close">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className={styles.filtersForm}>
        <div className={styles.filterGroup}>
          <label>Owner <span style={{fontSize: '0.65rem', color: '#64748b', fontWeight: 'normal', textTransform: 'none'}}>(CMD/CTRL multiple)</span></label>
          <select
            multiple
            value={owners} // Use the state variable 'owners'
            onChange={e => {
              const values = Array.from(e.target.selectedOptions, option => option.value);
              setOwners(values);
            }}
            className={styles.filterInput}
            style={{height: '80px', padding: '0.25rem'}}
          >
            {members.map((m: any) => <option key={m.id} value={m.id} style={{padding: '0.25rem 0.5rem'}}>{m.name}</option>)}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label>Priority</label>
          <select value={priority} onChange={e => setPriority(e.target.value)}>
             <option value="">Any</option>
             {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label>From</label>
          <DatePicker
            selected={fromDate ? parseISO(fromDate) : null}
            onChange={(date: Date | null) => setFromDate(date ? formatDate(date, 'yyyy-MM-dd') : null)}
            dateFormat="dd-MM-yyyy"
            placeholderText="Pick start date"
          />
        </div>
        <div className={styles.filterGroup}>
          <label>To</label>
          <DatePicker
            selected={toDate ? parseISO(toDate) : null}
            onChange={(date: Date | null) => setToDate(date ? formatDate(date, 'yyyy-MM-dd') : null)}
            dateFormat="dd-MM-yyyy"
            placeholderText="Pick end date"
          />
        </div>
        <div className={styles.filterGroup}>
          <label>Tags</label>
          <div className={styles.filterTagsContainer}>
             {selectedTags.map(t => (
               <span key={t} className={styles.filterTag}>
                 {t.replace(/_/g, ' ')}
                 <button onClick={() => removeTag(t)}><X size={10} /></button>
               </span>
             ))}
          </div>
          <div style={{position: 'relative'}}>
            <input 
              placeholder="Filter by tags..." 
              value={tagInput}
              onChange={e => { setTagInput(e.target.value); setShowTagOptions(true); }}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); } }}
              onFocus={() => setShowTagOptions(true)}
              onBlur={() => setTimeout(() => setShowTagOptions(false), 200)}
            />
            {showTagOptions && filteredTags.length > 0 && (
              <div className={styles.filterTypeahead}>
                 {filteredTags.map((ft: string) => (
                    <div key={ft} className={styles.filterOption} onClick={() => addTag(ft)}>
                      #{ft.replace(/_/g, ' ')}
                    </div>
                 ))}
              </div>
            )}
          </div>
        </div>
        <div className={styles.filterActions}>
           <button type="button" className={styles.clearBtn} onClick={onClear}>Clear</button>
           <button type="submit" className={styles.applyBtn}>Apply (↵)</button>
        </div>
      </form>
    </div>
  );
}
