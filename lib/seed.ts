import { v4 as uuidv4 } from 'uuid';
import { addDays } from 'date-fns';

export function seedDatabase(db: any) {
  try {
    const existing = db.prepare('SELECT hash FROM boards WHERE hash = ?').get('AAAAAAAA');
    if (existing) return;

    db.transaction(() => {
      // 1. Create Users
      const users = [
        { id: uuidv4(), name: 'Han Solo', color: '#ef4444' },
        { id: uuidv4(), name: 'Leia Organa', color: '#ec4899' },
        { id: uuidv4(), name: 'Luke Skywalker', color: '#3b82f6' },
      ];

      const stmtUser = db.prepare('INSERT INTO users (id, name, color) VALUES (?, ?, ?)');
      for (const u of users) stmtUser.run(u.id, u.name, u.color);

      // 2. Create Board AAAAAAAA
      db.prepare('INSERT INTO boards (hash, name) VALUES (?, ?)').run('AAAAAAAA', 'GALACTIC RESTORATION PROJECT');

      // 3. Add Members
      const stmtMember = db.prepare('INSERT INTO board_members (board_hash, user_id, role) VALUES (?, ?, ?)');
      stmtMember.run('AAAAAAAA', users[0].id, 'ADMIN');
      stmtMember.run('AAAAAAAA', users[1].id, 'MEMBER');
      stmtMember.run('AAAAAAAA', users[2].id, 'MEMBER');

      // 4. Add Tasks (3 Backlog, 5 To Do, 3 Doing, 2 Done)
      const stmtTask = db.prepare(`
        INSERT INTO tasks (id, board_hash, name, description, status, priority, assignee_id, start_date, end_date, tags, links)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const insertTask = (name: string, status: string, priority: string, assignee: any, startOff: number|null, endOff: number|null, tags: string[]) => {
        stmtTask.run(
          uuidv4(),
          'AAAAAAAA',
          name,
          '# Mission Brief\n\nThis is a securely intercepted transmission describing the critical parameters of this task.\n\n- Ensure complete stealth operations.\n- May the force be with you.',
          status,
          priority,
          assignee?.id || null,
          startOff !== null ? addDays(new Date(), startOff).toISOString() : null,
          endOff !== null ? addDays(new Date(), endOff).toISOString() : null,
          JSON.stringify(tags),
          JSON.stringify([])
        );
      };

      // Backlog
      insertTask('Re-calibrate Hyperdrive Sensors', 'Backlog', 'MEDIUM', users[0], null, 2, ['Maintenance', 'Falcon']);
      insertTask('Secure Rebel Base Coordinates', 'Backlog', 'HIGH', users[1], null, null, ['Alliance']);
      insertTask('Inventory Rations Case 4', 'Backlog', 'LOW', users[2], null, null, []);

      // To Do
      insertTask('Repair Portside Shield Emitter', 'To Do', 'HIGH', users[0], 0, 1, ['Maintenance', 'Urgent']);
      insertTask('Negotiate with Hutts', 'To Do', 'MEDIUM', users[1], null, 4, ['Diplomacy']);
      insertTask('Update Astromech Firmware', 'To Do', 'LOW', users[2], null, null, ['Droid']);
      insertTask('Map Kessel Run Route further', 'To Do', 'HIGH', users[0], null, null, []);
      insertTask('Distribute Medical Supplies', 'To Do', 'MEDIUM', users[1], 1, 3, ['Alliance']);

      // Doing
      insertTask('Decrypt Imperial Signal', 'Doing', 'CRITICAL', users[2], -1, 2, ['Intelligence', 'Imperial']);
      insertTask('Refuel Hyperdrive Tank', 'Doing', 'HIGH', users[0], -2, 0, ['Falcon']);
      insertTask('Infiltrating Scarif Facilities', 'Doing', 'CRITICAL', users[1], -3, 1, ['Stealth', 'Mission']);

      // Done
      insertTask('Extract Han from Carbonite', 'Done', 'CRITICAL', users[1], -10, -5, ['Rescue', 'Jabba']);
      insertTask('Destroy Death Star Shield Generator', 'Done', 'HIGH', users[0], -5, -1, ['Endor', 'Victory']);
      
    })();
    console.log('Successfully seeded local K4nb4n database with board AAAAAAAA');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}
