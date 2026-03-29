export const dynamic = 'force-dynamic';
import db from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { addBoardLog } from '@/lib/history';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
    }

    const comments = db!.prepare(`
      SELECT tc.*, u.name as user_name, u.color as user_color
      FROM task_comments tc
      JOIN users u ON tc.user_id = u.id
      WHERE tc.task_id = ?
      ORDER BY tc.created_at ASC
    `).all(taskId);

    return NextResponse.json(comments);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error fetching comments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { taskId, userId, content, parentId, boardHash } = await req.json();

    if (!taskId || !userId || !content || !boardHash) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const member = db!.prepare('SELECT role FROM board_members WHERE board_hash = ? AND user_id = ?').get(boardHash, userId);
    if (!member) {
      return NextResponse.json({ error: 'Unauthorized: Not a board member' }, { status: 403 });
    }

    const user = db!.prepare('SELECT name FROM users WHERE id = ?').get(userId) as { name: string } | undefined;
    const task = db!.prepare('SELECT name FROM tasks WHERE id = ?').get(taskId) as { name: string } | undefined;

    const id = uuidv4();
    const stmt = db!.prepare(`
      INSERT INTO task_comments (id, task_id, user_id, content, parent_id)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(id, taskId, userId, content, parentId || null);

    if (user && task) {
        addBoardLog({
            board_hash: boardHash,
            user_id: userId,
            user_name: user.name,
            event_name: 'Comment Added',
            details: JSON.stringify([{ field: 'comment', new: content, taskName: task.name }])
        });
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error adding comment' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    const boardHash = searchParams.get('boardHash');

    if (!id || !userId || !boardHash) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const user = db!.prepare('SELECT name FROM users WHERE id = ?').get(userId) as { name: string } | undefined;
    const currentComment = db!.prepare('SELECT tc.*, t.name as task_name FROM task_comments tc JOIN tasks t ON tc.task_id = t.id WHERE tc.id = ?').get(id) as any;

    const stmt = db!.prepare('DELETE FROM task_comments WHERE id = ? AND user_id = ?');
    const info = stmt.run(id, userId);

    if (info.changes === 0) {
      return NextResponse.json({ error: 'Unauthorized or comment not found' }, { status: 403 });
    }

    if (user && currentComment) {
        addBoardLog({
            board_hash: boardHash,
            user_id: userId,
            user_name: user.name,
            event_name: 'Comment Removed',
            details: JSON.stringify([{ field: 'comment', old: currentComment.content, taskName: currentComment.task_name }])
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error deleting comment' }, { status: 500 });
  }
}
