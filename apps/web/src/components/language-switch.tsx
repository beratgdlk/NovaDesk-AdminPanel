import { Button } from '#/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '#/components/ui/dropdown-menu';
import { useI18n } from '#/context/i18n-context';
import { cn } from '#/lib/utils';
import { IconCheck, IconLanguage } from '@tabler/icons-react';

export function LanguageSwitch() {
  const { locale, setLocale } = useI18n();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="scale-95 rounded-full">
          <IconLanguage className="size-[1.2rem]" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setLocale('tr')}>
          Türkçe <IconCheck size={14} className={cn('ml-auto', locale !== 'tr' && 'hidden')} />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocale('en')}>
          English <IconCheck size={14} className={cn('ml-auto', locale !== 'en' && 'hidden')} />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

