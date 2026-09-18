import type { Language } from '../context/LanguageContext';

/**
 * Landing page copy, keyed by language. Only the navbar + hero are covered for
 * now — extend this dictionary with more keys as more sections get translated.
 */
export const landingTranslations: Record<Language, {
  navLinks: { hiw: string; trust: string; products: string; distributor: string; faq: string };
  joinUs: string;
  chooseYourService: string;
  logIn: string;
  dashboard: string;
  goToDashboard: string;
  chooseTag: string;
  orderNewTags: string;
  trackOrder: string;
  heroKicker: string;
  heroHeadingLine1: string;
  heroHeadingHighlight: string;
  heroHeadingLine2: string;
  heroSubheading: string;
}> = {
  en: {
    navLinks: {
      hiw: 'How it works',
      trust: 'Why RepiQR',
      products: 'Products',
      distributor: 'Franchise',
      faq: 'FAQ',
    },
    joinUs: 'Join us',
    chooseYourService: 'Choose your service',
    logIn: 'Log in',
    dashboard: 'Dashboard',
    goToDashboard: 'Go to Dashboard',
    chooseTag: 'Choose tag',
    orderNewTags: 'Order new tags',
    trackOrder: 'Track Order',
    heroKicker: 'Built for safer everyday journeys',
    heroHeadingLine1: "India's 1st",
    heroHeadingHighlight: 'smartest',
    heroHeadingLine2: 'QR safety platform',
    heroSubheading: 'One smart scan helps people reach you instantly, while your phone number stays private.',
  },
  hi: {
    navLinks: {
      hiw: 'यह कैसे काम करता है',
      trust: 'RepiQR क्यों',
      products: 'उत्पाद',
      distributor: 'फ्रैंचाइज़ी',
      faq: 'सामान्य प्रश्न',
    },
    joinUs: 'हमसे जुड़ें',
    chooseYourService: 'अपनी सेवा चुनें',
    logIn: 'लॉग इन करें',
    dashboard: 'डैशबोर्ड',
    goToDashboard: 'डैशबोर्ड पर जाएं',
    chooseTag: 'टैग चुनें',
    orderNewTags: 'नए टैग ऑर्डर करें',
    trackOrder: 'ऑर्डर ट्रैक करें',
    heroKicker: 'हर दिन की सुरक्षित यात्रा के लिए बनाया गया',
    heroHeadingLine1: 'भारत का पहला',
    heroHeadingHighlight: 'सबसे स्मार्ट',
    heroHeadingLine2: 'QR सुरक्षा प्लेटफ़ॉर्म',
    heroSubheading: 'एक स्मार्ट स्कैन लोगों को आप तक तुरंत पहुंचने में मदद करता है, जबकि आपका फ़ोन नंबर निजी रहता है।',
  },
  gu: {
    navLinks: {
      hiw: 'આ કેવી રીતે કામ કરે છે',
      trust: 'RepiQR શા માટે',
      products: 'ઉત્પાદનો',
      distributor: 'ફ્રેન્ચાઇઝી',
      faq: 'વારંવાર પૂછાતા પ્રશ્નો',
    },
    joinUs: 'અમારી સાથે જોડાઓ',
    chooseYourService: 'તમારી સેવા પસંદ કરો',
    logIn: 'લૉગ ઇન કરો',
    dashboard: 'ડેશબોર્ડ',
    goToDashboard: 'ડેશબોર્ડ પર જાઓ',
    chooseTag: 'ટેગ પસંદ કરો',
    orderNewTags: 'નવા ટેગ ઓર્ડર કરો',
    trackOrder: 'ઓર્ડર ટ્રેક કરો',
    heroKicker: 'દરરોજની સુરક્ષિત મુસાફરી માટે બનાવેલ',
    heroHeadingLine1: 'ભારતનું પ્રથમ',
    heroHeadingHighlight: 'સૌથી સ્માર્ટ',
    heroHeadingLine2: 'QR સુરક્ષા પ્લેટફોર્મ',
    heroSubheading: 'એક સ્માર્ટ સ્કેન લોકોને તમારા સુધી તરત પહોંચવામાં મદદ કરે છે, જ્યારે તમારો ફોન નંબર ખાનગી રહે છે.',
  },
};
