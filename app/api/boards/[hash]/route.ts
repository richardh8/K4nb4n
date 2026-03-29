export const dynamic = 'force-dynamic';
import db from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ hash: string }> }) {
  try {
    const { hash } = await params;

    const board = db!.prepare(`
      SELECT b.*, u.name as creator_name
      FROM boards b
      LEFT JOIN users u ON b.created_by_id = u.id
      WHERE b.hash = ?
    `).get(hash);

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    const members = db!.prepare(`
      SELECT bm.role, u.id, u.name, u.color
      FROM board_members bm
      JOIN users u ON bm.user_id = u.id
      WHERE bm.board_hash = ?
    `).all(hash);

    const tasks = db!.prepare(`
      SELECT t.*, u.name as creator_name
      FROM tasks t
      LEFT JOIN users u ON t.created_by_id = u.id
      WHERE t.board_hash = ?
    `).all(hash);

    const todos = db!.prepare(`
      SELECT tt.* FROM task_todos tt
      JOIN tasks t ON tt.task_id = t.id
      WHERE t.board_hash = ?
    `).all(hash);

    const tasksMapped = tasks.map((task: any) => ({
      ...task,
      tags: task.tags ? JSON.parse(task.tags) : [],
      links: task.links ? JSON.parse(task.links) : [],
      todos: todos.filter((todo: any) => todo.task_id === task.id)
    }));

    return NextResponse.json({
      board,
      members,
      tasks: tasksMapped
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error fetching board' }, { status: 500 });
  }
}

import { addBoardLog } from '@/lib/history';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ hash: string }> }) {
  try {
    const { hash } = await params;
    const { name, description, userId } = await req.json();

    const user = db!.prepare('SELECT name FROM users WHERE id = ?').get(userId) as { name: string } | undefined;
    const currentBoard = db!.prepare('SELECT name, description FROM boards WHERE hash = ?').get(hash) as { name: string, description: string } | undefined;

    const member = db!.prepare('SELECT role FROM board_members WHERE board_hash = ? AND user_id = ?').get(hash, userId) as { role: string } | undefined;
    if (!member || member.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized to change board settings' }, { status: 403 });
    }

    const diffs: any[] = [];
    if (name !== undefined && name !== currentBoard?.name) {
      db!.prepare('UPDATE boards SET name = ? WHERE hash = ?').run(name, hash);
      diffs.push({ field: 'name', old: currentBoard?.name, new: name });
    }
    if (description !== undefined && description !== currentBoard?.description) {
      db!.prepare('UPDATE boards SET description = ? WHERE hash = ?').run(description, hash);
      diffs.push({ field: 'description', old: currentBoard?.description, new: description });
    }

    if (diffs.length > 0 && user) {
        addBoardLog({
            board_hash: hash,
            user_id: userId,
            user_name: user.name,
            event_name: 'Board Settings Updated',
            details: JSON.stringify(diffs)
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error updating board' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ hash: string }> }) {
  try {
    const { hash } = await params;
    const userId = req.nextUrl.searchParams.get('userId');

    const member = db!.prepare('SELECT role FROM board_members WHERE board_hash = ? AND user_id = ?').get(hash, userId) as { role: string } | undefined;
    if (!member || member.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized to delete board' }, { status: 403 });
    }

    // Cascading deletes are handled by SQL foreign keys
    db!.prepare('DELETE FROM boards WHERE hash = ?').run(hash);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error deleting board' }, { status: 500 });
  }
}
