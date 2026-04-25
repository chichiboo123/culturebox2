import { useApp } from '@/contexts/AppContext';

export default function Footer() {
  const { t } = useApp();
  return (
    <footer className="border-t border-border/50 py-6">
      <div className="mx-auto max-w-[1100px] px-4 text-center">
        <a
          href="https://litt.ly/chichiboo"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          {t('footer.credit')}
        </a>
      </div>
    </footer>
  );
}
