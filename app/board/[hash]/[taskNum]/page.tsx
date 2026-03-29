'use client';
import { useParams } from 'next/navigation';
import BoardMain from '@/components/Board/BoardMain';

export default function DeepLinkPage() {
  const params = useParams();
  const taskNum = params?.taskNum as string;
  
  return <BoardMain taskNum={taskNum} />;
}
