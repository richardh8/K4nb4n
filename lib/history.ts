import db from './db';
import { v4 as uuidv4 } from 'uuid';

export interface HistoryEntry {
  id?: string;
  board_hash: string;
  user_id: string;
  user_name: string;
  event_name: string;
  details: string; // JSON string of diffs
  created_at?: string;
}

export function addBoardLog(entry: Omit<HistoryEntry, 'id' | 'created_at'>) {
  if (!db) return;
  
  const id = uuidv4();
  const stmt = db.prepare(`
    INSERT INTO board_history (id, board_hash, user_id, user_name, event_name, details)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(id, entry.board_hash, entry.user_id, entry.user_name, entry.event_name, entry.details);
}

export function getBoardHistory(boardHash: string) {
  if (!db) return [];
  
  return db.prepare(`
    SELECT bh.*, u.id as user_id, u.color as user_color 
    FROM board_history bh
    JOIN users u ON bh.user_id = u.id
    WHERE bh.board_hash = ? 
    ORDER BY bh.created_at DESC
  `).all(boardHash);
}
