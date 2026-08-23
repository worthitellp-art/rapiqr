  # REPIQR — WHATSAPP-FIRST MIGRATION & EXISTING SYSTEM REFACTOR PROMPT

You are working on the existing RepiQR website/web app.

IMPORTANT:
Do NOT rebuild RepiQR from scratch.
Do NOT replace the existing architecture blindly.
Do NOT remove existing features just to simplify the project.

You must first inspect the existing codebase and the existing product specification in:

SCAN_BUTTONS_ALL_CATEGORIES.md

This MD file is the source of truth for the current scan-page/category/button/action system.

Your job is to adapt the EXISTING RepiQR system into a WhatsApp-first communication architecture while preserving the current UX, category system, RepiChat concept, emergency actions, location sharing, assistant, helplines, partner actions and future extensibility.

==================================================
1. CURRENT PRODUCT DECISION
==================================================

We have made an important business decision:

FOR THE CURRENT LAUNCH:

SMS IS REMOVED.

We do NOT want to purchase or implement SMS right now because SMS is expensive and DLT creates additional complexity.

WhatsApp will be the PRIMARY communication channel.

We plan to purchase/configure WhatsApp Business API TOMORROW.

Therefore:

TODAY:
Make the website/backend WhatsApp-ready.

TOMORROW:
We should only need to add/configure the real WhatsApp provider credentials, approved templates and webhook configuration.

Do NOT build an SMS dependency.

Do NOT use SMS as a fallback right now.

However, design the notification architecture so SMS can be added later as an optional fallback without rebuilding the entire system.

==================================================
2. IMPORTANT EXISTING MD FILE OBSERVATIONS
==================================================

The current SCAN_BUTTONS_ALL_CATEGORIES.md contains many actions where the declared behavior currently says things such as:

"SMS + RepiChat"

or:

"SMS to owner"

or:

"Push, SMS and WhatsApp go out together"

These must NOT remain the actual communication behavior.

Replace the communication concept with:

WhatsApp + RepiChat

or, where appropriate:

WhatsApp notification + RepiChat

The current product should NOT send SMS.

Do not blindly replace the text "SMS" everywhere with "WhatsApp".

First understand what the action actually does.

For every `notify` action, determine:

- Who receives it?
- What event triggered it?
- What information is included?
- Is location attached?
- Is a chat session created?
- Is the recipient an owner, guardian, family member, employer, emergency contact or other party?
- Should it be a WhatsApp template message?
- Should it open RepiChat?
- Should it create an emergency session?

Then refactor the underlying action accordingly.

==================================================
3. EXISTING REPIQR CONCEPT
==================================================

RepiQR is NOT simply:

"QR code → WhatsApp message"

The actual product is:

QR / NFC
↓
RepiQR Scan Experience
↓
Context-aware action
↓
RepiQR backend
↓
WhatsApp notification
↓
RepiChat / secure communication
↓
Location / emergency / assistance / partner actions

The QR is the trigger.

WhatsApp is the external notification channel.

RepiChat is the communication layer.

The backend is the safety engine.

==================================================
4. PRESERVE THE EXISTING CATEGORY SYSTEM
==================================================

The existing MD defines many categories and contexts.

Examples include:

- car
- bike
- bicycle
- child

- luggage
- keychain
-
- and other categories defined in the MD

DO NOT remove these categories.

DO NOT merge them into one generic scan page.

Each category should retain its context-specific:

- title
- subtitle
- tone
- hero
- default owner alert
- quick actions
- emergency actions
- assistant prompts
- helplines
- location actions
- partner actions

But the communication implementation should become centralized and reusable.

==================================================
5. VERY IMPORTANT: CURRENT BESPOKE CATEGORY PROBLEM
==================================================

The MD explicitly says:

`bike` is listed in `BESPOKE_CATEGORIES`.

ScanPage currently renders a hard-coded screen for bike instead of CategoryScanView.

The MD also says that the declared button data is currently NOT necessarily what the visitor sees.

DO NOT ignore this.

Audit all categories and identify:

1. Which categories use CategoryScanView?
2. Which categories use bespoke/hard-coded screens?
3. Which screens duplicate logic?
4. Which buttons are data-driven?
5. Which buttons are hard-coded?
6. Which actions are currently inert?
7. Which actions are dead code?
8. Which actions are only visual?
9. Which backend endpoints are actually connected?

Do NOT force everything into one component if doing so would damage the existing UX.

Instead, create a clean shared action/notification layer underneath the existing UI.

