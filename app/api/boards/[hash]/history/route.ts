import { NextRequest, NextResponse } from 'next/server';
import { getBoardHistory } from '@/lib/history';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  const { hash } = await params;
  try {
    const history = getBoardHistory(hash);
    return NextResponse.json({ history });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
