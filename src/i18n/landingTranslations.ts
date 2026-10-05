import type { Language } from '../context/LanguageContext';

/**
 * Landing page copy, keyed by language. Covers the navbar, hero, and every
 * section down through the footer, toasts and modals. Deliberately NOT
 * translated: product names/descriptions and franchise tier names, since
 * those values flow into the cart (localStorage, read by checkout) and into
 * the distributor-application backend record — translating them would mean
 * the persisted value changes depending on which language the user had
 * selected at submit time.
 */
export const landingTranslations: Record<Language, {
  navLinks: { hiw: string; features: string; products: string; distributor: string; faq: string };
  joinUs: string;
  chooseYourService: string;
  logIn: string;
  dashboard: string;
  goToDashboard: string;
  chooseTag: string;
  orderNewTags: string;
  trackOrder: string;
  shopTags: string;
  shopSafetyTags: string;
  homeAria: string;
  openCartAria: string;
  closeCartAria: string;
  toggleNavAria: string;
  joinUsMobileLabel: string;
  hero: {
    headingLine1: string;
    headingLine2: string;
    headingLine3: string;
    subheading: string;
    cta: string;
    tagVehicle: string;
    tagHome: string;
  };
  heroShowcase: { scan: string; family: string; report: string };
  statsStrip: { privacyLabel: string; appsLabel: string };
  howItWorks: {
    kicker: string;
    title: string;
    subtitle: string;
    stepWord: string;
    steps: { title: string; description: string }[];
    stickMockup: { tagName: string; mount: string; peelStick: string; adhesive: string; weatherproof: string };
    scanMockup: { noAppNeeded: string };
    alertMockup: { maskedCall: string; numberPrivate: string; live: string; whatsappAlert: string; locationPin: string };
  };
  features: {
    kicker: string;
    title: string;
    subtitle: string;
    items: { title: string; description: string; badge: string }[];
  };
  platform: {
    title: string;
    badge: string;
    subtitle: string;
    vehiclesTitle: string;
    everydayTitle: string;
    windshield: string;
    orderTag: string;
    tryDemo: string;
    motorcycles: string;
    specs: string;
    fleets: string;
    bulkQuote: string;
    luggage: string;
    orderCharm: string;
    petCollars: string;
    scanDemo: string;
    gates: string;
    orderPlate: string;
    quote: string;
  };
  products: {
    kicker: string;
    title: string;
    subtitle: string;
    save: string;
    delivery: string;
    orderNow: string;
    addToCartAria: string;
  };
  franchise: {
    kicker: string;
    title: string;
    subtitle: string;
    exclusive: string;
    openDistributorDashboard: string;
    tiers: { starter: { bullets: string[]; cta: string }; city: { bullets: string[]; cta: string }; master: { bullets: string[]; cta: string } };
  };
  faq: {
    title: string;
    subtitle: string;
    items: { question: string; answer: string }[];
  };
  footer: {
    tagline: string;
    productsHeading: string;
    companyHeading: string;
    contactHeading: string;
    adhesiveTag: string;
    charmTag: string;
    howItWorks: string;
    privacyPolicy: string;
    contactLink: string;
    allRightsReserved: string;
    productOf: string;
  };
  cartToast: { addedPrefix: string; toCart: string; viewCart: string };
  cartDrawer: {
    title: string;
    closeAria: string;
    empty: string;
    browseProducts: string;
    subtotal: string;
    item: string;
    items: string;
    shippingNote: string;
    checkout: string;
    continueShopping: string;
    decreaseQtyAria: string;
    increaseQtyAria: string;
    removeAria: string;
    expandAria: string;
    collapseAria: string;
  };
  partnerModal: {
    title: string;
    receivedTitle: string;
    thankYouPrefix: string;
    thankYouSuffix: string;
    done: string;
    closeAria: string;
    nameLabel: string;
    namePlaceholder: string;
    phoneLabel: string;
    cityLabel: string;
    cityPlaceholder: string;
    submit: string;
  };
  joinModal: {
    title: string;
    partnerServiceFallback: string;
    submittedTitle: string;
    thankYouPrefix: string;
    thankYouSuffix: string;
    close: string;
    closeAria: string;
    nameLabel: string;
    namePlaceholder: string;
    phoneLabel: string;
    cityLabel: string;
    cityPlaceholder: string;
    submitting: string;
    submit: string;
  };
}> = {
  en: {
    navLinks: {
      hiw: 'How it works',
      features: 'Features',
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
    shopTags: 'Shop Tags',
    shopSafetyTags: 'Shop Safety Tags',
    homeAria: 'RepiQR home',
    openCartAria: 'Open cart',
    closeCartAria: 'Close cart',
    toggleNavAria: 'Toggle navigation',
    joinUsMobileLabel: 'Join us (Partner Services)',
    hero: {
      headingLine1: 'safety,',
      headingLine2: 'one scan',
      headingLine3: 'away',
      subheading: 'Connects you to the right person, when it matters — without exposing your phone number.',
      cta: 'Explore RepiQR',
      tagVehicle: 'VEHICLE SAFETY',
      tagHome: 'HOME SAFETY',
    },
    heroShowcase: {
      scan: 'Scan and connect directly from your smartphone.',
      family: 'Keep family informed in an emergency.',
      report: 'Report suspicious activity around the vehicle',
    },
    statsStrip: {
      privacyLabel: 'Phone Number Privacy',
      appsLabel: 'Apps Required for Finders',
    },
    howItWorks: {
      kicker: 'Three Simple Steps',
      title: 'How It Works',
      subtitle: 'Protect your essentials in minutes with zero setup friction.',
      stepWord: 'Step',
      steps: [
        { title: 'Stick', description: 'Peel and attach your weatherproof tag to your vehicle, bag, or pet collar.' },
        { title: 'Scan', description: 'A finder scans the QR code or taps the NFC tag using any smartphone camera.' },
        { title: 'Get Alerted', description: 'Receive an instant masked call or WhatsApp notification to connect safely.' },
      ],
      stickMockup: {
        tagName: 'REPIQR TAG',
        mount: 'Weatherproof Mount',
        peelStick: 'Peel & Stick',
        adhesive: 'Durable 3M Adhesive',
        weatherproof: 'Rain & UV Outdoor Proof',
      },
      scanMockup: { noAppNeeded: 'No app needed' },
      alertMockup: {
        maskedCall: 'Masked Call',
        numberPrivate: 'Number Private',
        live: 'Live',
        whatsappAlert: 'WhatsApp Alert',
        locationPin: '"Finder shared location pin"',
      },
    },
    features: {
      kicker: 'Privacy & Simplicity',
      title: 'Features',
      subtitle: 'Engineered with private telecom bridges and instant notifications.',
      items: [
        {
          title: 'Masked Calling',
          description: 'Callers connect through a private virtual number so neither party ever sees your real phone number.',
          badge: 'Privacy Shield',
        },
        {
          title: 'Instant WhatsApp & SMS',
          description: 'Receive immediate scan notifications with the finder’s note and optional location.',
          badge: 'Real-time Alerts',
        },
        {
          title: 'Emergency Contacts',
          description: 'Add backup family members who can be reached if you do not answer.',
          badge: 'Family Safety',
        },
        {
          title: 'No App & No Batteries',
          description: 'Passive NFC and QR tags require no charging and work in any standard smartphone browser.',
          badge: 'Zero Friction',
        },
      ],
    },
    platform: {
      title: 'Ready on Every Device',
      badge: 'Optimized for iOS, Android & Web Browsers',
      subtitle: 'No app download, no battery charging, and no manual Bluetooth pairing. Native smartphone camera scanning works out of the box.',
      vehiclesTitle: 'Vehicles & Fleets',
      everydayTitle: 'Everyday & Pets',
      windshield: 'Windshield Safety Tag',
      orderTag: 'Order Tag',
      tryDemo: 'Try Demo',
      motorcycles: 'Motorcycles & Helmets',
      specs: 'Specs',
      fleets: 'Commercial Fleets & Cabs',
      bulkQuote: 'Bulk Quote',
      luggage: 'Luggage & Keyring Charm',
      orderCharm: 'Order Charm',
      petCollars: 'Pet Collars & Leashes',
      scanDemo: 'Scan Demo',
      gates: 'Apartment Gates & Doors',
      orderPlate: 'Order Plate',
      quote: '“RepiQR falls somewhere between immediately helpful and peace of mind you can count on every single day.”',
    },
    products: {
      kicker: 'The Safety Collection',
      title: 'Products',
      subtitle: 'Choose the tag style that fits your lifestyle.',
      save: 'Save',
      delivery: 'Standard delivery 2–3 business days across India',
      orderNow: 'Order Now',
      addToCartAria: 'Add to cart',
    },
    franchise: {
      kicker: 'Wholesale Opportunities',
      title: 'Grow With RepiQR',
      subtitle: 'Wholesale distribution and territory franchise opportunities.',
      exclusive: 'Exclusive',
      openDistributorDashboard: 'Open distributor dashboard',
      tiers: {
        starter: {
          bullets: ['50% margin on retail ₹299 MRP', 'Countertop display packaging included'],
          cta: 'Inquire Starter Kit',
        },
        city: {
          bullets: ['60% margin on retail ₹299 MRP', 'Exclusive distribution rights for your city'],
          cta: 'Apply for City Franchise',
        },
        master: {
          bullets: ['70% margin on retail ₹299 MRP', 'State-wide distribution & bulk priority fulfillment'],
          cta: 'Contact for Master Rights',
        },
      },
    },
    faq: {
      title: 'Frequently Asked Questions',
      subtitle: 'Clear, practical answers about RepiQR technology.',
      items: [
        {
          question: 'How does masked calling protect my privacy?',
          answer: 'When someone scans your tag and taps "Call Owner", our cloud telecom system bridges the call through a virtual number. Neither party’s real phone number is ever revealed.',
        },
        {
          question: 'Does the person scanning need an app?',
          answer: 'No. Any smartphone camera or QR scanner opens the safety page directly in their web browser. No download or registration needed.',
        },
        {
          question: 'How does location sharing work?',
          answer: 'RepiQR tags are passive (no GPS chip or battery). When someone scans, their browser asks if they wish to share their location to assist you. If they accept, you receive a Google Maps pin.',
        },
        {
          question: 'Can I change my phone number or emergency contacts later?',
          answer: 'Yes. You can log into your web dashboard at any time to update phone numbers and backup emergency contacts without replacing the physical tag.',
        },
        {
          question: 'What happens if a tag arrives damaged?',
          answer: 'If your tag arrives damaged or fails to scan, we replace it free of charge within 7 days of delivery.',
        },
      ],
    },
    footer: {
      tagline: 'Scan. Connect. Stay Safe.',
      productsHeading: 'Products',
      companyHeading: 'Company',
      contactHeading: 'Contact',
      adhesiveTag: 'Adhesive Safety Tag',
      charmTag: 'Safety Keyring Charm',
      howItWorks: 'How It Works',
      privacyPolicy: 'Privacy Policy',
      contactLink: 'Contact',
      allRightsReserved: 'All rights reserved.',
      productOf: 'RepiQR is a product of Worthite LLP | GSTIN: 24AAFFW7093N1ZH',
    },
    cartToast: { addedPrefix: 'Added', toCart: 'to cart', viewCart: 'View cart' },
    cartDrawer: {
      title: 'Your cart',
      closeAria: 'Close cart',
      empty: 'Your cart is empty',
      browseProducts: 'Browse products',
      subtotal: 'Subtotal',
      item: 'item',
      items: 'items',
      shippingNote: 'Shipping & taxes at checkout',
      checkout: 'Checkout',
      continueShopping: 'Continue shopping',
      decreaseQtyAria: 'Decrease quantity',
      increaseQtyAria: 'Increase quantity',
      removeAria: 'Remove',
      expandAria: 'Expand cart',
      collapseAria: 'Collapse cart',
    },
    partnerModal: {
      title: 'Franchise Inquiry',
      receivedTitle: 'Inquiry Received',
      thankYouPrefix: 'Thank you,',
      thankYouSuffix: 'Our distribution team will review your inquiry and contact you shortly.',
      done: 'Done',
      closeAria: 'Close',
      nameLabel: 'Full Name / Business Name',
      namePlaceholder: 'e.g. Ramesh Auto Accessories',
      phoneLabel: 'Phone / WhatsApp',
      cityLabel: 'City & State',
      cityPlaceholder: 'e.g. Pune, Maharashtra',
      submit: 'Submit Inquiry',
    },
    joinModal: {
      title: 'Join as Service Partner',
      partnerServiceFallback: 'Partner Service',
      submittedTitle: 'Application Submitted',
      thankYouPrefix: 'Thank you,',
      thankYouSuffix: 'Our partner operations team will review your application and contact you.',
      close: 'Close',
      closeAria: 'Close',
      nameLabel: 'Business / Service Name',
      namePlaceholder: 'e.g. Apex Towing & Assistance',
      phoneLabel: 'Phone / WhatsApp',
      cityLabel: 'City & Operating Area',
      cityPlaceholder: 'e.g. Ahmedabad, Gujarat',
      submitting: 'Submitting…',
      submit: 'Apply as Partner',
    },
  },
  hi: {
    navLinks: {
      hiw: 'यह कैसे काम करता है',
      features: 'फीचर्स',
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
    shopTags: 'टैग खरीदें',
    shopSafetyTags: 'सेफ्टी टैग्स खरीदें',
    homeAria: 'RepiQR होम',
    openCartAria: 'कार्ट खोलें',
    closeCartAria: 'कार्ट बंद करें',
    toggleNavAria: 'नेविगेशन खोलें/बंद करें',
    joinUsMobileLabel: 'हमसे जुड़ें (पार्टनर सेवाएं)',
    hero: {
      headingLine1: 'सुरक्षा,',
      headingLine2: 'एक स्कैन',
      headingLine3: 'की दूरी पर',
      subheading: 'जब बात मायने रखे, आपको सही व्यक्ति से जोड़ता है — आपका फोन नंबर दिखाए बिना।',
      cta: 'RepiQR देखें',
      tagVehicle: 'वाहन सुरक्षा',
      tagHome: 'घर की सुरक्षा',
    },
    heroShowcase: {
      scan: 'अपने स्मार्टफोन से सीधे स्कैन करें और जुड़ें।',
      family: 'आपातकाल में परिवार को सूचित रखें।',
      report: 'वाहन के आसपास संदिग्ध गतिविधि की रिपोर्ट करें',
    },
    statsStrip: {
      privacyLabel: 'फोन नंबर गोपनीयता',
      appsLabel: 'खोजने वालों के लिए ऐप आवश्यक नहीं',
    },
    howItWorks: {
      kicker: 'तीन आसान चरण',
      title: 'यह कैसे काम करता है',
      subtitle: 'बिना किसी झंझट के मिनटों में अपनी ज़रूरी चीज़ों की सुरक्षा करें।',
      stepWord: 'चरण',
      steps: [
        { title: 'चिपकाएं', description: 'अपने वाहन, बैग या पेट कॉलर पर मौसम-रोधी टैग छीलकर चिपकाएं।' },
        { title: 'स्कैन करें', description: 'खोजने वाला किसी भी स्मार्टफोन कैमरे से QR कोड स्कैन करता है या NFC टैग टैप करता है।' },
        { title: 'अलर्ट पाएं', description: 'सुरक्षित रूप से जुड़ने के लिए तुरंत मास्क्ड कॉल या व्हाट्सएप सूचना प्राप्त करें।' },
      ],
      stickMockup: {
        tagName: 'REPIQR TAG',
        mount: 'मौसम-रोधी माउंट',
        peelStick: 'छीलें और चिपकाएं',
        adhesive: 'टिकाऊ 3M एडहेसिव',
        weatherproof: 'बारिश और यूवी आउटडोर प्रूफ',
      },
      scanMockup: { noAppNeeded: 'कोई ऐप आवश्यक नहीं' },
      alertMockup: {
        maskedCall: 'मास्क्ड कॉल',
        numberPrivate: 'नंबर गोपनीय',
        live: 'लाइव',
        whatsappAlert: 'व्हाट्सएप अलर्ट',
        locationPin: '"खोजने वाले ने लोकेशन पिन साझा किया"',
      },
    },
    features: {
      kicker: 'गोपनीयता और सरलता',
      title: 'फीचर्स',
      subtitle: 'प्राइवेट टेलीकॉम ब्रिज और तुरंत सूचनाओं के साथ तैयार किया गया।',
      items: [
        {
          title: 'मास्क्ड कॉलिंग',
          description: 'कॉलर एक प्राइवेट वर्चुअल नंबर के माध्यम से जुड़ते हैं, जिससे कोई भी पक्ष आपका असली फोन नंबर कभी नहीं देखता।',
          badge: 'प्राइवेसी शील्ड',
        },
        {
          title: 'तुरंत व्हाट्सएप और एसएमएस',
          description: 'खोजने वाले के नोट और वैकल्पिक लोकेशन के साथ तुरंत स्कैन सूचनाएं प्राप्त करें।',
          badge: 'रीयल-टाइम अलर्ट',
        },
        {
          title: 'आपातकालीन संपर्क',
          description: 'बैकअप परिवार के सदस्य जोड़ें जिनसे आपके जवाब न देने पर संपर्क किया जा सके।',
          badge: 'फैमिली सेफ्टी',
        },
        {
          title: 'न ऐप, न बैटरी',
          description: 'पैसिव NFC और QR टैग्स को चार्जिंग की ज़रूरत नहीं और यह किसी भी सामान्य स्मार्टफोन ब्राउज़र में काम करते हैं।',
          badge: 'ज़ीरो फ्रिक्शन',
        },
      ],
    },
    platform: {
      title: 'हर डिवाइस पर तैयार',
      badge: 'iOS, Android और वेब ब्राउज़र के लिए अनुकूलित',
      subtitle: 'कोई ऐप डाउनलोड नहीं, कोई बैटरी चार्जिंग नहीं, और कोई मैनुअल ब्लूटूथ पेयरिंग नहीं। नेटिव स्मार्टफोन कैमरा स्कैनिंग बिना किसी सेटअप के काम करती है।',
      vehiclesTitle: 'वाहन और फ्लीट',
      everydayTitle: 'रोज़मर्रा और पालतू जानवर',
      windshield: 'विंडशील्ड सेफ्टी टैग',
      orderTag: 'टैग ऑर्डर करें',
      tryDemo: 'डेमो आज़माएं',
      motorcycles: 'मोटरसाइकिल और हेलमेट',
      specs: 'विवरण',
      fleets: 'कमर्शियल फ्लीट और कैब',
      bulkQuote: 'बल्क कोटेशन',
      luggage: 'लगेज और कीरिंग चार्म',
      orderCharm: 'चार्म ऑर्डर करें',
      petCollars: 'पेट कॉलर और लीश',
      scanDemo: 'स्कैन डेमो',
      gates: 'अपार्टमेंट गेट और दरवाज़े',
      orderPlate: 'प्लेट ऑर्डर करें',
      quote: '"RepiQR, तुरंत मदद और हर दिन भरोसा कर सकने वाले मन की शांति के बीच कहीं ठहरता है।"',
    },
    products: {
      kicker: 'सेफ्टी कलेक्शन',
      title: 'उत्पाद',
      subtitle: 'वह टैग स्टाइल चुनें जो आपकी जीवनशैली के अनुकूल हो।',
      save: 'बचाएं',
      delivery: 'भारत भर में स्टैंडर्ड डिलीवरी 2–3 कार्य दिवस',
      orderNow: 'अभी ऑर्डर करें',
      addToCartAria: 'कार्ट में जोड़ें',
    },
    franchise: {
      kicker: 'थोक अवसर',
      title: 'RepiQR के साथ बढ़ें',
      subtitle: 'थोक वितरण और क्षेत्रीय फ्रैंचाइज़ी अवसर।',
      exclusive: 'एक्सक्लूसिव',
      openDistributorDashboard: 'डिस्ट्रीब्यूटर डैशबोर्ड खोलें',
      tiers: {
        starter: {
          bullets: ['₹299 MRP पर रिटेल में 50% मार्जिन', 'काउंटरटॉप डिस्प्ले पैकेजिंग शामिल'],
          cta: 'स्टार्टर किट के लिए पूछें',
        },
        city: {
          bullets: ['₹299 MRP पर रिटेल में 60% मार्जिन', 'आपके शहर के लिए एक्सक्लूसिव वितरण अधिकार'],
          cta: 'सिटी फ्रैंचाइज़ी के लिए आवेदन करें',
        },
        master: {
          bullets: ['₹299 MRP पर रिटेल में 70% मार्जिन', 'राज्यव्यापी वितरण और प्राथमिकता पूर्ति'],
          cta: 'मास्टर राइट्स के लिए संपर्क करें',
        },
      },
    },
    faq: {
      title: 'सामान्य प्रश्न',
      subtitle: 'RepiQR तकनीक के बारे में स्पष्ट, व्यावहारिक जवाब।',
      items: [
        {
          question: 'मास्क्ड कॉलिंग मेरी गोपनीयता की सुरक्षा कैसे करती है?',
          answer: 'जब कोई आपका टैग स्कैन करके "Call Owner" टैप करता है, तो हमारा क्लाउड टेलीकॉम सिस्टम कॉल को एक वर्चुअल नंबर के माध्यम से जोड़ता है। किसी भी पक्ष का असली फोन नंबर कभी सामने नहीं आता।',
        },
        {
          question: 'क्या स्कैन करने वाले व्यक्ति को ऐप चाहिए?',
          answer: 'नहीं। कोई भी स्मार्टफोन कैमरा या QR स्कैनर सीधे उनके वेब ब्राउज़र में सेफ्टी पेज खोल देता है। किसी डाउनलोड या रजिस्ट्रेशन की ज़रूरत नहीं।',
        },
        {
          question: 'लोकेशन शेयरिंग कैसे काम करती है?',
          answer: 'RepiQR टैग पैसिव होते हैं (कोई GPS चिप या बैटरी नहीं)। जब कोई स्कैन करता है, तो उनका ब्राउज़र पूछता है कि क्या वे आपकी मदद के लिए अपनी लोकेशन शेयर करना चाहते हैं। अगर वे मानते हैं, तो आपको एक Google Maps पिन मिलता है।',
        },
        {
          question: 'क्या मैं बाद में अपना फोन नंबर या आपातकालीन संपर्क बदल सकता हूं?',
          answer: 'हां। आप फिजिकल टैग बदले बिना कभी भी अपने वेब डैशबोर्ड में लॉग इन करके फोन नंबर और बैकअप आपातकालीन संपर्क अपडेट कर सकते हैं।',
        },
        {
          question: 'अगर टैग खराब होकर पहुंचे तो क्या होगा?',
          answer: 'अगर आपका टैग खराब होकर पहुंचता है या स्कैन नहीं होता, तो हम डिलीवरी के 7 दिनों के भीतर इसे मुफ्त में बदल देते हैं।',
        },
      ],
    },
    footer: {
      tagline: 'स्कैन करें। जुड़ें। सुरक्षित रहें।',
      productsHeading: 'उत्पाद',
      companyHeading: 'कंपनी',
      contactHeading: 'संपर्क',
      adhesiveTag: 'एडहेसिव सेफ्टी टैग',
      charmTag: 'सेफ्टी कीरिंग चार्म',
      howItWorks: 'यह कैसे काम करता है',
      privacyPolicy: 'प्राइवेसी पॉलिसी',
      contactLink: 'संपर्क करें',
      allRightsReserved: 'सभी अधिकार सुरक्षित।',
      productOf: 'RepiQR, Worthite LLP का एक उत्पाद है | GSTIN: 24AAFFW7093N1ZH',
    },
    cartToast: { addedPrefix: 'जोड़ा गया', toCart: 'कार्ट में', viewCart: 'कार्ट देखें' },
    cartDrawer: {
      title: 'आपका कार्ट',
      closeAria: 'कार्ट बंद करें',
      empty: 'आपका कार्ट खाली है',
      browseProducts: 'उत्पाद देखें',
      subtotal: 'उप-योग',
      item: 'आइटम',
      items: 'आइटम',
      shippingNote: 'शिपिंग और टैक्स चेकआउट पर',
      checkout: 'चेकआउट',
      continueShopping: 'खरीदारी जारी रखें',
      decreaseQtyAria: 'मात्रा घटाएं',
      increaseQtyAria: 'मात्रा बढ़ाएं',
      removeAria: 'हटाएं',
      expandAria: 'कार्ट बड़ा करें',
      collapseAria: 'कार्ट छोटा करें',
    },
    partnerModal: {
      title: 'फ्रैंचाइज़ी पूछताछ',
      receivedTitle: 'पूछताछ प्राप्त हुई',
      thankYouPrefix: 'धन्यवाद,',
      thankYouSuffix: 'हमारी डिस्ट्रीब्यूशन टीम आपकी पूछताछ की समीक्षा करेगी और शीघ्र ही आपसे संपर्क करेगी।',
      done: 'पूर्ण',
      closeAria: 'बंद करें',
      nameLabel: 'पूरा नाम / बिज़नेस नाम',
      namePlaceholder: 'जैसे Ramesh Auto Accessories',
      phoneLabel: 'फोन / व्हाट्सएप',
      cityLabel: 'शहर और राज्य',
      cityPlaceholder: 'जैसे पुणे, महाराष्ट्र',
      submit: 'पूछताछ भेजें',
    },
    joinModal: {
      title: 'सर्विस पार्टनर के रूप में जुड़ें',
      partnerServiceFallback: 'पार्टनर सेवा',
      submittedTitle: 'आवेदन सबमिट हुआ',
      thankYouPrefix: 'धन्यवाद,',
      thankYouSuffix: 'हमारी पार्टनर ऑपरेशंस टीम आपके आवेदन की समीक्षा करेगी और आपसे संपर्क करेगी।',
      close: 'बंद करें',
      closeAria: 'बंद करें',
      nameLabel: 'बिज़नेस / सर्विस का नाम',
      namePlaceholder: 'जैसे Apex Towing & Assistance',
      phoneLabel: 'फोन / व्हाट्सएप',
      cityLabel: 'शहर और कार्य क्षेत्र',
      cityPlaceholder: 'जैसे अहमदाबाद, गुजरात',
      submitting: 'सबमिट हो रहा है…',
      submit: 'पार्टनर के रूप में आवेदन करें',
    },
  },
  gu: {
    navLinks: {
      hiw: 'આ કેવી રીતે કામ કરે છે',
      features: 'ફીચર્સ',
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
    shopTags: 'ટેગ ખરીદો',
    shopSafetyTags: 'સેફ્ટી ટેગ્સ ખરીદો',
    homeAria: 'RepiQR હોમ',
    openCartAria: 'કાર્ટ ખોલો',
    closeCartAria: 'કાર્ટ બંધ કરો',
    toggleNavAria: 'નેવિગેશન ખોલો/બંધ કરો',
    joinUsMobileLabel: 'અમારી સાથે જોડાઓ (પાર્ટનર સેવાઓ)',
    hero: {
      headingLine1: 'સલામતી,',
      headingLine2: 'એક સ્કેન',
      headingLine3: 'જેટલી નજીક',
      subheading: 'જ્યારે જરૂર પડે, તમારો ફોન નંબર બતાવ્યા વગર તમને સાચી વ્યક્તિ સાથે જોડે છે.',
      cta: 'RepiQR જુઓ',
      tagVehicle: 'વાહન સલામતી',
      tagHome: 'ઘરની સલામતી',
    },
    heroShowcase: {
      scan: 'તમારા સ્માર્ટફોનથી સીધું સ્કેન કરીને જોડાઓ.',
      family: 'ઇમરજન્સીમાં પરિવારને માહિતગાર રાખો.',
      report: 'વાહનની આસપાસની શંકાસ્પદ પ્રવૃત્તિની જાણ કરો',
    },
    statsStrip: {
      privacyLabel: 'ફોન નંબર ગોપનીયતા',
      appsLabel: 'શોધનારાઓ માટે ઍપની જરૂર નથી',
    },
    howItWorks: {
      kicker: 'ત્રણ સરળ પગલાં',
      title: 'આ કેવી રીતે કામ કરે છે',
      subtitle: 'કોઈ પણ સેટઅપ મુશ્કેલી વગર મિનિટોમાં તમારી જરૂરી ચીજોનું રક્ષણ કરો.',
      stepWord: 'પગલું',
      steps: [
        { title: 'ચોંટાડો', description: 'તમારા વાહન, બેગ અથવા પેટ કોલર પર વેધરપ્રૂફ ટેગ છોલીને ચોંટાડો.' },
        { title: 'સ્કેન કરો', description: 'શોધનાર કોઈપણ સ્માર્ટફોન કેમેરાથી QR કોડ સ્કેન કરે છે અથવા NFC ટેગ ટેપ કરે છે.' },
        { title: 'એલર્ટ મેળવો', description: 'સુરક્ષિત રીતે જોડાવા માટે તરત જ માસ્ક્ડ કોલ અથવા વ્હોટ્સએપ સૂચના મેળવો.' },
      ],
      stickMockup: {
        tagName: 'REPIQR TAG',
        mount: 'વેધરપ્રૂફ માઉન્ટ',
        peelStick: 'છોલો અને ચોંટાડો',
        adhesive: 'ટકાઉ 3M એડહેસિવ',
        weatherproof: 'વરસાદ અને યુવી આઉટડોર પ્રૂફ',
      },
      scanMockup: { noAppNeeded: 'કોઈ ઍપની જરૂર નથી' },
      alertMockup: {
        maskedCall: 'માસ્ક્ડ કોલ',
        numberPrivate: 'નંબર ખાનગી',
        live: 'લાઇવ',
        whatsappAlert: 'વ્હોટ્સએપ એલર્ટ',
        locationPin: '"શોધનારે લોકેશન પિન શેર કર્યું"',
      },
    },
    features: {
      kicker: 'ગોપનીયતા અને સરળતા',
      title: 'ફીચર્સ',
      subtitle: 'પ્રાઇવેટ ટેલિકોમ બ્રિજ અને તરત સૂચનાઓ સાથે બનાવેલ.',
      items: [
        {
          title: 'માસ્ક્ડ કોલિંગ',
          description: 'કોલર્સ એક પ્રાઇવેટ વર્ચ્યુઅલ નંબર મારફતે જોડાય છે, જેથી કોઈ પણ પક્ષ તમારો સાચો ફોન નંબર ક્યારેય જોતો નથી.',
          badge: 'પ્રાઇવસી શીલ્ડ',
        },
        {
          title: 'તરત વ્હોટ્સએપ અને એસએમએસ',
          description: 'શોધનારની નોંધ અને વૈકલ્પિક લોકેશન સાથે તરત સ્કેન સૂચનાઓ મેળવો.',
          badge: 'રીઅલ-ટાઇમ એલર્ટ',
        },
        {
          title: 'ઇમરજન્સી સંપર્કો',
          description: 'બેકઅપ પરિવારના સભ્યો ઉમેરો જેમનો તમે જવાબ ન આપો ત્યારે સંપર્ક કરી શકાય.',
          badge: 'ફેમિલી સેફ્ટી',
        },
        {
          title: 'ન ઍપ, ન બેટરી',
          description: 'પેસિવ NFC અને QR ટેગ્સને ચાર્જિંગની જરૂર નથી અને તે કોઈપણ સામાન્ય સ્માર્ટફોન બ્રાઉઝરમાં કામ કરે છે.',
          badge: 'ઝીરો ફ્રિક્શન',
        },
      ],
    },
    platform: {
      title: 'દરેક ડિવાઇસ પર તૈયાર',
      badge: 'iOS, Android અને વેબ બ્રાઉઝર માટે ઓપ્ટિમાઇઝ્ડ',
      subtitle: 'કોઈ ઍપ ડાઉનલોડ નહીં, કોઈ બેટરી ચાર્જિંગ નહીં, અને કોઈ મેન્યુઅલ બ્લૂટૂથ પેરિંગ નહીં. નેટિવ સ્માર્ટફોન કેમેરા સ્કેનિંગ કોઈપણ સેટઅપ વિના કામ કરે છે.',
      vehiclesTitle: 'વાહનો અને ફ્લીટ',
      everydayTitle: 'રોજિંદું અને પાલતુ પ્રાણીઓ',
      windshield: 'વિન્ડશીલ્ડ સેફ્ટી ટેગ',
      orderTag: 'ટેગ ઓર્ડર કરો',
      tryDemo: 'ડેમો અજમાવો',
      motorcycles: 'મોટરસાઇકલ અને હેલમેટ',
      specs: 'વિગતો',
      fleets: 'કમર્શિયલ ફ્લીટ અને કેબ',
      bulkQuote: 'બલ્ક ક્વોટ',
      luggage: 'લગેજ અને કીરિંગ ચાર્મ',
      orderCharm: 'ચાર્મ ઓર્ડર કરો',
      petCollars: 'પેટ કોલર અને લીશ',
      scanDemo: 'સ્કેન ડેમો',
      gates: 'એપાર્ટમેન્ટ ગેટ અને દરવાજા',
      orderPlate: 'પ્લેટ ઓર્ડર કરો',
      quote: '"RepiQR તરત મદદરૂપ થવા અને રોજેરોજ ભરોસાપાત્ર મનની શાંતિ વચ્ચે ક્યાંક ઊભું છે."',
    },
    products: {
      kicker: 'સેફ્ટી કલેક્શન',
      title: 'ઉત્પાદનો',
      subtitle: 'તમારી જીવનશૈલીને અનુકૂળ ટેગ સ્ટાઇલ પસંદ કરો.',
      save: 'બચાવો',
      delivery: 'ભારતભરમાં સ્ટાન્ડર્ડ ડિલિવરી 2–3 કાર્યકારી દિવસ',
      orderNow: 'હવે ઓર્ડર કરો',
      addToCartAria: 'કાર્ટમાં ઉમેરો',
    },
    franchise: {
      kicker: 'હોલસેલ તકો',
      title: 'RepiQR સાથે વિકસો',
      subtitle: 'હોલસેલ ડિસ્ટ્રિબ્યુશન અને પ્રાદેશિક ફ્રેન્ચાઇઝી તકો.',
      exclusive: 'એક્સક્લુઝિવ',
      openDistributorDashboard: 'ડિસ્ટ્રિબ્યુટર ડેશબોર્ડ ખોલો',
      tiers: {
        starter: {
          bullets: ['₹299 MRP પર રિટેલમાં 50% માર્જિન', 'કાઉન્ટરટોપ ડિસ્પ્લે પેકેજિંગ સામેલ'],
          cta: 'સ્ટાર્ટર કિટ માટે પૂછપરછ કરો',
        },
        city: {
          bullets: ['₹299 MRP પર રિટેલમાં 60% માર્જિન', 'તમારા શહેર માટે એક્સક્લુઝિવ ડિસ્ટ્રિબ્યુશન અધિકારો'],
          cta: 'સિટી ફ્રેન્ચાઇઝી માટે અરજી કરો',
        },
        master: {
          bullets: ['₹299 MRP પર રિટેલમાં 70% માર્જિન', 'રાજ્યવ્યાપી ડિસ્ટ્રિબ્યુશન અને પ્રાયોરિટી ફુલફિલમેન્ટ'],
          cta: 'માસ્ટર રાઇટ્સ માટે સંપર્ક કરો',
        },
      },
    },
    faq: {
      title: 'વારંવાર પૂછાતા પ્રશ્નો',
      subtitle: 'RepiQR ટેકનોલોજી વિશે સ્પષ્ટ, વ્યવહારુ જવાબો.',
      items: [
        {
          question: 'માસ્ક્ડ કોલિંગ મારી ગોપનીયતાનું રક્ષણ કેવી રીતે કરે છે?',
          answer: 'જ્યારે કોઈ તમારો ટેગ સ્કેન કરીને "Call Owner" ટેપ કરે છે, ત્યારે અમારી ક્લાઉડ ટેલિકોમ સિસ્ટમ કોલને વર્ચ્યુઅલ નંબર મારફતે જોડે છે. કોઈ પણ પક્ષનો સાચો ફોન નંબર ક્યારેય જાહેર થતો નથી.',
        },
        {
          question: 'શું સ્કેન કરનાર વ્યક્તિને ઍપની જરૂર છે?',
          answer: 'ના. કોઈપણ સ્માર્ટફોન કેમેરા અથવા QR સ્કેનર તેમના વેબ બ્રાઉઝરમાં સીધું સેફ્ટી પેજ ખોલે છે. કોઈ ડાઉનલોડ અથવા રજિસ્ટ્રેશનની જરૂર નથી.',
        },
        {
          question: 'લોકેશન શેરિંગ કેવી રીતે કામ કરે છે?',
          answer: 'RepiQR ટેગ પેસિવ હોય છે (કોઈ GPS ચિપ અથવા બેટરી નહીં). જ્યારે કોઈ સ્કેન કરે છે, ત્યારે તેમનું બ્રાઉઝર પૂછે છે કે શું તેઓ તમારી મદદ માટે તેમનું લોકેશન શેર કરવા માંગે છે. જો તેઓ સ્વીકારે, તો તમને Google Maps પિન મળે છે.',
        },
        {
          question: 'શું હું પછીથી મારો ફોન નંબર અથવા ઇમરજન્સી સંપર્કો બદલી શકું?',
          answer: 'હા. તમે ભૌતિક ટેગ બદલ્યા વગર કોઈપણ સમયે તમારા વેબ ડેશબોર્ડમાં લૉગ ઇન કરીને ફોન નંબર અને બેકઅપ ઇમરજન્સી સંપર્કો અપડેટ કરી શકો છો.',
        },
        {
          question: 'જો ટેગ ખરાબ થઈને પહોંચે તો શું થાય?',
          answer: 'જો તમારો ટેગ ખરાબ થઈને પહોંચે અથવા સ્કેન ન થાય, તો અમે ડિલિવરીના 7 દિવસની અંદર તેને મફતમાં બદલી આપીએ છીએ.',
        },
      ],
    },
    footer: {
      tagline: 'સ્કેન કરો. જોડાઓ. સલામત રહો.',
      productsHeading: 'ઉત્પાદનો',
      companyHeading: 'કંપની',
      contactHeading: 'સંપર્ક',
      adhesiveTag: 'એડહેસિવ સેફ્ટી ટેગ',
      charmTag: 'સેફ્ટી કીરિંગ ચાર્મ',
      howItWorks: 'આ કેવી રીતે કામ કરે છે',
      privacyPolicy: 'પ્રાઇવસી પોલિસી',
      contactLink: 'સંપર્ક કરો',
      allRightsReserved: 'બધા અધિકારો સુરક્ષિત.',
      productOf: 'RepiQR, Worthite LLP નું ઉત્પાદન છે | GSTIN: 24AAFFW7093N1ZH',
    },
    cartToast: { addedPrefix: 'ઉમેરાયું', toCart: 'કાર્ટમાં', viewCart: 'કાર્ટ જુઓ' },
    cartDrawer: {
      title: 'તમારો કાર્ટ',
      closeAria: 'કાર્ટ બંધ કરો',
      empty: 'તમારો કાર્ટ ખાલી છે',
      browseProducts: 'ઉત્પાદનો જુઓ',
      subtotal: 'પેટા-કુલ',
      item: 'આઇટમ',
      items: 'આઇટમ',
      shippingNote: 'શિપિંગ અને ટેક્સ ચેકઆઉટ પર',
      checkout: 'ચેકઆઉટ',
      continueShopping: 'ખરીદી ચાલુ રાખો',
      decreaseQtyAria: 'જથ્થો ઘટાડો',
      increaseQtyAria: 'જથ્થો વધારો',
      removeAria: 'દૂર કરો',
      expandAria: 'કાર્ટ મોટું કરો',
      collapseAria: 'કાર્ટ નાનું કરો',
    },
    partnerModal: {
      title: 'ફ્રેન્ચાઇઝી પૂછપરછ',
      receivedTitle: 'પૂછપરછ મળી',
      thankYouPrefix: 'આભાર,',
      thankYouSuffix: 'અમારી ડિસ્ટ્રિબ્યુશન ટીમ તમારી પૂછપરછની સમીક્ષા કરશે અને ટૂંક સમયમાં તમારો સંપર્ક કરશે.',
      done: 'પૂર્ણ',
      closeAria: 'બંધ કરો',
      nameLabel: 'પૂરું નામ / બિઝનેસ નામ',
      namePlaceholder: 'દા.ત. Ramesh Auto Accessories',
      phoneLabel: 'ફોન / વ્હોટ્સએપ',
      cityLabel: 'શહેર અને રાજ્ય',
      cityPlaceholder: 'દા.ત. પુણે, મહારાષ્ટ્ર',
      submit: 'પૂછપરછ મોકલો',
    },
    joinModal: {
      title: 'સર્વિસ પાર્ટનર તરીકે જોડાઓ',
      partnerServiceFallback: 'પાર્ટનર સેવા',
      submittedTitle: 'અરજી સબમિટ થઈ',
      thankYouPrefix: 'આભાર,',
      thankYouSuffix: 'અમારી પાર્ટનર ઓપરેશન્સ ટીમ તમારી અરજીની સમીક્ષા કરશે અને તમારો સંપર્ક કરશે.',
      close: 'બંધ કરો',
      closeAria: 'બંધ કરો',
      nameLabel: 'બિઝનેસ / સર્વિસનું નામ',
      namePlaceholder: 'દા.ત. Apex Towing & Assistance',
      phoneLabel: 'ફોન / વ્હોટ્સએપ',
      cityLabel: 'શહેર અને કાર્યક્ષેત્ર',
      cityPlaceholder: 'દા.ત. અમદાવાદ, ગુજરાત',
      submitting: 'સબમિટ થઈ રહ્યું છે…',
      submit: 'પાર્ટનર તરીકે અરજી કરો',
    },
  },
};
