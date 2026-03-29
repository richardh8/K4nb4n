import db from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');

  if (!q || q.length < 2) {
     return NextResponse.json([]);
  }

  try {
     const users = db!.prepare(`
       SELECT id, name, color FROM users
       WHERE name LIKE ? OR id LIKE ?
       LIMIT 10
     `).all(`%${q}%`, `%${q}%`);

     return NextResponse.json(users);
  } catch (e) {
     console.error(e);
     return NextResponse.json({ error: 'Error fetching users' }, { status: 500 });
  }
}
