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
    heroKicker: 'Privacy-First QR & NFC Safety Solutions',
    heroHeadingLine1: 'Smart QR Safety Tags for',
    heroHeadingHighlight: 'Everyday',
    heroHeadingLine2: 'Protection',
    heroSubheading: 'One scan lets people contact you via masked calls and instant WhatsApp alerts without ever seeing your personal phone number.',
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
    heroKicker: 'गोपनीयता-प्रथम QR और NFC सुरक्षा',
    heroHeadingLine1: 'रोजमर्रा की सुरक्षा के लिए',
    heroHeadingHighlight: 'स्मार्ट QR',
    heroHeadingLine2: 'सेफ्टी टैग्स',
    heroSubheading: 'एक स्कैन से लोग आपका निजी नंबर देखे बिना मास्क्ड कॉल या व्हाट्सएप से संपर्क कर सकते हैं।',
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
    heroKicker: 'પ્રાઇવસી-પ્રથમ QR અને NFC સુરક્ષા',
    heroHeadingLine1: 'રોજિંદી સુરક્ષા માટે',
    heroHeadingHighlight: 'સ્માર્ટ QR',
    heroHeadingLine2: 'સેફ્ટી ટેગ્સ',
    heroSubheading: 'એક સ્કેનથી લોકો તમારો અસલી નંબર જોયા વગર માસ્ક કરેલ કૉલ કે વ્હોટ્સએપ દ્વારા સંપર્ક કરી શકે છે.',
  },
};
