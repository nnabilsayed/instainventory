import { useTranslations } from 'next-intl';

export default function Home() {
  const t = useTranslations('nav');
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">{t('dashboard')}</h1>
    </main>
  );
}
