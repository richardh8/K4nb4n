export const dynamic = 'force-dynamic';
import db from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { generateHash } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const { userId, userName, userColor } = await req.json();
    if (!userId || !userName || !userColor) {
      return NextResponse.json({ error: 'Missing user data' }, { status: 400 });
    }

    let hash = generateHash();
    
    // Ensure uniqueness
    let exists = db!.prepare('SELECT hash FROM boards WHERE hash = ?').get(hash);
    while (exists) {
        hash = generateHash();
        exists = db!.prepare('SELECT hash FROM boards WHERE hash = ?').get(hash);
    }

    const transaction = db!.transaction(() => {
      // Create user if not exists
      const stmtUser = db!.prepare(`
        INSERT INTO users (id, name, color)
        VALUES (?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET name=excluded.name, color=excluded.color
      `);
      stmtUser.run(userId, userName, userColor);

      // Create board
      const stmtBoard = db!.prepare('INSERT INTO boards (hash, name, created_by_id) VALUES (?, ?, ?)');
      stmtBoard.run(hash, 'New Board', userId);

      // Assign user as ADMIN to the board
      const stmtMember = db!.prepare('INSERT INTO board_members (board_hash, user_id, role) VALUES (?, ?, ?)');
      stmtMember.run(hash, userId, 'ADMIN');
    });

    transaction();

    return NextResponse.json({ hash, name: 'New Board' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) {
     return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  try {
    const stmt = db!.prepare(`
      SELECT b.hash, b.name, bm.role 
      FROM boards b
      JOIN board_members bm ON b.hash = bm.board_hash
      WHERE bm.user_id = ?
      ORDER BY b.created_at DESC
    `);
    const boards = stmt.all(userId);
    return NextResponse.json(boards);
  } catch (error) {
     console.error(error);
     return NextResponse.json({ error: 'Error fetching boards' }, { status: 500 });
  }
}
