import type { Language } from '../context/LanguageContext';

/**
 * Copy for the trimmed-down header/footer reused outside the marketing
 * landing page (auth, scan, legal pages, etc).
 */
export const layoutTranslations: Record<Language, {
  header: {
    homeAriaLabel: string;
    secureRegistration: string;
  };
  footer: {
    tagline: string;
    privacyPolicy: string;
    isAProductOf: string;
    allRightsReserved: string;
  };
}> = {
  en: {
    header: {
      homeAriaLabel: 'RepiQR home',
      secureRegistration: 'Secure registration',
    },
    footer: {
      tagline: 'Scan. Connect. Stay Safe.',
      privacyPolicy: 'Privacy Policy',
      isAProductOf: 'is a product of',
      allRightsReserved: 'All rights reserved.',
    },
  },
  hi: {
    header: {
      homeAriaLabel: 'RepiQR होम',
      secureRegistration: 'सुरक्षित रजिस्ट्रेशन',
    },
    footer: {
      tagline: 'स्कैन करें। जुड़ें। सुरक्षित रहें।',
      privacyPolicy: 'गोपनीयता नीति',
      isAProductOf: 'का एक प्रोडक्ट है',
      allRightsReserved: 'सर्वाधिकार सुरक्षित।',
    },
  },
  gu: {
    header: {
      homeAriaLabel: 'RepiQR હોમ',
      secureRegistration: 'સુરક્ષિત રજિસ્ટ્રેશન',
    },
    footer: {
      tagline: 'સ્કેન કરો. જોડાઓ. સુરક્ષિત રહો.',
      privacyPolicy: 'પ્રાઇવસી પોલિસી',
      isAProductOf: 'નું એક પ્રોડક્ટ છે',
      allRightsReserved: 'તમામ અધિકારો આરક્ષિત.',
    },
  },
};
