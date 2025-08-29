import React, { createContext, useContext, useMemo, useState } from 'react';

type Locale = 'tr' | 'en';

type Dictionary = Record<string, string>;

type Messages = Record<Locale, Dictionary>;

const defaultMessages: Messages = {
  tr: {
    'common.deleteWarning': 'Bu işlem geri alınamaz ve ilgili tüm veriler silinecektir.',
    // Users dialog
    'users.update.title': 'Kullanıcı Düzenle',
    'users.delete.title': 'Kullanıcıyı Sil',
    'users.delete.success': 'Kullanıcı başarıyla silindi',
    'users.delete.error': 'Kullanıcı silinirken bir hata oluştu',
    'users.delete.confirmPrefix': '"',
    'users.delete.confirmSuffix': '" kullanıcısını silmek istediğinizden emin misiniz?',
    // Agents dialog
    'agents.update.title': 'Acente Düzenle',
    'agents.delete.title': 'Acenteyi Sil',
    'agents.delete.success': 'Acente başarıyla silindi',
    'agents.delete.error': 'Acente silinirken bir hata oluştu',
    'agents.delete.confirmPrefix': '"',
    'agents.delete.confirmSuffix': '" acentesini silmek istediğinizden emin misiniz?',
    // Roles dialog
    'roles.update.title': 'Rol Düzenle',
    'roles.delete.title': 'Rolü Sil',
    'roles.delete.success': 'Rol başarıyla silindi',
    'roles.delete.error': 'Rol silinirken bir hata oluştu',
    'roles.delete.confirmPrefix': '"',
    'roles.delete.confirmSuffix': '" rolünü silmek istediğinizden emin misiniz?',
    // Common
    'common.status': 'Durum',
    'common.createdAt': 'Oluşturulma Tarihi',
    'common.updatedAt': 'Güncellenme Tarihi',
    'common.actions': 'İşlemler',
    'common.view': 'Görüntüle',
    'common.edit': 'Düzenle',
    'common.delete': 'Sil',
    'common.deleting': 'Siliniyor...',
    'common.cancel': 'İptal',
    'common.active': 'Aktif',
    'common.inactive': 'Pasif',
    // Roles page
    'roles.title': 'Roller',
    'roles.subtitle': 'Tüm rolleri yönetin ve yeni rol ekleyin.',
    'roles.create.title': 'Yeni Rol Ekle',
    'roles.create.button': 'Rol Ekle',
    'roles.columns.name': 'Rol Adı',
    'roles.columns.description': 'Açıklama',
    'roles.columns.permissions': 'İzinler',
    // Users page
    'users.title': 'Kullanıcılar',
    'users.subtitle': 'Tüm kullanıcıları yönetin ve yeni kullanıcı ekleyin.',
    'users.create.title': 'Yeni Kullanıcı Ekle',
    'users.create.button': 'Kullanıcı Ekle',
    'users.columns.firstName': 'Ad',
    'users.columns.lastName': 'Soyad',
    'users.columns.email': 'E-posta',
    'users.columns.roles': 'Roller',
    'users.columns.agent': 'Acente',
    // Domains page
    'domains.title': 'Domainler',
    'domains.subtitle': 'Tüm acente domainlerini görüntüleyin ve yönetin.',
    'domains.columns.domain': 'Domain',
    'domains.columns.agent': 'Acente',
    // Agents page
    'agents.title': 'Acenteler',
    'agents.subtitle': 'Tüm acenteleri yönetin ve yeni acente ekleyin.',
    'agents.create.title': 'Yeni Acente Ekle',
    'agents.create.button': 'Acente Ekle',
    'agents.columns.name': 'Acente Adı',
    'agents.columns.insurupId': 'Insurup ID',
    'agents.columns.domains': 'Domain Sayısı',
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
    'common.deleteWarning': 'This action cannot be undone and all related data will be deleted.',
    // Users dialog
    'users.update.title': 'Edit User',
    'users.delete.title': 'Delete User',
    'users.delete.success': 'User deleted successfully',
    'users.delete.error': 'An error occurred while deleting the user',
    'users.delete.confirmPrefix': 'Do you really want to delete user ',
    'users.delete.confirmSuffix': '?',
    // Agents dialog
    'agents.update.title': 'Edit Agent',
    'agents.delete.title': 'Delete Agent',
    'agents.delete.success': 'Agent deleted successfully',
    'agents.delete.error': 'An error occurred while deleting the agent',
    'agents.delete.confirmPrefix': 'Do you really want to delete agent ',
    'agents.delete.confirmSuffix': '?',
    // Roles dialog
    'roles.update.title': 'Edit Role',
    'roles.delete.title': 'Delete Role',
    'roles.delete.success': 'Role deleted successfully',
    'roles.delete.error': 'An error occurred while deleting the role',
    'roles.delete.confirmPrefix': 'Do you really want to delete role ',
    'roles.delete.confirmSuffix': '?',
    // Common
    'common.status': 'Status',
    'common.createdAt': 'Created At',
    'common.updatedAt': 'Updated At',
    'common.actions': 'Actions',
    'common.view': 'View',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.deleting': 'Deleting...',
    'common.cancel': 'Cancel',
    'common.active': 'Active',
    'common.inactive': 'Inactive',
    // Roles page
    'roles.title': 'Roles',
    'roles.subtitle': 'Manage all roles and add new ones.',
    'roles.create.title': 'Add New Role',
    'roles.create.button': 'Add Role',
    'roles.columns.name': 'Role Name',
    'roles.columns.description': 'Description',
    'roles.columns.permissions': 'Permissions',
    // Users page
    'users.title': 'Users',
    'users.subtitle': 'Manage all users and add new ones.',
    'users.create.title': 'Add New User',
    'users.create.button': 'Add User',
    'users.columns.firstName': 'First Name',
    'users.columns.lastName': 'Last Name',
    'users.columns.email': 'Email',
    'users.columns.roles': 'Roles',
    'users.columns.agent': 'Agent',
    // Domains page
    'domains.title': 'Domains',
    'domains.subtitle': 'View and manage all agent domains.',
    'domains.columns.domain': 'Domain',
    'domains.columns.agent': 'Agent',
    // Agents page
    'agents.title': 'Agents',
    'agents.subtitle': 'Manage all agents and add new ones.',
    'agents.create.title': 'Add New Agent',
    'agents.create.button': 'Add Agent',
    'agents.columns.name': 'Agent Name',
    'agents.columns.insurupId': 'Insurup ID',
    'agents.columns.domains': 'Domain Count',
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