==================================================
6. NOTIFICATION ARCHITECTURE
==================================================

Create a provider-agnostic notification service.

Conceptually:

NotificationService
    ↓
WhatsAppProvider
    ↓
Actual provider

The business logic must NOT directly call Meta/Gupshup/Twilio APIs.

For example:

notifyOwner()
notifyEmergencyContacts()
notifyGuardian()
notifyEmployer()
notifyFamily()
sendOTP()
sendEmergencyAlert()
sendLocationAlert()
sendSafeStatus()
sendQRScanAlert()

These should call a central notification service.

The provider layer then handles WhatsApp.

This is important because we have NOT yet finalized whether we will use:

- Direct Meta WhatsApp Cloud API
- Gupshup
- Twilio
- another official WhatsApp Business Solution Provider

Do NOT lock the entire application to one provider.

==================================================
7. WHATSAPP API IS NOT PURCHASED YET
==================================================

We will purchase/configure it tomorrow.

Therefore TODAY:

DO NOT add fake credentials.

DO NOT expose access tokens in frontend.

DO NOT hard-code provider credentials.

DO NOT assume a WhatsApp phone number ID.

DO NOT assume templates are approved.

DO NOT create fake production webhook credentials.

Instead create:

MOCK WHATSAPP MODE

Example:

NOTIFICATION_PROVIDER=mock

The mock provider should:

- simulate sending
- log outgoing WhatsApp messages
- show recipient
- show message/template name
- show delivery status
- show failure status
- allow testing of the complete flow
- never contact real users

Tomorrow we should be able to switch to:

NOTIFICATION_PROVIDER=whatsapp

through environment configuration.

==================================================
8. WHATSAPP ENVIRONMENT VARIABLES
==================================================

Prepare `.env.example`.

Use generic provider configuration.

Possible variables:

WHATSAPP_PROVIDER=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_API_VERSION=

Do not assume every provider uses the same variables.

Create provider-specific configuration where necessary.

Never expose secrets to client-side JavaScript.

==================================================
9. REPIQR QR SCAN → OWNER FLOW
==================================================

Current concept:

Someone scans a RepiQR tag.

They should be able to notify the owner without exposing their phone number unnecessarily.

Desired flow:

QR Scan
↓
Identify QR/category
↓
Show contextual ScanPage
↓
User chooses action
↓
Optional message
↓
Optional location
↓
Create scan event
↓
Create notification event
↓
Send WhatsApp notification to owner
↓
Create/open RepiChat session

Example:

Someone scans a vehicle QR.

They choose:

"Alert the owner"

Message:

"Your car is blocking the entrance."

Location:

Shared

Backend creates:

ScanEvent
NotificationEvent
ChatSession
LocationEvent

Owner receives WhatsApp notification.

Then the owner can enter RepiChat.

==================================================
10. REPIQR CHAT
==================================================

The MD already references:

RepiChat

Treat RepiChat as an important existing product concept.

Do NOT replace it with a basic WhatsApp deep link.

The goal is:

Finder
↕
RepiChat
↕
Owner

without unnecessarily exposing personal phone numbers.

Important:

Do NOT assume that WhatsApp itself provides anonymous phone-number masking.

If RepiChat is intended to protect both parties' phone numbers, the actual conversation layer must remain under RepiQR control.

WhatsApp can notify the recipient.

RepiChat can handle secure communication.

The architecture should support:

- text
- location
- image/photo
- timestamps
- read/unread
- session status
- emergency status
- report
- block
- session expiration

==================================================
11. SECURE CHAT SESSION
==================================================

Every RepiChat conversation should be tied to an event.

Examples:

QR scan
Emergency
Found item
Vehicle issue
Child found
Pet found
Luggage found
Medical emergency
Theft alert

Create a secure non-guessable chat/session ID.

Example:

repiqr.com/chat/8X72K

Do NOT put:

- phone number
- email
- personal address
- sensitive information

inside the URL.

Use:

- random ID
- authorization
- expiration
- rate limiting
- server-side access checks

==================================================
12. IMPORTANT: NOT EVERY ACTION NEEDS A CHAT
==================================================

Do not blindly create a chat session for every button.

Classify actions.

### Communication action

Example:

Alert owner
Notify family
Tell guardian
Contact employer

→ WhatsApp + RepiChat

### Location action

Example:

Share Live Location

→ Save location
→ attach location to active event/session
→ notify relevant recipient via WhatsApp if appropriate

### Public emergency action

Example:

Call 112
Call 108
Call police
Call child helpline

→ Direct phone call

