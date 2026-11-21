'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      'nav.my_work': 'My Work',
      'nav.dashboard': 'Dashboard',
      'nav.institutions': 'Institutions',
      'nav.fdrs': 'FDR Records',
      'nav.calendar': 'Maturity Calendar',
      'nav.liquidity_ladder': 'Liquidity Ladder',
      'nav.renewals': 'Renewals',
      'nav.documents': 'Verification Queue',
      'nav.risk_center': 'Risk Center',
      'nav.releases': 'Release Requests',
      'nav.reports': 'Reports & Export',
      'nav.notifications': 'Notifications',
      'nav.audit': 'Audit Trail',
      'nav.users': 'Users & Roles',
      'nav.settings': 'System Settings',
      'nav.profile': 'Profile',
      'nav.logout': 'Sign Out',
      'common.search': 'Search',
      'common.actions': 'Actions',
      'common.status': 'Status',
      'common.loading': 'Loading...',
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.verify': 'Verify',
      'common.reject': 'Reject',
      'common.release': 'Release',
      'common.renew': 'Renew',
      'login.title': 'AICTE FDR Vault',
      'login.subtitle': 'Transparent. Tracked. Timely.',
      'login.badge': 'Security Deposit Command Center',
      'login.signin': 'Sign In to Portal',
    },
  },
  hi: {
    translation: {
      'nav.my_work': 'मेरा कार्य',
      'nav.dashboard': 'डैशबोर्ड',
      'nav.institutions': 'संस्थान निर्देशिका',
      'nav.fdrs': 'एफडीआर रिकॉर्ड',
      'nav.calendar': 'परिपक्वता कैलेंडर',
      'nav.liquidity_ladder': 'तरलता सीढ़ी',
      'nav.renewals': 'नवीनीकरण',
      'nav.documents': 'सत्यापन कतार',
      'nav.risk_center': 'जोखिम केंद्र',
      'nav.releases': 'रिलीज अनुरोध',
      'nav.reports': 'रिपोर्ट एवं निर्यात',
      'nav.notifications': 'सूचनाएं',
      'nav.audit': 'ऑडिट ट्रेल',
      'nav.users': 'उपयोगकर्ता एवं भूमिकाएं',
      'nav.settings': 'सिस्टम सेटिंग्स',
      'nav.profile': 'प्रोफ़ाइल',
      'nav.logout': 'लॉगआउट',
      'common.search': 'खोजें',
      'common.actions': 'कार्रवाई',
      'common.status': 'स्थिति',
      'common.loading': 'लोड हो रहा है...',
      'common.save': 'सहेजें',
      'common.cancel': 'रद्द करें',
      'common.verify': 'सत्यापित करें',
      'common.reject': 'अस्वीकार करें',
      'common.release': 'जारी करें',
      'common.renew': 'नवीनीकरण करें',
      'login.title': 'एआईसीटीई एफडीआर वॉल्ट',
      'login.subtitle': 'पारदर्शी. ट्रैक किया गया. समय पर.',
      'login.badge': 'सुरक्षा जमा कमान केंद्र',
      'login.signin': 'पोर्टल में साइन इन करें',
    },
  },
};

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') || 'en' : 'en',
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
    });
}

export default i18n;
