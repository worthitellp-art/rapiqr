import React from 'react';
import { ArrowLeft } from 'lucide-react';
import AppLogo from '../common/AppLogo';

/**
 * Minimal markdown renderer for this page's own content only — handles
 * exactly the subset the policy text below uses (#/##, **bold**, * bullets,
 * [text](url) links, --- rules, blank-line paragraph breaks). Not a general
 * markdown engine; adding a real one for one static page would be a much
 * heavier dependency than this page needs.
 */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const pattern = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    if (match[1] !== undefined) {
      nodes.push(<strong key={`${keyPrefix}-b${i++}`} className="font-semibold text-gray-900">{match[1]}</strong>);
    } else {
      const isMail = match[3].startsWith('mailto:');
      nodes.push(
        <a
          key={`${keyPrefix}-a${i++}`}
          href={match[3]}
          target={isMail ? undefined : '_blank'}
          rel={isMail ? undefined : 'noopener noreferrer'}
          className="text-[#111111] underline hover:text-black"
        >
          {match[2]}
        </a>
      );
    }
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

function renderMarkdown(source: string): React.ReactNode {
  const lines = source.split('\n');
  const blocks: React.ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length === 0) return;
    blocks.push(
      <ul key={`ul-${key++}`} className="list-disc pl-5 space-y-1.5 text-[15px] text-gray-700 leading-relaxed">
        {listItems.map((item, i) => (
          <li key={i}>{renderInline(item, `li-${key}-${i}`)}</li>
        ))}
      </ul>
    );
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.startsWith('* ')) {
      listItems.push(line.slice(2));
      continue;
    }
    flushList();

    if (!line) continue;
    if (line === '---') {
      blocks.push(<hr key={`hr-${key++}`} className="border-gray-200 my-2" />);
      continue;
    }
    if (line.startsWith('### ')) {
      blocks.push(<h3 key={`h3-${key++}`} className="text-base font-bold text-gray-900 mt-2">{renderInline(line.slice(4), `h3-${key}`)}</h3>);
      continue;
    }
    if (line.startsWith('## ')) {
      blocks.push(<h2 key={`h2-${key++}`} className="text-xl font-bold text-gray-950 mt-2">{renderInline(line.slice(3), `h2-${key}`)}</h2>);
      continue;
    }
    if (line.startsWith('# ')) {
      blocks.push(<h1 key={`h1-${key++}`} className="text-2xl sm:text-3xl font-black text-gray-950">{renderInline(line.slice(2), `h1-${key}`)}</h1>);
      continue;
    }
    blocks.push(<p key={`p-${key++}`} className="text-[15px] text-gray-700 leading-relaxed">{renderInline(line, `p-${key}`)}</p>);
  }
  flushList();
  return blocks;
}

const PRIVACY_POLICY_MARKDOWN = `
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

---

## 26. Consent

By creating an account, using RepiQR, purchasing a RepiQR product, activating a QR product, or otherwise using services for which consent is required, you acknowledge the practices described in this Privacy Policy and provide consent where required by applicable law.
`;

export default function PrivacyPolicyPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:h-16 sm:px-6">
          <button
            onClick={onBack}
            className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-900"
            aria-label="Back"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
          <AppLogo variant="light" className="h-6 w-auto object-contain sm:h-7" />
          <span className="w-12" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14 space-y-4">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-950">Privacy Policy</h1>
        <div className="space-y-4">{renderMarkdown(PRIVACY_POLICY_MARKDOWN)}</div>
      </main>
    </div>
  );
}