Do NOT route public emergency calls through WhatsApp.

### Maps action

Example:

Nearest police station
Nearest hospital
Nearest vet
Lost & found

→ Maps

### Partner action

Example:

Towing
Mechanic
Fuel delivery

→ Existing partner action architecture

Do not replace these with WhatsApp unless the existing product logic requires communication.

==================================================
13. REPLACE CURRENT SMS BEHAVIOR
==================================================

Current MD contains statements such as:

"notify → SMS + RepiChat"

Change the actual system behavior to:

"notify → WhatsApp + RepiChat"

Current MD contains:

"SMS to owner"

Change the actual system behavior to:

"WhatsApp notification to owner"

Current MD contains:

"Push, SMS and WhatsApp go out together"

For the current launch:

"WhatsApp notification + RepiChat"

Do NOT add push notifications unless an actual push infrastructure exists.

Do not claim a channel exists if it is not actually implemented.

==================================================
14. WHATSAPP MESSAGE TYPES
==================================================

Create a message/template abstraction.

Potential notification types:

QR_SCAN_ALERT
EMERGENCY_ALERT
ACCIDENT_ALERT
LOCATION_SHARED
OWNER_FOUND
CHILD_FOUND
PET_FOUND
LUGGAGE_FOUND
KEY_FOUND
THEFT_ALERT
MEDICAL_ALERT
FAMILY_ALERT
GUARDIAN_ALERT
SAFE_STATUS
QR_ACTIVATED
OTP

Each should have configurable message content.

Do NOT hard-code every message inside React components.

Keep message content/configuration separate from UI.

==================================================
15. WHATSAPP TEMPLATE VS REPIQR CHAT
==================================================

Understand this distinction:

Outside an active WhatsApp conversation:

Use approved WhatsApp template messages where required.

Inside RepiChat:

The communication should happen through RepiQR's own chat system.

Do not assume WhatsApp free-form messaging rules apply to RepiChat.

Do not build the product around the assumption that every arbitrary message can be sent through WhatsApp.

==================================================
16. EMERGENCY FLOW
==================================================

For categories like:

car
bike
helmet
bicycle
child
wristband

where the MD defines emergency actions:

Create a proper EmergencyEvent.

Example:

EmergencyEvent:

id
qrId
category
type
severity
triggeredAt
location
status
createdBy
ownerId

Possible statuses:

ACTIVE
ACKNOWLEDGED
HELP_REQUESTED
SAFE
RESOLVED
CANCELLED
EXPIRED

When emergency is triggered:

EmergencyEvent
↓
NotificationService
↓
WhatsApp
↓
Emergency Contacts
↓
RepiChat

==================================================
17. "I'M SAFE"
==================================================

Add/prepare an "I'm Safe" action for appropriate emergency flows.

When owner confirms:

Emergency status → SAFE

Then notify relevant emergency contacts through WhatsApp.

Example:

"RepiQR Update

The emergency has been marked SAFE by the registered user.

Time: 11:42 AM"

Store:

- timestamp
- user
- event
- previous status
- new status

==================================================
18. LOCATION SYSTEM
==================================================

The MD contains many:

Share Live Location
Send where we are
Send exact location
Attach where I found it

These must use one reusable location service.

Create:

LocationService

It should support:

- latitude
- longitude
- accuracy
- timestamp
- source
- eventId
- sessionId
- user/session identifier

Do NOT unnecessarily implement continuous live tracking.

Prepare the architecture for future live tracking.

==================================================
19. EMERGENCY CONTACTS
==================================================

Emergency contacts must be separate from the owner.

Support:

- contact name
- relationship
- WhatsApp number
- priority
- active/inactive
- notification preference

Example:

Owner
↓
Emergency Contact 1
↓
Emergency Contact 2
↓
Emergency Contact 3

Do NOT implement automatic escalation without clear backend rules and user configuration.

==================================================
20. EXISTING HELPLINES
==================================================

The MD includes actions such as:

112
108
100
1098
104
14416
1363
139
1962

Do not remove these simply because SMS is removed.

These are direct public helpline/call actions.

However:

DO NOT assume every number is universally valid across every state/time.

Keep them configurable.

Use the existing helpline configuration system where available.

==================================================
21. EXISTING PARTNER ACTIONS
==================================================

The MD contains partner actions such as:

- towing
- mechanic
- fuel
- courier
- support
- other assistance

Preserve these.

Do not invent new partner integrations.

Where a partner action needs owner notification:

Use:

WhatsApp + RepiChat

not SMS.

