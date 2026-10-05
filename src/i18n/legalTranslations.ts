import type { Language } from '../context/LanguageContext';

/**
 * Full Privacy Policy page copy (title, back button, and the entire
 * markdown body) per language. The markdown body uses the same minimal
 * markdown subset the page's own renderer understands (#/##/###, **bold**,
 * * bullets, [text](url) links, --- rules, blank-line paragraph breaks) —
 * keep that syntax intact when editing any language's text.
 */
export const legalTranslations: Record<Language, {
  title: string;
  back: string;
  markdown: string;
}> = {
  en: {
    title: 'Privacy Policy',
    back: 'Back',
    markdown: `
**Effective Date:** 12 September 2026
**Last Updated:** 12 September 2026

RepiQR is a safety ecosystem operated by **Worthite LLP** ("RepiQR", "we", "us", or "our").

This Privacy Policy explains how we collect, use, store, disclose, and protect information when you use the RepiQR website, mobile applications, QR products, safety services, communication services, and related features (collectively, the "Services").

By using RepiQR, you acknowledge that you have read and understood this Privacy Policy.

---

## 1. Information We Collect

Depending on how you use RepiQR, we may collect the following categories of information.

### 1.1 Account Information

When you create or use a RepiQR account, we may collect:

* Full name
* Email address
* Mobile phone number
* Password or authentication information, where applicable
* Profile information
* Account preferences
* Account and security information

You may create an account using Google Sign-In or other authentication methods made available by RepiQR.

---

## 2. Google Sign-In

RepiQR may offer "Sign in with Google" to make account creation and login easier.

When you choose Google Sign-In, Google may provide RepiQR with information associated with your Google account that is permitted by the authentication flow, which may include:

* Name
* Email address
* Google account identifier
* Profile picture, where available and requested

RepiQR uses this information only for purposes such as:

* Creating or identifying your RepiQR account
* Authenticating you
* Maintaining account security
* Providing access to RepiQR services
* Associating your RepiQR account with your selected authentication method
* Communicating with you about your account and RepiQR services

RepiQR does **not** use Google user data to sell your personal information or for unrelated advertising purposes.

RepiQR does not request access to your Google Drive, Gmail, Contacts, Calendar, Photos, or other Google services unless a specific RepiQR feature explicitly requires such access and you separately authorize it.

We request only the Google information reasonably necessary for authentication and account functionality.

Google user data is handled in accordance with applicable Google API Services User Data Policies, including applicable Limited Use requirements.

---

## 3. QR Product Information

When you purchase, register, or activate a RepiQR product, you may provide information associated with the QR product.

Depending on the product and features you use, this may include:

* QR code or product identifier
* Vehicle information
* Vehicle registration details
* Emergency contact information
* Owner contact information
* Home-related emergency information
* Child-related emergency information
* Key or property identification information
* Travel/luggage information
* Other information that you voluntarily add to your QR profile

You should only provide information that is necessary for the intended safety function.

---

## 4. Emergency and Safety Information

RepiQR is designed to help people communicate during situations such as accidents, emergencies, lost-property situations, vehicle-related incidents, and other safety-related circumstances.

Depending on the features you activate, RepiQR may process:

* Emergency contact names
* Emergency contact phone numbers
* Owner contact information
* Vehicle information
* Emergency messages
* QR scan information
* Communication records
* Location information, where you explicitly enable or provide it
* Information voluntarily provided during an emergency interaction

Some information may be visible to a person who scans your QR code, depending on the privacy settings and information you have chosen to make available.

You are responsible for ensuring that the information you publish through your QR profile is accurate and appropriate.

---

## 5. QR Scans

When someone scans a RepiQR QR code, RepiQR may record technical and operational information associated with the scan.

This may include:

* QR/product identifier
* Date and time of scan
* Approximate technical information
* Device/browser information
* IP address or similar technical information
* Actions performed after the scan
* Emergency or contact requests generated through the QR system

We may use this information to:

* Provide the requested safety functionality
* Notify the QR owner where applicable
* Detect misuse or suspicious activity
* Prevent abuse
* Improve reliability
* Maintain security
* Generate service analytics

A QR scanner does not automatically receive the QR owner's private information unless that information has been made available through the relevant RepiQR functionality.

---

## 6. WhatsApp Communication and Alerts

RepiQR may use WhatsApp or an authorized WhatsApp Business/API service provider to send service-related communications.

Depending on the feature used, these communications may include:

* OTPs
* Account verification messages
* QR scan alerts
* Emergency alerts
* Family/emergency-contact notifications
* Order updates
* Shipping and delivery notifications
* Customer-support communications
* Product activation messages
* Important service notifications

Where applicable, WhatsApp messages may be delivered through third-party technology providers that process information on our behalf.

We do not guarantee delivery of every WhatsApp message because delivery may depend on WhatsApp, telecommunications providers, internet connectivity, device settings, or other external factors.

---

## 7. Location Information

Certain RepiQR safety features may use location information if you explicitly enable or provide it.

For example, location information may be used to:

* Help communicate the approximate location of an emergency
* Help a user share their location with an emergency contact
* Support roadside or emergency assistance
* Improve the operation of location-dependent safety features

RepiQR does not access precise device location unless the relevant feature, device permission, or user action permits it.

You may disable location permissions through your device or browser settings. Certain location-dependent features may then become unavailable.

---

## 8. Orders and Purchases

When you purchase a RepiQR product, we may collect:

* Customer name
* Email address
* Mobile number
* Shipping address
* Billing information
* Product/order information
* Order amount
* Transaction reference
* Delivery information
* Customer support information

Payment card, UPI, banking, or other payment credentials may be processed by our authorized payment service providers.

RepiQR generally does not need to store your complete payment-card credentials.

Payment information may be processed directly by the payment provider according to its own privacy policy and security practices.

---

## 9. Shipping and Delivery

To fulfil your order, we may share necessary information with shipping, logistics, courier, and delivery partners.

This may include:

* Name
* Phone number
* Shipping address
* Order information
* Delivery instructions

We share only information reasonably necessary to fulfil and deliver your order.

---

## 10. How We Use Personal Information

We may use personal information for purposes including:

* Creating and managing accounts
* Providing RepiQR services
* Authenticating users
* Processing orders
* Processing payments
* Delivering products
* Activating QR products
* Sending OTPs and service alerts
* Sending WhatsApp notifications
* Facilitating emergency communication
* Providing customer support
* Detecting fraud and abuse
* Maintaining security
* Troubleshooting technical problems
* Improving products and services
* Understanding service usage
* Complying with applicable laws
* Protecting our legal rights
* Communicating important changes to our services

We do not sell your personal information as a standalone product.

---

## 11. Legal Basis and Consent

Where consent is required under applicable law, RepiQR will request consent in an appropriate manner and for specified purposes.

You may have rights to withdraw consent, subject to applicable law and legitimate operational, contractual, legal, or security requirements.

Withdrawal of consent may affect your ability to use certain RepiQR features.

India's Digital Personal Data Protection Act, 2023 provides for consent to be free, specific, informed, unconditional and unambiguous, and provides for withdrawal of consent where consent is the basis of processing.

---

## 12. Sharing of Information

We may share information with trusted third parties where reasonably necessary to provide RepiQR services.

These may include:

### Service Providers

* Cloud hosting providers
* Database and infrastructure providers
* Authentication providers
* Google authentication services
* Payment gateways
* WhatsApp Business/API providers
* SMS or OTP providers, where applicable
* Shipping and courier companies
* Analytics and monitoring providers
* Customer-support platforms
* Security and fraud-prevention providers

### Legal and Regulatory Requirements

We may disclose information when reasonably necessary to:

* Comply with applicable law
* Respond to lawful government or regulatory requests
* Prevent fraud or abuse
* Protect users
* Protect RepiQR or Worthite LLP
* Enforce our Terms and Conditions
* Protect legal rights or property

We do not permit third-party service providers to use personal information for purposes unrelated to the services they provide to us, except where otherwise permitted or required by applicable law.

---

## 13. Data Retention

We retain personal information only for as long as reasonably necessary for the purposes described in this Privacy Policy, including:

* Providing services
* Maintaining accounts
* Fulfilling orders
* Maintaining transaction records
* Resolving disputes
* Preventing fraud
* Maintaining security
* Complying with legal obligations

When information is no longer required, we may delete, anonymize, or securely dispose of it, subject to applicable legal and operational requirements.

---

## 14. Account Deletion

You may request deletion of your RepiQR account and associated personal information by contacting us.

Certain information may need to be retained where required by law, necessary for legitimate security purposes, necessary to resolve disputes, or required to complete transactions already initiated.

Deleting your account may also disable or deactivate QR-related services associated with that account.

---

## 15. Data Security

We use reasonable technical and organizational measures designed to protect personal information against unauthorized access, loss, misuse, alteration, or disclosure.

Security measures may include:

* HTTPS/TLS encryption
* Access controls
* Authentication mechanisms
* Secure infrastructure
* Monitoring and logging
* Limited internal access
* Security updates
* Backup and recovery procedures

However, no internet-based system can be guaranteed to be completely secure.

---

## 16. Children's Information

RepiQR may offer products designed for child safety, such as Child Safety QR products.

These products are intended to help parents or lawful guardians manage safety information.

Where personal information relates to a child, the parent or lawful guardian should provide and manage the information appropriately.

We do not knowingly seek unnecessary personal information from children.

Parents or lawful guardians who believe that information relating to a child has been provided improperly may contact us.

---

## 17. Public and Emergency Information

RepiQR allows users to decide what information is associated with their QR products.

Before activating or publishing a QR profile, users should consider whether the information could reveal:

* Home address
* Personal phone number
* Family information
* Vehicle information
* Child-related information
* Other sensitive information

Where possible, RepiQR may provide privacy controls or masked communication mechanisms to reduce unnecessary exposure of personal contact details.

However, users remain responsible for information they choose to publish.

---

## 18. Cookies and Similar Technologies

RepiQR may use cookies, local storage, pixels, analytics technologies, and similar mechanisms to:

* Keep users signed in
* Maintain sessions
* Remember preferences
* Improve website functionality
* Understand website usage
* Improve performance
* Protect against fraud and abuse

You may control cookies through your browser settings. Some website functions may not work correctly if certain cookies are disabled.

---

## 19. Analytics

We may use analytics and technical monitoring services to understand:

* Website usage
* Product usage
* Performance
* Errors
* Traffic patterns
* Feature adoption

Analytics information may be aggregated or otherwise processed to improve RepiQR.

Where third-party analytics providers are used, their processing may also be governed by their respective privacy policies.

---

## 20. Third-Party Services

RepiQR may contain links, integrations, or services operated by third parties.

Examples may include:

* Google
* WhatsApp/Meta
* Payment providers
* Shipping providers
* Other technology providers

RepiQR is not responsible for the privacy practices of independent third-party services.

Users should review the applicable third-party privacy policies when using those services.

---

## 21. International Data Processing

Some RepiQR service providers may process or store information outside India.

Where applicable, RepiQR will take reasonable steps required by applicable law regarding such processing, transfers, and service-provider arrangements.

---

## 22. Your Rights

Subject to applicable law, you may have rights regarding your personal information, including rights to:

* Request information about processing
* Request correction of inaccurate information
* Request deletion where applicable
* Withdraw consent where consent is the basis of processing
* Request information regarding how your data is used
* Raise a complaint regarding processing

Requests may be submitted using the contact details below.

We may need to verify a requester's identity or account ownership before fulfilling certain requests.

---

## 23. Changes to This Privacy Policy

We may update this Privacy Policy from time to time.

When we make material changes, we may provide notice through the website, application, email, or other appropriate communication channels.

The "Last Updated" date at the beginning of this Privacy Policy indicates when it was most recently revised.

---

## 24. Contact Us

**RepiQR**
Operated by **Worthite LLP**

Website: [https://repiqr.com](https://repiqr.com)

Email: [privacy@repiqr.com](mailto:privacy@repiqr.com)

For privacy-related requests, please include sufficient information for us to understand and process your request.

---

## 25. Grievance / Privacy Contact

For questions, concerns, complaints, or requests regarding personal information or this Privacy Policy, contact:

**Privacy / Grievance Contact**
Worthite LLP / RepiQR
Email: [privacy@repiqr.com](mailto:privacy@repiqr.com)

We will review and respond to requests in accordance with applicable law.

**Self-service controls.** Signed-in account holders can also manage consent (grant/withdraw specific purposes), download a copy of their data, name a nominee, request account erasure, and submit a grievance directly — without emailing us — from **Dashboard → Privacy & Data**. Submitting a grievance there issues a tracked ticket number.

---

## 26. Consent

By creating an account, using RepiQR, purchasing a RepiQR product, activating a QR product, or otherwise using services for which consent is required, you acknowledge the practices described in this Privacy Policy and provide consent where required by applicable law.
`,
  },
  hi: {
    title: 'गोपनीयता नीति',
    back: 'वापस',
    markdown: `
**प्रभावी तिथि:** 12 सितंबर 2026
**अंतिम अद्यतन:** 12 सितंबर 2026

RepiQR एक सुरक्षा इकोसिस्टम है जिसे **Worthite LLP** ("RepiQR", "हम", "हमें", या "हमारा") द्वारा संचालित किया जाता है।

यह गोपनीयता नीति बताती है कि जब आप RepiQR वेबसाइट, मोबाइल एप्लिकेशन, QR उत्पाद, सुरक्षा सेवाएं, संचार सेवाएं, और संबंधित सुविधाओं (सामूहिक रूप से "सेवाएं") का उपयोग करते हैं तो हम जानकारी कैसे एकत्र करते हैं, उपयोग करते हैं, संग्रहीत करते हैं, प्रकट करते हैं, और सुरक्षित रखते हैं।

RepiQR का उपयोग करके, आप स्वीकार करते हैं कि आपने इस गोपनीयता नीति को पढ़ और समझ लिया है।

---

## 1. हम जो जानकारी एकत्र करते हैं

आप RepiQR का उपयोग कैसे करते हैं, इसके आधार पर, हम निम्नलिखित श्रेणियों की जानकारी एकत्र कर सकते हैं।

### 1.1 खाता जानकारी

जब आप RepiQR खाता बनाते या उपयोग करते हैं, तो हम एकत्र कर सकते हैं:

* पूरा नाम
* ईमेल पता
* मोबाइल फोन नंबर
* पासवर्ड या प्रमाणीकरण जानकारी, जहां लागू हो
* प्रोफ़ाइल जानकारी
* खाता प्राथमिकताएं
* खाता और सुरक्षा जानकारी

आप Google साइन-इन या RepiQR द्वारा उपलब्ध कराए गए अन्य प्रमाणीकरण तरीकों का उपयोग करके खाता बना सकते हैं।

---

## 2. Google साइन-इन

RepiQR खाता बनाना और लॉग इन करना आसान बनाने के लिए "Google से साइन इन करें" की सुविधा दे सकता है।

जब आप Google साइन-इन चुनते हैं, तो Google RepiQR को आपके Google खाते से संबंधित जानकारी प्रदान कर सकता है जो प्रमाणीकरण प्रक्रिया द्वारा अनुमत है, जिसमें शामिल हो सकते हैं:

* नाम
* ईमेल पता
* Google खाता पहचानकर्ता
* प्रोफ़ाइल चित्र, जहां उपलब्ध हो और अनुरोध किया गया हो

RepiQR इस जानकारी का उपयोग केवल इन उद्देश्यों के लिए करता है, जैसे:

* आपका RepiQR खाता बनाना या पहचानना
* आपको प्रमाणित करना
* खाता सुरक्षा बनाए रखना
* RepiQR सेवाओं तक पहुंच प्रदान करना
* आपके RepiQR खाते को आपके चयनित प्रमाणीकरण तरीके से जोड़ना
* आपके खाते और RepiQR सेवाओं के बारे में आपसे संवाद करना

RepiQR आपकी व्यक्तिगत जानकारी बेचने या असंबंधित विज्ञापन उद्देश्यों के लिए Google उपयोगकर्ता डेटा का उपयोग **नहीं** करता है।

RepiQR आपके Google Drive, Gmail, संपर्क, कैलेंडर, फ़ोटो, या अन्य Google सेवाओं तक पहुंच का अनुरोध नहीं करता जब तक कि किसी विशेष RepiQR सुविधा को स्पष्ट रूप से इस तरह की पहुंच की आवश्यकता न हो और आप अलग से इसे अधिकृत न करें।

हम केवल वह Google जानकारी मांगते हैं जो प्रमाणीकरण और खाता कार्यक्षमता के लिए उचित रूप से आवश्यक है।

Google उपयोगकर्ता डेटा को लागू Google API सेवाएं उपयोगकर्ता डेटा नीतियों के अनुसार संभाला जाता है, जिसमें लागू सीमित उपयोग (Limited Use) आवश्यकताएं शामिल हैं।

---

## 3. QR उत्पाद जानकारी

जब आप किसी RepiQR उत्पाद को खरीदते, पंजीकृत करते, या सक्रिय करते हैं, तो आप QR उत्पाद से संबंधित जानकारी प्रदान कर सकते हैं।

आप जिस उत्पाद और सुविधाओं का उपयोग करते हैं, उसके आधार पर, इसमें शामिल हो सकता है:

* QR कोड या उत्पाद पहचानकर्ता
* वाहन जानकारी
* वाहन पंजीकरण विवरण
* आपातकालीन संपर्क जानकारी
* मालिक संपर्क जानकारी
* घर से संबंधित आपातकालीन जानकारी
* बच्चे से संबंधित आपातकालीन जानकारी
* चाबी या संपत्ति पहचान जानकारी
* यात्रा/सामान जानकारी
* अन्य जानकारी जो आप स्वेच्छा से अपनी QR प्रोफ़ाइल में जोड़ते हैं

आपको केवल वही जानकारी प्रदान करनी चाहिए जो इच्छित सुरक्षा कार्य के लिए आवश्यक है।

---

## 4. आपातकालीन और सुरक्षा जानकारी

RepiQR को दुर्घटनाओं, आपातकाल, खोई हुई संपत्ति की स्थितियों, वाहन-संबंधी घटनाओं, और अन्य सुरक्षा-संबंधी परिस्थितियों के दौरान लोगों के बीच संवाद में मदद करने के लिए डिज़ाइन किया गया है।

आप जिन सुविधाओं को सक्रिय करते हैं, उसके आधार पर, RepiQR प्रोसेस कर सकता है:

* आपातकालीन संपर्क नाम
* आपातकालीन संपर्क फोन नंबर
* मालिक संपर्क जानकारी
* वाहन जानकारी
* आपातकालीन संदेश
* QR स्कैन जानकारी
* संचार रिकॉर्ड
* स्थान जानकारी, जहां आप स्पष्ट रूप से इसे सक्षम या प्रदान करते हैं
* आपातकालीन इंटरैक्शन के दौरान स्वेच्छा से प्रदान की गई जानकारी

आपकी गोपनीयता सेटिंग्स और आपके द्वारा उपलब्ध कराने के लिए चुनी गई जानकारी के आधार पर, कुछ जानकारी आपके QR कोड को स्कैन करने वाले व्यक्ति को दिखाई दे सकती है।

आप यह सुनिश्चित करने के लिए जिम्मेदार हैं कि आप अपनी QR प्रोफ़ाइल के माध्यम से जो जानकारी प्रकाशित करते हैं वह सटीक और उचित है।

---

## 5. QR स्कैन

जब कोई RepiQR QR कोड स्कैन करता है, तो RepiQR स्कैन से संबंधित तकनीकी और संचालन संबंधी जानकारी रिकॉर्ड कर सकता है।

इसमें शामिल हो सकता है:

* QR/उत्पाद पहचानकर्ता
* स्कैन की तारीख और समय
* अनुमानित तकनीकी जानकारी
* डिवाइस/ब्राउज़र जानकारी
* IP पता या इसी तरह की तकनीकी जानकारी
* स्कैन के बाद की गई कार्रवाइयां
* QR सिस्टम के माध्यम से उत्पन्न आपातकालीन या संपर्क अनुरोध

हम इस जानकारी का उपयोग निम्न के लिए कर सकते हैं:

* अनुरोधित सुरक्षा कार्यक्षमता प्रदान करना
* जहां लागू हो, QR मालिक को सूचित करना
* दुरुपयोग या संदिग्ध गतिविधि का पता लगाना
* दुरुपयोग रोकना
* विश्वसनीयता में सुधार करना
* सुरक्षा बनाए रखना
* सेवा विश्लेषण उत्पन्न करना

जब तक संबंधित RepiQR कार्यक्षमता के माध्यम से वह जानकारी उपलब्ध नहीं कराई जाती, एक QR स्कैनर स्वचालित रूप से QR मालिक की निजी जानकारी प्राप्त नहीं करता।

---

## 6. WhatsApp संचार और अलर्ट

RepiQR सेवा-संबंधी संचार भेजने के लिए WhatsApp या किसी अधिकृत WhatsApp Business/API सेवा प्रदाता का उपयोग कर सकता है।

उपयोग की गई सुविधा के आधार पर, इन संचारों में शामिल हो सकते हैं:

* OTP
* खाता सत्यापन संदेश
* QR स्कैन अलर्ट
* आपातकालीन अलर्ट
* परिवार/आपातकालीन-संपर्क सूचनाएं
* ऑर्डर अपडेट
* शिपिंग और डिलीवरी सूचनाएं
* ग्राहक-सहायता संचार
* उत्पाद सक्रियण संदेश
* महत्वपूर्ण सेवा सूचनाएं

जहां लागू हो, WhatsApp संदेश तीसरे-पक्ष की तकनीक प्रदाताओं के माध्यम से वितरित किए जा सकते हैं जो हमारी ओर से जानकारी प्रोसेस करते हैं।

हम हर WhatsApp संदेश की डिलीवरी की गारंटी नहीं देते क्योंकि डिलीवरी WhatsApp, दूरसंचार प्रदाताओं, इंटरनेट कनेक्टिविटी, डिवाइस सेटिंग्स, या अन्य बाहरी कारकों पर निर्भर हो सकती है।

---

## 7. स्थान जानकारी

कुछ RepiQR सुरक्षा सुविधाएं स्थान जानकारी का उपयोग कर सकती हैं यदि आप स्पष्ट रूप से इसे सक्षम या प्रदान करते हैं।

उदाहरण के लिए, स्थान जानकारी का उपयोग किया जा सकता है:

* किसी आपातकाल के अनुमानित स्थान को संप्रेषित करने में मदद करने के लिए
* किसी उपयोगकर्ता को अपने आपातकालीन संपर्क के साथ अपना स्थान साझा करने में मदद करने के लिए
* रोडसाइड या आपातकालीन सहायता का समर्थन करने के लिए
* स्थान-निर्भर सुरक्षा सुविधाओं के संचालन में सुधार करने के लिए

RepiQR आपके डिवाइस के सटीक स्थान तक तब तक पहुंच नहीं बनाता जब तक संबंधित सुविधा, डिवाइस अनुमति, या उपयोगकर्ता कार्रवाई इसकी अनुमति न दे।

आप अपने डिवाइस या ब्राउज़र सेटिंग्स के माध्यम से स्थान अनुमतियां अक्षम कर सकते हैं। कुछ स्थान-निर्भर सुविधाएं तब अनुपलब्ध हो सकती हैं।

---

## 8. ऑर्डर और खरीदारी

जब आप कोई RepiQR उत्पाद खरीदते हैं, तो हम एकत्र कर सकते हैं:

* ग्राहक का नाम
* ईमेल पता
* मोबाइल नंबर
* शिपिंग पता
* बिलिंग जानकारी
* उत्पाद/ऑर्डर जानकारी
* ऑर्डर राशि
* ट्रांज़ैक्शन संदर्भ
* डिलीवरी जानकारी
* ग्राहक सहायता जानकारी

पेमेंट कार्ड, UPI, बैंकिंग, या अन्य पेमेंट क्रेडेंशियल हमारे अधिकृत पेमेंट सेवा प्रदाताओं द्वारा प्रोसेस किए जा सकते हैं।

RepiQR को आम तौर पर आपके पूर्ण पेमेंट-कार्ड क्रेडेंशियल संग्रहीत करने की आवश्यकता नहीं होती।

पेमेंट जानकारी को पेमेंट प्रदाता द्वारा सीधे उसकी अपनी गोपनीयता नीति और सुरक्षा प्रथाओं के अनुसार प्रोसेस किया जा सकता है।

---

## 9. शिपिंग और डिलीवरी

आपके ऑर्डर को पूरा करने के लिए, हम शिपिंग, लॉजिस्टिक्स, कूरियर, और डिलीवरी पार्टनरों के साथ आवश्यक जानकारी साझा कर सकते हैं।

इसमें शामिल हो सकता है:

* नाम
* फोन नंबर
* शिपिंग पता
* ऑर्डर जानकारी
* डिलीवरी निर्देश

हम केवल वही जानकारी साझा करते हैं जो आपके ऑर्डर को पूरा करने और डिलीवर करने के लिए उचित रूप से आवश्यक है।

---

## 10. हम व्यक्तिगत जानकारी का उपयोग कैसे करते हैं

हम व्यक्तिगत जानकारी का उपयोग निम्नलिखित उद्देश्यों के लिए कर सकते हैं:

* खाते बनाना और प्रबंधित करना
* RepiQR सेवाएं प्रदान करना
* उपयोगकर्ताओं को प्रमाणित करना
* ऑर्डर प्रोसेस करना
* पेमेंट प्रोसेस करना
* उत्पाद डिलीवर करना
* QR उत्पाद सक्रिय करना
* OTP और सेवा अलर्ट भेजना
* WhatsApp सूचनाएं भेजना
* आपातकालीन संचार की सुविधा देना
* ग्राहक सहायता प्रदान करना
* धोखाधड़ी और दुरुपयोग का पता लगाना
* सुरक्षा बनाए रखना
* तकनीकी समस्याओं का निवारण करना
* उत्पादों और सेवाओं में सुधार करना
* सेवा उपयोग को समझना
* लागू कानूनों का पालन करना
* हमारे कानूनी अधिकारों की सुरक्षा करना
* हमारी सेवाओं में महत्वपूर्ण बदलावों के बारे में संवाद करना

हम आपकी व्यक्तिगत जानकारी को एक स्टैंडअलोन उत्पाद के रूप में नहीं बेचते।

---

## 11. कानूनी आधार और सहमति

जहां लागू कानून के अंतर्गत सहमति आवश्यक है, RepiQR उचित तरीके से और निर्दिष्ट उद्देश्यों के लिए सहमति मांगेगा।

लागू कानून और वैध संचालन, संविदात्मक, कानूनी, या सुरक्षा आवश्यकताओं के अधीन, आपको सहमति वापस लेने का अधिकार हो सकता है।

सहमति वापस लेने से कुछ RepiQR सुविधाओं का उपयोग करने की आपकी क्षमता प्रभावित हो सकती है।

भारत का डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम, 2023 यह प्रावधान करता है कि सहमति स्वतंत्र, विशिष्ट, सूचित, अप्रतिबंधित और स्पष्ट हो, और यह प्रावधान करता है कि जहां सहमति प्रोसेसिंग का आधार है, वहां सहमति वापस ली जा सकती है।

---

## 12. जानकारी का साझाकरण

जहां RepiQR सेवाएं प्रदान करने के लिए उचित रूप से आवश्यक हो, हम विश्वसनीय तीसरे पक्षों के साथ जानकारी साझा कर सकते हैं।

इनमें शामिल हो सकते हैं:

### सेवा प्रदाता

* क्लाउड होस्टिंग प्रदाता
* डेटाबेस और इंफ्रास्ट्रक्चर प्रदाता
* प्रमाणीकरण प्रदाता
* Google प्रमाणीकरण सेवाएं
* पेमेंट गेटवे
* WhatsApp Business/API प्रदाता
* SMS या OTP प्रदाता, जहां लागू हो
* शिपिंग और कूरियर कंपनियां
* एनालिटिक्स और मॉनिटरिंग प्रदाता
* ग्राहक-सहायता प्लेटफ़ॉर्म
* सुरक्षा और धोखाधड़ी-रोकथाम प्रदाता

### कानूनी और नियामक आवश्यकताएं

हम जानकारी प्रकट कर सकते हैं जब यह निम्न के लिए उचित रूप से आवश्यक हो:

* लागू कानून का पालन करना
* वैध सरकारी या नियामक अनुरोधों का जवाब देना
* धोखाधड़ी या दुरुपयोग को रोकना
* उपयोगकर्ताओं की सुरक्षा करना
* RepiQR या Worthite LLP की सुरक्षा करना
* हमारी नियम और शर्तों को लागू करना
* कानूनी अधिकारों या संपत्ति की सुरक्षा करना

हम तीसरे-पक्ष सेवा प्रदाताओं को उन उद्देश्यों के लिए व्यक्तिगत जानकारी का उपयोग करने की अनुमति नहीं देते जो हमें प्रदान की जाने वाली सेवाओं से असंबंधित हैं, सिवाय इसके कि जहां लागू कानून द्वारा अन्यथा अनुमति दी गई हो या आवश्यक हो।

---

## 13. डेटा प्रतिधारण

हम व्यक्तिगत जानकारी को केवल इस गोपनीयता नीति में वर्णित उद्देश्यों के लिए उचित रूप से आवश्यक समय तक बनाए रखते हैं, जिसमें शामिल हैं:

* सेवाएं प्रदान करना
* खाते बनाए रखना
* ऑर्डर पूरा करना
* ट्रांज़ैक्शन रिकॉर्ड बनाए रखना
* विवादों का समाधान करना
* धोखाधड़ी को रोकना
* सुरक्षा बनाए रखना
* कानूनी बाध्यताओं का पालन करना

जब जानकारी की आवश्यकता नहीं रहती, तो हम लागू कानूनी और संचालन संबंधी आवश्यकताओं के अधीन, इसे हटा सकते हैं, अनाम बना सकते हैं, या सुरक्षित रूप से नष्ट कर सकते हैं।

---

## 14. खाता विलोपन

आप हमसे संपर्क करके अपने RepiQR खाते और संबंधित व्यक्तिगत जानकारी को हटाने का अनुरोध कर सकते हैं।

कानून द्वारा आवश्यक होने पर, वैध सुरक्षा उद्देश्यों के लिए आवश्यक होने पर, विवादों को सुलझाने के लिए आवश्यक होने पर, या पहले से शुरू किए गए ट्रांज़ैक्शन को पूरा करने के लिए आवश्यक होने पर, कुछ जानकारी को बनाए रखने की आवश्यकता हो सकती है।

आपके खाते को हटाने से उस खाते से जुड़ी QR-संबंधित सेवाएं भी अक्षम या निष्क्रिय हो सकती हैं।

---

## 15. डेटा सुरक्षा

हम व्यक्तिगत जानकारी को अनधिकृत पहुंच, हानि, दुरुपयोग, परिवर्तन, या प्रकटीकरण से बचाने के लिए डिज़ाइन किए गए उचित तकनीकी और संगठनात्मक उपाय करते हैं।

सुरक्षा उपायों में शामिल हो सकते हैं:

* HTTPS/TLS एन्क्रिप्शन
* एक्सेस नियंत्रण
* प्रमाणीकरण तंत्र
* सुरक्षित इंफ्रास्ट्रक्चर
* मॉनिटरिंग और लॉगिंग
* सीमित आंतरिक पहुंच
* सुरक्षा अपडेट
* बैकअप और रिकवरी प्रक्रियाएं

हालांकि, किसी भी इंटरनेट-आधारित सिस्टम को पूरी तरह से सुरक्षित होने की गारंटी नहीं दी जा सकती।

---

## 16. बच्चों की जानकारी

RepiQR बच्चों की सुरक्षा के लिए डिज़ाइन किए गए उत्पाद प्रदान कर सकता है, जैसे चाइल्ड सेफ्टी QR उत्पाद।

इन उत्पादों का उद्देश्य माता-पिता या वैध अभिभावकों को सुरक्षा जानकारी प्रबंधित करने में मदद करना है।

जहां व्यक्तिगत जानकारी किसी बच्चे से संबंधित है, वहां माता-पिता या वैध अभिभावक को उचित रूप से जानकारी प्रदान और प्रबंधित करनी चाहिए।

हम बच्चों से अनावश्यक व्यक्तिगत जानकारी जानबूझकर नहीं मांगते।

माता-पिता या वैध अभिभावक जो मानते हैं कि किसी बच्चे से संबंधित जानकारी अनुचित रूप से प्रदान की गई है, वे हमसे संपर्क कर सकते हैं।

---

## 17. सार्वजनिक और आपातकालीन जानकारी

RepiQR उपयोगकर्ताओं को यह तय करने देता है कि उनके QR उत्पादों से कौन सी जानकारी जुड़ी है।

QR प्रोफ़ाइल को सक्रिय या प्रकाशित करने से पहले, उपयोगकर्ताओं को यह विचार करना चाहिए कि क्या जानकारी इन्हें प्रकट कर सकती है:

* घर का पता
* व्यक्तिगत फोन नंबर
* पारिवारिक जानकारी
* वाहन जानकारी
* बच्चे से संबंधित जानकारी
* अन्य संवेदनशील जानकारी

जहां संभव हो, RepiQR व्यक्तिगत संपर्क विवरणों के अनावश्यक प्रदर्शन को कम करने के लिए गोपनीयता नियंत्रण या मास्क्ड संचार तंत्र प्रदान कर सकता है।

हालांकि, उपयोगकर्ता उस जानकारी के लिए जिम्मेदार रहते हैं जिसे वे प्रकाशित करना चुनते हैं।

---

## 18. कुकीज़ और इसी तरह की तकनीकें

RepiQR कुकीज़, लोकल स्टोरेज, पिक्सेल, एनालिटिक्स तकनीकों, और इसी तरह के तंत्रों का उपयोग कर सकता है:

* उपयोगकर्ताओं को साइन-इन रखने के लिए
* सेशन बनाए रखने के लिए
* प्राथमिकताएं याद रखने के लिए
* वेबसाइट कार्यक्षमता में सुधार करने के लिए
* वेबसाइट उपयोग को समझने के लिए
* प्रदर्शन में सुधार करने के लिए
* धोखाधड़ी और दुरुपयोग से बचाने के लिए

आप अपने ब्राउज़र सेटिंग्स के माध्यम से कुकीज़ को नियंत्रित कर सकते हैं। यदि कुछ कुकीज़ अक्षम हैं तो कुछ वेबसाइट फ़ंक्शन सही ढंग से काम नहीं कर सकते।

---

## 19. एनालिटिक्स

हम यह समझने के लिए एनालिटिक्स और तकनीकी मॉनिटरिंग सेवाओं का उपयोग कर सकते हैं:

* वेबसाइट उपयोग
* उत्पाद उपयोग
* प्रदर्शन
* त्रुटियां
* ट्रैफ़िक पैटर्न
* सुविधा अपनाना

RepiQR को बेहतर बनाने के लिए एनालिटिक्स जानकारी को एकत्रित या अन्यथा प्रोसेस किया जा सकता है।

जहां तीसरे-पक्ष एनालिटिक्स प्रदाताओं का उपयोग किया जाता है, उनकी प्रोसेसिंग उनकी संबंधित गोपनीयता नीतियों द्वारा भी शासित हो सकती है।

---

## 20. तीसरे-पक्ष की सेवाएं

RepiQR में तीसरे पक्षों द्वारा संचालित लिंक, इंटीग्रेशन, या सेवाएं हो सकती हैं।

उदाहरणों में शामिल हो सकते हैं:

* Google
* WhatsApp/Meta
* पेमेंट प्रदाता
* शिपिंग प्रदाता
* अन्य तकनीक प्रदाता

RepiQR स्वतंत्र तीसरे-पक्ष सेवाओं की गोपनीयता प्रथाओं के लिए जिम्मेदार नहीं है।

उपयोगकर्ताओं को उन सेवाओं का उपयोग करते समय लागू तीसरे-पक्ष गोपनीयता नीतियों की समीक्षा करनी चाहिए।

---

## 21. अंतरराष्ट्रीय डेटा प्रोसेसिंग

कुछ RepiQR सेवा प्रदाता जानकारी को भारत के बाहर प्रोसेस या संग्रहीत कर सकते हैं।

जहां लागू हो, RepiQR ऐसी प्रोसेसिंग, ट्रांसफर, और सेवा-प्रदाता व्यवस्थाओं के संबंध में लागू कानून द्वारा आवश्यक उचित कदम उठाएगा।

---

## 22. आपके अधिकार

लागू कानून के अधीन, आपके व्यक्तिगत जानकारी के संबंध में अधिकार हो सकते हैं, जिनमें शामिल हैं:

* प्रोसेसिंग के बारे में जानकारी का अनुरोध करने का अधिकार
* गलत जानकारी के सुधार का अनुरोध करने का अधिकार
* जहां लागू हो, विलोपन का अनुरोध करने का अधिकार
* जहां सहमति प्रोसेसिंग का आधार है, वहां सहमति वापस लेने का अधिकार
* आपके डेटा का उपयोग कैसे किया जाता है, इसके बारे में जानकारी का अनुरोध करने का अधिकार
* प्रोसेसिंग के संबंध में शिकायत दर्ज करने का अधिकार

अनुरोध नीचे दिए गए संपर्क विवरण का उपयोग करके प्रस्तुत किए जा सकते हैं।

कुछ अनुरोधों को पूरा करने से पहले हमें अनुरोधकर्ता की पहचान या खाता स्वामित्व सत्यापित करने की आवश्यकता हो सकती है।

---

## 23. इस गोपनीयता नीति में परिवर्तन

हम समय-समय पर इस गोपनीयता नीति को अपडेट कर सकते हैं।

जब हम महत्वपूर्ण बदलाव करते हैं, तो हम वेबसाइट, एप्लिकेशन, ईमेल, या अन्य उचित संचार माध्यमों के द्वारा सूचना प्रदान कर सकते हैं।

इस गोपनीयता नीति की शुरुआत में "अंतिम अद्यतन" तारीख बताती है कि इसे सबसे हाल में कब संशोधित किया गया था।

---

## 24. हमसे संपर्क करें

**RepiQR**
**Worthite LLP** द्वारा संचालित

वेबसाइट: [https://repiqr.com](https://repiqr.com)

ईमेल: [privacy@repiqr.com](mailto:privacy@repiqr.com)

गोपनीयता-संबंधी अनुरोधों के लिए, कृपया अपने अनुरोध को समझने और प्रोसेस करने के लिए हमें पर्याप्त जानकारी शामिल करें।

---

## 25. शिकायत / गोपनीयता संपर्क

व्यक्तिगत जानकारी या इस गोपनीयता नीति के संबंध में प्रश्नों, चिंताओं, शिकायतों, या अनुरोधों के लिए, संपर्क करें:

**गोपनीयता / शिकायत संपर्क**
Worthite LLP / RepiQR
ईमेल: [privacy@repiqr.com](mailto:privacy@repiqr.com)

हम लागू कानून के अनुसार अनुरोधों की समीक्षा करेंगे और उनका जवाब देंगे।

**स्व-सेवा नियंत्रण।** साइन-इन किए हुए खाताधारक हमें ईमेल किए बिना — **डैशबोर्ड → गोपनीयता और डेटा** से सीधे सहमति प्रबंधित (विशिष्ट उद्देश्यों को स्वीकृत/वापस) कर सकते हैं, अपने डेटा की एक कॉपी डाउनलोड कर सकते हैं, एक नॉमिनी नामित कर सकते हैं, खाता विलोपन का अनुरोध कर सकते हैं, और सीधे शिकायत दर्ज कर सकते हैं। वहां शिकायत दर्ज करने से एक ट्रैक की गई टिकट संख्या जारी होती है।

---

## 26. सहमति

खाता बनाकर, RepiQR का उपयोग करके, RepiQR उत्पाद खरीदकर, QR उत्पाद सक्रिय करके, या अन्यथा उन सेवाओं का उपयोग करके जिनके लिए सहमति आवश्यक है, आप इस गोपनीयता नीति में वर्णित प्रथाओं को स्वीकार करते हैं और जहां लागू कानून द्वारा आवश्यक हो, सहमति प्रदान करते हैं।
`,
  },
  gu: {
    title: 'ગોપનીયતા નીતિ',
    back: 'પાછા',
    markdown: `
**અસરકારક તારીખ:** 12 સપ્ટેમ્બર 2026
**છેલ્લે અપડેટ કર્યું:** 12 સપ્ટેમ્બર 2026

RepiQR એ **Worthite LLP** ("RepiQR", "અમે", "અમને", અથવા "અમારું") દ્વારા સંચાલિત એક સુરક્ષા ઇકોસિસ્ટમ છે.

આ ગોપનીયતા નીતિ સમજાવે છે કે જ્યારે તમે RepiQR વેબસાઇટ, મોબાઇલ એપ્લિકેશન, QR ઉત્પાદનો, સુરક્ષા સેવાઓ, સંચાર સેવાઓ, અને સંબંધિત સુવિધાઓ (સામૂહિક રીતે "સેવાઓ") નો ઉપયોગ કરો છો ત્યારે અમે માહિતી કેવી રીતે એકત્રિત કરીએ છીએ, ઉપયોગ કરીએ છીએ, સંગ્રહિત કરીએ છીએ, જાહેર કરીએ છીએ, અને સુરક્ષિત કરીએ છીએ.

RepiQR નો ઉપયોગ કરીને, તમે સ્વીકારો છો કે તમે આ ગોપનીયતા નીતિ વાંચી અને સમજી છે.

---

## 1. અમે જે માહિતી એકત્રિત કરીએ છીએ

તમે RepiQR નો ઉપયોગ કેવી રીતે કરો છો તેના આધારે, અમે નીચેની શ્રેણીઓની માહિતી એકત્રિત કરી શકીએ છીએ.

### 1.1 એકાઉન્ટ માહિતી

જ્યારે તમે RepiQR એકાઉન્ટ બનાવો અથવા ઉપયોગ કરો, ત્યારે અમે એકત્રિત કરી શકીએ છીએ:

* સંપૂર્ણ નામ
* ઈમેલ સરનામું
* મોબાઇલ ફોન નંબર
* પાસવર્ડ અથવા પ્રમાણીકરણ માહિતી, જ્યાં લાગુ પડે
* પ્રોફાઇલ માહિતી
* એકાઉન્ટ પસંદગીઓ
* એકાઉન્ટ અને સુરક્ષા માહિતી

તમે Google સાઇન-ઇન અથવા RepiQR દ્વારા ઉપલબ્ધ અન્ય પ્રમાણીકરણ પદ્ધતિઓનો ઉપયોગ કરીને એકાઉન્ટ બનાવી શકો છો.

---

## 2. Google સાઇન-ઇન

RepiQR એકાઉન્ટ બનાવવું અને લૉગ ઇન કરવું સરળ બનાવવા માટે "Google સાથે સાઇન ઇન કરો" ઓફર કરી શકે છે.

જ્યારે તમે Google સાઇન-ઇન પસંદ કરો છો, ત્યારે Google RepiQR ને તમારા Google એકાઉન્ટ સાથે સંકળાયેલ માહિતી પ્રદાન કરી શકે છે જે પ્રમાણીકરણ પ્રક્રિયા દ્વારા માન્ય છે, જેમાં શામેલ હોઈ શકે છે:

* નામ
* ઈમેલ સરનામું
* Google એકાઉન્ટ ઓળખકર્તા
* પ્રોફાઇલ ચિત્ર, જ્યાં ઉપલબ્ધ અને વિનંતી કરેલ હોય

RepiQR આ માહિતીનો ઉપયોગ માત્ર આવા હેતુઓ માટે કરે છે, જેમ કે:

* તમારું RepiQR એકાઉન્ટ બનાવવું અથવા ઓળખવું
* તમને પ્રમાણિત કરવું
* એકાઉન્ટ સુરક્ષા જાળવવી
* RepiQR સેવાઓની ઍક્સેસ પ્રદાન કરવી
* તમારા RepiQR એકાઉન્ટને તમારી પસંદ કરેલી પ્રમાણીકરણ પદ્ધતિ સાથે સાંકળવું
* તમારા એકાઉન્ટ અને RepiQR સેવાઓ વિશે તમારી સાથે વાતચીત કરવી

RepiQR તમારી વ્યક્તિગત માહિતી વેચવા અથવા અસંબંધિત જાહેરાત હેતુઓ માટે Google યુઝર ડેટાનો ઉપયોગ **કરતું નથી**.

RepiQR તમારા Google Drive, Gmail, સંપર્કો, કેલેન્ડર, ફોટા, અથવા અન્ય Google સેવાઓની ઍક્સેસની વિનંતી કરતું નથી સિવાય કે કોઈ ચોક્કસ RepiQR સુવિધાને સ્પષ્ટપણે આવી ઍક્સેસની જરૂર હોય અને તમે તેને અલગથી અધિકૃત કરો.

અમે માત્ર તે Google માહિતી માંગીએ છીએ જે પ્રમાણીકરણ અને એકાઉન્ટ કાર્યક્ષમતા માટે વાજબી રીતે જરૂરી છે.

Google યુઝર ડેટાને લાગુ Google API સેવાઓ યુઝર ડેટા નીતિઓ અનુસાર સંભાળવામાં આવે છે, જેમાં લાગુ મર્યાદિત ઉપયોગ (Limited Use) જરૂરિયાતો શામેલ છે.

---

## 3. QR ઉત્પાદન માહિતી

જ્યારે તમે કોઈ RepiQR ઉત્પાદન ખરીદો, રજીસ્ટર કરો, અથવા સક્રિય કરો, ત્યારે તમે QR ઉત્પાદન સાથે સંકળાયેલ માહિતી પ્રદાન કરી શકો છો.

તમે જે ઉત્પાદન અને સુવિધાઓનો ઉપયોગ કરો છો તેના આધારે, આમાં શામેલ હોઈ શકે છે:

* QR કોડ અથવા ઉત્પાદન ઓળખકર્તા
* વાહન માહિતી
* વાહન નોંધણી વિગતો
* ઇમરજન્સી સંપર્ક માહિતી
* માલિક સંપર્ક માહિતી
* ઘર-સંબંધિત ઇમરજન્સી માહિતી
* બાળક-સંબંધિત ઇમરજન્સી માહિતી
* ચાવી અથવા સંપત્તિ ઓળખ માહિતી
* મુસાફરી/સામાન માહિતી
* અન્ય માહિતી જે તમે સ્વેચ્છાએ તમારી QR પ્રોફાઇલમાં ઉમેરો છો

તમારે માત્ર તે માહિતી પ્રદાન કરવી જોઈએ જે ઇચ્છિત સુરક્ષા કાર્ય માટે જરૂરી છે.

---

## 4. ઇમરજન્સી અને સુરક્ષા માહિતી

RepiQR ને અકસ્માતો, ઇમરજન્સી, ખોવાયેલી-સંપત્તિની પરિસ્થિતિઓ, વાહન-સંબંધિત ઘટનાઓ, અને અન્ય સુરક્ષા-સંબંધિત પરિસ્થિતિઓ દરમિયાન લોકોને વાતચીત કરવામાં મદદ કરવા માટે ડિઝાઇન કરવામાં આવ્યું છે.

તમે જે સુવિધાઓ સક્રિય કરો છો તેના આધારે, RepiQR પ્રક્રિયા કરી શકે છે:

* ઇમરજન્સી સંપર્ક નામો
* ઇમરજન્સી સંપર્ક ફોન નંબરો
* માલિક સંપર્ક માહિતી
* વાહન માહિતી
* ઇમરજન્સી સંદેશાઓ
* QR સ્કેન માહિતી
* સંચાર રેકોર્ડ
* સ્થાન માહિતી, જ્યાં તમે સ્પષ્ટપણે તેને સક્ષમ કરો અથવા પ્રદાન કરો
* ઇમરજન્સી ઇન્ટરેક્શન દરમિયાન સ્વેચ્છાએ પ્રદાન કરેલ માહિતી

તમારી ગોપનીયતા સેટિંગ્સ અને તમે ઉપલબ્ધ કરવા માટે પસંદ કરેલી માહિતીના આધારે, કેટલીક માહિતી તમારા QR કોડ સ્કેન કરનાર વ્યક્તિને દેખાઈ શકે છે.

તમે એ સુનિશ્ચિત કરવા માટે જવાબદાર છો કે તમે તમારી QR પ્રોફાઇલ દ્વારા જે માહિતી પ્રકાશિત કરો છો તે સચોટ અને યોગ્ય છે.

---

## 5. QR સ્કેન

જ્યારે કોઈ RepiQR QR કોડ સ્કેન કરે છે, ત્યારે RepiQR સ્કેન સાથે સંકળાયેલ ટેકનિકલ અને ઓપરેશનલ માહિતી રેકોર્ડ કરી શકે છે.

આમાં શામેલ હોઈ શકે છે:

* QR/ઉત્પાદન ઓળખકર્તા
* સ્કેનની તારીખ અને સમય
* અંદાજિત ટેકનિકલ માહિતી
* ડિવાઇસ/બ્રાઉઝર માહિતી
* IP સરનામું અથવા તેના જેવી ટેકનિકલ માહિતી
* સ્કેન પછી કરવામાં આવેલી ક્રિયાઓ
* QR સિસ્ટમ દ્વારા બનાવવામાં આવેલ ઇમરજન્સી અથવા સંપર્ક વિનંતીઓ

અમે આ માહિતીનો ઉપયોગ નીચેના માટે કરી શકીએ છીએ:

* વિનંતી કરેલ સુરક્ષા કાર્યક્ષમતા પ્રદાન કરવી
* જ્યાં લાગુ પડે, QR માલિકને જાણ કરવી
* દુરુપયોગ અથવા શંકાસ્પદ પ્રવૃત્તિ શોધવી
* દુરુપયોગ અટકાવવો
* વિશ્વસનીયતામાં સુધારો કરવો
* સુરક્ષા જાળવવી
* સેવા વિશ્લેષણ બનાવવું

સંબંધિત RepiQR કાર્યક્ષમતા દ્વારા તે માહિતી ઉપલબ્ધ કરવામાં આવી ન હોય ત્યાં સુધી, QR સ્કેનર સ્વયંચાલિત રીતે QR માલિકની ખાનગી માહિતી મેળવતું નથી.

---

## 6. WhatsApp સંચાર અને અલર્ટ

RepiQR સેવા-સંબંધિત સંચાર મોકલવા માટે WhatsApp અથવા અધિકૃત WhatsApp Business/API સેવા પ્રદાતાનો ઉપયોગ કરી શકે છે.

ઉપયોગમાં લેવાયેલી સુવિધાના આધારે, આ સંચારમાં શામેલ હોઈ શકે છે:

* OTP
* એકાઉન્ટ વેરિફિકેશન સંદેશાઓ
* QR સ્કેન અલર્ટ
* ઇમરજન્સી અલર્ટ
* પરિવાર/ઇમરજન્સી-સંપર્ક સૂચનાઓ
* ઓર્ડર અપડેટ્સ
* શિપિંગ અને ડિલિવરી સૂચનાઓ
* ગ્રાહક-સપોર્ટ સંચાર
* ઉત્પાદન સક્રિયકરણ સંદેશાઓ
* મહત્વપૂર્ણ સેવા સૂચનાઓ

જ્યાં લાગુ પડે, WhatsApp સંદેશાઓ તૃતીય-પક્ષ ટેકનોલોજી પ્રદાતાઓ દ્વારા વિતરિત કરવામાં આવી શકે છે જે અમારા વતી માહિતી પર પ્રક્રિયા કરે છે.

અમે દરેક WhatsApp સંદેશની ડિલિવરીની ખાતરી આપતા નથી કારણ કે ડિલિવરી WhatsApp, ટેલિકોમ્યુનિકેશન પ્રદાતાઓ, ઇન્ટરનેટ કનેક્ટિવિટી, ડિવાઇસ સેટિંગ્સ, અથવા અન્ય બાહ્ય પરિબળો પર આધારિત હોઈ શકે છે.

---

## 7. સ્થાન માહિતી

ચોક્કસ RepiQR સુરક્ષા સુવિધાઓ સ્થાન માહિતીનો ઉપયોગ કરી શકે છે જો તમે સ્પષ્ટપણે તેને સક્ષમ કરો અથવા પ્રદાન કરો.

ઉદાહરણ તરીકે, સ્થાન માહિતીનો ઉપયોગ આ માટે થઈ શકે છે:

* ઇમરજન્સીનું અંદાજિત સ્થાન જણાવવામાં મદદ કરવા
* યુઝરને તેમના ઇમરજન્સી સંપર્ક સાથે તેમનું સ્થાન શેર કરવામાં મદદ કરવા
* રોડસાઇડ અથવા ઇમરજન્સી સહાયને ટેકો આપવા
* સ્થાન-આધારિત સુરક્ષા સુવિધાઓના સંચાલનમાં સુધારો કરવા

RepiQR તમારા ડિવાઇસના ચોક્કસ સ્થાનને ઍક્સેસ કરતું નથી સિવાય કે સંબંધિત સુવિધા, ડિવાઇસ પરવાનગી, અથવા યુઝર ક્રિયા તેને મંજૂરી આપે.

તમે તમારા ડિવાઇસ અથવા બ્રાઉઝર સેટિંગ્સ દ્વારા સ્થાન પરવાનગીઓ અક્ષમ કરી શકો છો. ત્યારબાદ કેટલીક સ્થાન-આધારિત સુવિધાઓ ઉપલબ્ધ ન પણ હોય.

---

## 8. ઓર્ડર અને ખરીદી

જ્યારે તમે RepiQR ઉત્પાદન ખરીદો છો, ત્યારે અમે એકત્રિત કરી શકીએ છીએ:

* ગ્રાહકનું નામ
* ઈમેલ સરનામું
* મોબાઇલ નંબર
* શિપિંગ સરનામું
* બિલિંગ માહિતી
* ઉત્પાદન/ઓર્ડર માહિતી
* ઓર્ડરની રકમ
* ટ્રાન્ઝેક્શન સંદર્ભ
* ડિલિવરી માહિતી
* ગ્રાહક સપોર્ટ માહિતી

પેમેન્ટ કાર્ડ, UPI, બેંકિંગ, અથવા અન્ય પેમેન્ટ ક્રેડેન્શિયલ્સ અમારા અધિકૃત પેમેન્ટ સેવા પ્રદાતાઓ દ્વારા પ્રોસેસ કરવામાં આવી શકે છે.

RepiQR ને સામાન્ય રીતે તમારા સંપૂર્ણ પેમેન્ટ-કાર્ડ ક્રેડેન્શિયલ્સ સંગ્રહિત કરવાની જરૂર નથી.

પેમેન્ટ માહિતી પેમેન્ટ પ્રદાતા દ્વારા સીધી તેની પોતાની ગોપનીયતા નીતિ અને સુરક્ષા પ્રથાઓ અનુસાર પ્રોસેસ કરવામાં આવી શકે છે.

---

## 9. શિપિંગ અને ડિલિવરી

તમારો ઓર્ડર પૂર્ણ કરવા માટે, અમે શિપિંગ, લોજિસ્ટિક્સ, કુરિયર, અને ડિલિવરી પાર્ટનર્સ સાથે જરૂરી માહિતી શેર કરી શકીએ છીએ.

આમાં શામેલ હોઈ શકે છે:

* નામ
* ફોન નંબર
* શિપિંગ સરનામું
* ઓર્ડર માહિતી
* ડિલિવરી સૂચનાઓ

અમે માત્ર તે માહિતી શેર કરીએ છીએ જે તમારો ઓર્ડર પૂર્ણ કરવા અને ડિલિવર કરવા માટે વાજબી રીતે જરૂરી છે.

---

## 10. અમે વ્યક્તિગત માહિતીનો ઉપયોગ કેવી રીતે કરીએ છીએ

અમે વ્યક્તિગત માહિતીનો ઉપયોગ નીચેના હેતુઓ માટે કરી શકીએ છીએ:

* એકાઉન્ટ બનાવવા અને મેનેજ કરવા
* RepiQR સેવાઓ પ્રદાન કરવી
* યુઝર્સને પ્રમાણિત કરવા
* ઓર્ડર પ્રોસેસ કરવા
* પેમેન્ટ પ્રોસેસ કરવા
* ઉત્પાદનો ડિલિવર કરવા
* QR ઉત્પાદનો સક્રિય કરવા
* OTP અને સેવા અલર્ટ મોકલવા
* WhatsApp સૂચનાઓ મોકલવા
* ઇમરજન્સી સંચારની સુવિધા આપવા
* ગ્રાહક સપોર્ટ પ્રદાન કરવો
* છેતરપિંડી અને દુરુપયોગ શોધવા
* સુરક્ષા જાળવવા
* ટેકનિકલ સમસ્યાઓનું નિવારણ કરવા
* ઉત્પાદનો અને સેવાઓમાં સુધારો કરવા
* સેવા ઉપયોગ સમજવા
* લાગુ કાયદાઓનું પાલન કરવા
* અમારા કાનૂની અધિકારોનું રક્ષણ કરવા
* અમારી સેવાઓમાં મહત્વપૂર્ણ ફેરફારો વિશે વાતચીત કરવા

અમે તમારી વ્યક્તિગત માહિતીને સ્ટેન્ડઅલોન ઉત્પાદન તરીકે વેચતા નથી.

---

## 11. કાનૂની આધાર અને સંમતિ

જ્યાં લાગુ કાયદા હેઠળ સંમતિ જરૂરી હોય, RepiQR યોગ્ય રીતે અને નિર્દિષ્ટ હેતુઓ માટે સંમતિ માંગશે.

લાગુ કાયદા અને વાજબી ઓપરેશનલ, કોન્ટ્રાક્ટ્યુઅલ, કાનૂની, અથવા સુરક્ષા જરૂરિયાતોને આધીન, તમને સંમતિ પાછી ખેંચવાનો અધિકાર હોઈ શકે છે.

સંમતિ પાછી ખેંચવાથી કેટલીક RepiQR સુવિધાઓનો ઉપયોગ કરવાની તમારી ક્ષમતાને અસર થઈ શકે છે.

ભારતનો ડિજિટલ પર્સનલ ડેટા પ્રોટેક્શન એક્ટ, 2023 એવી જોગવાઈ કરે છે કે સંમતિ મુક્ત, ચોક્કસ, માહિતગાર, બિનશરતી અને અસ્પષ્ટતા વિનાની હોવી જોઈએ, અને જ્યાં સંમતિ પ્રોસેસિંગનો આધાર હોય ત્યાં સંમતિ પાછી ખેંચવાની જોગવાઈ કરે છે.

---

## 12. માહિતીનું શેરિંગ

જ્યાં RepiQR સેવાઓ પ્રદાન કરવા માટે વાજબી રીતે જરૂરી હોય, અમે વિશ્વસનીય તૃતીય પક્ષો સાથે માહિતી શેર કરી શકીએ છીએ.

આમાં શામેલ હોઈ શકે છે:

### સેવા પ્રદાતાઓ

* ક્લાઉડ હોસ્ટિંગ પ્રદાતાઓ
* ડેટાબેઝ અને ઈન્ફ્રાસ્ટ્રક્ચર પ્રદાતાઓ
* પ્રમાણીકરણ પ્રદાતાઓ
* Google પ્રમાણીકરણ સેવાઓ
* પેમેન્ટ ગેટવે
* WhatsApp Business/API પ્રદાતાઓ
* SMS અથવા OTP પ્રદાતાઓ, જ્યાં લાગુ પડે
* શિપિંગ અને કુરિયર કંપનીઓ
* એનાલિટિક્સ અને મોનિટરિંગ પ્રદાતાઓ
* ગ્રાહક-સપોર્ટ પ્લેટફોર્મ
* સુરક્ષા અને છેતરપિંડી-નિવારણ પ્રદાતાઓ

### કાનૂની અને નિયમનકારી જરૂરિયાતો

અમે માહિતી જાહેર કરી શકીએ છીએ જ્યારે તે નીચેના માટે વાજબી રીતે જરૂરી હોય:

* લાગુ કાયદાનું પાલન કરવું
* કાયદેસર સરકારી અથવા નિયમનકારી વિનંતીઓનો જવાબ આપવો
* છેતરપિંડી અથવા દુરુપયોગ અટકાવવો
* યુઝર્સનું રક્ષણ કરવું
* RepiQR અથવા Worthite LLP નું રક્ષણ કરવું
* અમારી નિયમો અને શરતો લાગુ કરવી
* કાનૂની અધિકારો અથવા સંપત્તિનું રક્ષણ કરવું

અમે તૃતીય-પક્ષ સેવા પ્રદાતાઓને તેમના દ્વારા અમને આપવામાં આવતી સેવાઓ સાથે અસંબંધિત હેતુઓ માટે વ્યક્તિગત માહિતીનો ઉપયોગ કરવાની મંજૂરી આપતા નથી, સિવાય કે જ્યાં લાગુ કાયદા દ્વારા અન્યથા મંજૂરી આપવામાં આવી હોય અથવા જરૂરી હોય.

---

## 13. ડેટા રિટેન્શન

અમે વ્યક્તિગત માહિતીને આ ગોપનીયતા નીતિમાં વર્ણવેલ હેતુઓ માટે જ વાજબી રીતે જરૂરી સમય સુધી જાળવી રાખીએ છીએ, જેમાં શામેલ છે:

* સેવાઓ પ્રદાન કરવી
* એકાઉન્ટ જાળવવા
* ઓર્ડર પૂર્ણ કરવા
* ટ્રાન્ઝેક્શન રેકોર્ડ જાળવવા
* વિવાદોનું સમાધાન કરવું
* છેતરપિંડી અટકાવવી
* સુરક્ષા જાળવવી
* કાનૂની જવાબદારીઓનું પાલન કરવું

જ્યારે માહિતીની જરૂર ન રહે, ત્યારે અમે લાગુ કાનૂની અને ઓપરેશનલ જરૂરિયાતોને આધીન, તેને ડિલીટ કરી શકીએ છીએ, અનામી બનાવી શકીએ છીએ, અથવા સુરક્ષિત રીતે નિકાલ કરી શકીએ છીએ.

---

## 14. એકાઉન્ટ ડિલીશન

તમે અમારો સંપર્ક કરીને તમારા RepiQR એકાઉન્ટ અને સંકળાયેલ વ્યક્તિગત માહિતીને ડિલીટ કરવાની વિનંતી કરી શકો છો.

કાયદા દ્વારા જરૂરી હોય ત્યારે, વાજબી સુરક્ષા હેતુઓ માટે જરૂરી હોય ત્યારે, વિવાદોનું સમાધાન કરવા માટે જરૂરી હોય ત્યારે, અથવા પહેલેથી શરૂ કરેલા ટ્રાન્ઝેક્શન પૂર્ણ કરવા માટે જરૂરી હોય ત્યારે, કેટલીક માહિતી જાળવી રાખવાની જરૂર પડી શકે છે.

તમારું એકાઉન્ટ ડિલીટ કરવાથી તે એકાઉન્ટ સાથે સંકળાયેલ QR-સંબંધિત સેવાઓ પણ અક્ષમ અથવા નિષ્ક્રિય થઈ શકે છે.

---

## 15. ડેટા સુરક્ષા

અમે વ્યક્તિગત માહિતીને અનધિકૃત ઍક્સેસ, નુકસાન, દુરુપયોગ, ફેરફાર, અથવા જાહેરાતથી બચાવવા માટે ડિઝાઇન કરેલા વાજબી ટેકનિકલ અને સંસ્થાકીય પગલાંનો ઉપયોગ કરીએ છીએ.

સુરક્ષા પગલાંમાં શામેલ હોઈ શકે છે:

* HTTPS/TLS એન્ક્રિપ્શન
* ઍક્સેસ નિયંત્રણો
* પ્રમાણીકરણ મિકેનિઝમ્સ
* સુરક્ષિત ઈન્ફ્રાસ્ટ્રક્ચર
* મોનિટરિંગ અને લોગિંગ
* મર્યાદિત આંતરિક ઍક્સેસ
* સુરક્ષા અપડેટ્સ
* બેકઅપ અને રિકવરી પ્રક્રિયાઓ

જો કે, કોઈપણ ઇન્ટરનેટ-આધારિત સિસ્ટમ સંપૂર્ણપણે સુરક્ષિત હોવાની ખાતરી આપી શકાતી નથી.

---

## 16. બાળકોની માહિતી

RepiQR બાળ સુરક્ષા માટે ડિઝાઇન કરેલા ઉત્પાદનો ઓફર કરી શકે છે, જેમ કે ચાઇલ્ડ સેફ્ટી QR ઉત્પાદનો.

આ ઉત્પાદનોનો હેતુ માતા-પિતા અથવા કાયદેસર વાલીઓને સુરક્ષા માહિતી મેનેજ કરવામાં મદદ કરવાનો છે.

જ્યાં વ્યક્તિગત માહિતી બાળક સાથે સંબંધિત હોય, ત્યાં માતા-પિતા અથવા કાયદેસર વાલીએ માહિતી યોગ્ય રીતે પ્રદાન અને મેનેજ કરવી જોઈએ.

અમે બાળકો પાસેથી જાણીજોઈને બિનજરૂરી વ્યક્તિગત માહિતી માંગતા નથી.

માતા-પિતા અથવા કાયદેસર વાલીઓ જેઓ માનતા હોય કે બાળક સંબંધિત માહિતી અયોગ્ય રીતે આપવામાં આવી છે, તેઓ અમારો સંપર્ક કરી શકે છે.

---

## 17. જાહેર અને ઇમરજન્સી માહિતી

RepiQR યુઝર્સને નક્કી કરવા દે છે કે તેમના QR ઉત્પાદનો સાથે કઈ માહિતી સંકળાયેલ છે.

QR પ્રોફાઇલ સક્રિય અથવા પ્રકાશિત કરતા પહેલાં, યુઝર્સે વિચારવું જોઈએ કે શું માહિતી આ જાહેર કરી શકે છે:

* ઘરનું સરનામું
* વ્યક્તિગત ફોન નંબર
* પારિવારિક માહિતી
* વાહન માહિતી
* બાળક-સંબંધિત માહિતી
* અન્ય સંવેદનશીલ માહિતી

જ્યાં શક્ય હોય, RepiQR વ્યક્તિગત સંપર્ક વિગતોના બિનજરૂરી એક્સપોઝરને ઘટાડવા માટે ગોપનીયતા નિયંત્રણો અથવા માસ્ક્ડ સંચાર મિકેનિઝમ પ્રદાન કરી શકે છે.

જો કે, યુઝર્સ તેઓ જે માહિતી પ્રકાશિત કરવાનું પસંદ કરે છે તેના માટે જવાબદાર રહે છે.

---

## 18. કૂકીઝ અને તેના જેવી ટેકનોલોજીઓ

RepiQR કૂકીઝ, લોકલ સ્ટોરેજ, પિક્સેલ્સ, એનાલિટિક્સ ટેકનોલોજીઓ, અને તેના જેવા મિકેનિઝમ્સનો ઉપયોગ કરી શકે છે:

* યુઝર્સને સાઇન-ઇન રાખવા
* સેશન જાળવવા
* પસંદગીઓ યાદ રાખવા
* વેબસાઇટ કાર્યક્ષમતામાં સુધારો કરવા
* વેબસાઇટ ઉપયોગ સમજવા
* પર્ફોર્મન્સ સુધારવા
* છેતરપિંડી અને દુરુપયોગ સામે રક્ષણ કરવા

તમે તમારા બ્રાઉઝર સેટિંગ્સ દ્વારા કૂકીઝને નિયંત્રિત કરી શકો છો. જો કેટલીક કૂકીઝ અક્ષમ હોય તો કેટલાક વેબસાઇટ ફંક્શન્સ યોગ્ય રીતે કામ ન પણ કરે.

---

## 19. એનાલિટિક્સ

અમે નીચેનું સમજવા માટે એનાલિટિક્સ અને ટેકનિકલ મોનિટરિંગ સેવાઓનો ઉપયોગ કરી શકીએ છીએ:

* વેબસાઇટ ઉપયોગ
* ઉત્પાદન ઉપયોગ
* પર્ફોર્મન્સ
* ભૂલો
* ટ્રાફિક પેટર્ન
* સુવિધા અપનાવવી

RepiQR ને સુધારવા માટે એનાલિટિક્સ માહિતીને એકત્રિત અથવા અન્યથા પ્રોસેસ કરવામાં આવી શકે છે.

જ્યાં તૃતીય-પક્ષ એનાલિટિક્સ પ્રદાતાઓનો ઉપયોગ થાય છે, ત્યાં તેમની પ્રોસેસિંગ તેમની સંબંધિત ગોપનીયતા નીતિઓ દ્વારા પણ સંચાલિત થઈ શકે છે.

---

## 20. તૃતીય-પક્ષ સેવાઓ

RepiQR માં તૃતીય પક્ષો દ્વારા સંચાલિત લિંક્સ, ઈન્ટિગ્રેશન્સ, અથવા સેવાઓ હોઈ શકે છે.

ઉદાહરણોમાં શામેલ હોઈ શકે છે:

* Google
* WhatsApp/Meta
* પેમેન્ટ પ્રદાતાઓ
* શિપિંગ પ્રદાતાઓ
* અન્ય ટેકનોલોજી પ્રદાતાઓ

RepiQR સ્વતંત્ર તૃતીય-પક્ષ સેવાઓની ગોપનીયતા પ્રથાઓ માટે જવાબદાર નથી.

યુઝર્સે તે સેવાઓનો ઉપયોગ કરતી વખતે લાગુ તૃતીય-પક્ષ ગોપનીયતા નીતિઓની સમીક્ષા કરવી જોઈએ.

---

## 21. આંતરરાષ્ટ્રીય ડેટા પ્રોસેસિંગ

કેટલાક RepiQR સેવા પ્રદાતાઓ ભારતની બહાર માહિતી પ્રોસેસ અથવા સંગ્રહિત કરી શકે છે.

જ્યાં લાગુ પડે, RepiQR આવી પ્રોસેસિંગ, ટ્રાન્સફર, અને સેવા-પ્રદાતા વ્યવસ્થાઓ સંબંધિત લાગુ કાયદા દ્વારા જરૂરી વાજબી પગલાં લેશે.

---

## 22. તમારા અધિકારો

લાગુ કાયદાને આધીન, તમારી વ્યક્તિગત માહિતી સંબંધિત અધિકારો હોઈ શકે છે, જેમાં શામેલ છે:

* પ્રોસેસિંગ વિશે માહિતીની વિનંતી કરવાનો અધિકાર
* ખોટી માહિતીના સુધારાની વિનંતી કરવાનો અધિકાર
* જ્યાં લાગુ પડે, ડિલીશનની વિનંતી કરવાનો અધિકાર
* જ્યાં સંમતિ પ્રોસેસિંગનો આધાર હોય, ત્યાં સંમતિ પાછી ખેંચવાનો અધિકાર
* તમારા ડેટાનો ઉપયોગ કેવી રીતે થાય છે તે વિશે માહિતીની વિનંતી કરવાનો અધિકાર
* પ્રોસેસિંગ સંબંધિત ફરિયાદ નોંધાવવાનો અધિકાર

વિનંતીઓ નીચે આપેલ સંપર્ક વિગતોનો ઉપયોગ કરીને સબમિટ કરી શકાય છે.

અમને કેટલીક વિનંતીઓ પૂર્ણ કરતા પહેલાં વિનંતી કરનારની ઓળખ અથવા એકાઉન્ટ માલિકી ચકાસવાની જરૂર પડી શકે છે.

---

## 23. આ ગોપનીયતા નીતિમાં ફેરફારો

અમે સમય સમય પર આ ગોપનીયતા નીતિને અપડેટ કરી શકીએ છીએ.

જ્યારે અમે મહત્વપૂર્ણ ફેરફારો કરીએ છીએ, ત્યારે અમે વેબસાઇટ, એપ્લિકેશન, ઈમેલ, અથવા અન્ય યોગ્ય સંચાર માધ્યમો દ્વારા સૂચના આપી શકીએ છીએ.

આ ગોપનીયતા નીતિની શરૂઆતમાં "છેલ્લે અપડેટ કર્યું" તારીખ દર્શાવે છે કે તે તાજેતરમાં ક્યારે સંશોધિત કરવામાં આવી હતી.

---

## 24. અમારો સંપર્ક કરો

**RepiQR**
**Worthite LLP** દ્વારા સંચાલિત

વેબસાઇટ: [https://repiqr.com](https://repiqr.com)

ઈમેલ: [privacy@repiqr.com](mailto:privacy@repiqr.com)

ગોપનીયતા-સંબંધિત વિનંતીઓ માટે, કૃપા કરીને તમારી વિનંતી સમજવા અને પ્રોસેસ કરવા માટે પૂરતી માહિતી શામેલ કરો.

---

## 25. ફરિયાદ / ગોપનીયતા સંપર્ક

વ્યક્તિગત માહિતી અથવા આ ગોપનીયતા નીતિ સંબંધિત પ્રશ્નો, ચિંતાઓ, ફરિયાદો, અથવા વિનંતીઓ માટે, સંપર્ક કરો:

**ગોપનીયતા / ફરિયાદ સંપર્ક**
Worthite LLP / RepiQR
ઈમેલ: [privacy@repiqr.com](mailto:privacy@repiqr.com)

અમે લાગુ કાયદા અનુસાર વિનંતીઓની સમીક્ષા કરીશું અને જવાબ આપીશું.

**સ્વ-સેવા નિયંત્રણો.** સાઇન-ઇન કરેલા એકાઉન્ટ ધારકો અમને ઈમેલ કર્યા વિના — **ડેશબોર્ડ → ગોપનીયતા અને ડેટા** માંથી સીધા સંમતિ મેનેજ (ચોક્કસ હેતુઓ મંજૂર/પાછી ખેંચવી) કરી શકે છે, તેમના ડેટાની કોપી ડાઉનલોડ કરી શકે છે, નોમિની નિયુક્ત કરી શકે છે, એકાઉન્ટ ડિલીશનની વિનંતી કરી શકે છે, અને સીધી ફરિયાદ નોંધાવી શકે છે. ત્યાં ફરિયાદ નોંધાવવાથી ટ્રેક કરેલ ટિકિટ નંબર જારી થાય છે.

---

## 26. સંમતિ

એકાઉન્ટ બનાવીને, RepiQR નો ઉપયોગ કરીને, RepiQR ઉત્પાદન ખરીદીને, QR ઉત્પાદન સક્રિય કરીને, અથવા અન્યથા જે સેવાઓ માટે સંમતિ જરૂરી છે તેનો ઉપયોગ કરીને, તમે આ ગોપનીયતા નીતિમાં વર્ણવેલ પ્રથાઓ સ્વીકારો છો અને જ્યાં લાગુ કાયદા દ્વારા જરૂરી હોય ત્યાં સંમતિ પ્રદાન કરો છો.
`,
  },
};
