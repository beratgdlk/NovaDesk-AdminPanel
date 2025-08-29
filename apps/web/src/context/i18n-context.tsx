import React, { createContext, useContext, useMemo, useState } from 'react';

type Locale = 'tr' | 'en';

type Dictionary = Record<string, string>;

type Messages = Record<Locale, Dictionary>;

const defaultMessages: Messages = {
  tr: {
    // Agents page
    'agents.title': 'Acenteler',
    'agents.subtitle': 'Tüm acenteleri yönetin ve yeni acente ekleyin.',
    'agents.create.title': 'Yeni Acente Ekle',
    'agents.create.button': 'Acente Ekle',
    'agents.columns.name': 'Acente Adı',
    'agents.columns.insurupId': 'Insurup ID',
    'agents.columns.domains': 'Domain Sayısı',
    'common.createdAt': 'Oluşturulma Tarihi',
    'common.updatedAt': 'Güncellenme Tarihi',
    'common.actions': 'İşlemler',
    // Sidebar
    'sidebar.general': 'Genel',
    'sidebar.home': 'Ana Sayfa',
    'sidebar.agents': 'Acenteler',
    'sidebar.domains': 'Domainler',
    'sidebar.users': 'Kullanıcılar',
    'sidebar.roles': 'Roller',
    'sidebar.others': 'Diğer',
    'sidebar.settings': 'Ayarlar',
    'sidebar.profile': 'Profil',
    'sidebar.account': 'Hesap',
    'sidebar.appearance': 'Görünüm',
    'sidebar.notifications': 'Bildirim',

    'dashboard.title': 'Analizler',
    'dashboard.messages': 'Başlatılan Mesaj Sayısı',
    'dashboard.offers': 'Alınan Teklif Sayısı',
    'dashboard.policies': 'Poliçeleşen Teklif Sayısı',
    'dashboard.conversion': 'Dönüşüm Oranı',
    'dashboard.daily': 'Günlük Dağılım',
    'dashboard.filterByDate': 'Tarih seçerek filtreleyebilirsiniz',
    'dashboard.forMonth': 'Seçili aya göre mesaj, teklif ve poliçe',
  },
  en: {
    // Agents page
    'agents.title': 'Agents',
    'agents.subtitle': 'Manage all agents and add new ones.',
    'agents.create.title': 'Add New Agent',
    'agents.create.button': 'Add Agent',
    'agents.columns.name': 'Agent Name',
    'agents.columns.insurupId': 'Insurup ID',
    'agents.columns.domains': 'Domain Count',
    'common.createdAt': 'Created At',
    'common.updatedAt': 'Updated At',
    'common.actions': 'Actions',
    // Sidebar
    'sidebar.general': 'General',
    'sidebar.home': 'Home',
    'sidebar.agents': 'Agents',
    'sidebar.domains': 'Domains',
    'sidebar.users': 'Users',
    'sidebar.roles': 'Roles',
    'sidebar.others': 'Others',
    'sidebar.settings': 'Settings',
    'sidebar.profile': 'Profile',
    'sidebar.account': 'Account',
    'sidebar.appearance': 'Appearance',
    'sidebar.notifications': 'Notifications',

    'dashboard.title': 'Analytics',
    'dashboard.messages': 'Started Messages',
    'dashboard.offers': 'Received Offers',
    'dashboard.policies': 'Converted Policies',
    'dashboard.conversion': 'Conversion Rate',
    'dashboard.daily': 'Daily Distribution',
    'dashboard.filterByDate': 'Filter by date',
    'dashboard.forMonth': 'Messages, offers, and policies for the selected month',
  },
};

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children, messages = defaultMessages, defaultLocale = 'tr' as Locale }: { children: React.ReactNode; messages?: Messages; defaultLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>((() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('novadesk-locale') : null;
    return (saved as Locale) || defaultLocale;
  })());

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    if (typeof window !== 'undefined') localStorage.setItem('novadesk-locale', l);
    const html = document.documentElement;
    html.lang = l;
  };

  const t = useMemo(() => {
    return (key: string) => messages[locale]?.[key] ?? key;
  }, [locale, messages]);

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('I18nContext not found');
  return ctx;
}