==================================================
22. REPIQR ASSISTANT
==================================================

The MD contains:

Ask the RepiQR Assistant

with category-specific suggested questions.

Preserve this feature.

Do NOT redesign it unless necessary.

However, audit whether:

- it is actually functional
- it uses hard-coded responses
- it uses backend AI
- it opens a modal
- it is dead code

Do not claim it is AI-powered unless it actually is.

==================================================
23. CURRENT CODE GAPS TO AUDIT
==================================================

The MD already identifies several inconsistencies/gaps.

You MUST audit these.

Examples:

1. `bike` is bespoke/hard-coded.
2. Some declared button data may not match what visitors actually see.
3. Some hero actions only navigate rather than performing the actual action.
4. Some call buttons are disabled/"Soon".
5. Some admin helpline numbers are displayed directly.
6. `flat-tire` photo is captured but apparently discarded.
7. `medical` menu is dead/unreachable.
8. Some admin-configured categories are not consumed by scan screens.
9. Notification actions currently refer to SMS.
10. Some actions may be visual-only/inert.

Do not assume the MD describes the actual runtime behavior.

Inspect the actual code.

Create an audit:

FEATURE
CURRENT BEHAVIOR
MD EXPECTED BEHAVIOR
PROBLEM
RECOMMENDED FIX
PRIORITY

==================================================
24. DO NOT OVER-ENGINEER BEFORE WHATSAPP PURCHASE
==================================================

Today we do NOT need to build the entire final WhatsApp production integration.

Today we need:

1. Clean notification abstraction
2. Mock WhatsApp provider
3. WhatsApp-ready backend endpoints
4. Webhook structure
5. Template/message abstraction
6. Secure environment configuration
7. Existing RepiChat integration
8. Emergency notification architecture
9. QR scan notification architecture

Tomorrow after API purchase:

1. Add credentials
2. Connect provider
3. Create/submit templates
4. Configure webhook
5. Verify webhook
6. Test real WhatsApp message
7. Test delivery/read events
8. Test incoming responses where applicable

==================================================
25. IMPORTANT UX RULE
==================================================

The scanner may be:

- a normal person
- child
- elderly person
- non-technical user
- stressed
- in an emergency

The scan experience must therefore be:

SCAN
↓
UNDERSTAND
↓
ONE CLEAR ACTION
↓
NOTIFY / HELP
↓
COMMUNICATE

Do not make the user:

- create an account before emergency action
- download an app
- understand technical terminology
- fill unnecessary forms
- manually copy phone numbers

==================================================
26. PRIVACY PROMISE
==================================================

RepiQR's core promise is secure communication without unnecessarily exposing personal information.

Therefore:

Never display the owner's personal phone number to the scanner.

Never display the scanner's phone number to the owner unless the user explicitly chooses to share it and the product/legal design supports it.

Never put phone numbers in URLs.

Never expose private database IDs unnecessarily.

==================================================
27. PUBLIC QR SECURITY
==================================================

QR scan pages are public.

Protect them against:

- spam
- repeated scans
- fake alerts
- abusive messages
- automated bots
- oversized uploads
- malicious URLs
- enumeration
- rate abuse

Implement or prepare:

- IP rate limiting
- QR-level rate limiting
- session-level rate limiting
- CAPTCHA/risk checks where necessary
- message length limits
- upload limits
- abuse reporting
- QR disable functionality

==================================================
28. DO NOT BREAK THE EXISTING DESIGN
==================================================

RepiQR currently has a category-driven visual system.

Preserve:

- existing tones
- icons
- hero sections
- cards
- quick-action tiles
- button styles
- category personality
- mobile-first layout

Do not redesign the entire UI unless a UX issue requires it.

Focus primarily on the underlying functionality and communication architecture.

==================================================
29. ADMIN SYSTEM
==================================================

The MD references admin-configurable:

- helplines
- partner numbers
- categories
- actions

Audit the admin system.

Ensure notification actions are not hard-coded to SMS.

Admin should eventually be able to configure:

- notification type
- WhatsApp template
- recipient type
- emergency priority
- helpline
- partner
- action type

But do not build a giant admin CMS unnecessarily if the current project does not need it.

==================================================
30. DATABASE / DATA MODEL
==================================================

Inspect the current database before creating anything.

Reuse existing models when possible.

If missing, prepare models for:

QR
QRScan
Owner
EmergencyContact
EmergencyEvent
Notification
NotificationDelivery
ChatSession
ChatMessage
LocationEvent
OTP
WhatsAppWebhookEvent
AuditLog

