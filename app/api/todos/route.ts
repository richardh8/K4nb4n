export const dynamic = 'force-dynamic';
import db from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { addBoardLog } from '@/lib/history';

export async function POST(req: NextRequest) {
  try {
    const { taskId, title, boardHash, requesterId } = await req.json();

    const member = db!.prepare('SELECT role FROM board_members WHERE board_hash = ? AND user_id = ?').get(boardHash, requesterId);
    if (!member) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const user = db!.prepare('SELECT name FROM users WHERE id = ?').get(requesterId) as { name: string } | undefined;
    const task = db!.prepare('SELECT name FROM tasks WHERE id = ?').get(taskId) as { name: string } | undefined;

    const id = uuidv4();
    const stmt = db!.prepare('INSERT INTO task_todos (id, task_id, title, completed) VALUES (?, ?, ?, ?)');
    stmt.run(id, taskId, title, 0);

    if (user && task) {
        addBoardLog({
            board_hash: boardHash,
            user_id: requesterId,
            user_name: user.name,
            event_name: 'Todo Added',
            details: JSON.stringify([{ field: 'todo', new: title, taskName: task.name }])
        });
    }

    return NextResponse.json({ id, title, completed: 0 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error adding todo' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, completed, title, boardHash, requesterId } = await req.json();

    const member = db!.prepare('SELECT role FROM board_members WHERE board_hash = ? AND user_id = ?').get(boardHash, requesterId);
    if (!member) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const user = db!.prepare('SELECT name FROM users WHERE id = ?').get(requesterId) as { name: string } | undefined;
    const currentTodo = db!.prepare('SELECT tt.*, t.name as task_name FROM task_todos tt JOIN tasks t ON tt.task_id = t.id WHERE tt.id = ?').get(id) as any;

    const diffs: any[] = [];
    if (completed !== undefined && completed !== (currentTodo?.completed === 1)) {
      db!.prepare('UPDATE task_todos SET completed = ? WHERE id = ?').run(completed ? 1 : 0, id);
      diffs.push({ field: 'todo completed', old: currentTodo?.completed === 1, new: !!completed, taskName: currentTodo?.task_name, todoName: currentTodo?.title });
    }
    if (title !== undefined && title !== currentTodo?.title) {
      db!.prepare('UPDATE task_todos SET title = ? WHERE id = ?').run(title, id);
      diffs.push({ field: 'todo title', old: currentTodo?.title, new: title, taskName: currentTodo?.task_name });
    }

    if (diffs.length > 0 && user) {
        addBoardLog({
            board_hash: boardHash,
            user_id: requesterId,
            user_name: user.name,
            event_name: 'Todo Updated',
            details: JSON.stringify(diffs)
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error updating todo' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const todoId = req.nextUrl.searchParams.get('id');
    const boardHash = req.nextUrl.searchParams.get('boardHash');
    const requesterId = req.nextUrl.searchParams.get('requesterId');

    const member = db!.prepare('SELECT role FROM board_members WHERE board_hash = ? AND user_id = ?').get(boardHash, requesterId);
    if (!member) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const user = db!.prepare('SELECT name FROM users WHERE id = ?').get(requesterId) as { name: string } | undefined;
    const currentTodo = db!.prepare('SELECT tt.*, t.name as task_name FROM task_todos tt JOIN tasks t ON tt.task_id = t.id WHERE tt.id = ?').get(todoId) as any;

    db!.prepare('DELETE FROM task_todos WHERE id = ?').run(todoId);

    if (user && currentTodo) {
        addBoardLog({
            board_hash: boardHash!,
            user_id: requesterId!,
            user_name: user.name,
            event_name: 'Todo Removed',
            details: JSON.stringify([{ field: 'todo', old: currentTodo.title, taskName: currentTodo.task_name }])
        });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error deleting todo' }, { status: 500 });
  }
}
