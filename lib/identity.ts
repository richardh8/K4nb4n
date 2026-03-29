import { v4 as uuidv4 } from 'uuid';

export interface LocalIdentity {
  userId: string;
  name: string;
  color: string;
}

const STAR_WARS_NAMES = [
  'Han Solo', 'Luke Skywalker', 'Leia Organa', 'Darth Vader', 'Obi-Wan Kenobi',
  'Yoda', 'Chewbacca', 'R2-D2', 'C-3PO', 'Boba Fett', 'Lando Calrissian',
  'Padmé Amidala', 'Mace Windu', 'Qui-Gon Jinn', 'Ahsoka Tano', 'Rey',
  'Finn', 'Poe Dameron', 'Kylo Ren', 'Din Djarin', 'Grogu'
];

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#10b981',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#d946ef', '#ec4899', '#f43f5e',
];

export function getLocalIdentity(): LocalIdentity | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('k4nb4n_identity');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      return null;
    }
  }
  return null;
}

export function generateIdentity(): LocalIdentity {
  const identity = {
    userId: uuidv4(),
    name: STAR_WARS_NAMES[Math.floor(Math.random() * STAR_WARS_NAMES.length)],
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  };
  localStorage.setItem('k4nb4n_identity', JSON.stringify(identity));
  return identity;
}
