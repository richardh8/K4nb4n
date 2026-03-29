export const dynamic = 'force-dynamic';
import db from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { addBoardLog } from '@/lib/history';

export async function POST(req: NextRequest) {
  try {
    const { boardHash, requesterId, name, description, priority, assigneeId, tags, links } = await req.json();

    const member = db!.prepare('SELECT role FROM board_members WHERE board_hash = ? AND user_id = ?').get(boardHash, requesterId);
    if (!member) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const user = db!.prepare('SELECT name FROM users WHERE id = ?').get(requesterId) as { name: string } | undefined;

    const id = uuidv4();
    const status = 'Backlog'; // Default

    const transaction = db!.transaction(() => {
      const lastTaskNumResult = db!.prepare('SELECT COALESCE(MAX(task_num), 0) as last FROM tasks').get() as { last: number };
      const newNum = lastTaskNumResult.last + 1;

      const stmt = db!.prepare(`
        INSERT INTO tasks (id, task_num, board_hash, name, description, status, priority, assignee_id, created_by_id, tags, links)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        id,
        newNum,
        boardHash,
        name,
        description || '',
        status,
        priority || 'MEDIUM',
        assigneeId || null,
        requesterId,
        tags ? JSON.stringify(tags) : JSON.stringify([]),
        links ? JSON.stringify(links) : JSON.stringify([])
      );

      if (user) {
        addBoardLog({
          board_hash: boardHash,
          user_id: requesterId,
          user_name: user.name,
          event_name: 'Task Created',
          details: JSON.stringify([{ field: 'name', new: name }])
        });
      }

      return newNum;
    });

    const taskNum = transaction();

    return NextResponse.json({ id, task_num: taskNum, status: 'success' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error creating task' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { taskId, boardHash, requesterId, ...updates } = await req.json();

    const member = db!.prepare('SELECT role FROM board_members WHERE board_hash = ? AND user_id = ?').get(boardHash, requesterId);
    if (!member) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const user = db!.prepare('SELECT name FROM users WHERE id = ?').get(requesterId) as { name: string } | undefined;
    const currentTask = db!.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;

    const fields = ['name', 'description', 'status', 'priority', 'assignee_id', 'start_date', 'end_date', 'tags', 'links'];
    const updateClauses: string[] = [];
    const updateValues: any[] = [];
    const diffs: any[] = [];

    for (const field of fields) {
      if (updates[field] !== undefined) {
        let oldVal = currentTask?.[field];
        let newVal = updates[field];
        
        const isJsonField = field === 'tags' || field === 'links';
        if (isJsonField && typeof newVal !== 'string') {
          newVal = JSON.stringify(newVal);
        }
        
        if (oldVal !== newVal) {
          updateClauses.push(`${field} = ?`);
          updateValues.push(newVal);

          let finalOld = oldVal;
          let finalNew = newVal;

          if (field === 'assignee_id') {
            const oldUser = oldVal ? db!.prepare('SELECT name FROM users WHERE id = ?').get(oldVal) as { name: string } : null;
            const newUser = newVal ? db!.prepare('SELECT name FROM users WHERE id = ?').get(newVal) as { name: string } : null;
            finalOld = oldUser?.name || 'Unassigned';
            finalNew = newUser?.name || 'Unassigned';
          }

          diffs.push({ 
            field: field === 'assignee_id' ? 'assignee' : field, 
            old: isJsonField && oldVal ? JSON.parse(oldVal) : finalOld, 
            new: isJsonField && newVal ? JSON.parse(newVal) : finalNew,
            taskName: currentTask?.name
          });
        }
      }
    }

    if (updateClauses.length > 0) {
      updateValues.push(taskId, boardHash);
      const stmt = db!.prepare(`UPDATE tasks SET ${updateClauses.join(', ')} WHERE id = ? AND board_hash = ?`);
      stmt.run(...updateValues);

      if (user && diffs.length > 0) {
        addBoardLog({
          board_hash: boardHash,
          user_id: requesterId,
          user_name: user.name,
          event_name: 'Task Updated',
          details: JSON.stringify(diffs)
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error updating task' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const taskId = req.nextUrl.searchParams.get('taskId');
    const boardHash = req.nextUrl.searchParams.get('boardHash');
    const requesterId = req.nextUrl.searchParams.get('requesterId');

    if (!taskId || !boardHash || !requesterId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const member = db!.prepare('SELECT role FROM board_members WHERE board_hash = ? AND user_id = ?').get(boardHash, requesterId);
    if (!member) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const user = db!.prepare('SELECT name FROM users WHERE id = ?').get(requesterId) as { name: string } | undefined;
    const currentTask = db!.prepare('SELECT name FROM tasks WHERE id = ?').get(taskId) as { name: string } | undefined;

    const stmt = db!.prepare('DELETE FROM tasks WHERE id = ? AND board_hash = ?');
    stmt.run(taskId, boardHash);

    if (user && currentTask) {
      addBoardLog({
        board_hash: boardHash,
        user_id: requesterId,
        user_name: user.name,
        event_name: 'Task Deleted',
        details: JSON.stringify([{ field: 'name', old: currentTask.name }])
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error deleting task' }, { status: 500 });
  }
}
