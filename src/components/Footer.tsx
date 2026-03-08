import { useApp } from '@/contexts/AppContext';

export default function Footer() {
  const { t } = useApp();
  return (
    <footer className="border-t border-border py-6 text-center">
      <a
        href="https://litt.ly/chichiboo"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        {t('footer.credit')}
      </a>
    </footer>
  );
}
