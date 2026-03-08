import { useApp } from '@/contexts/AppContext';
import { Heart } from 'lucide-react';

export default function Footer() {
  const { t } = useApp();
  return (
    <footer className="border-t border-border/50 py-8">
      <div className="mx-auto max-w-[1100px] px-4 text-center">
        <div className="mb-2 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
          <span>Made with</span>
          <Heart className="h-3.5 w-3.5 fill-accent text-accent" />
          <span>by</span>
        </div>
        <a
          href="https://litt.ly/chichiboo"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-foreground/70 transition-colors hover:text-primary"
        >
          교육뮤지컬 꿈꾸는 치수쌤
        </a>
        <p className="mt-2 text-xs text-muted-foreground/60">
          © 2026 Digital Culture Box Project
        </p>
      </div>
    </footer>
  );
}
