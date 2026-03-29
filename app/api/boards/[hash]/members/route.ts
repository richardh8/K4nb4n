export const dynamic = 'force-dynamic';
import db from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { addBoardLog } from '@/lib/history';

export async function POST(req: NextRequest, { params }: { params: Promise<{ hash: string }> }) {
  try {
    const { hash } = await params;
    const { adminId, targetUserId, targetUserName, targetUserColor, role } = await req.json();

    if (!['ADMIN', 'MEMBER'].includes(role)) {
       return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const currentMember = db!.prepare('SELECT role FROM board_members WHERE board_hash = ? AND user_id = ?').get(hash, adminId) as { role: string } | undefined;
    if (!currentMember || currentMember.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const admin = db!.prepare('SELECT name FROM users WHERE id = ?').get(adminId) as { name: string } | undefined;

    const transaction = db!.transaction(() => {
      const stmtUser = db!.prepare(`
        INSERT INTO users (id, name, color)
        VALUES (?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET name=excluded.name, color=excluded.color
      `);
      stmtUser.run(targetUserId, targetUserName, targetUserColor);

      const stmtMember = db!.prepare(`
        INSERT INTO board_members (board_hash, user_id, role) 
        VALUES (?, ?, ?)
        ON CONFLICT(board_hash, user_id) DO UPDATE SET role=excluded.role
      `);
      stmtMember.run(hash, targetUserId, role);

      if (admin) {
        addBoardLog({
          board_hash: hash,
          user_id: adminId,
          user_name: admin.name,
          event_name: 'Member Added',
          details: JSON.stringify([{ field: 'member', new: targetUserName, role }])
        });
      }
    });

    transaction();

    return NextResponse.json({ success: true, user_id: targetUserId, role });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error adding member' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ hash: string }> }) {
  try {
    const { hash } = await params;
    const { adminId, targetUserId, role } = await req.json();

    if (!['ADMIN', 'MEMBER'].includes(role)) {
       return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const requesterMember = db!.prepare('SELECT role FROM board_members WHERE board_hash = ? AND user_id = ?').get(hash, adminId) as { role: string } | undefined;
    if (!requesterMember || requesterMember.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const admin = db!.prepare('SELECT name FROM users WHERE id = ?').get(adminId) as { name: string } | undefined;
    const targetUser = db!.prepare('SELECT name FROM users WHERE id = ?').get(targetUserId) as { name: string } | undefined;
    const currentMember = db!.prepare('SELECT role FROM board_members WHERE board_hash = ? AND user_id = ?').get(hash, targetUserId) as { role: string } | undefined;

    db!.prepare('UPDATE board_members SET role = ? WHERE board_hash = ? AND user_id = ?').run(role, hash, targetUserId);

    if (admin && targetUser) {
      addBoardLog({
        board_hash: hash,
        user_id: adminId,
        user_name: admin.name,
        event_name: 'Member Role Updated',
        details: JSON.stringify([{ field: 'member', name: targetUser.name, old: currentMember?.role, new: role }])
      });
    }

    return NextResponse.json({ success: true, user_id: targetUserId, role });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error updating role' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ hash: string }> }) {
  try {
    const { hash } = await params;
    const { adminId, targetUserId } = await req.json();

    const requesterMember = db!.prepare('SELECT role FROM board_members WHERE board_hash = ? AND user_id = ?').get(hash, adminId) as { role: string } | undefined;
    if (!requesterMember || requesterMember.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const admin = db!.prepare('SELECT name FROM users WHERE id = ?').get(adminId) as { name: string } | undefined;
    const targetUser = db!.prepare('SELECT name FROM users WHERE id = ?').get(targetUserId) as { name: string } | undefined;

    db!.prepare('DELETE FROM board_members WHERE board_hash = ? AND user_id = ?').run(hash, targetUserId);

    if (admin && targetUser) {
      addBoardLog({
        board_hash: hash,
        user_id: adminId,
        user_name: admin.name,
        event_name: 'Member Removed',
        details: JSON.stringify([{ field: 'member', name: targetUser.name }])
      });
    }

    return NextResponse.json({ success: true, user_id: targetUserId });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error removing member' }, { status: 500 });
  }
}
