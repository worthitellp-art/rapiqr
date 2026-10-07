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
      mysticker: string;
      contacts: string;
      history: string;
      settings: string;
      privacy: string;
      support: string;
    };
    navSections: { myTag: string; communication: string; account: string };
    searchPlaceholder: string;
    buySticker: string;
    proProtection: string;
    active: string;
    splash: { heading: string; line1: string; line2: string };
    gate: { loggedInAs: string; you: string; logOut: string; heading: string; recoverLink: string; skip: string; getFreePrefix: string };
    phoneBanner: {
      unverified: string;
      titlePending: string;
      titleAdd: string;
      descPendingPrefix: string;
      descPendingSuffix: string;
      descAdd: string;
      verifyBtn: string;
      addBtn: string;
      dismiss: string;
    };
    setup: {
      welcomePrefix: string;
      completedSuffix: string;
      step1Title: string;
      step1VerifiedPrefix: string;
      step1PendingPrefix: string;
      step1None: string;
      completedLabel: string;
      verifyLink: string;
      step2Title: string;
      step2DescSuffix: string;
      configureLink: string;
      addContactsLink: string;
      step3Title: string;
      step3DescSuffix: string;
      viewStickersLink: string;
    };
    overview: {
      welcomeBackPrefix: string;
      heroBadge: string;
      heroTitle: string;
      heroDesc: string;
      maskingBadge: string;
      instantBadge: string;
      deliveryBadge: string;
      getFreeStickerBtn: string;
      haveTagLink: string;
      statActive: string;
      statScans: string;
      statContacts: string;
      statSecurity: string;
      protectedLabel: string;
      latestChat: string;
      unreadSuffix: string;
      viewInbox: string;
      loadingChats: string;
      noChatsYet: string;
      noMessagesYet: string;
      quickActions: string;
      openChat: string;
      addContact: string;
      syncStickers: string;
      viewQr: string;
      scanLogs: string;
      mySafetyStickersPrefix: string;
      recoverLink: string;
      refreshLink: string;
      loadingStickers: string;
      noStickersTitle: string;
      noStickersDesc: string;
      getFreeStickerShort: string;
      qrBtn: string;
      editBtn: string;
      noLongerShowsSuffix: string;
      recovering: string;
      recoverBtn: string;
      viewAllStickers: string;
      emergencyContactsPrefix: string;
      addContactShort: string;
      noContactsYet: string;
      addResponders: string;
      manageContacts: string;
      recentScans: string;
      noScansYet: string;
    };
    products: {
      title: string;
      availableTags: string;
      myOrders: string;
      noProductsTitle: string;
      noProductsDesc: string;
      refreshCatalog: string;
      freeTag: string;
      free: string;
      safetyTagCategory: string;
      privacyBadge: string;
      getFreeTagBtn: string;
      orderNowBtn: string;
      searchOrders: string;
      allStatus: string;
      placed: string;
      shipped: string;
      delivered: string;
      cancelled: string;
      loadingOrders: string;
      noOrdersTitle: string;
      noOrdersDesc: string;
      browseTagsBtn: string;
      noOrdersMatch: string;
      clearFilters: string;
      paid: string;
      paymentFailed: string;
      awaitingPayment: string;
      courierSite: string;
      checking: string;
      hideTracking: string;
      trackDelivery: string;
      preparingOrder: string;
      noCourierScans: string;
      stepOrdered: string;
      stepShipped: string;
      stepDelivered: string;
      courierFallback: string;
    };
    history: {
      title: string;
      refreshAlerts: string;
      refreshing: string;
      fetching: string;
      noAlertsTitle: string;
      noAlertsDesc: string;
      latestAlert: string;
      scanRecorded: string;
      scannedByPrefix: string;
      viewPlate: string;
      openVisitorChat: string;
      allLogsPrefix: string;
      searchLogs: string;
      noLogsMatchPrefix: string;
      colSticker: string;
      colEventType: string;
      colContext: string;
      colTimestamp: string;
      directScan: string;
      noScanEventsRecent: string;
      fullLog: string;
      vehicleSafetyTag: string;
      stickerFallback: string;
    };
    chatInbox: {
      title: string;
      searchPlaceholder: string;
      all: string;
      unread: string;
      loadingChats: string;
      emptyInbox: string;
      noMatches: string;
      noMessagesYet: string;
      selectChat: string;
      deleteConversation: string;
      visitor: string;
    };
    chrome: {
      clientBadge: string;
      backToSite: string;
      logOut: string;
      collapseSidebar: string;
      expandSidebar: string;
      home: string;
      user: string;
      owner: string;
      myBalance: string;
      getFreeSticker: string;
      balanceTooltip: string;
      liveChatNotifications: string;
      unreadMessagesSuffix: string;
    };
  };
  distributor: {
    partnerDesk: string;
    verifiedPartner: string;
    exitToHome: string;
    logOut: string;
    tabs: { overview: string; activate: string; pos: string };
    nav: { overview: string; stickers: string };
    gate: {
      pendingTitle: string;
      rejectedTitle: string;
      approvedTitle: string;
      noneTitle: string;
      backToSite: string;
    };
    kpi: { allocated: string; activated: string; inStock: string; scans: string };
    recentActivations: string;
    viewAll: string;
    noAllocatedYet: string;
    noActivationsYet: string;
    retry: string;
    refresh: string;
    columns: { sticker: string; type: string; customer: string; phone: string; activated: string; scans: string; status: string };
    statusActive: string;
    statusInStock: string;
    sinceLabel: string;
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
        chat: 'Chat',
        mysticker: 'My Sticker',
        contacts: 'Emergency Contacts',
        history: 'Alert History',
        settings: 'Account Settings',
        privacy: 'Privacy & Data',
        support: 'Support & Help',
      },
      navSections: { myTag: 'My Tag', communication: 'Communication', account: 'Account' },
      searchPlaceholder: 'Search stickers, contacts...',
      buySticker: 'Buy Sticker',
      proProtection: '◆ Pro Protection',
      active: '✦ Active',
      splash: {
        heading: 'Preparing your dashboard',
        line1: 'RepiQR is syncing your safety data.',
        line2: 'Please wait…',
      },
      gate: {
        loggedInAs: 'Logged in as',
        you: 'you',
        logOut: 'Log out',
        heading: 'Get Your Free Safety Sticker to Activate Your Dashboard',
        recoverLink: 'Already have a tag? Link it by recovery code',
        skip: 'Skip for now →',
        getFreePrefix: 'Get Free',
      },
      phoneBanner: {
        unverified: 'Unverified',
        titlePending: 'Action Required: Phone Verification Pending',
        titleAdd: 'Action Required: Add & Verify Mobile Number',
        descPendingPrefix: 'Complete OTP verification for',
        descPendingSuffix: 'to auto-claim safety stickers and enable emergency SMS alerts.',
        descAdd: 'Add and verify your mobile phone number via OTP to link safety stickers to your dashboard and enable instant emergency call bridges.',
        verifyBtn: 'Verify Phone via OTP',
        addBtn: 'Add & Verify Mobile Number',
        dismiss: 'Dismiss alert',
      },
      setup: {
        welcomePrefix: 'Welcome to RepiQR,',
        completedSuffix: 'completed',
        step1Title: 'Verify Mobile Phone Number OTP',
        step1VerifiedPrefix: 'Verified mobile number linked:',
        step1PendingPrefix: 'Verification pending for',
        step1None: 'No mobile number verified yet (Required to auto-claim stickers)',
        completedLabel: 'Completed',
        verifyLink: 'Verify Phone ›',
        step2Title: 'Link Emergency Responders',
        step2DescSuffix: 'emergency contact numbers active',
        configureLink: 'Configure ›',
        addContactsLink: 'Add Contacts ›',
        step3Title: 'Active Safety QR Plates',
        step3DescSuffix: 'active vehicle QR plates online',
        viewStickersLink: 'View Stickers ›',
      },
      overview: {
        welcomeBackPrefix: 'Welcome back,',
        heroBadge: 'Your Sticker Is Free',
        heroTitle: 'Get Your Free Safety Sticker to Activate Your Dashboard',
        heroDesc: 'Your account is ready! To generate your vehicle QR plate, emergency responder tree, and instant WhatsApp parking alerts, get your free RepiQR smart safety tag.',
        maskingBadge: '100% Number Masking',
        instantBadge: '0.4s Instant Alerts',
        deliveryBadge: 'Free Delivery',
        getFreeStickerBtn: 'Get Free Sticker →',
        haveTagLink: 'Have a Tag? Link by Code',
        statActive: 'Active Stickers',
        statScans: 'Total Scans',
        statContacts: 'Emergency Contacts',
        statSecurity: 'Security Status',
        protectedLabel: 'Protected',
        latestChat: 'Latest chat',
        unreadSuffix: 'unread',
        viewInbox: 'View inbox ›',
        loadingChats: 'Loading chats...',
        noChatsYet: 'No chats yet.',
        noMessagesYet: 'No messages yet',
        quickActions: 'Quick Actions',
        openChat: 'Open Live Visitor Chat',
        addContact: 'Add Emergency Contact',
        syncStickers: 'Sync Safety Stickers',
        viewQr: 'View QR Plate Code',
        scanLogs: 'Scan Logs & Alerts',
        mySafetyStickersPrefix: 'My Safety Stickers',
        recoverLink: 'Recover a sticker',
        refreshLink: 'Refresh',
        loadingStickers: 'Loading stickers...',
        noStickersTitle: 'No Safety Stickers Linked Yet',
        noStickersDesc: 'Get your free sticker to create your vehicle plate.',
        getFreeStickerShort: 'Get Free Sticker',
        qrBtn: 'QR',
        editBtn: 'Edit',
        noLongerShowsSuffix: 'no longer shows here',
        recovering: 'Recovering…',
        recoverBtn: 'Recover',
        viewAllStickers: 'View all safety stickers ›',
        emergencyContactsPrefix: 'Emergency Contacts',
        addContactShort: '＋ Contact',
        noContactsYet: 'No emergency contacts added yet.',
        addResponders: 'Add Emergency Responders',
        manageContacts: 'Manage responder contacts ›',
        recentScans: 'Recent Scans',
        noScansYet: 'No scans recorded yet',
      },
      products: {
        title: 'Products & Orders',
        availableTags: 'Available Tags',
        myOrders: 'My Orders',
        noProductsTitle: 'No products currently available',
        noProductsDesc: 'Check back shortly or refresh the catalog.',
        refreshCatalog: 'Refresh Catalog',
        freeTag: 'Free Tag',
        free: 'Free',
        safetyTagCategory: 'Safety Tag',
        privacyBadge: '100% Privacy',
        getFreeTagBtn: 'Get Free Tag',
        orderNowBtn: 'Order Now',
        searchOrders: 'Search orders...',
        allStatus: 'All Status',
        placed: 'Placed',
        shipped: 'Shipped',
        delivered: 'Delivered',
        cancelled: 'Cancelled',
        loadingOrders: 'Loading your orders...',
        noOrdersTitle: 'No orders placed yet.',
        noOrdersDesc: 'Safety stickers and accessories you order on RepiQR will appear here with live tracking.',
        browseTagsBtn: 'Browse Available Tags',
        noOrdersMatch: 'No orders match your filters.',
        clearFilters: 'Clear Filters',
        paid: 'Paid',
        paymentFailed: 'Payment Failed',
        awaitingPayment: 'Awaiting Payment',
        courierSite: 'Courier site',
        checking: 'Checking…',
        hideTracking: 'Hide tracking',
        trackDelivery: 'Track delivery',
        preparingOrder: "We're preparing your order. Tracking appears here as soon as it's handed to the courier.",
        noCourierScans: 'No courier scans reported yet — check back shortly.',
        stepOrdered: 'Ordered',
        stepShipped: 'Shipped',
        stepDelivered: 'Delivered',
        courierFallback: 'Courier',
      },
      history: {
        title: 'Alerts & Scan History',
        refreshAlerts: 'Refresh Alerts',
        refreshing: 'Refreshing…',
        fetching: 'Fetching alert history...',
        noAlertsTitle: 'No alert events recorded yet.',
        noAlertsDesc: 'Whenever someone scans your vehicle safety tag or initiates an alert, real-time reports appear here.',
        latestAlert: 'Latest Alert',
        scanRecorded: 'Scan Recorded',
        scannedByPrefix: 'Scanned by:',
        viewPlate: 'View Plate',
        openVisitorChat: 'Open Visitor Chat',
        allLogsPrefix: 'All Alert Logs',
        searchLogs: 'Search logs...',
        noLogsMatchPrefix: 'No alert logs match',
        colSticker: 'Sticker / Plate',
        colEventType: 'Event Type',
        colContext: 'Context / Visitor',
        colTimestamp: 'Timestamp',
        directScan: 'Direct QR Scan',
        noScanEventsRecent: 'No scan events recorded recently.',
        fullLog: 'Full log',
        vehicleSafetyTag: 'Vehicle Safety Tag',
        stickerFallback: 'Sticker',
      },
      chatInbox: {
        title: 'Chats',
        searchPlaceholder: 'Search chats',
        all: 'All',
        unread: 'Unread',
        loadingChats: 'Loading chats...',
        emptyInbox: 'Your inbox is empty. Visitor chats appear here after a scan.',
        noMatches: 'No chats match.',
        noMessagesYet: 'No messages yet',
        selectChat: 'Select a chat to reply',
        deleteConversation: 'Delete conversation',
        visitor: 'Visitor',
      },
      chrome: {
        clientBadge: 'Client',
        backToSite: 'Back to site',
        logOut: 'Log out',
        collapseSidebar: 'Collapse sidebar',
        expandSidebar: 'Expand sidebar',
        home: 'RepiQR home',
        user: 'User',
        owner: 'Owner',
        myBalance: 'My Balance',
        getFreeSticker: 'Get Free Sticker',
        balanceTooltip: 'Balance from your paid top-ups',
        liveChatNotifications: 'Live Chat Notifications',
        unreadMessagesSuffix: 'unread message(s)',
      },
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
      nav: { overview: 'Overview', stickers: 'Stickers' },
      gate: {
        pendingTitle: 'Application under review',
        rejectedTitle: 'Application not approved',
        approvedTitle: 'Approved — contact support to finish setup',
        noneTitle: 'No partner application yet',
        backToSite: 'Back to site',
      },
      kpi: { allocated: 'Allocated', activated: 'Activated', inStock: 'In stock', scans: 'Scans' },
      recentActivations: 'Recent activations',
      viewAll: 'View all',
      noAllocatedYet: 'No stickers allocated yet',
      noActivationsYet: 'No activations yet',
      retry: 'Retry',
      refresh: 'Refresh',
      columns: { sticker: 'Sticker', type: 'Type', customer: 'Customer', phone: 'Phone', activated: 'Activated', scans: 'Scans', status: 'Status' },
      statusActive: 'Active',
      statusInStock: 'In stock',
      sinceLabel: 'Since',
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
        chat: 'चैट',
        mysticker: 'मेरा स्टिकर',
        contacts: 'आपातकालीन संपर्क',
        history: 'अलर्ट इतिहास',
        settings: 'खाता सेटिंग्स',
        privacy: 'गोपनीयता एवं डेटा',
        support: 'सहायता एवं मदद',
      },
      navSections: { myTag: 'मेरा टैग', communication: 'संचार', account: 'खाता' },
      searchPlaceholder: 'स्टिकर, संपर्क खोजें...',
      buySticker: 'स्टिकर खरीदें',
      proProtection: '◆ प्रो सुरक्षा',
      active: '✦ सक्रिय',
      splash: {
        heading: 'आपका डैशबोर्ड तैयार किया जा रहा है',
        line1: 'RepiQR आपका सुरक्षा डेटा सिंक कर रहा है।',
        line2: 'कृपया प्रतीक्षा करें…',
      },
      gate: {
        loggedInAs: 'इस रूप में लॉग इन',
        you: 'आप',
        logOut: 'लॉग आउट',
        heading: 'अपना डैशबोर्ड सक्रिय करने के लिए मुफ़्त सेफ्टी स्टिकर पाएं',
        recoverLink: 'पहले से टैग है? रिकवरी कोड से लिंक करें',
        skip: 'अभी के लिए छोड़ें →',
        getFreePrefix: 'मुफ़्त पाएं',
      },
      phoneBanner: {
        unverified: 'असत्यापित',
        titlePending: 'कार्रवाई आवश्यक: फ़ोन सत्यापन लंबित',
        titleAdd: 'कार्रवाई आवश्यक: मोबाइल नंबर जोड़ें और सत्यापित करें',
        descPendingPrefix: 'सेफ्टी स्टिकर स्वतः क्लेम करने और इमरजेंसी SMS अलर्ट सक्षम करने के लिए',
        descPendingSuffix: 'के लिए OTP सत्यापन पूरा करें।',
        descAdd: 'सेफ्टी स्टिकर को अपने डैशबोर्ड से लिंक करने और इमरजेंसी कॉल ब्रिज सक्षम करने के लिए अपना मोबाइल नंबर OTP से जोड़ें और सत्यापित करें।',
        verifyBtn: 'OTP से फ़ोन सत्यापित करें',
        addBtn: 'मोबाइल नंबर जोड़ें और सत्यापित करें',
        dismiss: 'अलर्ट खारिज करें',
      },
      setup: {
        welcomePrefix: 'RepiQR में आपका स्वागत है,',
        completedSuffix: 'पूर्ण',
        step1Title: 'मोबाइल फ़ोन नंबर OTP सत्यापित करें',
        step1VerifiedPrefix: 'सत्यापित मोबाइल नंबर लिंक:',
        step1PendingPrefix: 'के लिए सत्यापन लंबित',
        step1None: 'अभी तक कोई मोबाइल नंबर सत्यापित नहीं (स्टिकर स्वतः क्लेम हेतु आवश्यक)',
        completedLabel: 'पूर्ण',
        verifyLink: 'फ़ोन सत्यापित करें ›',
        step2Title: 'इमरजेंसी रेस्पॉन्डर लिंक करें',
        step2DescSuffix: 'इमरजेंसी संपर्क नंबर सक्रिय',
        configureLink: 'कॉन्फ़िगर करें ›',
        addContactsLink: 'संपर्क जोड़ें ›',
        step3Title: 'सक्रिय सेफ्टी QR प्लेट',
        step3DescSuffix: 'सक्रिय वाहन QR प्लेट ऑनलाइन',
        viewStickersLink: 'स्टिकर देखें ›',
      },
      overview: {
        welcomeBackPrefix: 'वापसी पर स्वागत है,',
        heroBadge: 'आपका स्टिकर मुफ़्त है',
        heroTitle: 'अपना डैशबोर्ड सक्रिय करने के लिए मुफ़्त सेफ्टी स्टिकर पाएं',
        heroDesc: 'आपका खाता तैयार है! वाहन QR प्लेट, इमरजेंसी रेस्पॉन्डर ट्री और इंस्टेंट WhatsApp पार्किंग अलर्ट बनाने के लिए अपना मुफ़्त RepiQR स्मार्ट सेफ्टी टैग पाएं।',
        maskingBadge: '100% नंबर मास्किंग',
        instantBadge: '0.4 सेकंड इंस्टेंट अलर्ट',
        deliveryBadge: 'मुफ़्त डिलीवरी',
        getFreeStickerBtn: 'मुफ़्त स्टिकर पाएं →',
        haveTagLink: 'टैग है? कोड से लिंक करें',
        statActive: 'सक्रिय स्टिकर',
        statScans: 'कुल स्कैन',
        statContacts: 'इमरजेंसी संपर्क',
        statSecurity: 'सुरक्षा स्थिति',
        protectedLabel: 'सुरक्षित',
        latestChat: 'नवीनतम चैट',
        unreadSuffix: 'अपठित',
        viewInbox: 'इनबॉक्स देखें ›',
        loadingChats: 'चैट लोड हो रही हैं...',
        noChatsYet: 'अभी तक कोई चैट नहीं।',
        noMessagesYet: 'अभी कोई संदेश नहीं',
        quickActions: 'त्वरित कार्य',
        openChat: 'लाइव विज़िटर चैट खोलें',
        addContact: 'इमरजेंसी संपर्क जोड़ें',
        syncStickers: 'सेफ्टी स्टिकर सिंक करें',
        viewQr: 'QR प्लेट कोड देखें',
        scanLogs: 'स्कैन लॉग और अलर्ट',
        mySafetyStickersPrefix: 'मेरे सेफ्टी स्टिकर',
        recoverLink: 'स्टिकर रिकवर करें',
        refreshLink: 'रीफ़्रेश करें',
        loadingStickers: 'स्टिकर लोड हो रहे हैं...',
        noStickersTitle: 'अभी तक कोई सेफ्टी स्टिकर लिंक नहीं',
        noStickersDesc: 'अपना वाहन प्लेट बनाने के लिए मुफ़्त स्टिकर पाएं।',
        getFreeStickerShort: 'मुफ़्त स्टिकर पाएं',
        qrBtn: 'QR',
        editBtn: 'संपादित करें',
        noLongerShowsSuffix: 'अब यहां नहीं दिख रहा',
        recovering: 'रिकवर हो रहा है…',
        recoverBtn: 'रिकवर करें',
        viewAllStickers: 'सभी सेफ्टी स्टिकर देखें ›',
        emergencyContactsPrefix: 'इमरजेंसी संपर्क',
        addContactShort: '＋ संपर्क',
        noContactsYet: 'अभी तक कोई इमरजेंसी संपर्क नहीं जोड़ा गया।',
        addResponders: 'इमरजेंसी रेस्पॉन्डर जोड़ें',
        manageContacts: 'रेस्पॉन्डर संपर्क प्रबंधित करें ›',
        recentScans: 'हाल के स्कैन',
        noScansYet: 'अभी तक कोई स्कैन दर्ज नहीं',
      },
      products: {
        title: 'उत्पाद और ऑर्डर',
        availableTags: 'उपलब्ध टैग',
        myOrders: 'मेरे ऑर्डर',
        noProductsTitle: 'अभी कोई उत्पाद उपलब्ध नहीं',
        noProductsDesc: 'कृपया बाद में देखें या कैटलॉग रीफ़्रेश करें।',
        refreshCatalog: 'कैटलॉग रीफ़्रेश करें',
        freeTag: 'मुफ़्त टैग',
        free: 'मुफ़्त',
        safetyTagCategory: 'सेफ्टी टैग',
        privacyBadge: '100% प्राइवेसी',
        getFreeTagBtn: 'मुफ़्त टैग पाएं',
        orderNowBtn: 'अभी ऑर्डर करें',
        searchOrders: 'ऑर्डर खोजें...',
        allStatus: 'सभी स्थिति',
        placed: 'प्लेस किया गया',
        shipped: 'शिप किया गया',
        delivered: 'डिलीवर किया गया',
        cancelled: 'रद्द किया गया',
        loadingOrders: 'आपके ऑर्डर लोड हो रहे हैं...',
        noOrdersTitle: 'अभी तक कोई ऑर्डर नहीं दिया गया।',
        noOrdersDesc: 'RepiQR पर आपके द्वारा ऑर्डर किए गए सेफ्टी स्टिकर और एक्सेसरीज़ यहां लाइव ट्रैकिंग के साथ दिखेंगे।',
        browseTagsBtn: 'उपलब्ध टैग देखें',
        noOrdersMatch: 'आपके फ़िल्टर से कोई ऑर्डर मेल नहीं खाता।',
        clearFilters: 'फ़िल्टर साफ़ करें',
        paid: 'भुगतान हो गया',
        paymentFailed: 'भुगतान विफल',
        awaitingPayment: 'भुगतान की प्रतीक्षा',
        courierSite: 'कुरियर साइट',
        checking: 'जाँच हो रही है…',
        hideTracking: 'ट्रैकिंग छिपाएं',
        trackDelivery: 'डिलीवरी ट्रैक करें',
        preparingOrder: 'हम आपका ऑर्डर तैयार कर रहे हैं। कुरियर को सौंपते ही ट्रैकिंग यहां दिखेगी।',
        noCourierScans: 'अभी तक कोई कुरियर स्कैन नहीं — कृपया थोड़ी देर बाद देखें।',
        stepOrdered: 'ऑर्डर किया गया',
        stepShipped: 'शिप किया गया',
        stepDelivered: 'डिलीवर किया गया',
        courierFallback: 'कुरियर',
      },
      history: {
        title: 'अलर्ट और स्कैन इतिहास',
        refreshAlerts: 'अलर्ट रीफ़्रेश करें',
        refreshing: 'रीफ़्रेश हो रहा है…',
        fetching: 'अलर्ट इतिहास लाया जा रहा है...',
        noAlertsTitle: 'अभी तक कोई अलर्ट इवेंट दर्ज नहीं हुआ।',
        noAlertsDesc: 'जब भी कोई आपके वाहन सेफ्टी टैग को स्कैन करता है या अलर्ट भेजता है, रीयल-टाइम रिपोर्ट यहां दिखेगी।',
        latestAlert: 'नवीनतम अलर्ट',
        scanRecorded: 'स्कैन दर्ज',
        scannedByPrefix: 'स्कैन किया गया:',
        viewPlate: 'प्लेट देखें',
        openVisitorChat: 'विज़िटर चैट खोलें',
        allLogsPrefix: 'सभी अलर्ट लॉग',
        searchLogs: 'लॉग खोजें...',
        noLogsMatchPrefix: 'कोई अलर्ट लॉग मेल नहीं खाता',
        colSticker: 'स्टिकर / प्लेट',
        colEventType: 'इवेंट प्रकार',
        colContext: 'संदर्भ / विज़िटर',
        colTimestamp: 'समय',
        directScan: 'डायरेक्ट QR स्कैन',
        noScanEventsRecent: 'हाल में कोई स्कैन इवेंट दर्ज नहीं हुआ।',
        fullLog: 'पूरा लॉग',
        vehicleSafetyTag: 'वाहन सेफ्टी टैग',
        stickerFallback: 'स्टिकर',
      },
      chatInbox: {
        title: 'चैट',
        searchPlaceholder: 'चैट खोजें',
        all: 'सभी',
        unread: 'अपठित',
        loadingChats: 'चैट लोड हो रही हैं...',
        emptyInbox: 'आपका इनबॉक्स खाली है। स्कैन के बाद विज़िटर चैट यहां दिखेंगी।',
        noMatches: 'कोई चैट मेल नहीं खाती।',
        noMessagesYet: 'अभी कोई संदेश नहीं',
        selectChat: 'जवाब देने के लिए एक चैट चुनें',
        deleteConversation: 'बातचीत हटाएं',
        visitor: 'विज़िटर',
      },
      chrome: {
        clientBadge: 'क्लाइंट',
        backToSite: 'साइट पर वापस जाएं',
        logOut: 'लॉग आउट',
        collapseSidebar: 'साइडबार संक्षिप्त करें',
        expandSidebar: 'साइडबार विस्तृत करें',
        home: 'RepiQR होम',
        user: 'उपयोगकर्ता',
        owner: 'मालिक',
        myBalance: 'मेरा बैलेंस',
        getFreeSticker: 'मुफ़्त स्टिकर पाएं',
        balanceTooltip: 'आपके भुगतान किए गए टॉप-अप से बैलेंस',
        liveChatNotifications: 'लाइव चैट सूचनाएं',
        unreadMessagesSuffix: 'अपठित संदेश',
      },
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
      nav: { overview: 'अवलोकन', stickers: 'स्टिकर' },
      gate: {
        pendingTitle: 'आवेदन समीक्षा में है',
        rejectedTitle: 'आवेदन स्वीकृत नहीं हुआ',
        approvedTitle: 'स्वीकृत — सेटअप पूरा करने के लिए सहायता से संपर्क करें',
        noneTitle: 'अभी तक कोई पार्टनर आवेदन नहीं',
        backToSite: 'साइट पर वापस जाएं',
      },
      kpi: { allocated: 'आवंटित', activated: 'सक्रिय किया गया', inStock: 'स्टॉक में', scans: 'स्कैन' },
      recentActivations: 'हाल की सक्रियताएं',
      viewAll: 'सभी देखें',
      noAllocatedYet: 'अभी तक कोई स्टिकर आवंटित नहीं',
      noActivationsYet: 'अभी तक कोई सक्रियता नहीं',
      retry: 'पुनः प्रयास करें',
      refresh: 'रीफ़्रेश करें',
      columns: { sticker: 'स्टिकर', type: 'प्रकार', customer: 'ग्राहक', phone: 'फ़ोन', activated: 'सक्रिय किया गया', scans: 'स्कैन', status: 'स्थिति' },
      statusActive: 'सक्रिय',
      statusInStock: 'स्टॉक में',
      sinceLabel: 'तारीख से',
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
        chat: 'ચેટ',
        mysticker: 'મારું સ્ટીકર',
        contacts: 'ઇમરજન્સી સંપર્કો',
        history: 'એલર્ટ ઇતિહાસ',
        settings: 'એકાઉન્ટ સેટિંગ્સ',
        privacy: 'ગોપનીયતા અને ડેટા',
        support: 'સપોર્ટ અને મદદ',
      },
      navSections: { myTag: 'મારો ટેગ', communication: 'સંચાર', account: 'એકાઉન્ટ' },
      searchPlaceholder: 'સ્ટીકર, સંપર્કો શોધો...',
      buySticker: 'સ્ટીકર ખરીદો',
      proProtection: '◆ પ્રો પ્રોટેક્શન',
      active: '✦ સક્રિય',
      splash: {
        heading: 'તમારું ડેશબોર્ડ તૈયાર કરી રહ્યા છીએ',
        line1: 'RepiQR તમારો સેફ્ટી ડેટા સિંક કરી રહ્યું છે.',
        line2: 'કૃપા કરી રાહ જુઓ…',
      },
      gate: {
        loggedInAs: 'આ રીતે લૉગ ઇન છે',
        you: 'તમે',
        logOut: 'લૉગ આઉટ',
        heading: 'તમારું ડેશબોર્ડ સક્રિય કરવા માટે મુક્ત સેફ્ટી સ્ટીકર મેળવો',
        recoverLink: 'પહેલેથી ટેગ છે? રિકવરી કોડથી લિંક કરો',
        skip: 'હમણાં માટે છોડો →',
        getFreePrefix: 'મુક્ત મેળવો',
      },
      phoneBanner: {
        unverified: 'અચકાસાયેલ',
        titlePending: 'કાર્યવાહી જરૂરી: ફોન વેરિફિકેશન બાકી',
        titleAdd: 'કાર્યવાહી જરૂરી: મોબાઇલ નંબર ઉમેરો અને ચકાસો',
        descPendingPrefix: 'સેફ્ટી સ્ટીકર ઓટો-ક્લેમ કરવા અને ઇમરજન્સી SMS એલર્ટ સક્ષમ કરવા માટે',
        descPendingSuffix: 'માટે OTP વેરિફિકેશન પૂર્ણ કરો.',
        descAdd: 'સેફ્ટી સ્ટીકરને તમારા ડેશબોર્ડ સાથે લિંક કરવા અને ઇમરજન્સી કૉલ બ્રિજ સક્ષમ કરવા માટે તમારો મોબાઇલ નંબર OTP દ્વારા ઉમેરો અને ચકાસો.',
        verifyBtn: 'OTP થી ફોન ચકાસો',
        addBtn: 'મોબાઇલ નંબર ઉમેરો અને ચકાસો',
        dismiss: 'એલર્ટ કાઢી નાખો',
      },
      setup: {
        welcomePrefix: 'RepiQR માં તમારું સ્વાગત છે,',
        completedSuffix: 'પૂર્ણ',
        step1Title: 'મોબાઇલ ફોન નંબર OTP ચકાસો',
        step1VerifiedPrefix: 'ચકાસાયેલ મોબાઇલ નંબર લિંક:',
        step1PendingPrefix: 'માટે વેરિફિકેશન બાકી',
        step1None: 'હજુ કોઈ મોબાઇલ નંબર ચકાસાયેલ નથી (સ્ટીકર ઓટો-ક્લેમ માટે જરૂરી)',
        completedLabel: 'પૂર્ણ',
        verifyLink: 'ફોન ચકાસો ›',
        step2Title: 'ઇમરજન્સી રેસ્પોન્ડર્સ લિંક કરો',
        step2DescSuffix: 'ઇમરજન્સી સંપર્ક નંબર સક્રિય',
        configureLink: 'કોન્ફિગર કરો ›',
        addContactsLink: 'સંપર્કો ઉમેરો ›',
        step3Title: 'સક્રિય સેફ્ટી QR પ્લેટ',
        step3DescSuffix: 'સક્રિય વાહન QR પ્લેટ ઓનલાઇન',
        viewStickersLink: 'સ્ટીકર જુઓ ›',
      },
      overview: {
        welcomeBackPrefix: 'પરત સ્વાગત છે,',
        heroBadge: 'તમારું સ્ટીકર મુક્ત છે',
        heroTitle: 'તમારું ડેશબોર્ડ સક્રિય કરવા માટે મુક્ત સેફ્ટી સ્ટીકર મેળવો',
        heroDesc: 'તમારું એકાઉન્ટ તૈયાર છે! વાહન QR પ્લેટ, ઇમરજન્સી રેસ્પોન્ડર ટ્રી અને ઇન્સ્ટન્ટ WhatsApp પાર્કિંગ એલર્ટ બનાવવા માટે તમારો મુક્ત RepiQR સ્માર્ટ સેફ્ટી ટેગ મેળવો.',
        maskingBadge: '100% નંબર માસ્કિંગ',
        instantBadge: '0.4 સેકન્ડ ઇન્સ્ટન્ટ એલર્ટ',
        deliveryBadge: 'મુક્ત ડિલિવરી',
        getFreeStickerBtn: 'મુક્ત સ્ટીકર મેળવો →',
        haveTagLink: 'ટેગ છે? કોડથી લિંક કરો',
        statActive: 'સક્રિય સ્ટીકર',
        statScans: 'કુલ સ્કેન',
        statContacts: 'ઇમરજન્સી સંપર્કો',
        statSecurity: 'સુરક્ષા સ્થિતિ',
        protectedLabel: 'સુરક્ષિત',
        latestChat: 'નવીનતમ ચેટ',
        unreadSuffix: 'અવાંચિત',
        viewInbox: 'ઇનબોક્સ જુઓ ›',
        loadingChats: 'ચેટ લોડ થઈ રહી છે...',
        noChatsYet: 'હજુ કોઈ ચેટ નથી.',
        noMessagesYet: 'હજુ કોઈ મેસેજ નથી',
        quickActions: 'ઝડપી ક્રિયાઓ',
        openChat: 'લાઇવ વિઝિટર ચેટ ખોલો',
        addContact: 'ઇમરજન્સી સંપર્ક ઉમેરો',
        syncStickers: 'સેફ્ટી સ્ટીકર સિંક કરો',
        viewQr: 'QR પ્લેટ કોડ જુઓ',
        scanLogs: 'સ્કેન લોગ અને એલર્ટ',
        mySafetyStickersPrefix: 'મારા સેફ્ટી સ્ટીકર',
        recoverLink: 'સ્ટીકર રિકવર કરો',
        refreshLink: 'રિફ્રેશ કરો',
        loadingStickers: 'સ્ટીકર લોડ થઈ રહ્યા છે...',
        noStickersTitle: 'હજુ કોઈ સેફ્ટી સ્ટીકર લિંક નથી',
        noStickersDesc: 'તમારી વાહન પ્લેટ બનાવવા માટે મુક્ત સ્ટીકર મેળવો.',
        getFreeStickerShort: 'મુક્ત સ્ટીકર મેળવો',
        qrBtn: 'QR',
        editBtn: 'ફેરફાર કરો',
        noLongerShowsSuffix: 'હવે અહીં દેખાતું નથી',
        recovering: 'રિકવર થઈ રહ્યું છે…',
        recoverBtn: 'રિકવર કરો',
        viewAllStickers: 'બધા સેફ્ટી સ્ટીકર જુઓ ›',
        emergencyContactsPrefix: 'ઇમરજન્સી સંપર્કો',
        addContactShort: '＋ સંપર્ક',
        noContactsYet: 'હજુ કોઈ ઇમરજન્સી સંપર્ક ઉમેરાયો નથી.',
        addResponders: 'ઇમરજન્સી રેસ્પોન્ડર્સ ઉમેરો',
        manageContacts: 'રેસ્પોન્ડર સંપર્કો મેનેજ કરો ›',
        recentScans: 'તાજેતરના સ્કેન',
        noScansYet: 'હજુ કોઈ સ્કેન નોંધાયેલ નથી',
      },
      products: {
        title: 'પ્રોડક્ટ્સ અને ઓર્ડર',
        availableTags: 'ઉપલબ્ધ ટેગ',
        myOrders: 'મારા ઓર્ડર',
        noProductsTitle: 'હાલમાં કોઈ પ્રોડક્ટ ઉપલબ્ધ નથી',
        noProductsDesc: 'કૃપા કરી થોડી વાર પછી જુઓ અથવા કેટલોગ રિફ્રેશ કરો.',
        refreshCatalog: 'કેટલોગ રિફ્રેશ કરો',
        freeTag: 'મુક્ત ટેગ',
        free: 'મુક્ત',
        safetyTagCategory: 'સેફ્ટી ટેગ',
        privacyBadge: '100% પ્રાઇવસી',
        getFreeTagBtn: 'મુક્ત ટેગ મેળવો',
        orderNowBtn: 'હવે ઓર્ડર કરો',
        searchOrders: 'ઓર્ડર શોધો...',
        allStatus: 'બધી સ્થિતિ',
        placed: 'મૂકાયેલ',
        shipped: 'શિપ થયેલ',
        delivered: 'ડિલિવર થયેલ',
        cancelled: 'રદ થયેલ',
        loadingOrders: 'તમારા ઓર્ડર લોડ થઈ રહ્યા છે...',
        noOrdersTitle: 'હજુ કોઈ ઓર્ડર મૂકાયેલ નથી.',
        noOrdersDesc: 'RepiQR પર તમે ઓર્ડર કરેલ સેફ્ટી સ્ટીકર અને એસેસરીઝ અહીં લાઇવ ટ્રેકિંગ સાથે દેખાશે.',
        browseTagsBtn: 'ઉપલબ્ધ ટેગ જુઓ',
        noOrdersMatch: 'તમારા ફિલ્ટર સાથે કોઈ ઓર્ડર મેળ ખાતો નથી.',
        clearFilters: 'ફિલ્ટર સાફ કરો',
        paid: 'ચુકવણી થઈ ગઈ',
        paymentFailed: 'ચુકવણી નિષ્ફળ',
        awaitingPayment: 'ચુકવણીની રાહ',
        courierSite: 'કુરિયર સાઇટ',
        checking: 'ચકાસી રહ્યા છીએ…',
        hideTracking: 'ટ્રેકિંગ છુપાવો',
        trackDelivery: 'ડિલિવરી ટ્રેક કરો',
        preparingOrder: 'અમે તમારો ઓર્ડર તૈયાર કરી રહ્યા છીએ. કુરિયરને સોંપાતાં જ ટ્રેકિંગ અહીં દેખાશે.',
        noCourierScans: 'હજુ કોઈ કુરિયર સ્કેન નોંધાયેલ નથી — કૃપા કરી થોડી વાર પછી જુઓ.',
        stepOrdered: 'ઓર્ડર થયેલ',
        stepShipped: 'શિપ થયેલ',
        stepDelivered: 'ડિલિવર થયેલ',
        courierFallback: 'કુરિયર',
      },
      history: {
        title: 'એલર્ટ અને સ્કેન ઇતિહાસ',
        refreshAlerts: 'એલર્ટ રિફ્રેશ કરો',
        refreshing: 'રિફ્રેશ થઈ રહ્યું છે…',
        fetching: 'એલર્ટ ઇતિહાસ લાવી રહ્યા છીએ...',
        noAlertsTitle: 'હજુ કોઈ એલર્ટ ઇવેન્ટ નોંધાયેલ નથી.',
        noAlertsDesc: 'જ્યારે પણ કોઈ તમારા વાહન સેફ્ટી ટેગને સ્કેન કરે અથવા એલર્ટ શરૂ કરે, ત્યારે રીયલ-ટાઇમ રિપોર્ટ અહીં દેખાશે.',
        latestAlert: 'નવીનતમ એલર્ટ',
        scanRecorded: 'સ્કેન નોંધાયેલ',
        scannedByPrefix: 'સ્કેન કરનાર:',
        viewPlate: 'પ્લેટ જુઓ',
        openVisitorChat: 'વિઝિટર ચેટ ખોલો',
        allLogsPrefix: 'બધા એલર્ટ લોગ',
        searchLogs: 'લોગ શોધો...',
        noLogsMatchPrefix: 'કોઈ એલર્ટ લોગ મેળ ખાતો નથી',
        colSticker: 'સ્ટીકર / પ્લેટ',
        colEventType: 'ઇવેન્ટ પ્રકાર',
        colContext: 'સંદર્ભ / વિઝિટર',
        colTimestamp: 'સમય',
        directScan: 'ડાયરેક્ટ QR સ્કેન',
        noScanEventsRecent: 'તાજેતરમાં કોઈ સ્કેન ઇવેન્ટ નોંધાયેલ નથી.',
        fullLog: 'સંપૂર્ણ લોગ',
        vehicleSafetyTag: 'વાહન સેફ્ટી ટેગ',
        stickerFallback: 'સ્ટીકર',
      },
      chatInbox: {
        title: 'ચેટ',
        searchPlaceholder: 'ચેટ શોધો',
        all: 'બધા',
        unread: 'અવાંચિત',
        loadingChats: 'ચેટ લોડ થઈ રહી છે...',
        emptyInbox: 'તમારું ઇનબોક્સ ખાલી છે. સ્કેન પછી વિઝિટર ચેટ અહીં દેખાશે.',
        noMatches: 'કોઈ ચેટ મેળ ખાતી નથી.',
        noMessagesYet: 'હજુ કોઈ મેસેજ નથી',
        selectChat: 'જવાબ આપવા માટે ચેટ પસંદ કરો',
        deleteConversation: 'વાતચીત કાઢી નાખો',
        visitor: 'વિઝિટર',
      },
      chrome: {
        clientBadge: 'ક્લાયન્ટ',
        backToSite: 'સાઇટ પર પાછા જાઓ',
        logOut: 'લૉગ આઉટ',
        collapseSidebar: 'સાઇડબાર સંકુચિત કરો',
        expandSidebar: 'સાઇડબાર વિસ્તૃત કરો',
        home: 'RepiQR હોમ',
        user: 'વપરાશકર્તા',
        owner: 'માલિક',
        myBalance: 'મારું બેલેન્સ',
        getFreeSticker: 'મુક્ત સ્ટીકર મેળવો',
        balanceTooltip: 'તમારા ચૂકવેલ ટોપ-અપમાંથી બેલેન્સ',
        liveChatNotifications: 'લાઇવ ચેટ નોટિફિકેશન',
        unreadMessagesSuffix: 'અવાંચિત મેસેજ',
      },
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
      nav: { overview: 'ઓવરવ્યૂ', stickers: 'સ્ટીકર' },
      gate: {
        pendingTitle: 'અરજી સમીક્ષા હેઠળ છે',
        rejectedTitle: 'અરજી મંજૂર થઈ નથી',
        approvedTitle: 'મંજૂર — સેટઅપ પૂર્ણ કરવા માટે સપોર્ટનો સંપર્ક કરો',
        noneTitle: 'હજુ કોઈ પાર્ટનર અરજી નથી',
        backToSite: 'સાઇટ પર પાછા જાઓ',
      },
      kpi: { allocated: 'ફાળવેલ', activated: 'સક્રિય થયેલ', inStock: 'સ્ટોકમાં', scans: 'સ્કેન' },
      recentActivations: 'તાજેતરની સક્રિયતાઓ',
      viewAll: 'બધું જુઓ',
      noAllocatedYet: 'હજુ કોઈ સ્ટીકર ફાળવેલ નથી',
      noActivationsYet: 'હજુ કોઈ સક્રિયતા નથી',
      retry: 'ફરી પ્રયાસ કરો',
      refresh: 'રિફ્રેશ કરો',
      columns: { sticker: 'સ્ટીકર', type: 'પ્રકાર', customer: 'ગ્રાહક', phone: 'ફોન', activated: 'સક્રિય થયેલ', scans: 'સ્કેન', status: 'સ્થિતિ' },
      statusActive: 'સક્રિય',
      statusInStock: 'સ્ટોકમાં',
      sinceLabel: 'તારીખથી',
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
