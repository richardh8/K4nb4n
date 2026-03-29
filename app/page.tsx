'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getLocalIdentity, generateIdentity, LocalIdentity } from '@/lib/identity';
import { LogIn, Copy, X } from 'lucide-react';
import { Footer } from '@/components/Footer/Footer';
import styles from './page.module.css';

function LandingPageContent() {
  const [identity, setIdentity] = useState<LocalIdentity | null>(null);
  const [boards, setBoards] = useState<any[]>([]);
  const [hashInput, setHashInput] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorKey = searchParams?.get('error');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const errorMap: Record<string, string> = {
    'board_not_found': 'Board not found or Access Denied.',
    'task_not_found': 'The requested Task ID could not be found on this board.',
    'unauthorized': 'Unauthorized Access. You do not have permission to view this content.'
  };

  useEffect(() => {
    if (errorKey && errorMap[errorKey]) {
      setErrorMessage(errorMap[errorKey]);
      // Clean up URL without triggering refresh
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      window.history.replaceState({}, '', url.toString());
    }
  }, [errorKey]);

  useEffect(() => {
    let id = getLocalIdentity();
    if (!id) {
      id = generateIdentity();
    }
    setIdentity(id);

    // Fetch user boards
    fetch(`/api/boards?userId=${id.userId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setBoards(data);
      })
      .catch(console.error);
  }, []);

  const createBoard = async () => {
    if (!identity) return;
    setLoading(true);
    try {
      const res = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: identity.userId,
          userName: identity.name,
          userColor: identity.color
        })
      });
      const data = await res.json();
      if (data.hash) {
        router.push(`/board/${data.hash}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (hashInput.trim().length === 8) {
      router.push(`/board/${hashInput.trim()}`);
    } else {
      alert("Invalid Hash. Must be exactly 8 characters.");
    }
  };

  if (!identity) return null;

  const copyToClipboard = (e: React.MouseEvent, hash: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/board/${hash}`);
    alert('Link copied to clipboard!');
  };

  return (
    <main className={styles.main}>
      {errorMessage && (
        <div className={styles.validationModalOverlay} onMouseDown={() => setErrorMessage(null)}>
          <div className={styles.validationModal} onMouseDown={e => e.stopPropagation()}>
            <span>{errorMessage}</span>
            <button className={styles.headerCloseBtn} onClick={() => setErrorMessage(null)} title="Close">
              <X size={20} />
            </button>
          </div>
        </div>
      )}
      <header className={styles.header}>
        <div className={styles.logo}>K4nb4n</div>
        <div className={styles.identity}>
           <span>Logged in as </span>
           <span className={styles.tag} style={{ backgroundColor: identity.color }}>
             {identity.name}
           </span>
        </div>
      </header>
      
      <div className={styles.content}>
        <section className={styles.hero}>
          <div className={styles.heroMedia}>
            <img src="/hero-kanban.png" alt="K4nb4n Board" className={styles.heroImage} />
          </div>
          <div className={styles.heroText}>
            <h1 className={styles.title}>The Local-First Anonymous Kanban</h1>
            <p className={styles.subtitle}>
              Instantly create, share, and track your boards without needing an account. 
              All identities are device-bound.
            </p>

            <div className={styles.actions}>
              <button className={styles.primaryBtn} onClick={createBoard} disabled={loading}>
                {loading ? 'Creating...' : '+ Create New Board'}
              </button>
              <div className={styles.divider}>OR</div>
              <form onSubmit={handleJoin} className={styles.joinForm}>
                <input 
                   value={hashInput} 
                   onChange={e => setHashInput(e.target.value)} 
                   placeholder="Enter 8-digit Hash..."
                   maxLength={8}
                   required
                />
                <button type="submit" className={styles.secondaryBtn}>
                  <LogIn size={18} style={{marginRight: '8px'}} /> Join Board
                </button>
              </form>
            </div>
          </div>
        </section>

        <div className={styles.grid}>
          <section className={styles.card}>
            <h2>My Boards</h2>
            {boards.length === 0 ? (
               <p className={styles.emptyText}>You aren't a member of any boards yet.</p>
            ) : (
               <ul className={styles.boardList}>
                 {boards.map(b => (
                    <li key={b.hash}>
                      <a href={`/board/${b.hash}`} target="_blank" rel="noopener noreferrer" className={styles.boardLink}>
                        <span className={styles.boardName}>{b.name}</span>
                        <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                           <span className={styles.boardRole}>{b.hash}</span>
                           <span className={styles.boardRole}>{b.role}</span>
                           <button 
                             onClick={(e) => copyToClipboard(e, b.hash)} 
                             className={styles.iconBtn}
                             title="Copy Link"
                           >
                             <Copy size={16} />
                           </button>
                        </div>
                      </a>
                    </li>
                 ))}
               </ul>
            )}
          </section>

          <section className={styles.card}>
            <h2>Frequently Asked Questions</h2>
            <div className={styles.faq}>
              <h3>How does authentication work?</h3>
              <p>You don't need a password! When you first visit K4nb4n, an anonymous identity is generated and securely tied to your browser. That unique ID lets you assume the role of Admin on your boards.</p>
              
              <h3>How do I share a board with my team?</h3>
              <p>Click on the copy icon in your My Boards list and share it with whoever you want to invite.</p>

              <h3>Are my boards saved permanently?</h3>
              <p>Boards are stored persistently in our unified SQLite backend. As long as you keep your browser data intact, your identity grants you lifetime access to your boards.</p>
            </div>
          </section>
        </div>
      </div>
      
      <Footer />
    </main>
  );
}

export default function LandingPage() {
  return (
    <Suspense fallback={<div style={{ color: '#64748b', textAlign: 'center', padding: '4rem' }}>Loading Holonet...</div>}>
      <LandingPageContent />
    </Suspense>
  );
}
