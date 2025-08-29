import { useI18n } from '#/context/i18n-context';

export function I18nText({ k }: { k: string }) {
  const { t } = useI18n();
  return <>{t(k)}</>;
}

