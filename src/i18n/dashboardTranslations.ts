import type { Language } from '../context/LanguageContext';

/**
 * Chrome-level copy (sidebars, top bars, tab bars) for the dashboards that sit
 * behind login — client, distributor and admin. Deep content inside each tab
 * is not covered yet; extend the relevant section here as more of it gets
 * translated.
 */
export const dashboardTranslations: Record<Language, {
  client: {
    nav: {
      overview: string;
      setup: string;
      products: string;
      chat: string;
      contacts: string;
      history: string;
      settings: string;
      support: string;
    };
    navSections: { myTag: string; communication: string; account: string };
    searchPlaceholder: string;
    buySticker: string;
    proProtection: string;
    active: string;
  };
  distributor: {
    partnerDesk: string;
    verifiedPartner: string;
    exitToHome: string;
    logOut: string;
    tabs: { overview: string; activate: string; pos: string };
  };
  admin: {
    quickSearch: string;
    tagsActive: string;
    alertsAndNotifications: string;
    new: string;
    generateTag: string;
    addUserAccount: string;
  };
}> = {
  en: {
    client: {
      nav: {
        overview: 'Home Overview',
        setup: 'Setup Guide',
        products: 'Products',
        chat: 'Live Visitor Chat',
        contacts: 'Emergency Contacts',
        history: 'Alert History',
        settings: 'Account Settings',
        support: 'Support & Help',
      },
      navSections: { myTag: 'My Tag', communication: 'Communication', account: 'Account' },
      searchPlaceholder: 'Search stickers, contacts...',
      buySticker: 'Buy Sticker',
      proProtection: '◆ Pro Protection',
      active: '✦ Active',
    },
    distributor: {
      partnerDesk: 'Partner Desk',
      verifiedPartner: 'Verified Partner',
      exitToHome: 'Exit to Home',
      logOut: 'Log Out',
      tabs: {
        overview: 'Assigned Customer Tags',
        activate: 'Assign New Tag',
        pos: 'POS Marketing Kits & Collateral',
      },
    },
    admin: {
      quickSearch: 'Quick Search...',
      tagsActive: 'tags active',
      alertsAndNotifications: 'Alerts & Notifications',
      new: 'New',
      generateTag: 'Generate Tag',
      addUserAccount: 'Add User Account',
    },
  },
  hi: {
    client: {
      nav: {
        overview: 'होम अवलोकन',
        setup: 'सेटअप गाइड',
        products: 'उत्पाद',
        chat: 'लाइव विज़िटर चैट',
        contacts: 'आपातकालीन संपर्क',
        history: 'अलर्ट इतिहास',
        settings: 'खाता सेटिंग्स',
        support: 'सहायता एवं मदद',
      },
      navSections: { myTag: 'मेरा टैग', communication: 'संचार', account: 'खाता' },
      searchPlaceholder: 'स्टिकर, संपर्क खोजें...',
      buySticker: 'स्टिकर खरीदें',
      proProtection: '◆ प्रो सुरक्षा',
      active: '✦ सक्रिय',
    },
    distributor: {
      partnerDesk: 'पार्टनर डेस्क',
      verifiedPartner: 'सत्यापित साझेदार',
      exitToHome: 'होम पर जाएं',
      logOut: 'लॉग आउट',
      tabs: {
        overview: 'सौंपे गए ग्राहक टैग',
        activate: 'नया टैग असाइन करें',
        pos: 'POS मार्केटिंग किट और सामग्री',
      },
    },
    admin: {
      quickSearch: 'त्वरित खोज...',
      tagsActive: 'टैग सक्रिय',
      alertsAndNotifications: 'अलर्ट और सूचनाएं',
      new: 'नया',
      generateTag: 'टैग जनरेट करें',
      addUserAccount: 'उपयोगकर्ता खाता जोड़ें',
    },
  },
  gu: {
    client: {
      nav: {
        overview: 'હોમ ઓવરવ્યૂ',
        setup: 'સેટઅપ ગાઇડ',
        products: 'ઉત્પાદનો',
        chat: 'લાઇવ વિઝિટર ચેટ',
        contacts: 'ઇમરજન્સી સંપર્કો',
        history: 'એલર્ટ ઇતિહાસ',
        settings: 'એકાઉન્ટ સેટિંગ્સ',
        support: 'સપોર્ટ અને મદદ',
      },
      navSections: { myTag: 'મારો ટેગ', communication: 'સંચાર', account: 'એકાઉન્ટ' },
      searchPlaceholder: 'સ્ટીકર, સંપર્કો શોધો...',
      buySticker: 'સ્ટીકર ખરીદો',
      proProtection: '◆ પ્રો પ્રોટેક્શન',
      active: '✦ સક્રિય',
    },
    distributor: {
      partnerDesk: 'પાર્ટનર ડેસ્ક',
      verifiedPartner: 'ચકાસાયેલ ભાગીદાર',
      exitToHome: 'હોમ પર જાઓ',
      logOut: 'લૉગ આઉટ',
      tabs: {
        overview: 'સોંપાયેલા ગ્રાહક ટેગ',
        activate: 'નવો ટેગ સોંપો',
        pos: 'POS માર્કેટિંગ કિટ્સ અને સામગ્રી',
      },
    },
    admin: {
      quickSearch: 'ઝડપી શોધ...',
      tagsActive: 'ટેગ સક્રિય',
      alertsAndNotifications: 'એલર્ટ અને સૂચનાઓ',
      new: 'નવું',
      generateTag: 'ટેગ જનરેટ કરો',
      addUserAccount: 'યુઝર એકાઉન્ટ ઉમેરો',
    },
  },
};
