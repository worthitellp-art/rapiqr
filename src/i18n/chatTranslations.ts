import type { Language } from '../context/LanguageContext';

/**
 * Copy for the shared RepiChat panel (visitor sheet, dashboard drawer, owner
 * inbox). Actual message bodies, names and timestamps are never translated —
 * only the chrome around them.
 */
export const chatTranslations: Record<Language, {
  defaultTitles: { visitor: string; vehicleOwner: string; newChatMessage: string };
  day: { today: string; yesterday: string };
  status: { typing: string; connecting: string; online: string; reconnecting: string };
  empty: { title: string; subtitle: string };
  aria: {
    back: string;
    closeChat: string;
    scrollToLatest: string;
    attachImage: string;
    message: string;
    sendMessage: string;
    dismiss: string;
    openFullSize: string;
    closePreview: string;
    imagePreview: string;
  };
  composer: { placeholderReady: string; placeholderConnecting: string; dropToSend: string };
  newMessages: string;
  photoPreview: string;
  openLocation: string;
  retry: { notSent: string; imageNotSent: string };
  liveLocation: {
    live: string;
    shared: string;
    justNow: string;
    updatedAgo: (seconds: number) => string;
    openMap: string;
  };
  image: { sharedImageAlt: string };
  deliveryStatus: { notSent: string; sending: string; read: string; delivered: string; sent: string };
  errors: {
    onlyImages: string;
    tooLarge: (mb: string) => string;
    uploadFailedShort: string;
    uploadFailed: string;
    readFailed: string;
    readFailedGeneric: string;
    browserUnsupported: string;
  };
}> = {
  en: {
    defaultTitles: { visitor: 'Visitor', vehicleOwner: 'Vehicle Owner', newChatMessage: 'New Chat Message' },
    day: { today: 'Today', yesterday: 'Yesterday' },
    status: { typing: 'Typing…', connecting: 'Connecting…', online: 'Online', reconnecting: 'Reconnecting…' },
    empty: { title: 'No messages yet', subtitle: 'Say hello' },
    aria: {
      back: 'Back',
      closeChat: 'Close chat',
      scrollToLatest: 'Scroll to latest messages',
      attachImage: 'Attach an image',
      message: 'Message',
      sendMessage: 'Send message',
      dismiss: 'Dismiss',
      openFullSize: 'Open full size',
      closePreview: 'Close preview',
      imagePreview: 'Image preview',
    },
    composer: { placeholderReady: 'Message', placeholderConnecting: 'Connecting…', dropToSend: 'Drop to send' },
    newMessages: 'new',
    photoPreview: 'Photo',
    openLocation: '📍 Open location',
    retry: { notSent: 'Not sent · tap to retry', imageNotSent: 'Image not sent · tap to retry' },
    liveLocation: {
      live: 'Live location',
      shared: 'Location shared',
      justNow: 'just now',
      updatedAgo: (s) => `updated ${s}s ago`,
      openMap: 'Open map',
    },
    image: { sharedImageAlt: 'Shared image' },
    deliveryStatus: { notSent: 'Not sent', sending: 'Sending', read: 'Read', delivered: 'Delivered', sent: 'Sent' },
    errors: {
      onlyImages: 'Only images can be attached.',
      tooLarge: (mb) => `That image is ${mb} MB — please pick one under 25 MB.`,
      uploadFailedShort: 'Upload failed',
      uploadFailed: "That image couldn't be sent.",
      readFailed: 'That file could not be read as an image.',
      readFailedGeneric: 'That file could not be read.',
      browserUnsupported: 'This browser could not process the image.',
    },
  },
  hi: {
    defaultTitles: { visitor: 'विज़िटर', vehicleOwner: 'वाहन मालिक', newChatMessage: 'नया चैट मैसेज' },
    day: { today: 'आज', yesterday: 'कल' },
    status: { typing: 'टाइप कर रहे हैं…', connecting: 'कनेक्ट हो रहा है…', online: 'ऑनलाइन', reconnecting: 'पुनः कनेक्ट हो रहा है…' },
    empty: { title: 'अभी कोई मैसेज नहीं', subtitle: 'नमस्ते कहें' },
    aria: {
      back: 'पीछे',
      closeChat: 'चैट बंद करें',
      scrollToLatest: 'नवीनतम मैसेज पर जाएं',
      attachImage: 'इमेज जोड़ें',
      message: 'मैसेज',
      sendMessage: 'मैसेज भेजें',
      dismiss: 'हटाएं',
      openFullSize: 'पूरा आकार खोलें',
      closePreview: 'पूर्वावलोकन बंद करें',
      imagePreview: 'इमेज पूर्वावलोकन',
    },
    composer: { placeholderReady: 'मैसेज', placeholderConnecting: 'कनेक्ट हो रहा है…', dropToSend: 'भेजने के लिए यहां छोड़ें' },
    newMessages: 'नए',
    photoPreview: 'फोटो',
    openLocation: '📍 लोकेशन खोलें',
    retry: { notSent: 'नहीं भेजा गया · पुनः प्रयास करें', imageNotSent: 'इमेज नहीं भेजी गई · पुनः प्रयास करें' },
    liveLocation: {
      live: 'लाइव लोकेशन',
      shared: 'लोकेशन साझा की गई',
      justNow: 'अभी-अभी',
      updatedAgo: (s) => `${s} सेकंड पहले अपडेट हुआ`,
      openMap: 'मैप खोलें',
    },
    image: { sharedImageAlt: 'साझा की गई इमेज' },
    deliveryStatus: { notSent: 'नहीं भेजा गया', sending: 'भेजा जा रहा है', read: 'पढ़ा गया', delivered: 'डिलीवर हुआ', sent: 'भेजा गया' },
    errors: {
      onlyImages: 'केवल इमेज ही जोड़ी जा सकती हैं।',
      tooLarge: (mb) => `यह इमेज ${mb} MB की है — कृपया 25 MB से छोटी इमेज चुनें।`,
      uploadFailedShort: 'अपलोड विफल',
      uploadFailed: 'यह इमेज नहीं भेजी जा सकी।',
      readFailed: 'इस फ़ाइल को इमेज के रूप में नहीं पढ़ा जा सका।',
      readFailedGeneric: 'इस फ़ाइल को पढ़ा नहीं जा सका।',
      browserUnsupported: 'यह ब्राउज़र इस इमेज को प्रोसेस नहीं कर सका।',
    },
  },
  gu: {
    defaultTitles: { visitor: 'વિઝિટર', vehicleOwner: 'વાહન માલિક', newChatMessage: 'નવો ચેટ મેસેજ' },
    day: { today: 'આજે', yesterday: 'ગઈકાલે' },
    status: { typing: 'ટાઇપ કરી રહ્યાં છે…', connecting: 'કનેક્ટ થઈ રહ્યું છે…', online: 'ઓનલાઇન', reconnecting: 'ફરીથી કનેક્ટ થઈ રહ્યું છે…' },
    empty: { title: 'હજુ કોઈ મેસેજ નથી', subtitle: 'નમસ્તે કહો' },
    aria: {
      back: 'પાછળ',
      closeChat: 'ચેટ બંધ કરો',
      scrollToLatest: 'નવીનતમ મેસેજ પર જાઓ',
      attachImage: 'ઇમેજ જોડો',
      message: 'મેસેજ',
      sendMessage: 'મેસેજ મોકલો',
      dismiss: 'દૂર કરો',
      openFullSize: 'સંપૂર્ણ કદમાં ખોલો',
      closePreview: 'પૂર્વાવલોકન બંધ કરો',
      imagePreview: 'ઇમેજ પૂર્વાવલોકન',
    },
    composer: { placeholderReady: 'મેસેજ', placeholderConnecting: 'કનેક્ટ થઈ રહ્યું છે…', dropToSend: 'મોકલવા માટે અહીં છોડો' },
    newMessages: 'નવા',
    photoPreview: 'ફોટો',
    openLocation: '📍 લોકેશન ખોલો',
    retry: { notSent: 'મોકલાયું નથી · ફરી પ્રયાસ કરો', imageNotSent: 'ઇમેજ મોકલાઈ નથી · ફરી પ્રયાસ કરો' },
    liveLocation: {
      live: 'લાઇવ લોકેશન',
      shared: 'લોકેશન શેર કરાયું',
      justNow: 'હમણાં જ',
      updatedAgo: (s) => `${s} સેકન્ડ પહેલાં અપડેટ થયું`,
      openMap: 'મેપ ખોલો',
    },
    image: { sharedImageAlt: 'શેર કરેલી ઇમેજ' },
    deliveryStatus: { notSent: 'મોકલાયું નથી', sending: 'મોકલાઈ રહ્યું છે', read: 'વાંચ્યું', delivered: 'ડિલિવર થયું', sent: 'મોકલાયું' },
    errors: {
      onlyImages: 'માત્ર ઇમેજ જ જોડી શકાય છે.',
      tooLarge: (mb) => `આ ઇમેજ ${mb} MB ની છે — કૃપા કરીને 25 MB થી નાની ઇમેજ પસંદ કરો.`,
      uploadFailedShort: 'અપલોડ નિષ્ફળ',
      uploadFailed: 'આ ઇમેજ મોકલી શકાઈ નથી.',
      readFailed: 'આ ફાઇલને ઇમેજ તરીકે વાંચી શકાઈ નથી.',
      readFailedGeneric: 'આ ફાઇલ વાંચી શકાઈ નથી.',
      browserUnsupported: 'આ બ્રાઉઝર આ ઇમેજને પ્રોસેસ કરી શક્યું નથી.',
    },
  },
};
