import type { Language } from '../context/LanguageContext';

/**
 * Copy for the checkout flow, the tax invoice preview modal, and the
 * order-tracking modal. Dynamic values (amounts, order IDs, counts) are
 * modelled as functions so the surrounding sentence can still be translated.
 */
export const orderTranslations: Record<Language, {
  checkout: {
    backToShopFull: string;
    backToShopShort: string;
    backToShopAria: string;
    checkoutLabel: string;
    emptyCart: { title: string; description: string; browseButton: string };
    freeStickerBanner: { title: string; description: (amount: number) => string; linkedTo: string };
    guestBanner: { message: string; logIn: string };
    contactSection: {
      title: string; subtitle: string;
      fullNameLabel: string; fullNamePlaceholder: string; fullNameAria: string;
      phoneLabel: string;
      emailLabel: string; emailPlaceholder: string;
    };
    addressSection: {
      title: string; subtitle: string;
      streetLabel: string; streetPlaceholder: string;
      pincodeLabel: string; pincodePlaceholder: string;
      pincodeLookingUp: string; pincodeFound: string; pincodeNotFound: string;
      cityLabel: string; cityPlaceholder: string;
      stateLabel: string; statePlaceholder: string;
    };
    payButton: (amount: number) => string;
    termsNotice: string;
    orderSummary: {
      title: string;
      itemsCount: (count: number) => string;
      qty: (qty: number) => string;
      free: string;
      stickersLabel: string;
      deliveryLabel: string;
      balanceTopupLabel: string;
      totalAmountLabel: string;
      balanceAddedNote: (amount: number) => string;
      sslBadge: string;
      replacementBadge: string;
    };
    processing: { title: string; description: string };
    success: {
      title: string;
      thankYouPrefix: string;
      orderPrefix: string;
      confirmedPrefix: string;
      balanceSuffix: string;
      viewInvoice: string;
      registerTag: (name: string) => string;
      openDashboard: string;
      trackOrder: string;
      accessDashboard: string;
    };
    errors: {
      invalidTotal: string;
      orderNotConfirmed: string;
      gatewayLoadFailed: string;
      gatewayUnreachable: string;
      orderSavedSuffix: (orderId: string) => string;
      verificationFailedDefault: string;
      verificationFailedSuffix: (orderId: string) => string;
      paymentCancelled: string;
      paymentFailedPrefix: string;
      paymentFailedDefaultSuffix: string;
      requiredFields: string;
      invalidEmail: string;
      invalidPhone: string;
    };
  };
  invoiceModal: {
    title: string;
    printTitle: string;
    printButton: string;
    closeAria: string;
    officialBadge: string;
    invoiceNumberLabel: string;
    invoiceDateLabel: string;
    orderIdLabel: string;
    billedShippedTo: string;
    phoneLabel: string;
    emailLabel: string;
    orderPaymentStatus: string;
    paymentStatusPrefix: string;
    paymentModeLabel: string;
    gatewayRefLabel: string;
    fulfilledViaLabel: string;
    expressPriority: string;
    standardDelivery: string;
    orderPlacedLabel: string;
    itemDescriptionHeader: string;
    qtyHeader: string;
    unitRateHeader: string;
    amountHeader: string;
    hsnSacLabel: string;
    warrantyTitle: string;
    warrantyDescription: string;
    taxableBaseLabel: string;
    cgstLabel: string;
    sgstLabel: string;
    shippingFeeLabel: string;
    free: string;
    totalAmountPaidLabel: string;
    computerGeneratedNotice: string;
    closeButton: string;
    downloadPrintButton: string;
  };
  trackOrderModal: {
    steps: {
      placed: string; placedDesc: string;
      confirmed: string; confirmedDesc: string;
      shipped: string; shippedDesc: string;
      delivered: string; deliveredDesc: string;
    };
    cancelledTitle: string;
    cancelledDescription: string;
    placedOnPrefix: string;
    recent: string;
    paidOnline: string;
    paymentPending: string;
    recipientLabel: string;
    destinationLabel: string;
    dispatchedToAddress: string;
    expeditedCourier: string;
    awbLabel: string;
    liveCourier: string;
    milestonesEmptyState: string;
    dispatchActivityTitle: string;
    modalTitle: string;
    modalSubtitle: string;
    closeAria: string;
    phoneLabel: string;
    phonePlaceholder: string;
    searching: string;
    trackButton: string;
    errorInvalidPhone: string;
    errorNoOrdersFound: string;
    errorConnectionFailed: string;
    foundOrdersMessage: (count: number) => string;
    backToAllOrders: (count: number) => string;
    activateTagTitle: string;
    activateTagDescription: string;
    goToDashboard: string;
  };
}> = {
  en: {
    checkout: {
      backToShopFull: 'Back to Shop',
      backToShopShort: 'Back',
      backToShopAria: 'Back to shop',
      checkoutLabel: 'Checkout',
      emptyCart: {
        title: 'Your Cart is Empty',
        description: 'Add a weatherproof smart QR safety tag to protect your vehicle, pet, or valuable assets.',
        browseButton: 'Browse Products',
      },
      freeStickerBanner: {
        title: 'Your sticker is free!',
        description: (amount) => `You only pay ₹${amount}, and the full ₹${amount} is added to your RepiQR balance.`,
        linkedTo: 'Linked to',
      },
      guestBanner: {
        message: 'Quick guest checkout — no password required.',
        logIn: 'Log In',
      },
      contactSection: {
        title: 'Contact Information',
        subtitle: 'Where should we send your order confirmation and tag updates?',
        fullNameLabel: 'Full Name *',
        fullNamePlaceholder: 'e.g. Rahul Sharma',
        fullNameAria: 'Full Name',
        phoneLabel: 'Phone Number *',
        emailLabel: 'Email Address (Optional)',
        emailPlaceholder: 'e.g. rahul@example.com (optional)',
      },
      addressSection: {
        title: 'Shipping Address',
        subtitle: 'Physical stickers delivered in 2–3 business days across India',
        streetLabel: 'Street Address / House / Flat *',
        streetPlaceholder: 'Flat 402, Green Heights, Opp. City Park',
        pincodeLabel: 'Pincode *',
        pincodePlaceholder: '560001',
        pincodeLookingUp: 'Looking up location…',
        pincodeFound: '✓ City & State found',
        pincodeNotFound: 'Enter city manually',
        cityLabel: 'City *',
        cityPlaceholder: 'Bengaluru',
        stateLabel: 'State *',
        statePlaceholder: 'Karnataka',
      },
      payButton: (amount) => `Pay ₹${amount} & Add to Balance`,
      termsNotice: 'By proceeding you agree to RepiQR Terms of Service & Privacy Policy. Free replacement within 7 days.',
      orderSummary: {
        title: 'Order Summary',
        itemsCount: (count) => `${count} Items`,
        qty: (qty) => `Qty: ${qty}`,
        free: 'FREE',
        stickersLabel: 'Stickers',
        deliveryLabel: 'Delivery (2-3 Days)',
        balanceTopupLabel: 'Balance top-up',
        totalAmountLabel: 'Total Amount',
        balanceAddedNote: (amount) => `₹${amount} will be added to your balance.`,
        sslBadge: '256-bit SSL encrypted & verified payment',
        replacementBadge: 'Free replacement within 7 days if damaged',
      },
      processing: {
        title: 'Processing Payment Securely',
        description: 'Please do not close or refresh this page. Connecting to Razorpay…',
      },
      success: {
        title: 'Order Confirmed!',
        thankYouPrefix: 'Thank you, ',
        orderPrefix: '! Your order ',
        confirmedPrefix: ' is confirmed and ',
        balanceSuffix: ' has been added to your balance.',
        viewInvoice: 'View Invoice',
        registerTag: (name) => `Register ${name} Tag`,
        openDashboard: 'Open Client Dashboard',
        trackOrder: 'Track Order',
        accessDashboard: 'Access Dashboard',
      },
      errors: {
        invalidTotal: 'Your cart total looks invalid. Please remove and re-add the affected item, then try again.',
        orderNotConfirmed: "We couldn't confirm your order. Please check your connection and try again.",
        gatewayLoadFailed: 'Could not load the payment gateway. Please check your connection and try again.',
        gatewayUnreachable: "We couldn't reach the payment gateway.",
        orderSavedSuffix: (orderId) => ` Your order ${orderId} has been saved — nothing was charged. Please try paying again in a moment.`,
        verificationFailedDefault: 'Payment verification failed.',
        verificationFailedSuffix: (orderId) => ` If money was deducted it will be reconciled automatically — quote order ID ${orderId} if you need to contact support.`,
        paymentCancelled: 'Payment was cancelled — nothing was charged. You can try paying again.',
        paymentFailedPrefix: 'Payment failed: ',
        paymentFailedDefaultSuffix: 'please try again.',
        requiredFields: 'Please fill in all required fields.',
        invalidEmail: 'Please enter a valid email address.',
        invalidPhone: 'Please enter a valid 10-digit phone number.',
      },
    },
    invoiceModal: {
      title: 'Tax Invoice Preview',
      printTitle: 'Print or save as PDF',
      printButton: 'Print / PDF',
      closeAria: 'Close invoice preview',
      officialBadge: 'OFFICIAL TAX INVOICE',
      invoiceNumberLabel: 'Invoice Number',
      invoiceDateLabel: 'Invoice Date:',
      orderIdLabel: 'Order ID:',
      billedShippedTo: 'Billed & Shipped To',
      phoneLabel: 'Phone:',
      emailLabel: 'Email:',
      orderPaymentStatus: 'Order & Payment Status',
      paymentStatusPrefix: 'Payment Status: ',
      paymentModeLabel: 'Payment Mode:',
      gatewayRefLabel: 'Gateway Ref:',
      fulfilledViaLabel: 'Fulfilled via:',
      expressPriority: 'Express Priority (24-48 hrs)',
      standardDelivery: 'Standard Delivery',
      orderPlacedLabel: 'Order Placed:',
      itemDescriptionHeader: 'Item Description',
      qtyHeader: 'Qty',
      unitRateHeader: 'Unit Rate',
      amountHeader: 'Amount (₹)',
      hsnSacLabel: 'HSN/SAC:',
      warrantyTitle: '3-Year 3M Weatherproof Warranty Guarantee',
      warrantyDescription: 'Tags replaced free of charge for any sun fading, water damage, or adhesion failure under normal usage conditions.',
      taxableBaseLabel: 'Taxable Base:',
      cgstLabel: 'CGST (9%):',
      sgstLabel: 'SGST (9%):',
      shippingFeeLabel: 'Shipping Fee:',
      free: 'FREE',
      totalAmountPaidLabel: 'Total Amount Paid:',
      computerGeneratedNotice: 'This is a computer-generated tax invoice and requires no physical signature. Support:',
      closeButton: 'Close',
      downloadPrintButton: 'Download / Print Invoice',
    },
    trackOrderModal: {
      steps: {
        placed: 'Placed', placedDesc: 'Order received',
        confirmed: 'Confirmed', confirmedDesc: 'Payment verified',
        shipped: 'Shipped', shippedDesc: 'Courier picked up',
        delivered: 'Delivered', deliveredDesc: 'At your address',
      },
      cancelledTitle: 'Order Cancelled',
      cancelledDescription: 'This order has been cancelled. If payment was deducted, refund processes within 5-7 business days.',
      placedOnPrefix: 'Placed on ',
      recent: 'Recent',
      paidOnline: 'Paid Online',
      paymentPending: 'Payment Pending',
      recipientLabel: 'Recipient',
      destinationLabel: 'Destination',
      dispatchedToAddress: 'Dispatched to address',
      expeditedCourier: 'Expedited Courier',
      awbLabel: 'AWB:',
      liveCourier: 'Live Courier',
      milestonesEmptyState: 'Detailed scans will appear once the courier scans your parcel at the dispatch hub.',
      dispatchActivityTitle: 'Dispatch Activity',
      modalTitle: 'Track Safety Tag Order',
      modalSubtitle: 'Live order status and dispatch updates',
      closeAria: 'Close',
      phoneLabel: 'Phone Number',
      phonePlaceholder: '10-digit mobile number used at checkout',
      searching: 'Searching order records...',
      trackButton: 'Track Delivery Status',
      errorInvalidPhone: 'Please enter a valid 10-digit phone number.',
      errorNoOrdersFound: 'No orders found for this phone number.',
      errorConnectionFailed: 'Unable to connect to order tracking service.',
      foundOrdersMessage: (count) => `Found ${count} orders for this number — select one:`,
      backToAllOrders: (count) => `← Back to all ${count} orders`,
      activateTagTitle: 'Activate Tag Telephony & Emergency Contacts',
      activateTagDescription: 'Sign in with the phone number used for this order to program your vehicle plate, link emergency responders, and manage private masked calls.',
      goToDashboard: 'Go to Client Dashboard',
    },
  },
  hi: {
    checkout: {
      backToShopFull: 'शॉप पर वापस जाएं',
      backToShopShort: 'वापस',
      backToShopAria: 'शॉप पर वापस जाएं',
      checkoutLabel: 'चेकआउट',
      emptyCart: {
        title: 'आपकी कार्ट खाली है',
        description: 'अपने वाहन, पालतू जानवर या कीमती सामान की सुरक्षा के लिए एक वेदरप्रूफ स्मार्ट QR सेफ्टी टैग जोड़ें।',
        browseButton: 'उत्पाद देखें',
      },
      freeStickerBanner: {
        title: 'आपका स्टिकर मुफ़्त है!',
        description: (amount) => `आपको केवल ₹${amount} का भुगतान करना है, और पूरे ₹${amount} आपके RepiQR बैलेंस में जोड़ दिए जाएंगे।`,
        linkedTo: 'इससे जुड़ा हुआ',
      },
      guestBanner: {
        message: 'त्वरित गेस्ट चेकआउट — पासवर्ड की आवश्यकता नहीं।',
        logIn: 'लॉग इन करें',
      },
      contactSection: {
        title: 'संपर्क जानकारी',
        subtitle: 'हम आपकी ऑर्डर पुष्टि और टैग अपडेट कहां भेजें?',
        fullNameLabel: 'पूरा नाम *',
        fullNamePlaceholder: 'उदा. राहुल शर्मा',
        fullNameAria: 'पूरा नाम',
        phoneLabel: 'फ़ोन नंबर *',
        emailLabel: 'ईमेल पता (वैकल्पिक)',
        emailPlaceholder: 'उदा. rahul@example.com (वैकल्पिक)',
      },
      addressSection: {
        title: 'शिपिंग पता',
        subtitle: 'भारत में 2-3 कार्य दिवसों में फिजिकल स्टिकर डिलीवर किए जाते हैं',
        streetLabel: 'स्ट्रीट एड्रेस / घर / फ्लैट *',
        streetPlaceholder: 'फ्लैट 402, ग्रीन हाइट्स, सिटी पार्क के सामने',
        pincodeLabel: 'पिनकोड *',
        pincodePlaceholder: '560001',
        pincodeLookingUp: 'स्थान खोजा जा रहा है…',
        pincodeFound: '✓ शहर और राज्य मिल गया',
        pincodeNotFound: 'शहर मैन्युअल रूप से दर्ज करें',
        cityLabel: 'शहर *',
        cityPlaceholder: 'बेंगलुरु',
        stateLabel: 'राज्य *',
        statePlaceholder: 'कर्नाटक',
      },
      payButton: (amount) => `₹${amount} का भुगतान करें और बैलेंस में जोड़ें`,
      termsNotice: 'आगे बढ़ने पर आप RepiQR की सेवा शर्तों और प्राइवेसी पॉलिसी से सहमत होते हैं। 7 दिनों में मुफ़्त रिप्लेसमेंट।',
      orderSummary: {
        title: 'ऑर्डर सारांश',
        itemsCount: (count) => `${count} आइटम`,
        qty: (qty) => `मात्रा: ${qty}`,
        free: 'मुफ़्त',
        stickersLabel: 'स्टिकर',
        deliveryLabel: 'डिलीवरी (2-3 दिन)',
        balanceTopupLabel: 'बैलेंस टॉप-अप',
        totalAmountLabel: 'कुल राशि',
        balanceAddedNote: (amount) => `₹${amount} आपके बैलेंस में जोड़े जाएंगे।`,
        sslBadge: '256-बिट SSL एन्क्रिप्टेड और सत्यापित भुगतान',
        replacementBadge: 'क्षतिग्रस्त होने पर 7 दिनों में मुफ़्त रिप्लेसमेंट',
      },
      processing: {
        title: 'भुगतान सुरक्षित रूप से प्रोसेस हो रहा है',
        description: 'कृपया इस पेज को बंद या रीफ्रेश न करें। Razorpay से कनेक्ट हो रहा है…',
      },
      success: {
        title: 'ऑर्डर कन्फर्म हो गया!',
        thankYouPrefix: 'धन्यवाद, ',
        orderPrefix: '! आपका ऑर्डर ',
        confirmedPrefix: ' कन्फर्म हो गया है और ',
        balanceSuffix: ' आपके बैलेंस में जोड़ दिए गए हैं।',
        viewInvoice: 'इनवॉइस देखें',
        registerTag: (name) => `${name} टैग रजिस्टर करें`,
        openDashboard: 'क्लाइंट डैशबोर्ड खोलें',
        trackOrder: 'ऑर्डर ट्रैक करें',
        accessDashboard: 'डैशबोर्ड एक्सेस करें',
      },
      errors: {
        invalidTotal: 'आपकी कार्ट का कुल योग अमान्य लग रहा है। कृपया प्रभावित आइटम हटाएं और फिर से जोड़ें, फिर पुनः प्रयास करें।',
        orderNotConfirmed: 'हम आपके ऑर्डर की पुष्टि नहीं कर सके। कृपया अपना कनेक्शन जांचें और पुनः प्रयास करें।',
        gatewayLoadFailed: 'पेमेंट गेटवे लोड नहीं हो सका। कृपया अपना कनेक्शन जांचें और पुनः प्रयास करें।',
        gatewayUnreachable: 'हम पेमेंट गेटवे तक नहीं पहुंच सके।',
        orderSavedSuffix: (orderId) => ` आपका ऑर्डर ${orderId} सेव कर लिया गया है — कोई शुल्क नहीं लिया गया। कृपया थोड़ी देर में फिर से भुगतान करने का प्रयास करें।`,
        verificationFailedDefault: 'भुगतान सत्यापन विफल हो गया।',
        verificationFailedSuffix: (orderId) => ` यदि पैसे कट गए हैं तो यह स्वचालित रूप से समायोजित हो जाएगा — सहायता के लिए ऑर्डर ID ${orderId} बताएं।`,
        paymentCancelled: 'भुगतान रद्द कर दिया गया — कोई शुल्क नहीं लिया गया। आप फिर से भुगतान करने का प्रयास कर सकते हैं।',
        paymentFailedPrefix: 'भुगतान विफल: ',
        paymentFailedDefaultSuffix: 'कृपया पुनः प्रयास करें।',
        requiredFields: 'कृपया सभी आवश्यक फ़ील्ड भरें।',
        invalidEmail: 'कृपया एक मान्य ईमेल पता दर्ज करें।',
        invalidPhone: 'कृपया एक मान्य 10-अंकीय फ़ोन नंबर दर्ज करें।',
      },
    },
    invoiceModal: {
      title: 'टैक्स इनवॉइस पूर्वावलोकन',
      printTitle: 'प्रिंट करें या PDF के रूप में सहेजें',
      printButton: 'प्रिंट / PDF',
      closeAria: 'इनवॉइस पूर्वावलोकन बंद करें',
      officialBadge: 'आधिकारिक टैक्स इनवॉइस',
      invoiceNumberLabel: 'इनवॉइस नंबर',
      invoiceDateLabel: 'इनवॉइस तिथि:',
      orderIdLabel: 'ऑर्डर ID:',
      billedShippedTo: 'बिल व शिप किया गया',
      phoneLabel: 'फ़ोन:',
      emailLabel: 'ईमेल:',
      orderPaymentStatus: 'ऑर्डर व भुगतान स्थिति',
      paymentStatusPrefix: 'भुगतान स्थिति: ',
      paymentModeLabel: 'भुगतान मोड:',
      gatewayRefLabel: 'गेटवे रेफरेंस:',
      fulfilledViaLabel: 'इसके माध्यम से पूरा किया गया:',
      expressPriority: 'एक्सप्रेस प्रायोरिटी (24-48 घंटे)',
      standardDelivery: 'स्टैंडर्ड डिलीवरी',
      orderPlacedLabel: 'ऑर्डर दिया गया:',
      itemDescriptionHeader: 'आइटम विवरण',
      qtyHeader: 'मात्रा',
      unitRateHeader: 'यूनिट रेट',
      amountHeader: 'राशि (₹)',
      hsnSacLabel: 'HSN/SAC:',
      warrantyTitle: '3-वर्षीय 3M वेदरप्रूफ वारंटी गारंटी',
      warrantyDescription: 'सामान्य उपयोग की स्थितियों में धूप से रंग उड़ने, पानी से नुकसान या चिपकने में विफलता पर टैग मुफ़्त में बदले जाते हैं।',
      taxableBaseLabel: 'टैक्स योग्य आधार:',
      cgstLabel: 'CGST (9%):',
      sgstLabel: 'SGST (9%):',
      shippingFeeLabel: 'शिपिंग शुल्क:',
      free: 'मुफ़्त',
      totalAmountPaidLabel: 'कुल भुगतान की गई राशि:',
      computerGeneratedNotice: 'यह एक कंप्यूटर-जनित टैक्स इनवॉइस है और इसके लिए किसी भौतिक हस्ताक्षर की आवश्यकता नहीं है। सहायता:',
      closeButton: 'बंद करें',
      downloadPrintButton: 'इनवॉइस डाउनलोड / प्रिंट करें',
    },
    trackOrderModal: {
      steps: {
        placed: 'प्लेस्ड', placedDesc: 'ऑर्डर प्राप्त हुआ',
        confirmed: 'कन्फर्म्ड', confirmedDesc: 'भुगतान सत्यापित',
        shipped: 'शिप्ड', shippedDesc: 'कोरियर द्वारा उठाया गया',
        delivered: 'डिलीवर्ड', deliveredDesc: 'आपके पते पर',
      },
      cancelledTitle: 'ऑर्डर रद्द कर दिया गया',
      cancelledDescription: 'यह ऑर्डर रद्द कर दिया गया है। यदि भुगतान कट गया था, तो रिफंड 5-7 कार्य दिवसों में प्रोसेस होगा।',
      placedOnPrefix: 'दिया गया: ',
      recent: 'हाल ही में',
      paidOnline: 'ऑनलाइन भुगतान किया गया',
      paymentPending: 'भुगतान बाकी है',
      recipientLabel: 'प्राप्तकर्ता',
      destinationLabel: 'गंतव्य',
      dispatchedToAddress: 'पते पर भेजा गया',
      expeditedCourier: 'एक्सप्रेस कोरियर',
      awbLabel: 'AWB:',
      liveCourier: 'लाइव कोरियर',
      milestonesEmptyState: 'विस्तृत स्कैन तब दिखाई देंगे जब कोरियर डिस्पैच हब पर आपके पार्सल को स्कैन करेगा।',
      dispatchActivityTitle: 'डिस्पैच गतिविधि',
      modalTitle: 'सेफ्टी टैग ऑर्डर ट्रैक करें',
      modalSubtitle: 'लाइव ऑर्डर स्थिति और डिस्पैच अपडेट',
      closeAria: 'बंद करें',
      phoneLabel: 'फ़ोन नंबर',
      phonePlaceholder: 'चेकआउट पर इस्तेमाल किया गया 10-अंकीय मोबाइल नंबर',
      searching: 'ऑर्डर रिकॉर्ड खोजे जा रहे हैं...',
      trackButton: 'डिलीवरी स्थिति ट्रैक करें',
      errorInvalidPhone: 'कृपया एक मान्य 10-अंकीय फ़ोन नंबर दर्ज करें।',
      errorNoOrdersFound: 'इस फ़ोन नंबर के लिए कोई ऑर्डर नहीं मिला।',
      errorConnectionFailed: 'ऑर्डर ट्रैकिंग सेवा से कनेक्ट नहीं हो सका।',
      foundOrdersMessage: (count) => `इस नंबर के लिए ${count} ऑर्डर मिले — एक चुनें:`,
      backToAllOrders: (count) => `← सभी ${count} ऑर्डर पर वापस जाएं`,
      activateTagTitle: 'टैग टेलीफोनी और इमरजेंसी संपर्क सक्रिय करें',
      activateTagDescription: 'अपने वाहन की प्लेट प्रोग्राम करने, इमरजेंसी रेस्पॉन्डर्स को लिंक करने और प्राइवेट मास्क्ड कॉल्स को मैनेज करने के लिए इस ऑर्डर में इस्तेमाल किए गए फ़ोन नंबर से साइन इन करें।',
      goToDashboard: 'क्लाइंट डैशबोर्ड पर जाएं',
    },
  },
  gu: {
    checkout: {
      backToShopFull: 'શોપ પર પાછા જાઓ',
      backToShopShort: 'પાછા',
      backToShopAria: 'શોપ પર પાછા જાઓ',
      checkoutLabel: 'ચેકઆઉટ',
      emptyCart: {
        title: 'તમારી કાર્ટ ખાલી છે',
        description: 'તમારા વાહન, પાલતુ પ્રાણી અથવા કિંમતી સામાનની સુરક્ષા માટે વેધરપ્રૂફ સ્માર્ટ QR સેફ્ટી ટેગ ઉમેરો.',
        browseButton: 'ઉત્પાદનો જુઓ',
      },
      freeStickerBanner: {
        title: 'તમારું સ્ટીકર મુક્ત છે!',
        description: (amount) => `તમે માત્ર ₹${amount} ચૂકવો છો, અને સંપૂર્ણ ₹${amount} તમારા RepiQR બેલેન્સમાં ઉમેરાશે.`,
        linkedTo: 'સાથે લિંક્ડ',
      },
      guestBanner: {
        message: 'ઝડપી ગેસ્ટ ચેકઆઉટ — પાસવર્ડની જરૂર નથી.',
        logIn: 'લૉગ ઇન કરો',
      },
      contactSection: {
        title: 'સંપર્ક માહિતી',
        subtitle: 'તમારી ઓર્ડર પુષ્ટિ અને ટેગ અપડેટ્સ અમે ક્યાં મોકલીએ?',
        fullNameLabel: 'પૂરું નામ *',
        fullNamePlaceholder: 'દા.ત. રાહુલ શર્મા',
        fullNameAria: 'પૂરું નામ',
        phoneLabel: 'ફોન નંબર *',
        emailLabel: 'ઇમેઇલ સરનામું (વૈકલ્પિક)',
        emailPlaceholder: 'દા.ત. rahul@example.com (વૈકલ્પિક)',
      },
      addressSection: {
        title: 'શિપિંગ સરનામું',
        subtitle: 'ભારતભરમાં 2-3 કાર્યકારી દિવસોમાં ફિઝિકલ સ્ટીકર ડિલિવર કરવામાં આવે છે',
        streetLabel: 'શેરી સરનામું / ઘર / ફ્લેટ *',
        streetPlaceholder: 'ફ્લેટ 402, ગ્રીન હાઇટ્સ, સિટી પાર્કની સામે',
        pincodeLabel: 'પિનકોડ *',
        pincodePlaceholder: '560001',
        pincodeLookingUp: 'સ્થાન શોધી રહ્યા છીએ…',
        pincodeFound: '✓ શહેર અને રાજ્ય મળ્યું',
        pincodeNotFound: 'શહેર જાતે દાખલ કરો',
        cityLabel: 'શહેર *',
        cityPlaceholder: 'બેંગલુરુ',
        stateLabel: 'રાજ્ય *',
        statePlaceholder: 'કર્ણાટક',
      },
      payButton: (amount) => `₹${amount} ચૂકવો અને બેલેન્સમાં ઉમેરો`,
      termsNotice: 'આગળ વધવાથી તમે RepiQR ની સેવા શરતો અને પ્રાઇવસી પોલિસી સાથે સંમત થાઓ છો. 7 દિવસમાં મુક્ત રિપ્લેસમેન્ટ.',
      orderSummary: {
        title: 'ઓર્ડર સારાંશ',
        itemsCount: (count) => `${count} આઇટમ્સ`,
        qty: (qty) => `જથ્થો: ${qty}`,
        free: 'મુક્ત',
        stickersLabel: 'સ્ટીકર',
        deliveryLabel: 'ડિલિવરી (2-3 દિવસ)',
        balanceTopupLabel: 'બેલેન્સ ટોપ-અપ',
        totalAmountLabel: 'કુલ રકમ',
        balanceAddedNote: (amount) => `₹${amount} તમારા બેલેન્સમાં ઉમેરાશે.`,
        sslBadge: '256-બિટ SSL એન્ક્રિપ્ટેડ અને ચકાસાયેલ પેમેન્ટ',
        replacementBadge: 'નુકસાન થયે 7 દિવસમાં મુક્ત રિપ્લેસમેન્ટ',
      },
      processing: {
        title: 'પેમેન્ટ સુરક્ષિત રીતે પ્રોસેસ થઈ રહ્યું છે',
        description: 'કૃપા કરી આ પેજ બંધ અથવા રિફ્રેશ ન કરો. Razorpay સાથે જોડાઈ રહ્યા છીએ…',
      },
      success: {
        title: 'ઓર્ડર કન્ફર્મ થયો!',
        thankYouPrefix: 'આભાર, ',
        orderPrefix: '! તમારો ઓર્ડર ',
        confirmedPrefix: ' કન્ફર્મ થયો છે અને ',
        balanceSuffix: ' તમારા બેલેન્સમાં ઉમેરાયા છે.',
        viewInvoice: 'ઇનવોઇસ જુઓ',
        registerTag: (name) => `${name} ટેગ રજિસ્ટર કરો`,
        openDashboard: 'ક્લાયન્ટ ડેશબોર્ડ ખોલો',
        trackOrder: 'ઓર્ડર ટ્રેક કરો',
        accessDashboard: 'ડેશબોર્ડ એક્સેસ કરો',
      },
      errors: {
        invalidTotal: 'તમારી કાર્ટનો કુલ સરવાળો અમાન્ય લાગે છે. કૃપા કરી અસરગ્રસ્ત આઇટમ દૂર કરીને ફરીથી ઉમેરો, પછી ફરી પ્રયાસ કરો.',
        orderNotConfirmed: 'અમે તમારો ઓર્ડર કન્ફર્મ કરી શક્યા નહીં. કૃપા કરી તમારું કનેક્શન ચકાસો અને ફરી પ્રયાસ કરો.',
        gatewayLoadFailed: 'પેમેન્ટ ગેટવે લોડ થઈ શક્યું નહીં. કૃપા કરી તમારું કનેક્શન ચકાસો અને ફરી પ્રયાસ કરો.',
        gatewayUnreachable: 'અમે પેમેન્ટ ગેટવે સુધી પહોંચી શક્યા નહીં.',
        orderSavedSuffix: (orderId) => ` તમારો ઓર્ડર ${orderId} સેવ કરવામાં આવ્યો છે — કોઈ ચાર્જ લેવાયો નથી. કૃપા કરી થોડી વાર પછી ફરીથી પેમેન્ટ કરવાનો પ્રયાસ કરો.`,
        verificationFailedDefault: 'પેમેન્ટ વેરિફિકેશન નિષ્ફળ થયું.',
        verificationFailedSuffix: (orderId) => ` જો પૈસા કપાયા હોય તો તે ઓટોમેટિક રીતે સમાધાન થઈ જશે — સહાય માટે ઓર્ડર ID ${orderId} જણાવો.`,
        paymentCancelled: 'પેમેન્ટ રદ કરવામાં આવ્યું — કોઈ ચાર્જ લેવાયો નથી. તમે ફરીથી પેમેન્ટ કરવાનો પ્રયાસ કરી શકો છો.',
        paymentFailedPrefix: 'પેમેન્ટ નિષ્ફળ: ',
        paymentFailedDefaultSuffix: 'કૃપા કરી ફરી પ્રયાસ કરો.',
        requiredFields: 'કૃપા કરી બધા જરૂરી ફીલ્ડ ભરો.',
        invalidEmail: 'કૃપા કરી માન્ય ઇમેઇલ સરનામું દાખલ કરો.',
        invalidPhone: 'કૃપા કરી માન્ય 10-અંકનો ફોન નંબર દાખલ કરો.',
      },
    },
    invoiceModal: {
      title: 'ટેક્સ ઇનવોઇસ પૂર્વાવલોકન',
      printTitle: 'પ્રિન્ટ કરો અથવા PDF તરીકે સેવ કરો',
      printButton: 'પ્રિન્ટ / PDF',
      closeAria: 'ઇનવોઇસ પૂર્વાવલોકન બંધ કરો',
      officialBadge: 'સત્તાવાર ટેક્સ ઇનવોઇસ',
      invoiceNumberLabel: 'ઇનવોઇસ નંબર',
      invoiceDateLabel: 'ઇનવોઇસ તારીખ:',
      orderIdLabel: 'ઓર્ડર ID:',
      billedShippedTo: 'બિલ અને શિપ કરવામાં આવ્યું',
      phoneLabel: 'ફોન:',
      emailLabel: 'ઇમેઇલ:',
      orderPaymentStatus: 'ઓર્ડર અને પેમેન્ટ સ્ટેટસ',
      paymentStatusPrefix: 'પેમેન્ટ સ્ટેટસ: ',
      paymentModeLabel: 'પેમેન્ટ મોડ:',
      gatewayRefLabel: 'ગેટવે સંદર્ભ:',
      fulfilledViaLabel: 'આ દ્વારા પૂર્ણ થયું:',
      expressPriority: 'એક્સપ્રેસ પ્રાયોરિટી (24-48 કલાક)',
      standardDelivery: 'સ્ટાન્ડર્ડ ડિલિવરી',
      orderPlacedLabel: 'ઓર્ડર મૂકાયો:',
      itemDescriptionHeader: 'આઇટમ વિગત',
      qtyHeader: 'જથ્થો',
      unitRateHeader: 'યુનિટ રેટ',
      amountHeader: 'રકમ (₹)',
      hsnSacLabel: 'HSN/SAC:',
      warrantyTitle: '3-વર્ષની 3M વેધરપ્રૂફ વોરંટી ગેરંટી',
      warrantyDescription: 'સામાન્ય ઉપયોગની સ્થિતિમાં સૂર્યપ્રકાશથી ઝાંખું પડવા, પાણીથી નુકસાન અથવા ચોંટવામાં નિષ્ફળતા પર ટેગ મુક્તમાં બદલવામાં આવે છે.',
      taxableBaseLabel: 'કરપાત્ર આધાર:',
      cgstLabel: 'CGST (9%):',
      sgstLabel: 'SGST (9%):',
      shippingFeeLabel: 'શિપિંગ ફી:',
      free: 'મુક્ત',
      totalAmountPaidLabel: 'કુલ ચૂકવેલ રકમ:',
      computerGeneratedNotice: 'આ એક કમ્પ્યુટર-જનરેટેડ ટેક્સ ઇનવોઇસ છે અને તેને કોઈ ભૌતિક સહી જરૂરી નથી. સપોર્ટ:',
      closeButton: 'બંધ કરો',
      downloadPrintButton: 'ઇનવોઇસ ડાઉનલોડ / પ્રિન્ટ કરો',
    },
    trackOrderModal: {
      steps: {
        placed: 'મૂકાયો', placedDesc: 'ઓર્ડર મળ્યો',
        confirmed: 'કન્ફર્મ', confirmedDesc: 'પેમેન્ટ ચકાસાયું',
        shipped: 'શિપ થયો', shippedDesc: 'કોરિયરે ઉપાડ્યો',
        delivered: 'ડિલિવર થયો', deliveredDesc: 'તમારા સરનામે',
      },
      cancelledTitle: 'ઓર્ડર રદ કરવામાં આવ્યો',
      cancelledDescription: 'આ ઓર્ડર રદ કરવામાં આવ્યો છે. જો પેમેન્ટ કપાયું હોય, તો રિફંડ 5-7 કાર્યકારી દિવસોમાં પ્રોસેસ થશે.',
      placedOnPrefix: 'મૂકાયો: ',
      recent: 'તાજેતરનું',
      paidOnline: 'ઓનલાઇન ચૂકવાયું',
      paymentPending: 'પેમેન્ટ બાકી',
      recipientLabel: 'પ્રાપ્તકર્તા',
      destinationLabel: 'ગંતવ્ય સ્થાન',
      dispatchedToAddress: 'સરનામે મોકલાયું',
      expeditedCourier: 'એક્સપ્રેસ કોરિયર',
      awbLabel: 'AWB:',
      liveCourier: 'લાઇવ કોરિયર',
      milestonesEmptyState: 'કોરિયર ડિસ્પેચ હબ પર તમારા પાર્સલને સ્કેન કરશે ત્યારે વિગતવાર સ્કેન દેખાશે.',
      dispatchActivityTitle: 'ડિસ્પેચ પ્રવૃત્તિ',
      modalTitle: 'સેફ્ટી ટેગ ઓર્ડર ટ્રેક કરો',
      modalSubtitle: 'લાઇવ ઓર્ડર સ્ટેટસ અને ડિસ્પેચ અપડેટ્સ',
      closeAria: 'બંધ કરો',
      phoneLabel: 'ફોન નંબર',
      phonePlaceholder: 'ચેકઆઉટ વખતે વાપરેલો 10-અંકનો મોબાઇલ નંબર',
      searching: 'ઓર્ડર રેકોર્ડ શોધાઈ રહ્યા છે...',
      trackButton: 'ડિલિવરી સ્ટેટસ ટ્રેક કરો',
      errorInvalidPhone: 'કૃપા કરી માન્ય 10-અંકનો ફોન નંબર દાખલ કરો.',
      errorNoOrdersFound: 'આ ફોન નંબર માટે કોઈ ઓર્ડર મળ્યો નથી.',
      errorConnectionFailed: 'ઓર્ડર ટ્રેકિંગ સેવા સાથે જોડાઈ શકાયું નહીં.',
      foundOrdersMessage: (count) => `આ નંબર માટે ${count} ઓર્ડર મળ્યા — એક પસંદ કરો:`,
      backToAllOrders: (count) => `← બધા ${count} ઓર્ડર પર પાછા જાઓ`,
      activateTagTitle: 'ટેગ ટેલિફોની અને ઇમરજન્સી સંપર્કો સક્રિય કરો',
      activateTagDescription: 'તમારી વાહન પ્લેટ પ્રોગ્રામ કરવા, ઇમરજન્સી રિસ્પોન્ડર્સને લિંક કરવા અને પ્રાઇવેટ માસ્ક્ડ કોલ્સ મેનેજ કરવા માટે આ ઓર્ડરમાં વાપરેલા ફોન નંબરથી સાઇન ઇન કરો.',
      goToDashboard: 'ક્લાયન્ટ ડેશબોર્ડ પર જાઓ',
    },
  },
};