Notification should record:

id
type
recipient
channel
provider
status
template
providerMessageId
eventId
createdAt
sentAt
deliveredAt
readAt
failedAt
errorCode

==================================================
31. API STRUCTURE
==================================================

Inspect existing API conventions.

Do not invent a completely separate API architecture.

Where appropriate, prepare endpoints conceptually for:

POST /api/scan/:qrId/notify
POST /api/scan/:qrId/location
POST /api/emergency
POST /api/emergency/:id/safe
POST /api/chat/session
POST /api/chat/message
POST /api/notifications/send
POST /api/webhooks/whatsapp
GET /api/webhooks/whatsapp

Use the project's existing routing conventions if different.

==================================================
32. MOCK MODE
==================================================

Until real WhatsApp API credentials are configured:

A button such as:

"Alert the owner on WhatsApp"

should work in development.

But instead of sending a real WhatsApp message:

Mock provider should create:

Notification:
status = MOCK_SENT

and log:

Recipient
Template
Message
Event
Timestamp

The UI should behave as close as possible to production.

This allows us to test the complete product tomorrow.

==================================================
33. TOMORROW'S WHATSAPP SETUP
==================================================

Prepare a clear checklist for what information will be required from the WhatsApp provider.

Potentially:

- WhatsApp Business Account
- Business phone number
- Phone Number ID
- Business Account ID
- Access Token
- Webhook verification token
- API version
- Approved templates
- Provider-specific credentials
- Webhook URL

Do NOT assume the exact provider yet.

==================================================
34. FINAL IMPLEMENTATION PROCESS
==================================================

Before changing code:

STEP 1:
Inspect the entire codebase.

STEP 2:
Inspect SCAN_BUTTONS_ALL_CATEGORIES.md carefully.

STEP 3:
Map every MD action to the actual code.

STEP 4:
Identify all SMS references.

STEP 5:
Identify all WhatsApp references.

STEP 6:
Identify all RepiChat references.

STEP 7:
Identify all notification endpoints/services.

STEP 8:
Identify all hard-coded/bespoke category screens.

STEP 9:
Identify dead/inert actions.

STEP 10:
Present me with an audit and implementation plan.

DO NOT start a destructive refactor before this audit.

==================================================
35. REQUIRED AUDIT OUTPUT
==================================================

Give me:

A. Existing architecture

B. Existing scan/category architecture

C. Existing RepiChat architecture

D. Existing notification architecture

E. All SMS dependencies

F. All WhatsApp dependencies

G. All notification-related backend APIs

H. All hard-coded notification logic

I. All category inconsistencies

J. All dead/inert actions

K. Security risks

L. Database changes required

M. API changes required

N. WhatsApp provider abstraction plan

O. Mock WhatsApp implementation plan

P. Tomorrow's real WhatsApp integration checklist

Q. Priority list:

P0 = must fix before launch
P1 = important
P2 = future

==================================================
36. IMPLEMENTATION RULE
==================================================

After presenting the audit:

Do NOT wait for me to repeat the requirements.

Proceed with the safest non-destructive implementation that can be completed without real WhatsApp credentials.

Implement:

- WhatsApp-ready notification abstraction
- mock provider
- removal of SMS dependency from active flows
- RepiChat integration
- notification event model
- secure chat/session architecture where missing
- location event integration where missing
- emergency status handling where appropriate
- centralized action handling
- preservation of existing category UI

Do NOT implement actual WhatsApp provider credentials.

Do NOT claim production WhatsApp is working.

==================================================
37. SUCCESS CRITERIA
==================================================

After your changes:

QR scan
→ contextual category page
→ user taps "Alert Owner on WhatsApp"
→ backend creates scan/notification event
→ mock WhatsApp provider simulates notification
→ RepiChat session is created/opened
→ owner can communicate securely

Emergency:

Emergency
→ EmergencyEvent
→ WhatsApp notification (mock until API connected)
→ emergency contact notification
→ location attached
→ RepiChat
→ owner can mark SAFE
→ contacts receive safe update

No active flow should depend on SMS.

The codebase should be ready for real WhatsApp API integration tomorrow.

MOST IMPORTANT:

Do not rebuild RepiQR.

Do not remove the existing category system.

Do not replace RepiChat.

Do not replace the current UX with a generic WhatsApp chatbot.

Do not introduce SMS.

Refactor the existing RepiQR product into a clean:

QR → RepiQR Backend → WhatsApp → RepiChat

architecture while preserving the existing product capabilities and category-specific experiences.