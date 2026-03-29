'use client';
import styles from './Footer.module.css';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className={styles.footer}>
      <div className={styles.line}>
        created by richardh8, coded by Antigravity - empowering people with light tools and AI
      </div>
      <div className={styles.line}>
        © {currentYear} richardh8. Released under the <a href="https://www.gnu.org/licenses/gpl-3.0.html" target="_blank" rel="noopener noreferrer" className={styles.link}>GNU GPLv3 License</a>
      </div>
    </footer>
  );
}
