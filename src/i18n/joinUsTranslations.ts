import type { Language } from '../context/LanguageContext';

/**
 * Copy for the "Join as a partner" wizard, the public pricing page, and the
 * guest post-checkout dashboard-access modal — grouped together since all
 * three are small, standalone landing-area flows.
 */
export const joinUsTranslations: Record<Language, {
  joinUs: {
    header: { backToHome: string; back: string; partnerNetwork: string; stepOf: (n: number, total: number) => string };
    wizardSteps: { service: string; location: string; coverage: string; availability: string; details: string; review: string };
    success: {
      title: string;
      thankYou: (name: string, serviceLabel: string, city: string) => string;
      detailsRecorded: string;
      phoneQueued: (phone: string) => string;
      maskedCallActivated: string;
      returnHome: string;
    };
    hero: {
      badge: string;
      headline: string;
      subheading: string;
      benefits: { title: string; desc: string }[];
      trustLine: string;
    };
    summarySidebar: {
      applicationSummary: string;
      profileFallback: string;
      primaryServiceOffering: string;
      locationPending: string;
      radiusNotSet: string;
      radiusKm: (km: number) => string;
      extraAreas: (n: number) => string;
      supportedCategories: string;
      privacySafetyTitle: string;
      privacySafetyDesc: string;
      protectedViaMaskedRelay: string;
    };
    progress: { completeFields: string };
    step0: { heading: string; sub: string; categoriesLabel: string; optional: string };
    step1: {
      heading: string; sub: string; baseCityLabel: string; selectCityPlaceholder: string; dragPin: string;
      fullAddressLabel: string; buildingStreetPlaceholder: string; areaLocalityLabel: string; pinCodeLabel: string;
      sixDigitsPlaceholder: string; invalidPin: string; stateLabel: string; countryLabel: string; countryPlaceholder: string;
    };
    step2: {
      heading: string; sub: (city: string) => string; customRadius: string; customRadiusPlaceholder: string; kilometers: string;
      radiusRangeError: (min: number, max: number) => string; coverageSummary: (city: string, km: string) => string;
      estimatedDispatch: string; additionalZones: string; radiusLabel: (km: number) => string; addArea: string; cancel: string;
      addAnotherArea: string; additionalZoneLabel: string; newAreaPlaceholder: string;
    };
    step3: {
      heading: string; sub: string;
      availability: { label: string; sub: string }[];
      sameHoursEveryDay: string; customPerDay: string; to: string; closed: string;
      days: string[];
      summaryAlways: string; summaryDaytime: string; summaryNight: string;
      summaryEveryday: (open: string, close: string) => string; summaryCustom: (days: number) => string;
    };
    step4: {
      heading: string; sub: string; businessNameLabel: string; businessNamePlaceholder: string; contactMobileLabel: string;
      verifyNote: string; whatsappSameLabel: string; whatsappPlaceholder: string; whatsappInvalid: string; emailLabel: string;
      emailPlaceholder: string; emailInvalid: string; experienceLabel: string; experienceOptions: string[];
      notesLabel: string; notesPlaceholder: string;
    };
    step5: {
      heading: string; sub: string; providerNameFallback: string; base: string; dispatchRadius: string;
      extraAreasSuffix: (n: number) => string; availabilityLabel: string; phoneLabel: string; phoneSuffix: string; emailLabel: string;
      submitting: string; submitCta: string; agreementNote: string; errorFallback: string;
    };
    nav: { back: string; continue: string; editFromStart: string };
  };
  pricing: {
    backToHome: string;
    plansAndPricing: string;
    kicker: string;
    headline: string;
    subheading: string;
    mostPopular: string;
    plans: { id: string; name: string; desc: string; features: string[]; cta: string }[];
  };
  dashboardAccessModal: {
    close: string;
    title: string;
    verifyPrompt: string;
    enterCodeSentTo: (phone: string) => string;
    lockedTitle: string;
    lockedWord: string;
    incorrectCodesEntered: string;
    attemptsUsed: string;
    tryAgainIn: string;
    invalidPhone: string;
    sendFailed: string;
    verificationFailed: string;
    pleaseEnterCode: string;
    attemptsLeftSuffix: (n: number) => string;
    incorrectCodeTryAgain: string;
    resendFailed: string;
    phonePlaceholder: string;
    sendCode: string;
    locked: (time: string) => string;
    otpPlaceholder: string;
    verifyAndContinue: string;
    changePhoneNumber: string;
    resendCode: string;
    resendIn: (s: number) => string;
    noMoreCodes: (time: string) => string;
    sendLockedMessage: (max: number, time: string) => string;
    verifyLockedMessage: (max: number, time: string) => string;
  };
}> = {
  en: {
    joinUs: {
      header: { backToHome: 'Back to home', back: 'Back', partnerNetwork: 'Partner Network', stepOf: (n, total) => `Step ${n} of ${total}` },
      wizardSteps: { service: 'Service', location: 'Location', coverage: 'Coverage', availability: 'Availability', details: 'Details', review: 'Review' },
      success: {
        title: 'Application Submitted',
        thankYou: (name, serviceLabel, city) => `Thank you, ${name}. We have received your ${serviceLabel} partner application for ${city}.`,
        detailsRecorded: 'Details & coverage radius recorded',
        phoneQueued: (phone) => `Phone number (${phone}) queued for verification`,
        maskedCallActivated: 'Masked call routing will be activated upon approval',
        returnHome: 'Return to Homepage',
      },
      hero: {
        badge: 'Service Network',
        headline: 'Be the help someone finds.',
        subheading: 'Join the RepiQR service partner network. Connect with nearby customers in need of urgent roadside, medical, or key assistance through privacy-masked calls.',
        benefits: [
          { title: 'Private Number Masking', desc: 'Nearby scans route to your phone through a secure masked bridge. Your real number stays confidential.' },
          { title: 'Custom Categories & Reach', desc: 'Choose the exact sticker categories you service (vehicles, pets, bags, home) and set your travel radius.' },
          { title: 'Zero Listing or Platform Fees', desc: 'Free to join. Every provider profile is vetted for safety before listing to keep trust high.' },
        ],
        trustLine: 'Zero spam guarantee · Verified provider badge upon review',
      },
      summarySidebar: {
        applicationSummary: 'Application Summary',
        profileFallback: 'Service Provider Profile',
        primaryServiceOffering: 'Primary Service Offering',
        locationPending: 'Location pending selection',
        radiusNotSet: 'Coverage radius not set',
        radiusKm: (km) => `~${km} KM radius`,
        extraAreas: (n) => ` (+${n} extra area${n > 1 ? 's' : ''})`,
        supportedCategories: 'Supported Categories:',
        privacySafetyTitle: 'Privacy & Safety Standard',
        privacySafetyDesc: 'Your phone number is stored on encrypted servers and never displayed publicly. When a user requests assistance, our system connects you via a private masked bridge.',
        protectedViaMaskedRelay: '(Protected via masked relay)',
      },
      progress: { completeFields: 'Please complete all required fields before proceeding.' },
      step0: {
        heading: 'Which service do you provide?',
        sub: 'Select your primary specialty. You can adjust this or add more services later.',
        categoriesLabel: 'Tag categories covered',
        optional: '(optional)',
      },
      step1: {
        heading: 'Where is your base location?',
        sub: 'Customers scanning tags nearby will be routed based on your base city.',
        baseCityLabel: 'Base city *',
        selectCityPlaceholder: 'Select your city',
        dragPin: 'Drag the pin to fine-tune your base point.',
        fullAddressLabel: 'Full address',
        buildingStreetPlaceholder: 'Building, street',
        areaLocalityLabel: 'Area / locality',
        pinCodeLabel: 'PIN code',
        sixDigitsPlaceholder: '6 digits',
        invalidPin: 'Enter a valid 6-digit PIN code.',
        stateLabel: 'State',
        countryLabel: 'Country',
        countryPlaceholder: 'e.g. India',
      },
      step2: {
        heading: 'What is your operational radius?',
        sub: (city) => `Specify how far you can travel or dispatch assistance from ${city || 'your base'}.`,
        customRadius: 'Custom Radius',
        customRadiusPlaceholder: 'e.g. 35',
        kilometers: 'Kilometers',
        radiusRangeError: (min, max) => `Please enter a radius between ${min} and ${max} KM.`,
        coverageSummary: (city, km) => `${city || 'Base location'} · ${km} coverage radius`,
        estimatedDispatch: 'Estimated dispatch area for assistance requests',
        additionalZones: 'Additional coverage zones:',
        radiusLabel: (km) => `${km} KM radius`,
        addArea: 'Add Area',
        cancel: 'Cancel',
        addAnotherArea: 'Add another nearby area',
        additionalZoneLabel: 'Additional Service Zone',
        newAreaPlaceholder: 'e.g. Navi Mumbai',
      },
      step3: {
        heading: 'When are you available to respond?',
        sub: 'Inform users and emergency dispatch when your service line is active.',
        availability: [
          { label: '24/7 Service', sub: 'Available round the clock for emergencies' },
          { label: 'Daytime', sub: 'Standard business hours (Morning to Evening)' },
          { label: 'Night Shift', sub: 'Evening to early morning assistance' },
          { label: 'Custom Hours', sub: 'Define your specific operating schedule' },
        ],
        sameHoursEveryDay: 'Same hours every day',
        customPerDay: 'Custom per day',
        to: 'to',
        closed: 'Closed',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        summaryAlways: '24/7 Round the clock',
        summaryDaytime: 'Daytime',
        summaryNight: 'Night hours',
        summaryEveryday: (open, close) => `Everyday ${open} – ${close}`,
        summaryCustom: (days) => `${days} days/week (Custom hours)`,
      },
      step4: {
        heading: 'Provider & Contact Details',
        sub: 'Used solely for internal vetting and private dispatch routing.',
        businessNameLabel: 'Business / Provider Name *',
        businessNamePlaceholder: 'e.g. Apex 24x7 Roadside Assistance',
        contactMobileLabel: 'Official Contact Mobile *',
        verifyNote: 'Our team will verify this number. Customers only see a masked routing bridge.',
        whatsappSameLabel: 'WhatsApp number is same as contact mobile',
        whatsappPlaceholder: '10-digit WhatsApp number',
        whatsappInvalid: 'Enter a valid 10-digit WhatsApp number.',
        emailLabel: 'Business Email',
        emailPlaceholder: 'support@yourcompany.com',
        emailInvalid: 'Enter a valid email address.',
        experienceLabel: 'Experience in service',
        experienceOptions: ['New to this', '1–3 years', '3–5 years', '5–10 years', '10+ years'],
        notesLabel: 'Additional details or license info',
        notesPlaceholder: 'Fleet size, vehicle types, license info, certifications...',
      },
      step5: {
        heading: 'Review Your Partner Profile',
        sub: 'Please confirm your details before submitting for partner onboarding.',
        providerNameFallback: 'Provider Name',
        base: 'Base:',
        dispatchRadius: 'Dispatch Radius:',
        extraAreasSuffix: (n) => ` (+${n} extra area${n > 1 ? 's' : ''})`,
        availabilityLabel: 'Availability:',
        phoneLabel: 'Phone:',
        phoneSuffix: '(Calls routed through masked bridge)',
        emailLabel: 'Email:',
        submitting: 'Submitting Application…',
        submitCta: 'Submit Partner Application',
        agreementNote: 'By submitting, you agree to receive verification calls from the RepiQR team. No fee required.',
        errorFallback: "We couldn't submit your application just now. Please try again.",
      },
      nav: { back: 'Back', continue: 'Continue', editFromStart: 'Edit details from start' },
    },
    pricing: {
      backToHome: 'Back to home',
      plansAndPricing: 'Plans & pricing',
      kicker: 'Simple pricing',
      headline: 'Plans & packages for every asset.',
      subheading: 'One tag or a hundred — pick the pack that fits, and every plan ships with the same masked-call privacy and lifetime dashboard access.',
      mostPopular: 'Most Popular',
      plans: [
        { id: 'solo', name: 'Solo Starter', desc: 'One vehicle or personal asset.', features: ['1x weatherproof smart sticker', 'Masked call and WhatsApp alerts', 'Lifetime dashboard access'], cta: 'Order Now' },
        { id: 'family', name: 'Family Trio', desc: 'Three tags for car, bike and gate or pets.', features: ['3x multi-category smart tags', 'Multi-responder emergency tree', 'Free priority 48h shipping'], cta: 'Order Now' },
        { id: 'fleet', name: 'Society & Fleet', desc: 'Bulk tags for apartments, schools and logistics.', features: ['Custom branded logo and colours', 'Admin master fleet dashboard', 'Dedicated relationship manager'], cta: 'Inquire Bulk Quote' },
      ],
    },
    dashboardAccessModal: {
      close: 'Close',
      title: 'Access Your Dashboard',
      verifyPrompt: 'Verify your number — your tag is already linked to it.',
      enterCodeSentTo: (phone) => `Enter the code sent to ${phone}`,
      lockedTitle: 'Locked for 1 hour',
      lockedWord: 'Locked',
      incorrectCodesEntered: 'incorrect codes entered.',
      attemptsUsed: 'attempts used.',
      tryAgainIn: 'Try again in',
      invalidPhone: 'Please enter a valid 10-digit mobile number.',
      sendFailed: 'Failed to send verification code.',
      verificationFailed: 'Verification failed.',
      pleaseEnterCode: 'Please enter the verification code.',
      attemptsLeftSuffix: (n) => ` (${n} attempt${n !== 1 ? 's' : ''} left before 4-hour lock)`,
      incorrectCodeTryAgain: 'Incorrect code — please try again.',
      resendFailed: 'Failed to resend the code.',
      phonePlaceholder: '10-digit mobile number',
      sendCode: 'Send Verification Code',
      locked: (time) => `Locked · ${time}`,
      otpPlaceholder: 'Enter code',
      verifyAndContinue: 'Verify & Continue',
      changePhoneNumber: 'Change phone number',
      resendCode: 'Resend code',
      resendIn: (s) => `Resend in ${s}s`,
      noMoreCodes: (time) => `No more codes · ${time}`,
      sendLockedMessage: (max, time) => `You've used all ${max} code requests. For your security, new codes are locked for 1 hour — try again in ${time}.`,
      verifyLockedMessage: (max, time) => `Too many incorrect codes (${max}/${max}). For your security, verification is locked for 1 hour — try again in ${time}.`,
    },
  },
  hi: {
    joinUs: {
      header: { backToHome: 'होम पर वापस जाएं', back: 'वापस', partnerNetwork: 'पार्टनर नेटवर्क', stepOf: (n, total) => `चरण ${n} / ${total}` },
      wizardSteps: { service: 'सेवा', location: 'स्थान', coverage: 'कवरेज', availability: 'उपलब्धता', details: 'विवरण', review: 'समीक्षा' },
      success: {
        title: 'आवेदन सबमिट हो गया',
        thankYou: (name, serviceLabel, city) => `धन्यवाद, ${name}। हमें ${city} के लिए आपका ${serviceLabel} पार्टनर आवेदन मिल गया है।`,
        detailsRecorded: 'विवरण और कवरेज रेडियस दर्ज किया गया',
        phoneQueued: (phone) => `फ़ोन नंबर (${phone}) सत्यापन के लिए कतार में है`,
        maskedCallActivated: 'स्वीकृति मिलने पर मास्क्ड कॉल रूटिंग सक्रिय हो जाएगी',
        returnHome: 'होमपेज पर लौटें',
      },
      hero: {
        badge: 'सेवा नेटवर्क',
        headline: 'किसी की ज़रूरत के वक्त मदद बनें।',
        subheading: 'RepiQR सेवा पार्टनर नेटवर्क से जुड़ें। गोपनीयता-सुरक्षित कॉल के ज़रिए आपातकालीन रोडसाइड, मेडिकल या की-असिस्टेंस की ज़रूरत वाले आस-पास के ग्राहकों से जुड़ें।',
        benefits: [
          { title: 'निजी नंबर मास्किंग', desc: 'आस-पास के स्कैन सुरक्षित मास्क्ड ब्रिज के ज़रिए आपके फ़ोन पर रूट होते हैं। आपका असली नंबर गोपनीय रहता है।' },
          { title: 'कस्टम श्रेणियां और पहुंच', desc: 'आप जो स्टिकर श्रेणियां सेवा देते हैं (वाहन, पालतू, बैग, घर) उन्हें चुनें और अपनी यात्रा रेडियस सेट करें।' },
          { title: 'कोई लिस्टिंग या प्लेटफ़ॉर्म फ़ीस नहीं', desc: 'जुड़ना मुफ़्त है। भरोसा बनाए रखने के लिए सूचीबद्ध करने से पहले हर प्रोवाइडर प्रोफ़ाइल की सुरक्षा जांच होती है।' },
        ],
        trustLine: 'स्पैम-मुक्त गारंटी · समीक्षा के बाद सत्यापित प्रोवाइडर बैज',
      },
      summarySidebar: {
        applicationSummary: 'आवेदन सारांश',
        profileFallback: 'सेवा प्रोवाइडर प्रोफ़ाइल',
        primaryServiceOffering: 'मुख्य सेवा पेशकश',
        locationPending: 'स्थान चयन बाकी है',
        radiusNotSet: 'कवरेज रेडियस सेट नहीं है',
        radiusKm: (km) => `~${km} KM रेडियस`,
        extraAreas: (n) => ` (+${n} अतिरिक्त क्षेत्र)`,
        supportedCategories: 'समर्थित श्रेणियां:',
        privacySafetyTitle: 'गोपनीयता और सुरक्षा मानक',
        privacySafetyDesc: 'आपका फ़ोन नंबर एन्क्रिप्टेड सर्वर पर सुरक्षित रहता है और कभी सार्वजनिक रूप से नहीं दिखाया जाता। जब कोई उपयोगकर्ता सहायता का अनुरोध करता है, तो हमारा सिस्टम आपको एक निजी मास्क्ड ब्रिज के ज़रिए जोड़ता है।',
        protectedViaMaskedRelay: '(मास्क्ड रिले से सुरक्षित)',
      },
      progress: { completeFields: 'आगे बढ़ने से पहले कृपया सभी आवश्यक फ़ील्ड पूरी करें।' },
      step0: {
        heading: 'आप कौन सी सेवा प्रदान करते हैं?',
        sub: 'अपनी मुख्य विशेषता चुनें। आप इसे बाद में बदल सकते हैं या और सेवाएं जोड़ सकते हैं।',
        categoriesLabel: 'कवर किए गए टैग श्रेणियां',
        optional: '(वैकल्पिक)',
      },
      step1: {
        heading: 'आपका आधार स्थान कहां है?',
        sub: 'आस-पास टैग स्कैन करने वाले ग्राहक आपके आधार शहर के अनुसार रूट किए जाएंगे।',
        baseCityLabel: 'आधार शहर *',
        selectCityPlaceholder: 'अपना शहर चुनें',
        dragPin: 'अपने आधार बिंदु को ठीक करने के लिए पिन खींचें।',
        fullAddressLabel: 'पूरा पता',
        buildingStreetPlaceholder: 'भवन, गली',
        areaLocalityLabel: 'क्षेत्र / इलाका',
        pinCodeLabel: 'पिन कोड',
        sixDigitsPlaceholder: '6 अंक',
        invalidPin: 'सही 6-अंकों का पिन कोड दर्ज करें।',
        stateLabel: 'राज्य',
        countryLabel: 'देश',
        countryPlaceholder: 'उदा. भारत',
      },
      step2: {
        heading: 'आपकी सेवा रेडियस कितनी है?',
        sub: (city) => `बताएं कि आप ${city || 'अपने आधार'} से कितनी दूर तक यात्रा या सहायता भेज सकते हैं।`,
        customRadius: 'कस्टम रेडियस',
        customRadiusPlaceholder: 'उदा. 35',
        kilometers: 'किलोमीटर',
        radiusRangeError: (min, max) => `कृपया ${min} और ${max} KM के बीच रेडियस दर्ज करें।`,
        coverageSummary: (city, km) => `${city || 'आधार स्थान'} · ${km} कवरेज रेडियस`,
        estimatedDispatch: 'सहायता अनुरोधों के लिए अनुमानित डिस्पैच क्षेत्र',
        additionalZones: 'अतिरिक्त कवरेज क्षेत्र:',
        radiusLabel: (km) => `${km} KM रेडियस`,
        addArea: 'क्षेत्र जोड़ें',
        cancel: 'रद्द करें',
        addAnotherArea: 'एक और नज़दीकी क्षेत्र जोड़ें',
        additionalZoneLabel: 'अतिरिक्त सेवा क्षेत्र',
        newAreaPlaceholder: 'उदा. नवी मुंबई',
      },
      step3: {
        heading: 'आप कब जवाब देने के लिए उपलब्ध हैं?',
        sub: 'अपनी सेवा लाइन सक्रिय होने की जानकारी उपयोगकर्ताओं और आपातकालीन डिस्पैच को दें।',
        availability: [
          { label: '24/7 सेवा', sub: 'आपातकाल के लिए चौबीसों घंटे उपलब्ध' },
          { label: 'दिन के समय', sub: 'सामान्य कार्यालय समय (सुबह से शाम तक)' },
          { label: 'नाइट शिफ्ट', sub: 'शाम से सुबह तक सहायता' },
          { label: 'कस्टम घंटे', sub: 'अपना विशेष कार्य समय तय करें' },
        ],
        sameHoursEveryDay: 'हर दिन एक समान समय',
        customPerDay: 'हर दिन के लिए कस्टम',
        to: 'से',
        closed: 'बंद',
        days: ['सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार', 'रविवार'],
        summaryAlways: '24/7 चौबीसों घंटे',
        summaryDaytime: 'दिन के समय',
        summaryNight: 'रात के घंटे',
        summaryEveryday: (open, close) => `हर दिन ${open} – ${close}`,
        summaryCustom: (days) => `${days} दिन/सप्ताह (कस्टम घंटे)`,
      },
      step4: {
        heading: 'प्रोवाइडर और संपर्क विवरण',
        sub: 'केवल आंतरिक सत्यापन और निजी डिस्पैच रूटिंग के लिए उपयोग किया जाता है।',
        businessNameLabel: 'व्यवसाय / प्रोवाइडर का नाम *',
        businessNamePlaceholder: 'उदा. Apex 24x7 रोडसाइड असिस्टेंस',
        contactMobileLabel: 'आधिकारिक संपर्क मोबाइल *',
        verifyNote: 'हमारी टीम इस नंबर को सत्यापित करेगी। ग्राहकों को केवल एक मास्क्ड रूटिंग ब्रिज दिखाई देगा।',
        whatsappSameLabel: 'व्हाट्सएप नंबर संपर्क मोबाइल जैसा ही है',
        whatsappPlaceholder: '10-अंकों का व्हाट्सएप नंबर',
        whatsappInvalid: 'सही 10-अंकों का व्हाट्सएप नंबर दर्ज करें।',
        emailLabel: 'व्यवसाय ईमेल',
        emailPlaceholder: 'support@yourcompany.com',
        emailInvalid: 'सही ईमेल पता दर्ज करें।',
        experienceLabel: 'सेवा में अनुभव',
        experienceOptions: ['नया हूं', '1–3 वर्ष', '3–5 वर्ष', '5–10 वर्ष', '10+ वर्ष'],
        notesLabel: 'अतिरिक्त विवरण या लाइसेंस जानकारी',
        notesPlaceholder: 'फ़्लीट आकार, वाहन प्रकार, लाइसेंस जानकारी, प्रमाणपत्र...',
      },
      step5: {
        heading: 'अपनी पार्टनर प्रोफ़ाइल की समीक्षा करें',
        sub: 'पार्टनर ऑनबोर्डिंग के लिए सबमिट करने से पहले कृपया अपने विवरण की पुष्टि करें।',
        providerNameFallback: 'प्रोवाइडर का नाम',
        base: 'आधार:',
        dispatchRadius: 'डिस्पैच रेडियस:',
        extraAreasSuffix: (n) => ` (+${n} अतिरिक्त क्षेत्र)`,
        availabilityLabel: 'उपलब्धता:',
        phoneLabel: 'फ़ोन:',
        phoneSuffix: '(कॉल मास्क्ड ब्रिज से रूट होती हैं)',
        emailLabel: 'ईमेल:',
        submitting: 'आवेदन सबमिट हो रहा है…',
        submitCta: 'पार्टनर आवेदन सबमिट करें',
        agreementNote: 'सबमिट करके, आप RepiQR टीम से सत्यापन कॉल प्राप्त करने के लिए सहमत हैं। कोई फ़ीस नहीं।',
        errorFallback: 'अभी आपका आवेदन सबमिट नहीं हो सका। कृपया फिर से प्रयास करें।',
      },
      nav: { back: 'वापस', continue: 'जारी रखें', editFromStart: 'शुरू से विवरण संपादित करें' },
    },
    pricing: {
      backToHome: 'होम पर वापस जाएं',
      plansAndPricing: 'योजनाएं और मूल्य',
      kicker: 'सरल मूल्य निर्धारण',
      headline: 'हर एसेट के लिए योजनाएं और पैकेज।',
      subheading: 'एक टैग या सौ — जो पैक फिट हो वह चुनें, हर योजना के साथ एक जैसी मास्क्ड-कॉल गोपनीयता और लाइफटाइम डैशबोर्ड एक्सेस मिलता है।',
      mostPopular: 'सबसे लोकप्रिय',
      plans: [
        { id: 'solo', name: 'सोलो स्टार्टर', desc: 'एक वाहन या व्यक्तिगत एसेट।', features: ['1x वेदरप्रूफ स्मार्ट स्टिकर', 'मास्क्ड कॉल और व्हाट्सएप अलर्ट', 'लाइफटाइम डैशबोर्ड एक्सेस'], cta: 'अभी ऑर्डर करें' },
        { id: 'family', name: 'फ़ैमिली ट्रायो', desc: 'कार, बाइक और गेट या पालतू के लिए तीन टैग।', features: ['3x मल्टी-कैटेगरी स्मार्ट टैग', 'मल्टी-रेस्पॉन्डर इमरजेंसी ट्री', 'मुफ़्त प्रायोरिटी 48 घंटे शिपिंग'], cta: 'अभी ऑर्डर करें' },
        { id: 'fleet', name: 'सोसाइटी और फ़्लीट', desc: 'अपार्टमेंट, स्कूल और लॉजिस्टिक्स के लिए बल्क टैग।', features: ['कस्टम ब्रांडेड लोगो और रंग', 'एडमिन मास्टर फ़्लीट डैशबोर्ड', 'समर्पित रिलेशनशिप मैनेजर'], cta: 'बल्क कोटेशन पूछें' },
      ],
    },
    dashboardAccessModal: {
      close: 'बंद करें',
      title: 'अपना डैशबोर्ड एक्सेस करें',
      verifyPrompt: 'अपना नंबर सत्यापित करें — आपका टैग इससे पहले से जुड़ा है।',
      enterCodeSentTo: (phone) => `${phone} पर भेजा गया कोड दर्ज करें`,
      lockedTitle: '1 घंटे के लिए लॉक',
      lockedWord: 'लॉक',
      incorrectCodesEntered: 'गलत कोड दर्ज किए गए।',
      attemptsUsed: 'प्रयास उपयोग किए गए।',
      tryAgainIn: 'फिर से प्रयास करें',
      invalidPhone: 'कृपया सही 10-अंकों का मोबाइल नंबर दर्ज करें।',
      sendFailed: 'सत्यापन कोड भेजने में विफल।',
      verificationFailed: 'सत्यापन विफल।',
      pleaseEnterCode: 'कृपया सत्यापन कोड दर्ज करें।',
      attemptsLeftSuffix: (n) => ` (4-घंटे के लॉक से पहले ${n} प्रयास शेष)`,
      incorrectCodeTryAgain: 'गलत कोड — कृपया फिर से प्रयास करें।',
      resendFailed: 'कोड पुनः भेजने में विफल।',
      phonePlaceholder: '10-अंकों का मोबाइल नंबर',
      sendCode: 'सत्यापन कोड भेजें',
      locked: (time) => `लॉक · ${time}`,
      otpPlaceholder: 'कोड दर्ज करें',
      verifyAndContinue: 'सत्यापित करें और जारी रखें',
      changePhoneNumber: 'फ़ोन नंबर बदलें',
      resendCode: 'कोड पुनः भेजें',
      resendIn: (s) => `${s} सेकंड में पुनः भेजें`,
      noMoreCodes: (time) => `और कोड नहीं · ${time}`,
      sendLockedMessage: (max, time) => `आपने सभी ${max} कोड अनुरोधों का उपयोग कर लिया है। आपकी सुरक्षा के लिए, नए कोड 1 घंटे के लिए लॉक हैं — ${time} में फिर से प्रयास करें।`,
      verifyLockedMessage: (max, time) => `बहुत सारे गलत कोड (${max}/${max})। आपकी सुरक्षा के लिए, सत्यापन 1 घंटे के लिए लॉक है — ${time} में फिर से प्रयास करें।`,
    },
  },
  gu: {
    joinUs: {
      header: { backToHome: 'હોમ પર પાછા જાઓ', back: 'પાછળ', partnerNetwork: 'પાર્ટનર નેટવર્ક', stepOf: (n, total) => `પગલું ${n} / ${total}` },
      wizardSteps: { service: 'સેવા', location: 'સ્થાન', coverage: 'કવરેજ', availability: 'ઉપલબ્ધતા', details: 'વિગતો', review: 'સમીક્ષા' },
      success: {
        title: 'અરજી સબમિટ થઈ',
        thankYou: (name, serviceLabel, city) => `આભાર, ${name}. અમને ${city} માટે તમારી ${serviceLabel} પાર્ટનર અરજી મળી ગઈ છે.`,
        detailsRecorded: 'વિગતો અને કવરેજ રેડિયસ નોંધાઈ',
        phoneQueued: (phone) => `ફોન નંબર (${phone}) ચકાસણી માટે કતારમાં છે`,
        maskedCallActivated: 'મંજૂરી મળ્યા પછી માસ્ક્ડ કોલ રૂટિંગ સક્રિય થશે',
        returnHome: 'હોમપેજ પર પાછા જાઓ',
      },
      hero: {
        badge: 'સેવા નેટવર્ક',
        headline: 'કોઈની શોધેલી મદદ બનો.',
        subheading: 'RepiQR સેવા પાર્ટનર નેટવર્કમાં જોડાઓ. ગોપનીયતા-સુરક્ષિત કોલ દ્વારા તાત્કાલિક રોડસાઇડ, મેડિકલ અથવા કી-સહાયની જરૂર હોય તેવા નજીકના ગ્રાહકો સાથે જોડાઓ.',
        benefits: [
          { title: 'પ્રાઇવેટ નંબર માસ્કિંગ', desc: 'નજીકના સ્કેન સુરક્ષિત માસ્ક્ડ બ્રિજ દ્વારા તમારા ફોન પર રૂટ થાય છે. તમારો સાચો નંબર ગોપનીય રહે છે.' },
          { title: 'કસ્ટમ કેટેગરી અને પહોંચ', desc: 'તમે સેવા આપો છો તે ચોક્કસ સ્ટીકર કેટેગરી (વાહનો, પાલતુ, બેગ, ઘર) પસંદ કરો અને તમારો મુસાફરી રેડિયસ સેટ કરો.' },
          { title: 'કોઈ લિસ્ટિંગ અથવા પ્લેટફોર્મ ફી નહીં', desc: 'જોડાવું મફત છે. વિશ્વાસ જાળવવા માટે લિસ્ટિંગ પહેલાં દરેક પ્રોવાઈડર પ્રોફાઇલની સુરક્ષા ચકાસણી થાય છે.' },
        ],
        trustLine: 'ઝીરો સ્પામ ગેરંટી · સમીક્ષા પછી વેરિફાઈડ પ્રોવાઈડર બેજ',
      },
      summarySidebar: {
        applicationSummary: 'અરજી સારાંશ',
        profileFallback: 'સેવા પ્રોવાઈડર પ્રોફાઇલ',
        primaryServiceOffering: 'મુખ્ય સેવા ઓફર',
        locationPending: 'સ્થાન પસંદગી બાકી છે',
        radiusNotSet: 'કવરેજ રેડિયસ સેટ નથી',
        radiusKm: (km) => `~${km} KM રેડિયસ`,
        extraAreas: (n) => ` (+${n} વધારાના વિસ્તાર)`,
        supportedCategories: 'સમર્થિત કેટેગરીઓ:',
        privacySafetyTitle: 'ગોપનીયતા અને સુરક્ષા ધોરણ',
        privacySafetyDesc: 'તમારો ફોન નંબર એન્ક્રિપ્ટેડ સર્વર પર સુરક્ષિત રહે છે અને ક્યારેય જાહેરમાં બતાવવામાં આવતો નથી. જ્યારે કોઈ યુઝર સહાય માટે વિનંતી કરે, ત્યારે અમારી સિસ્ટમ તમને ખાનગી માસ્ક્ડ બ્રિજ દ્વારા જોડે છે.',
        protectedViaMaskedRelay: '(માસ્ક્ડ રિલે દ્વારા સુરક્ષિત)',
      },
      progress: { completeFields: 'આગળ વધતા પહેલાં કૃપા કરીને બધી જરૂરી ફીલ્ડ પૂર્ણ કરો.' },
      step0: {
        heading: 'તમે કઈ સેવા પ્રદાન કરો છો?',
        sub: 'તમારી મુખ્ય વિશેષતા પસંદ કરો. તમે પછીથી આ બદલી શકો છો અથવા વધુ સેવાઓ ઉમેરી શકો છો.',
        categoriesLabel: 'આવરી લેવાયેલ ટેગ કેટેગરીઓ',
        optional: '(વૈકલ્પિક)',
      },
      step1: {
        heading: 'તમારું બેઝ લોકેશન ક્યાં છે?',
        sub: 'નજીકમાં ટેગ સ્કેન કરતા ગ્રાહકો તમારા બેઝ શહેર પ્રમાણે રૂટ થશે.',
        baseCityLabel: 'બેઝ શહેર *',
        selectCityPlaceholder: 'તમારું શહેર પસંદ કરો',
        dragPin: 'તમારા બેઝ પોઈન્ટને ફાઈન-ટ્યુન કરવા માટે પિન ખેંચો.',
        fullAddressLabel: 'સંપૂર્ણ સરનામું',
        buildingStreetPlaceholder: 'બિલ્ડિંગ, શેરી',
        areaLocalityLabel: 'વિસ્તાર / લોકાલિટી',
        pinCodeLabel: 'પિન કોડ',
        sixDigitsPlaceholder: '6 આંકડા',
        invalidPin: 'યોગ્ય 6-આંકડાનો પિન કોડ દાખલ કરો.',
        stateLabel: 'રાજ્ય',
        countryLabel: 'દેશ',
        countryPlaceholder: 'દા.ત. ભારત',
      },
      step2: {
        heading: 'તમારો ઓપરેશનલ રેડિયસ કેટલો છે?',
        sub: (city) => `જણાવો કે તમે ${city || 'તમારા બેઝ'} થી કેટલું દૂર મુસાફરી અથવા સહાય મોકલી શકો છો.`,
        customRadius: 'કસ્ટમ રેડિયસ',
        customRadiusPlaceholder: 'દા.ત. 35',
        kilometers: 'કિલોમીટર',
        radiusRangeError: (min, max) => `કૃપા કરીને ${min} અને ${max} KM વચ્ચે રેડિયસ દાખલ કરો.`,
        coverageSummary: (city, km) => `${city || 'બેઝ લોકેશન'} · ${km} કવરેજ રેડિયસ`,
        estimatedDispatch: 'સહાય વિનંતીઓ માટે અંદાજિત ડિસ્પેચ વિસ્તાર',
        additionalZones: 'વધારાના કવરેજ ઝોન:',
        radiusLabel: (km) => `${km} KM રેડિયસ`,
        addArea: 'વિસ્તાર ઉમેરો',
        cancel: 'રદ કરો',
        addAnotherArea: 'બીજો નજીકનો વિસ્તાર ઉમેરો',
        additionalZoneLabel: 'વધારાનો સેવા ઝોન',
        newAreaPlaceholder: 'દા.ત. નવી મુંબઈ',
      },
      step3: {
        heading: 'તમે ક્યારે જવાબ આપવા માટે ઉપલબ્ધ છો?',
        sub: 'તમારી સેવા લાઈન સક્રિય હોય ત્યારે યુઝર્સ અને ઇમરજન્સી ડિસ્પેચને જણાવો.',
        availability: [
          { label: '24/7 સેવા', sub: 'ઇમરજન્સી માટે ચોવીસ કલાક ઉપલબ્ધ' },
          { label: 'દિવસના સમયે', sub: 'સામાન્ય ઓફિસ સમય (સવારથી સાંજ)' },
          { label: 'નાઇટ શિફ્ટ', sub: 'સાંજથી સવાર સુધી સહાય' },
          { label: 'કસ્ટમ કલાકો', sub: 'તમારું ખાસ કાર્ય શેડ્યૂલ નક્કી કરો' },
        ],
        sameHoursEveryDay: 'દરરોજ એક સરખો સમય',
        customPerDay: 'દરેક દિવસ માટે કસ્ટમ',
        to: 'થી',
        closed: 'બંધ',
        days: ['સોમવાર', 'મંગળવાર', 'બુધવાર', 'ગુરુવાર', 'શુક્રવાર', 'શનિવાર', 'રવિવાર'],
        summaryAlways: '24/7 ચોવીસ કલાક',
        summaryDaytime: 'દિવસના સમયે',
        summaryNight: 'રાત્રિના કલાકો',
        summaryEveryday: (open, close) => `દરરોજ ${open} – ${close}`,
        summaryCustom: (days) => `${days} દિવસ/અઠવાડિયું (કસ્ટમ કલાકો)`,
      },
      step4: {
        heading: 'પ્રોવાઈડર અને સંપર્ક વિગતો',
        sub: 'માત્ર આંતરિક ચકાસણી અને ખાનગી ડિસ્પેચ રૂટિંગ માટે વપરાય છે.',
        businessNameLabel: 'બિઝનેસ / પ્રોવાઈડર નામ *',
        businessNamePlaceholder: 'દા.ત. Apex 24x7 રોડસાઇડ આસિસ્ટન્સ',
        contactMobileLabel: 'ઓફિશિયલ સંપર્ક મોબાઈલ *',
        verifyNote: 'અમારી ટીમ આ નંબરની ચકાસણી કરશે. ગ્રાહકોને માત્ર માસ્ક્ડ રૂટિંગ બ્રિજ દેખાશે.',
        whatsappSameLabel: 'વોટ્સએપ નંબર સંપર્ક મોબાઈલ જેવો જ છે',
        whatsappPlaceholder: '10-આંકડાનો વોટ્સએપ નંબર',
        whatsappInvalid: 'યોગ્ય 10-આંકડાનો વોટ્સએપ નંબર દાખલ કરો.',
        emailLabel: 'બિઝનેસ ઈમેલ',
        emailPlaceholder: 'support@yourcompany.com',
        emailInvalid: 'યોગ્ય ઈમેલ સરનામું દાખલ કરો.',
        experienceLabel: 'સેવામાં અનુભવ',
        experienceOptions: ['નવા છીએ', '1–3 વર્ષ', '3–5 વર્ષ', '5–10 વર્ષ', '10+ વર્ષ'],
        notesLabel: 'વધારાની વિગતો અથવા લાઇસન્સ માહિતી',
        notesPlaceholder: 'ફ્લીટ સાઇઝ, વાહન પ્રકારો, લાઇસન્સ માહિતી, પ્રમાણપત્રો...',
      },
      step5: {
        heading: 'તમારી પાર્ટનર પ્રોફાઇલની સમીક્ષા કરો',
        sub: 'પાર્ટનર ઓનબોર્ડિંગ માટે સબમિટ કરતા પહેલાં કૃપા કરીને તમારી વિગતોની પુષ્ટિ કરો.',
        providerNameFallback: 'પ્રોવાઈડર નામ',
        base: 'બેઝ:',
        dispatchRadius: 'ડિસ્પેચ રેડિયસ:',
        extraAreasSuffix: (n) => ` (+${n} વધારાના વિસ્તાર)`,
        availabilityLabel: 'ઉપલબ્ધતા:',
        phoneLabel: 'ફોન:',
        phoneSuffix: '(કોલ માસ્ક્ડ બ્રિજ દ્વારા રૂટ થાય છે)',
        emailLabel: 'ઈમેલ:',
        submitting: 'અરજી સબમિટ થઈ રહી છે…',
        submitCta: 'પાર્ટનર અરજી સબમિટ કરો',
        agreementNote: 'સબમિટ કરીને, તમે RepiQR ટીમ પાસેથી ચકાસણી કોલ મેળવવા સંમત થાઓ છો. કોઈ ફી નહીં.',
        errorFallback: 'તમારી અરજી અત્યારે સબમિટ થઈ શકી નથી. કૃપા કરીને ફરી પ્રયાસ કરો.',
      },
      nav: { back: 'પાછળ', continue: 'આગળ વધો', editFromStart: 'શરૂઆતથી વિગતો સંપાદિત કરો' },
    },
    pricing: {
      backToHome: 'હોમ પર પાછા જાઓ',
      plansAndPricing: 'પ્લાન અને ભાવ',
      kicker: 'સરળ ભાવ નિર્ધારણ',
      headline: 'દરેક એસેટ માટે પ્લાન અને પેકેજ.',
      subheading: 'એક ટેગ હોય અથવા સો — જે પેક ફિટ થાય તે પસંદ કરો, દરેક પ્લાન સાથે એક સમાન માસ્ક્ડ-કોલ ગોપનીયતા અને લાઈફટાઇમ ડેશબોર્ડ એક્સેસ મળે છે.',
      mostPopular: 'સૌથી વધુ પસંદગી',
      plans: [
        { id: 'solo', name: 'સોલો સ્ટાર્ટર', desc: 'એક વાહન અથવા વ્યક્તિગત એસેટ.', features: ['1x વેધરપ્રૂફ સ્માર્ટ સ્ટીકર', 'માસ્ક્ડ કોલ અને વોટ્સએપ એલર્ટ', 'લાઈફટાઇમ ડેશબોર્ડ એક્સેસ'], cta: 'હવે ઓર્ડર કરો' },
        { id: 'family', name: 'ફેમિલી ટ્રાયો', desc: 'કાર, બાઇક અને ગેટ અથવા પાલતુ માટે ત્રણ ટેગ.', features: ['3x મલ્ટી-કેટેગરી સ્માર્ટ ટેગ', 'મલ્ટી-રેસ્પોન્ડર ઇમરજન્સી ટ્રી', 'ફ્રી પ્રાયોરિટી 48 કલાક શિપિંગ'], cta: 'હવે ઓર્ડર કરો' },
        { id: 'fleet', name: 'સોસાયટી અને ફ્લીટ', desc: 'એપાર્ટમેન્ટ, સ્કૂલ અને લોજિસ્ટિક્સ માટે બલ્ક ટેગ.', features: ['કસ્ટમ બ્રાન્ડેડ લોગો અને રંગો', 'એડમિન માસ્ટર ફ્લીટ ડેશબોર્ડ', 'સમર્પિત રિલેશનશિપ મેનેજર'], cta: 'બલ્ક ક્વોટ માટે પૂછો' },
      ],
    },
    dashboardAccessModal: {
      close: 'બંધ કરો',
      title: 'તમારું ડેશબોર્ડ એક્સેસ કરો',
      verifyPrompt: 'તમારો નંબર ચકાસો — તમારો ટેગ પહેલેથી જ તેની સાથે લિંક છે.',
      enterCodeSentTo: (phone) => `${phone} પર મોકલેલ કોડ દાખલ કરો`,
      lockedTitle: '1 કલાક માટે લૉક',
      lockedWord: 'લૉક',
      incorrectCodesEntered: 'ખોટા કોડ દાખલ થયા.',
      attemptsUsed: 'પ્રયાસો વપરાયા.',
      tryAgainIn: 'ફરી પ્રયાસ કરો',
      invalidPhone: 'કૃપા કરીને યોગ્ય 10-આંકડાનો મોબાઈલ નંબર દાખલ કરો.',
      sendFailed: 'ચકાસણી કોડ મોકલવામાં નિષ્ફળ.',
      verificationFailed: 'ચકાસણી નિષ્ફળ.',
      pleaseEnterCode: 'કૃપા કરીને ચકાસણી કોડ દાખલ કરો.',
      attemptsLeftSuffix: (n) => ` (4-કલાકના લૉક પહેલાં ${n} પ્રયાસો બાકી)`,
      incorrectCodeTryAgain: 'ખોટો કોડ — કૃપા કરીને ફરી પ્રયાસ કરો.',
      resendFailed: 'કોડ ફરીથી મોકલવામાં નિષ્ફળ.',
      phonePlaceholder: '10-આંકડાનો મોબાઈલ નંબર',
      sendCode: 'ચકાસણી કોડ મોકલો',
      locked: (time) => `લૉક · ${time}`,
      otpPlaceholder: 'કોડ દાખલ કરો',
      verifyAndContinue: 'ચકાસો અને આગળ વધો',
      changePhoneNumber: 'ફોન નંબર બદલો',
      resendCode: 'કોડ ફરીથી મોકલો',
      resendIn: (s) => `${s} સેકન્ડમાં ફરીથી મોકલો`,
      noMoreCodes: (time) => `વધુ કોડ નથી · ${time}`,
      sendLockedMessage: (max, time) => `તમે બધા ${max} કોડ વિનંતીઓનો ઉપયોગ કરી લીધો છે. તમારી સુરક્ષા માટે, નવા કોડ 1 કલાક માટે લૉક છે — ${time} માં ફરી પ્રયાસ કરો.`,
      verifyLockedMessage: (max, time) => `ઘણા બધા ખોટા કોડ (${max}/${max}). તમારી સુરક્ષા માટે, ચકાસણી 1 કલાક માટે લૉક છે — ${time} માં ફરી પ્રયાસ કરો.`,
    },
  },
};
