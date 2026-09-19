# MSG91 WhatsApp Templates (Named Parameters & Buttons)

Meta requires that template body parameters be **named** with curly brackets (e.g. `{{label}}`, `{{message}}`, `{{customer_name}}`), rather than numbers.

In MSG91 (WhatsApp → Templates → Edit Template / Create Template):
- Paste the **Body** text exactly as shown with the named variables.
- Fill in the **Sample / Example** value for each named variable.
- Click **+ Add Button** → choose **Call To Action** → **Visit Website** (URL) → Dynamic URL.
- Paste the URL with `{{1}}` as the variable suffix and provide the sample session ID.

---

## 1. emergency_alert_v2 (With Button)

**Category:** `UTILITY`  
**Template Name:** `emergency_alert_v2`  
*(Note: Named `emergency_alert_v2` because Meta locks deleted template names for 30 days).*  
**Language:** `English (en)` or `English (US) (en_US)`

**Body:**
```text
🚨 *URGENT — ACCIDENT ALERT*

Possible accident involving {{label}}.
Message: {{message}}

— *RepiQR Safety*
```

**Body Variables & Examples:**
- `{{label}}` → Example: `Car GJ 01 XX 0000`
- `{{message}}` → Example: `Found your car unlocked with lights on`

**Button:**
- **Button Type:** `Call To Action` → `Visit Website`
- **URL Type:** `Dynamic`
- **Button Text:** `View & Take Action`
- **Website URL:** `https://repiqr.com/#/dashboard?tab=chat&session={{1}}`
- **Button Sample / Example Value:** `6aae76dcae7ca2804553a390`

---

## 2. qr_scan_alert (With Button)

**Category:** `UTILITY`  
**Template Name:** `qr_scan_alert`  
**Language:** `English (en)`

**Body:**
```text
*🔔 QR Scan Alert*
Your tag *{{label}}* was just scanned.
Message: *{{message}}*
— RepiQR
```

**Body Variables & Examples:**
- `{{label}}` → Example: `Demo Tag 1234`
- `{{message}}` → Example: `A visitor sent a test alert.`

**Button:**
- **Button Type:** `Call To Action` → `Visit Website`
- **URL Type:** `Dynamic`
- **Button Text:** `View & Reply`
- **Website URL:** `https://repiqr.com/#/dashboard?tab=chat&session={{1}}`
- **Button Sample / Example Value:** `6aae76dcae7ca2804553a390`

---

## 3. location_shared (With 2 Buttons)

**Category:** `UTILITY`  
**Template Name:** `location_shared`  
**Language:** `English (en)`

**Body:**
```text
*📍 Location Shared*
Someone has shared their live location for *{{label}}*.
— RepiQR Safety
```

**Body Variables & Examples:**
- `{{label}}` → Example: `Car GJ 01 XX 0000`

**Button 1 (View Location):**
- **Type:** `Dynamic URL`
- **Button Text:** `View Location`
- **Website URL:** `https://maps.google.com/?q={{1}}`
- **Sample Value:** `23.0225,72.5714`

**Button 2 (Open Dashboard):**
- **Type:** `Dynamic URL`
- **Button Text:** `Open Dashboard`
- **Website URL:** `https://repiqr.com/#/dashboard?tab=chat&session={{1}}`
- **Sample Value:** `6aae76dcae7ca2804553a390`

---

## 4. chat_started (With Button)

**Category:** `UTILITY`  
**Template Name:** `chat_started`  
**Language:** `English (en)`

**Body:**
```text
RepiQR chat alert: a visitor has started a conversation about your tag "{{label}}". They are waiting for your response.
```

**Body Variables & Examples:**
- `{{label}}` → Example: `Car GJ 01 XX 0000`

**Button:**
- **Type:** `Dynamic URL`
- **Button Text:** `Reply Now`
- **Website URL:** `https://repiqr.com/#/dashboard?tab=chat&session={{1}}`
- **Sample Value:** `6aae76dcae7ca2804553a390`

---

## 5. chat_message (With Button)

**Category:** `UTILITY`  
**Template Name:** `chat_message`  
**Language:** `English (en)`

**Body:**
```text
*💬 RepiChat – New Message*
Someone has sent you a message about your RepiQR tag *{{label}}*.
— RepiQR Safety
```

**Body Variables & Examples:**
- `{{label}}` → Example: `Car GJ 01 XX 0000`

**Button:**
- **Type:** `Dynamic URL`
- **Button Text:** `View & Reply`
- **Website URL:** `https://repiqr.com/#/dashboard?tab=chat&session={{1}}`
- **Sample Value:** `6aae76dcae7ca2804553a390`

---

## 6. emergency_contact_alert_v2 (No Button)

**Category:** `UTILITY`  
**Template Name:** `emergency_contact_alert_v2`

**Body:**
```text
RepiQR EMERGENCY NOTIFICATION: an urgent alert was raised on the registered tag "{{label}}". The reporter states: "{{message}}". Please check on this situation immediately.
```

**Body Variables & Examples:**
- `{{label}}` → Example: `Car GJ 01 XX 0000`
- `{{message}}` → Example: `Vehicle involved in minor bump`

---

## 7. emergency_contact_added (No Button)

**Category:** `UTILITY`  
**Template Name:** `emergency_contact_added`

**Body:**
```text
Hi {{contact_name}}, {{owner_name}} has added you as an emergency contact on their RapiQR safety tag. If they are ever in an emergency, you may be contacted to help. No action is needed right now.
```

**Body Variables & Examples:**
- `{{contact_name}}` → Example: `Ramesh`
- `{{owner_name}}` → Example: `Rahul Sharma`

---

## 8. qr_activated (No Button)

**Category:** `UTILITY`  
**Template Name:** `qr_activated`

**Body:**
```text
*🎉 RepiQR Activated!*
Your tag *{{label}}* is now active.
You will receive an alert when someone scans your tag.
Thank you for choosing RepiQR.
```

**Body Variables & Examples:**
- `{{label}}` → Example: `Bike MH 12 AB 1234`

---

## 9. safe_status (No Button)

**Category:** `UTILITY`  
**Template Name:** `safe_status`

**Body:**
```text
*✅ RepiQR – SAFE*
Your tag *{{label}}* has been marked as *SAFE*.
The emergency situation is resolved. No action is needed.
```

**Body Variables & Examples:**
- `{{label}}` → Example: `Car GJ 01 XX 0000`
