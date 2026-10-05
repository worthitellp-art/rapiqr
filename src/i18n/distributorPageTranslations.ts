import type { Language } from '../context/LanguageContext';

/**
 * Copy for the public "become a distributor" landing page (DistributorPage).
 */
export const distributorPageTranslations: Record<Language, {
  backToHome: string;
  brand: string;
  networkTag: string;
  becomePartner: string;
  heroTitle: string;
  heroDesc: string;
  tiers: {
    id: string;
    name: string;
    badge: string;
    minUnits: string;
    margin: string;
    desc: string;
  }[];
  tierOptions: string[];
  businessOptions: string[];
  applicationReceived: string;
  thanksPrefix: string;
  thanksMiddle: string;
  thanksFor: string;
  contactYouOn: string;
  returnHome: string;
  partnerApplication: string;
  tellUsAboutBusiness: string;
  threeFieldsRequired: string;
  existingAppPrefix: string;
  existingAppStatus: string;
  existingAppNote: string;
  fullName: string;
  namePlaceholder: string;
  phone: string;
  phonePlaceholder: string;
  city: string;
  cityPlaceholder: string;
  businessType: string;
  desiredTier: string;
  sendingApplication: string;
  submitApplication: string;
  noFeeNote: string;
  submitErrorGeneric: string;
}> = {
  en: {
    backToHome: 'Back to home',
    brand: 'RAPIQR',
    networkTag: 'Distributor network',
    becomePartner: 'Become a partner',
    heroTitle: 'Sell the tag that sells itself.',
    heroDesc: 'Partner with RapiQR to distribute smart QR safety tags in your area, shop, or auto network — three tiers, from a single retail counter to a state-wide master franchise.',
    tiers: [
      {
        id: 'retailer-starter',
        name: 'Retailer Starter Pack',
        badge: 'Garages & retail shops',
        minUnits: '50 - 100 units',
        margin: '40%+ retail margin',
        desc: 'Ideal for auto garages, bike accessory shops, mobile stores, and local locksmiths.',
      },
      {
        id: 'city-franchise',
        name: 'City Exclusive Franchise',
        badge: 'Exclusive territory partner',
        minUnits: '500 - 1,000 units',
        margin: '50%+ exclusive margin',
        desc: 'Sole distributor rights for your city or district, with local buyer leads routed to you.',
      },
      {
        id: 'master-partner',
        name: 'Master State / Fleet Partner',
        badge: 'Regional master rights',
        minUnits: '2,500+ units',
        margin: '60%+ master margin',
        desc: 'State-level master franchise and large fleet deployments for corporate and logistics networks.',
      },
    ],
    tierOptions: ['Retail Kit (50 Units)', 'City Exclusive (500 Units)', 'Master State Partner (2500+ Units)'],
    businessOptions: ['Auto Accessories Shop', 'Car Dealership / Garage', 'Locksmith / Security Store', 'Regional Distributor', 'Other'],
    applicationReceived: 'Application received',
    thanksPrefix: 'Thanks,',
    thanksMiddle: 'Our partnerships team will review your',
    thanksFor: 'inquiry for',
    contactYouOn: 'and contact you on',
    returnHome: 'Return to home',
    partnerApplication: 'Partner application',
    tellUsAboutBusiness: 'Tell us about your business',
    threeFieldsRequired: 'Only three fields are required to get started.',
    existingAppPrefix: 'You already have an application on file for',
    existingAppStatus: 'status:',
    existingAppNote: 'Submitting again adds a new inquiry.',
    fullName: 'Full name *',
    namePlaceholder: 'Your name',
    phone: 'Phone *',
    phonePlaceholder: '10-digit mobile number',
    city: 'City *',
    cityPlaceholder: 'e.g. Pune',
    businessType: 'Business type',
    desiredTier: 'Desired tier',
    sendingApplication: 'Sending application',
    submitApplication: 'Submit application',
    noFeeNote: 'No fee to apply. Our partnerships team verifies every inquiry.',
    submitErrorGeneric: "We couldn't submit your application just now. Please try again.",
  },
  hi: {
    backToHome: 'होम पर वापस जाएं',
    brand: 'RAPIQR',
    networkTag: 'डिस्ट्रीब्यूटर नेटवर्क',
    becomePartner: 'पार्टनर बनें',
    heroTitle: 'वह टैग बेचें जो खुद बिकता है।',
    heroDesc: 'अपने क्षेत्र, दुकान या ऑटो नेटवर्क में स्मार्ट QR सेफ्टी टैग बांटने के लिए RapiQR के साथ पार्टनर बनें — एक रिटेल काउंटर से लेकर राज्यव्यापी मास्टर फ्रैंचाइज़ी तक तीन स्तर।',
    tiers: [
      {
        id: 'retailer-starter',
        name: 'रिटेलर स्टार्टर पैक',
        badge: 'गैराज और रिटेल दुकानें',
        minUnits: '50 - 100 यूनिट',
        margin: '40%+ रिटेल मार्जिन',
        desc: 'ऑटो गैराज, बाइक एक्सेसरी दुकानों, मोबाइल स्टोर और स्थानीय लॉकस्मिथ के लिए आदर्श।',
      },
      {
        id: 'city-franchise',
        name: 'सिटी एक्सक्लूसिव फ्रैंचाइज़ी',
        badge: 'एक्सक्लूसिव क्षेत्र पार्टनर',
        minUnits: '500 - 1,000 यूनिट',
        margin: '50%+ एक्सक्लूसिव मार्जिन',
        desc: 'आपके शहर या जिले के लिए एकमात्र डिस्ट्रीब्यूटर अधिकार, स्थानीय खरीदार लीड आपको भेजी जाएंगी।',
      },
      {
        id: 'master-partner',
        name: 'मास्टर स्टेट / फ्लीट पार्टनर',
        badge: 'क्षेत्रीय मास्टर अधिकार',
        minUnits: '2,500+ यूनिट',
        margin: '60%+ मास्टर मार्जिन',
        desc: 'कॉर्पोरेट और लॉजिस्टिक्स नेटवर्क के लिए राज्य-स्तरीय मास्टर फ्रैंचाइज़ी और बड़े फ्लीट डिप्लॉयमेंट।',
      },
    ],
    tierOptions: ['रिटेल किट (50 यूनिट)', 'सिटी एक्सक्लूसिव (500 यूनिट)', 'मास्टर स्टेट पार्टनर (2500+ यूनिट)'],
    businessOptions: ['ऑटो एक्सेसरीज़ शॉप', 'कार डीलरशिप / गैराज', 'लॉकस्मिथ / सिक्योरिटी स्टोर', 'रीजनल डिस्ट्रीब्यूटर', 'अन्य'],
    applicationReceived: 'आवेदन प्राप्त हुआ',
    thanksPrefix: 'धन्यवाद,',
    thanksMiddle: 'हमारी पार्टनरशिप टीम आपकी',
    thanksFor: 'के लिए इंक्वायरी की समीक्षा करेगी',
    contactYouOn: 'और आपसे इस नंबर पर संपर्क करेगी',
    returnHome: 'होम पर वापस जाएं',
    partnerApplication: 'पार्टनर आवेदन',
    tellUsAboutBusiness: 'अपने बिज़नेस के बारे में बताएं',
    threeFieldsRequired: 'शुरू करने के लिए केवल तीन फ़ील्ड आवश्यक हैं।',
    existingAppPrefix: 'आपके पास पहले से ही आवेदन मौजूद है',
    existingAppStatus: 'स्थिति:',
    existingAppNote: 'फिर से सबमिट करने पर एक नई इंक्वायरी जुड़ जाती है।',
    fullName: 'पूरा नाम *',
    namePlaceholder: 'आपका नाम',
    phone: 'फ़ोन *',
    phonePlaceholder: '10-अंकों का मोबाइल नंबर',
    city: 'शहर *',
    cityPlaceholder: 'जैसे पुणे',
    businessType: 'बिज़नेस प्रकार',
    desiredTier: 'इच्छित स्तर',
    sendingApplication: 'आवेदन भेजा जा रहा है',
    submitApplication: 'आवेदन सबमिट करें',
    noFeeNote: 'आवेदन करने की कोई फीस नहीं। हमारी पार्टनरशिप टीम हर इंक्वायरी सत्यापित करती है।',
    submitErrorGeneric: 'हम अभी आपका आवेदन सबमिट नहीं कर सके। कृपया फिर से प्रयास करें।',
  },
  gu: {
    backToHome: 'હોમ પર પાછા જાઓ',
    brand: 'RAPIQR',
    networkTag: 'ડિસ્ટ્રિબ્યુટર નેટવર્ક',
    becomePartner: 'પાર્ટનર બનો',
    heroTitle: 'એ ટેગ વેચો જે જાતે વેચાય છે.',
    heroDesc: 'તમારા વિસ્તાર, દુકાન અથવા ઓટો નેટવર્કમાં સ્માર્ટ QR સેફ્ટી ટેગ વિતરિત કરવા માટે RapiQR સાથે પાર્ટનર બનો — એક રિટેલ કાઉન્ટરથી રાજ્યવ્યાપી માસ્ટર ફ્રેન્ચાઇઝી સુધી ત્રણ સ્તર.',
    tiers: [
      {
        id: 'retailer-starter',
        name: 'રિટેલર સ્ટાર્ટર પેક',
        badge: 'ગેરેજ અને રિટેલ દુકાનો',
        minUnits: '50 - 100 યુનિટ',
        margin: '40%+ રિટેલ માર્જિન',
        desc: 'ઓટો ગેરેજ, બાઇક એસેસરી દુકાનો, મોબાઇલ સ્ટોર અને સ્થાનિક લોકસ્મિથ માટે આદર્શ.',
      },
      {
        id: 'city-franchise',
        name: 'સિટી એક્સક્લુઝિવ ફ્રેન્ચાઇઝી',
        badge: 'એક્સક્લુઝિવ ટેરિટરી પાર્ટનર',
        minUnits: '500 - 1,000 યુનિટ',
        margin: '50%+ એક્સક્લુઝિવ માર્જિન',
        desc: 'તમારા શહેર અથવા જિલ્લા માટે એકમાત્ર ડિસ્ટ્રિબ્યુટર અધિકારો, સ્થાનિક ખરીદનાર લીડ તમને મોકલવામાં આવશે.',
      },
      {
        id: 'master-partner',
        name: 'માસ્ટર સ્ટેટ / ફ્લીટ પાર્ટનર',
        badge: 'પ્રાદેશિક માસ્ટર અધિકારો',
        minUnits: '2,500+ યુનિટ',
        margin: '60%+ માસ્ટર માર્જિન',
        desc: 'કોર્પોરેટ અને લોજિસ્ટિક્સ નેટવર્ક માટે રાજ્ય-સ્તરીય માસ્ટર ફ્રેન્ચાઇઝી અને મોટા ફ્લીટ ડિપ્લોયમેન્ટ.',
      },
    ],
    tierOptions: ['રિટેલ કિટ (50 યુનિટ)', 'સિટી એક્સક્લુઝિવ (500 યુનિટ)', 'માસ્ટર સ્ટેટ પાર્ટનર (2500+ યુનિટ)'],
    businessOptions: ['ઓટો એસેસરીઝ શોપ', 'કાર ડીલરશિપ / ગેરેજ', 'લોકસ્મિથ / સિક્યુરિટી સ્ટોર', 'રિજનલ ડિસ્ટ્રિબ્યુટર', 'અન્ય'],
    applicationReceived: 'અરજી મળી ગઈ',
    thanksPrefix: 'આભાર,',
    thanksMiddle: 'અમારી પાર્ટનરશિપ ટીમ તમારી',
    thanksFor: 'માટેની પૂછપરછની સમીક્ષા કરશે',
    contactYouOn: 'અને તમારો આ નંબર પર સંપર્ક કરશે',
    returnHome: 'હોમ પર પાછા જાઓ',
    partnerApplication: 'પાર્ટનર અરજી',
    tellUsAboutBusiness: 'તમારા બિઝનેસ વિશે જણાવો',
    threeFieldsRequired: 'શરૂ કરવા માટે માત્ર ત્રણ ફીલ્ડ જરૂરી છે.',
    existingAppPrefix: 'તમારી પાસે પહેલેથી જ અરજી નોંધાયેલ છે',
    existingAppStatus: 'સ્થિતિ:',
    existingAppNote: 'ફરીથી સબમિટ કરવાથી નવી પૂછપરછ ઉમેરાય છે.',
    fullName: 'પૂરું નામ *',
    namePlaceholder: 'તમારું નામ',
    phone: 'ફોન *',
    phonePlaceholder: '10-અંકનો મોબાઇલ નંબર',
    city: 'શહેર *',
    cityPlaceholder: 'દા.ત. પુણે',
    businessType: 'બિઝનેસ પ્રકાર',
    desiredTier: 'ઇચ્છિત સ્તર',
    sendingApplication: 'અરજી મોકલાઈ રહી છે',
    submitApplication: 'અરજી સબમિટ કરો',
    noFeeNote: 'અરજી કરવા માટે કોઈ ફી નથી. અમારી પાર્ટનરશિપ ટીમ દરેક પૂછપરછ ચકાસે છે.',
    submitErrorGeneric: 'અમે હમણાં તમારી અરજી સબમિટ કરી શક્યા નહીં. કૃપા કરી ફરી પ્રયાસ કરો.',
  },
};
