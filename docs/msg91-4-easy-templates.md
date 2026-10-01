# 4 Brand-New WhatsApp Templates for MSG91 (Fresh Names - No Deletion Lock)

Because Meta locks old and deleted template names for up to 30 days, these templates use fresh unique names prefixed with **`rapi_`** (`rapi_tag_scan`, `rapi_new_chat`, `rapi_urgent_alert`, `rapi_live_location`).

---

### Quick Setup Steps in MSG91:
1. Go to **MSG91 Dashboard** ➔ **WhatsApp** ➔ **Templates** ➔ **+ Add Template**.
2. **Category:** `UTILITY`.
3. **Language:** `English (en)`.
4. **Variable Type Dropdown:** Select **`Name`** (do this *before* typing in Body).
5. **Header / Footer:** `None`.
6. **Button:** Click **+ Add Button** ➔ **Call To Action** ➔ **Visit Website** ➔ **Dynamic URL** (end URL with `{{1}}`).

---

## 1. Tag Scan Alert
* **Template Name:** `rapi_tag_scan`
* **Category:** `UTILITY`
* **Language:** `English (en)`
* **Variable Type:** `Name`

**Body:**
```text
🔔 *RapiQR Scan Alert*

Your tag *{{item_name}}* was just scanned.
Note: "{{message}}"

Tap below to view details and reply 👇
```

* **Sample Values:**
  * `{{item_name}}` ➔ `Car GJ 01 AB 1234`
  * `{{message}}` ➔ `Found parked with headlights on`
* **Button:**
  * **Type:** `Call To Action` ➔ `Visit Website` (Dynamic URL)
  * **Button Text:** `💬 View & Reply`
  * **Website URL:** `https://repiqr.com/#/dashboard?tab=chat&session={{1}}`
  * **Button Sample:** `6aae76dcae7ca2804553a390`

---

## 2. New Chat Message
* **Template Name:** `rapi_new_chat`
* **Category:** `UTILITY`
* **Language:** `English (en)`
* **Variable Type:** `Name`

**Body:**
```text
💬 *New Message Received*

You have a new message regarding *{{item_name}}*.
Message: "{{message}}"

Tap below to open secure chat 👇
```

* **Sample Values:**
  * `{{item_name}}` ➔ `Office Keys`
  * `{{message}}` ➔ `Hi, I found your keychain in the lobby`
* **Button:**
  * **Type:** `Call To Action` ➔ `Visit Website` (Dynamic URL)
  * **Button Text:** `🚀 Open Chat`
  * **Website URL:** `https://repiqr.com/#/dashboard?tab=chat&session={{1}}`
  * **Button Sample:** `6aae76dcae7ca2804553a390`

---

## 3. Urgent Safety Alert
* **Template Name:** `rapi_urgent_alert`
* **Category:** `UTILITY`
* **Language:** `English (en)`
* **Variable Type:** `Name`

**Body:**
```text
🚨 *Urgent Safety Alert*

An urgent alert was reported for *{{item_name}}*.
Reason: "{{message}}"

Tap below to take immediate action 👇
```

* **Sample Values:**
  * `{{item_name}}` ➔ `Bike MH 12 AB 5678`
  * `{{message}}` ➔ `Vehicle blocking emergency driveway`
* **Button:**
  * **Type:** `Call To Action` ➔ `Visit Website` (Dynamic URL)
  * **Button Text:** `⚡ View Alert Now`
  * **Website URL:** `https://repiqr.com/#/dashboard?tab=chat&session={{1}}`
  * **Button Sample:** `6aae76dcae7ca2804553a390`

---

## 4. Live Location Shared
* **Template Name:** `rapi_live_location`
* **Category:** `UTILITY`
* **Language:** `English (en)`
* **Variable Type:** `Name`

**Body:**
```text
📍 *Live Location Shared*

Someone has shared their location regarding *{{item_name}}*.

Tap below to open the location on Google Maps 👇
```

* **Sample Values:**
  * `{{item_name}}` ➔ `Dog Tag - Bruno`
* **Button:**
  * **Type:** `Call To Action` ➔ `Visit Website` (Dynamic URL)
  * **Button Text:** `🗺️ Open in Google Maps`
  * **Website URL:** `https://maps.google.com/?q={{1}}`
  * **Button Sample:** `23.0225,72.5714`
